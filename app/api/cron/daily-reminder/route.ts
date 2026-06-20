import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { getJSTDateString } from '../../../../lib/date'

// Vercel Cron: 毎日20時（JST = 11:00 UTC）に実行
// vercel.json に { "crons": [{ "path": "/api/cron/daily-reminder", "schedule": "0 11 * * *" }] } を追加

export async function GET(req: NextRequest) {
  // Vercel Cron認証
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const adminSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const today = getJSTDateString()

  // 今日まだ記録していないユーザーのpush subscriptionを取得
  const { data: subs } = await adminSupabase
    .from('push_subscriptions')
    .select('*')

  if (!subs?.length) return NextResponse.json({ sent: 0 })

  const { data: todayRecords } = await adminSupabase
    .from('meal_records')
    .select('user_id')
    .eq('recorded_at', today)

  const recordedUserIds = new Set((todayRecords ?? []).map(r => r.user_id))
  const targets = subs.filter(s => !recordedUserIds.has(s.user_id))

  if (!targets.length) return NextResponse.json({ sent: 0 })

  const vapidPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const vapidPrivate = process.env.VAPID_PRIVATE_KEY
  const vapidSubject = process.env.NEXT_PUBLIC_APP_URL

  if (!vapidPublic || !vapidPrivate || !vapidSubject) {
    return NextResponse.json({ error: 'VAPID keys not configured' }, { status: 500 })
  }

  // web-push を使って通知送信
  // npm install web-push が必要
  const webpush = await import('web-push').catch(() => null)
  if (!webpush) return NextResponse.json({ error: 'web-push not installed' }, { status: 500 })

  webpush.default.setVapidDetails(vapidSubject, vapidPublic, vapidPrivate)

  let sent = 0
  for (const sub of targets) {
    try {
      await webpush.default.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify({
          title: 'Meal Journal 🍽',
          body: '今日の食事をまだ記録していません。記録してみましょう！',
          url: '/',
        })
      )
      sent++
    } catch {
      // 無効な購読は削除
      await adminSupabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint)
    }
  }

  return NextResponse.json({ sent })
}
