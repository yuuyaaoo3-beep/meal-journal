import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'
import { NextRequest } from 'next/server'
import { getJSTDayStart } from '../../../lib/date'

const anthropic = new Anthropic()

const MEAL_LABELS: Record<string, string> = {
  breakfast: '朝食', lunch: '昼食', dinner: '夕食', snack: '間食',
}

export async function POST(req: NextRequest) {
  try {
    const { accessToken, meal, goal, todayTotal, messages } = await req.json()

    if (!accessToken || !meal || !goal) {
      return Response.json({ error: 'Invalid request' }, { status: 400 })
    }
    if (messages !== undefined && (!Array.isArray(messages) || messages.length > 30)) {
      return Response.json({ error: 'Invalid request' }, { status: 400 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: `Bearer ${accessToken}` } } }
    )
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: goalData } = await supabase
      .from('user_goals').select('is_premium').eq('user_id', user.id).single()
    if (!goalData?.is_premium) return Response.json({ error: 'Premium required' }, { status: 403 })

    // Rate limit: 20 calls/day per user
    const dayStart = getJSTDayStart()
    const { count } = await supabase.from('api_usage')
      .select('*', { count: 'exact', head: true })
      .eq('endpoint', 'meal-feedback')
      .gte('created_at', dayStart.toISOString())
    if ((count ?? 0) >= 20) {
      return Response.json({ error: '本日の利用上限（20回）に達しました。明日またお試しください。' }, { status: 429 })
    }
    supabase.from('api_usage').insert({ endpoint: 'meal-feedback' }).then(() => {})

    const mealLabel = MEAL_LABELS[meal.meal_type] || meal.meal_type
    const system = `あなたは管理栄養士AIです。ユーザーの食事記録を分析し、日本語で温かく、具体的で実践的なアドバイスをします。`

    let apiMessages: { role: 'user' | 'assistant'; content: string }[]

    if (!messages || messages.length === 0) {
      // 初回評価：スコア + フィードバック
      apiMessages = [{
        role: 'user',
        content: `【1日の目標】カロリー:${goal.target_cal}kcal / P:${goal.protein}g / F:${goal.fat}g / C:${goal.carbs}g
【本日の累計摂取（この食事含む）】カロリー:${Math.round(todayTotal.calories)}kcal / P:${Math.round(todayTotal.protein)}g / F:${Math.round(todayTotal.fat)}g / C:${Math.round(todayTotal.carbs)}g
【評価する${mealLabel}】${meal.food_name}（${meal.calories}kcal / P:${meal.protein}g / F:${meal.fat}g / C:${meal.carbs}g）

この食事を100点満点で採点してフィードバックをください。
必ず最初の行に "SCORE:数値" という形式（整数のみ）で点数を書き、そのあと改行してフィードバックを3〜4文で書いてください。
今日の残りの食事や翌日への具体的なアドバイスも添えてください。`,
      }]
    } else {
      // フォローアップチャット
      const firstAssistant: string = messages[0]?.role === 'assistant' ? messages[0].content : ''
      const chatHistory: { role: 'user' | 'assistant'; content: string }[] = messages.slice(firstAssistant ? 1 : 0)

      apiMessages = [
        {
          role: 'user',
          content: `【食事情報】${meal.food_name}（${mealLabel}/${meal.calories}kcal・P:${meal.protein}g・F:${meal.fat}g・C:${meal.carbs}g）【目標】Cal:${goal.target_cal} P:${goal.protein}g F:${goal.fat}g C:${goal.carbs}g`,
        },
        {
          role: 'assistant',
          content: firstAssistant || 'ご質問にお答えします。',
        },
        ...chatHistory,
      ]
    }

    const stream = anthropic.messages.stream({
      model: 'claude-opus-4-8',
      max_tokens: 1024,
      thinking: { type: 'adaptive' },
      system,
      messages: apiMessages,
    })

    const readable = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder()
        try {
          for await (const event of stream) {
            if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
              controller.enqueue(encoder.encode(event.delta.text))
            }
          }
        } finally {
          controller.close()
        }
      },
    })

    return new Response(readable, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  } catch {
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
