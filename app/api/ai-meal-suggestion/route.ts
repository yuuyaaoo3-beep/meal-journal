import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'
import { NextRequest } from 'next/server'

const anthropic = new Anthropic()

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { accessToken, mealType, todayConsumed, dailyGoal, filters } = body

    if (!accessToken || !['dinner', 'next_day'].includes(mealType) ||
        !todayConsumed || !dailyGoal) {
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
      .select('is_premium')
      .eq('user_id', user.id)
      .single()
    if (goalError || !goalData || goalData.is_premium !== true) {
      return Response.json({ error: 'Premium required' }, { status: 403 })
    }

    const remaining = {
      calories: Math.max(0, dailyGoal.calories - todayConsumed.calories),
      protein: Math.max(0, dailyGoal.protein - todayConsumed.protein),
      fat: Math.max(0, dailyGoal.fat - todayConsumed.fat),
      carbs: Math.max(0, dailyGoal.carbs - todayConsumed.carbs),
    }

    const systemPrompt = 'あなたは日本の食事管理・栄養の専門家です。忙しい会社員が実際に実践できる、具体的で現実的な献立を提案することが得意です。カロリーとタンパク質・脂質・炭水化物（PFC）のバランスを重視し、ユーザーの目標と希望に沿った提案をしてください。'

    const filterLines: string[] = []
    if (filters?.eatStyle === 'jisui') {
      filterLines.push('【食事スタイル】自炊（家で調理する）')
      const grainMap: Record<string, string> = { rice: '米', noodle: '麺', bread: 'パン' }
      const grains = (filters.selectedGrain ?? []).map((g: string) => grainMap[g]).filter(Boolean)
      if (grains.length > 0) filterLines.push(`【主食の希望】${grains.join('・')}`)
      const proteinMap: Record<string, string> = { meat: '肉', fish: '魚', egg_tofu: '卵・豆腐' }
      const proteins = (filters.selectedProtein ?? []).map((p: string) => proteinMap[p]).filter(Boolean)
      if (proteins.length > 0) filterLines.push(`【主菜の希望】${proteins.join('・')}`)
    } else if (filters?.eatStyle === 'convenience') {
      const chainMap: Record<string, string> = { seven: 'セブンイレブン', famima: 'ファミリーマート', lawson: 'ローソン', any: 'どのコンビニでも可' }
      const chain = chainMap[filters.selectedChain ?? ''] ?? 'コンビニ'
      filterLines.push(`【食事スタイル】コンビニ（${chain}）`)
    } else if (filters?.eatStyle === 'gaishoku') {
      const genreMap: Record<string, string> = { washoku: '和食', yoshoku: '洋食', chuka: '中華', fast: 'ファストフード' }
      const genre = genreMap[filters.selectedGenre ?? ''] ?? ''
      filterLines.push(`【食事スタイル】外食${genre ? `（${genre}）` : ''}`)
    }
    const filterSection = filterLines.length > 0 ? '\n\n【ユーザーの希望条件】\n' + filterLines.join('\n') + '\n\n上記の条件を必ず守って提案してください。' : ''

    const userMessage = mealType === 'dinner'
      ? `今日の残りの栄養目標は以下の通りです：
- カロリー残り：${remaining.calories} kcal
- タンパク質残り：${remaining.protein} g
- 脂質残り：${remaining.fat} g
- 炭水化物残り：${remaining.carbs} g${filterSection}

この残り目標に合わせた夕食を3つ提案してください。各提案には以下を含めてください：
1. 料理名と具体的な食材・量
2. 推定カロリー（kcal）
3. 推定PFC（タンパク質・脂質・炭水化物、各グラム）
4. 一言コメント（手軽さや栄養バランスについて）

忙しい会社員でも実践しやすい、現実的なメニューをお願いします。`
      : `明日の1日の栄養目標は以下の通りです：
- カロリー目標：${dailyGoal.calories} kcal
- タンパク質目標：${dailyGoal.protein} g
- 脂質目標：${dailyGoal.fat} g
- 炭水化物目標：${dailyGoal.carbs} g${filterSection}

この目標に合わせた明日1日分の献立（朝食・昼食・夕食）を3パターン提案してください。各パターンには以下を含めてください：
1. 朝食・昼食・夕食それぞれの料理名と具体的な食材・量
2. 1日合計の推定カロリー（kcal）と推定PFC
3. 一言コメント（準備のしやすさや特徴について）

忙しい会社員でも実践しやすい、現実的なメニューをお願いします。`

    const stream = anthropic.messages.stream({
      model: 'claude-opus-4-8',
      max_tokens: 4096,
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
