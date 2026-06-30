import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function verifySecret(req: NextRequest) {
  return req.headers.get('authorization') === `Bearer ${process.env.BOT_SECRET}`
}

function todayJST(): string {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Tokyo' }).format(new Date())
}

// POST: 下書きを保存
export async function POST(req: NextRequest) {
  if (!verifySecret(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { post_type, content, scheduled_at } = await req.json()

  // 同じタイプの未処理下書きを削除
  await supabase
    .from('bot_posts')
    .delete()
    .eq('post_type', post_type)
    .in('status', ['pending', 'waiting_edit'])

  const { data, error } = await supabase
    .from('bot_posts')
    .insert({ post_type, content, scheduled_at, status: 'pending' })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// GET: 投稿用の下書きを取得（投稿後にposted状態へ更新）
export async function GET(req: NextRequest) {
  if (!verifySecret(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const post_type = new URL(req.url).searchParams.get('type')
  const today = todayJST()
  const dayStart = `${today}T00:00:00+09:00`
  const dayEnd = `${today}T23:59:59+09:00`

  const { data, error } = await supabase
    .from('bot_posts')
    .select('*')
    .eq('post_type', post_type)
    .in('status', ['pending', 'approved', 'edited'])
    .gte('scheduled_at', dayStart)
    .lte('scheduled_at', dayEnd)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (error || !data) {
    // skippedか下書きなし
    const { data: skipped } = await supabase
      .from('bot_posts')
      .select('id')
      .eq('post_type', post_type)
      .eq('status', 'skipped')
      .gte('scheduled_at', dayStart)
      .lte('scheduled_at', dayEnd)
      .limit(1)
      .single()

    return NextResponse.json({ skip: true, reason: skipped ? 'skipped' : 'no_draft' })
  }

  // 未対応（pending）の下書きは、本人が編集・承認する猶予として60分待つ
  if (data.status === 'pending') {
    const ageMinutes = (Date.now() - new Date(data.created_at).getTime()) / 60000
    if (ageMinutes < 60) {
      return NextResponse.json({ skip: true, reason: 'waiting_for_response' })
    }
  }

  await supabase.from('bot_posts').update({ status: 'posted' }).eq('id', data.id)

  return NextResponse.json({
    skip: false,
    content: data.edited_content || data.content,
    id: data.id,
    status: data.status,
  })
}
