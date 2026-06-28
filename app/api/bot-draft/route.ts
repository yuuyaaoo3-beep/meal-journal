import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function verifySecret(req: NextRequest) {
  return req.headers.get('authorization') === `Bearer ${process.env.BOT_SECRET}`
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

  const { data, error } = await supabase
    .from('bot_posts')
    .select('*')
    .eq('post_type', post_type)
    .in('status', ['pending', 'approved', 'edited'])
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
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    return NextResponse.json({ skip: true, reason: skipped ? 'skipped' : 'no_draft' })
  }

  await supabase.from('bot_posts').update({ status: 'posted' }).eq('id', data.id)

  return NextResponse.json({
    skip: false,
    content: data.edited_content || data.content,
    id: data.id,
    status: data.status,
  })
}
