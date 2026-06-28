import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function verifySignature(rawBody: string, signature: string): boolean {
  const secret = process.env.LINE_CHANNEL_SECRET!
  const hmac = crypto.createHmac('SHA256', secret)
  hmac.update(rawBody)
  return hmac.digest('base64') === signature
}

async function replyToLine(replyToken: string, text: string) {
  await fetch('https://api.line.me/v2/bot/message/reply', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.LINE_CHANNEL_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      replyToken,
      messages: [{ type: 'text', text }],
    }),
  })
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text()
  const signature = req.headers.get('x-line-signature') || ''

  if (!verifySignature(rawBody, signature)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  const body = JSON.parse(rawBody)

  for (const event of body.events || []) {
    // ボタンタップ（承認・編集・スキップ）
    if (event.type === 'postback') {
      const params = new URLSearchParams(event.postback.data)
      const action = params.get('action')
      const id = params.get('id')

      if (action === 'approve') {
        await supabase.from('bot_posts').update({ status: 'approved' }).eq('id', id)
        await replyToLine(event.replyToken, '✅ 承認しました！予定時刻に投稿します。')

      } else if (action === 'skip') {
        await supabase.from('bot_posts').update({ status: 'skipped' }).eq('id', id)
        await replyToLine(event.replyToken, '❌ スキップしました。今日はこの投稿をしません。')

      } else if (action === 'edit') {
        await supabase.from('bot_posts').update({ status: 'waiting_edit' }).eq('id', id)
        await replyToLine(event.replyToken, '✏️ 修正後の投稿内容を、このトークルームに返信してください。\n送った内容がそのまま投稿されます。')
      }
    }

    // テキスト返信（編集内容の受け取り）
    if (event.type === 'message' && event.message.type === 'text') {
      const { data: waiting } = await supabase
        .from('bot_posts')
        .select('id')
        .eq('status', 'waiting_edit')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (waiting) {
        await supabase
          .from('bot_posts')
          .update({ status: 'edited', edited_content: event.message.text })
          .eq('id', waiting.id)
        await replyToLine(event.replyToken, '✅ 修正内容を保存しました！予定時刻に修正版を投稿します。')
      }
    }
  }

  return NextResponse.json({ ok: true })
}
