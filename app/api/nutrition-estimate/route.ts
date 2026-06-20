import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'
import { NextRequest } from 'next/server'

const anthropic = new Anthropic()

export async function POST(req: NextRequest) {
  try {
    const { accessToken, mealName } = await req.json()

    if (!accessToken || !mealName?.trim()) {
      return Response.json({ error: 'Invalid request' }, { status: 400 })
    }
    if (mealName.trim().length > 100) {
      return Response.json({ error: 'Invalid request' }, { status: 400 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: `Bearer ${accessToken}` } } }
    )
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: goal } = await supabase
      .from('user_goals').select('is_premium').eq('user_id', user.id).single()
    if (!goal?.is_premium) return Response.json({ error: 'Premium required' }, { status: 403 })

    // Rate limit: 20 calls/day per user
    const dayStart = new Date(); dayStart.setHours(0, 0, 0, 0)
    const { count } = await supabase.from('api_usage')
      .select('*', { count: 'exact', head: true })
      .eq('endpoint', 'nutrition-estimate')
      .gte('created_at', dayStart.toISOString())
    if ((count ?? 0) >= 20) {
      return Response.json({ error: '本日のAI推定の利用上限（20回）に達しました。明日またお試しください。' }, { status: 429 })
    }
    supabase.from('api_usage').insert({ endpoint: 'nutrition-estimate' }).then(() => {})

    const msg = await anthropic.messages.create({
      model: 'claude-opus-4-8',
      max_tokens: 256,
      thinking: { type: 'adaptive' },
      system: 'あなたは管理栄養士です。食事名から一般的な1人前の栄養素を推定し、必ずJSONのみで回答してください。形式: {"calories":整数,"protein":数値,"fat":数値,"carbs":数値,"portion":"推定量の説明（例:1人前約350g）"}',
      messages: [{ role: 'user', content: `「${mealName.trim()}」の栄養素を推定してください。` }],
    })

    let text = ''
    for (const block of msg.content) {
      if (block.type === 'text') text += block.text
    }

    const match = text.match(/\{[\s\S]*\}/)
    if (!match) return Response.json({ error: '推定に失敗しました' }, { status: 500 })

    try {
      const nutrition = JSON.parse(match[0])
      const { calories, protein, fat, carbs, portion } = nutrition
      if (typeof calories !== 'number' || typeof protein !== 'number' ||
          typeof fat !== 'number' || typeof carbs !== 'number') {
        return Response.json({ error: '推定に失敗しました' }, { status: 500 })
      }
      return Response.json({ calories, protein, fat, carbs, portion: portion || '' })
    } catch {
      return Response.json({ error: '推定に失敗しました' }, { status: 500 })
    }
  } catch {
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
