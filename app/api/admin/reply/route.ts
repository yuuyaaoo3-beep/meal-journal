import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { NextRequest } from 'next/server'

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

export async function POST(req: NextRequest) {
  try {
    const { accessToken, messageId, replyText } = await req.json()
    if (!accessToken || !messageId || !replyText?.trim()) {
      return Response.json({ error: 'Invalid request' }, { status: 400 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: `Bearer ${accessToken}` } } }
    )
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || user.email !== process.env.ADMIN_EMAIL) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    const adminSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: msg } = await adminSupabase
      .from('contact_messages')
      .select('*')
      .eq('id', messageId)
      .single()
    if (!msg) return Response.json({ error: 'Not found' }, { status: 404 })

    await adminSupabase
      .from('contact_replies')
      .insert({ message_id: messageId, reply_text: replyText.trim() })

    await adminSupabase
      .from('contact_messages')
      .update({ status: 'replied' })
      .eq('id', messageId)

    // メール通知（RESEND_API_KEY が設定されている場合のみ）
    if (process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL) {
      try {
        const resend = new Resend(process.env.RESEND_API_KEY)
        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL,
          to: msg.user_email,
          subject: '【Meal Journal】お問い合わせへのご返信',
          html: `
<div style="font-family:'Helvetica Neue',sans-serif;max-width:560px;margin:0 auto;padding:32px;background:#fff;">
  <h2 style="font-size:18px;color:#2C2A26;margin:0 0 4px;">Meal Journal サポート</h2>
  <p style="font-size:13px;color:#8A8377;margin:0 0 24px;">お問い合わせいただきありがとうございます。以下の通りご返信いたします。</p>
  <div style="background:#F8F4ED;border-radius:12px;padding:20px;margin-bottom:24px;">
    <p style="font-size:12px;color:#8A8377;margin:0 0 8px;">カテゴリ：${escapeHtml(msg.category)}</p>
    <div style="font-size:14px;color:#2C2A26;white-space:pre-line;line-height:1.7;">${escapeHtml(replyText.trim())}</div>
  </div>
  <hr style="border:none;border-top:1px solid #DDD6C8;margin:20px 0;"/>
  <p style="font-size:12px;color:#8A8377;margin:0 0 4px;">＜ご送信いただいた内容＞</p>
  <p style="font-size:13px;color:#8A8377;white-space:pre-line;margin:0 0 20px;">${escapeHtml(msg.message)}</p>
  <hr style="border:none;border-top:1px solid #DDD6C8;margin:20px 0;"/>
  <p style="font-size:12px;color:#8A8377;">返信内容はMeal JournalアプリのMenuの「お問い合わせ履歴」でもご確認いただけます。</p>
</div>`,
        })
      } catch (emailErr) {
        console.error('Email send failed:', emailErr)
      }
    }

    return Response.json({ success: true })
  } catch {
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
