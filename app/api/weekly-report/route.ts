import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'
import { NextRequest } from 'next/server'

const anthropic = new Anthropic()

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { accessToken } = body

    if (!accessToken) {
      return Response.json({ error: 'Invalid request' }, { status: 400 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: `Bearer ${accessToken}` } } }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: goalData, error: goalError } = await supabase
      .from('user_goals')
      .select('is_premium, target_cal, protein, fat, carbs')
      .eq('user_id', user.id)
      .single()
    if (goalError || !goalData || goalData.is_premium !== true) {
      return Response.json({ error: 'Premium required' }, { status: 403 })
    }

    const today = new Date()
    const fromDate = new Date(today)
    fromDate.setDate(fromDate.getDate() - 6)
    const fromDateStr = fromDate.toISOString().split('T')[0]
    const todayStr = today.toISOString().split('T')[0]

    const [mealRes, weightRes] = await Promise.all([
      supabase.from('meal_records').select('*').eq('user_id', user.id)
        .gte('recorded_at', fromDateStr).lte('recorded_at', todayStr)
        .order('recorded_at', { ascending: true }),
      supabase.from('weight_records').select('weight, recorded_at').eq('user_id', user.id)
        .gte('recorded_at', fromDateStr).lte('recorded_at', todayStr)
        .order('recorded_at', { ascending: true }),
    ])

    const mealRecords = mealRes.data ?? []
    const weightRecords = weightRes.data ?? []

    const mealsByDate: Record<string, typeof mealRecords> = {}
    for (const r of mealRecords) {
      if (!mealsByDate[r.recorded_at]) mealsByDate[r.recorded_at] = []
      mealsByDate[r.recorded_at].push(r)
    }

    const targetCal = goalData.target_cal ?? 1750
    const targetP = goalData.protein ?? 100
    const targetF = goalData.fat ?? 50
    const targetC = goalData.carbs ?? 200

    const dailyLines = Object.entries(mealsByDate).map(([date, records]) => {
      const totals = records.reduce((acc, r) => ({
        calories: acc.calories + (r.calories || 0),
        protein: acc.protein + (r.protein || 0),
        fat: acc.fat + (r.fat || 0),
        carbs: acc.carbs + (r.carbs || 0),
      }), { calories: 0, protein: 0, fat: 0, carbs: 0 })
      const foods = records.map(r => r.food_name).filter(Boolean).join('、')
      const calDiff = Math.round(totals.calories) - targetCal
      const diffStr = calDiff > 0 ? `+${calDiff}` : String(calDiff)
      return `${date}: ${Math.round(totals.calories)}kcal（目標比${diffStr}kcal）/ P${Math.round(totals.protein)}g / F${Math.round(totals.fat)}g / C${Math.round(totals.carbs)}g\n  食事: ${foods || '記録なし'}`
    })

    const recordedDays = Object.keys(mealsByDate).length
    const weeklyCalAvg = recordedDays > 0
      ? Math.round(mealRecords.reduce((s, r) => s + (r.calories || 0), 0) / recordedDays)
      : 0

    const weightLines = weightRecords.map(w => `${w.recorded_at}: ${w.weight}kg`).join('\n')
    const firstWeight = weightRecords[0]?.weight
    const lastWeight = weightRecords[weightRecords.length - 1]?.weight
    const weightDiff = firstWeight && lastWeight ? (lastWeight - firstWeight).toFixed(1) : null

    const userDataSection = `
【期間】${fromDateStr} 〜 ${todayStr}

【1日の栄養目標】
カロリー: ${targetCal}kcal / タンパク質: ${targetP}g / 脂質: ${targetF}g / 炭水化物: ${targetC}g

【日別食事記録（記録のある日のみ）】
${dailyLines.length > 0 ? dailyLines.join('\n') : '記録なし'}

記録日数: ${recordedDays}日
記録日の平均カロリー: ${weeklyCalAvg}kcal

【体重推移】
${weightLines || '記録なし'}
${weightDiff !== null ? `週間変化: ${Number(weightDiff) <= 0 ? '' : '+'}${weightDiff}kg（${firstWeight}kg → ${lastWeight}kg）` : ''}
`.trim()

    const systemPrompt = 'あなたは忙しい社会人のダイエットをサポートする、優しくて実践的な栄養コーチです。データを見て褒める点・改善点・具体的なアドバイスを伝えてください。完璧主義を押しつけず、継続できる小さな改善を提案することを大切にしてください。'

    const userMessage = `以下は私の1週間の食事・体重記録です。振り返りとアドバイスをお願いします。

${userDataSection}

以下の構成でレポートを作成してください：

## 📊 今週のまとめ
（カロリー・PFCの傾向を2〜3文でまとめる）

## 👏 よかった点
（具体的に褒める。小さなことでも見つける）

## 💡 来週に向けたアドバイス
（2〜3個の具体的で実践しやすいアドバイス）

## 💬 コーチからひとこと
（励ましのメッセージ。短く、温かく）`

    const stream = anthropic.messages.stream({
      model: 'claude-opus-4-8',
      max_tokens: 2048,
      thinking: { type: 'adaptive' },
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    })

    const readableStream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder()
        try {
          for await (const event of stream) {
            if (
              event.type === 'content_block_delta' &&
              event.delta.type === 'text_delta'
            ) {
              controller.enqueue(encoder.encode(event.delta.text))
            }
          }
        } finally {
          controller.close()
        }
      },
    })

    return new Response(readableStream, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })

  } catch {
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
