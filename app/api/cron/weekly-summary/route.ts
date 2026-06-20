import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { NextRequest, NextResponse } from 'next/server'
import { getJSTDateString } from '../../../../lib/date'

// Vercel Cron: 毎週日曜 20:00 JST (11:00 UTC) に実行

type Goal = { target_cal: number; protein: number; fat: number; carbs: number }

function getWeekRange() {
  // 毎週日曜 20:00 JST に実行 → その週（月〜日）を JST 基準で集計
  const weekEnd = getJSTDateString()
  const mon = new Date(Date.now() + 9 * 60 * 60 * 1000)
  mon.setDate(mon.getDate() - 6)
  const weekStart = getJSTDateString(mon)
  return { weekStart, weekEnd }
}

function motivationalMessage(daysLogged: number, avgCal: number, goal: Goal): string {
  if (daysLogged === 7) return '素晴らしい！7日間すべて記録できました 🎉'
  if (daysLogged >= 5) return `${daysLogged}日記録できました。安定したペースです 👍`
  if (daysLogged >= 3) return `${daysLogged}日の記録でした。今週はもう少し増やしてみましょう ✨`
  return `${daysLogged}日の記録でした。継続することで効果が出やすくなります 💪`
}

function calMessage(avgCal: number, target: number): string {
  const diff = avgCal - target
  if (Math.abs(diff) <= 100) return '目標カロリーにぴったりでした 🎯'
  if (diff < 0) return `目標より ${Math.abs(diff)} kcal 少なめでした`
  return `目標より ${diff} kcal 多めでした`
}

function buildHtml(params: {
  weekStart: string; weekEnd: string
  daysLogged: number; daysWithWeight: number
  avgCal: number; avgProtein: number; avgFat: number; avgCarbs: number
  weightStart: number | null; weightEnd: number | null
  goal: Goal
  appUrl: string
}): string {
  const { weekStart, weekEnd, daysLogged, avgCal, avgProtein, avgFat, avgCarbs,
    weightStart, weightEnd, goal, appUrl } = params
  const weightDiff = (weightStart && weightEnd) ? (weightEnd - weightStart).toFixed(1) : null
  const weekLabel = `${weekStart.slice(5).replace('-', '/')} 〜 ${weekEnd.slice(5).replace('-', '/')}`
  const calRatio = Math.min(100, Math.round((avgCal / goal.target_cal) * 100))

  const diffColor = weightDiff === null ? '#8A8377'
    : parseFloat(weightDiff) < 0 ? '#7A9471' : '#E8835A'

  return `
<!DOCTYPE html>
<html lang="ja">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F8F4ED;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
<div style="max-width:560px;margin:0 auto;padding:24px 16px;">

  <!-- ヘッダー -->
  <div style="text-align:center;margin-bottom:24px;">
    <div style="display:inline-block;background:#7A9471;color:white;font-size:18px;font-weight:700;padding:10px 20px;border-radius:14px;letter-spacing:0.5px;">
      Meal Journal
    </div>
    <p style="color:#8A8377;font-size:13px;margin:10px 0 0;">先週（${weekLabel}）の振り返り</p>
  </div>

  <!-- メッセージ -->
  <div style="background:white;border-radius:16px;padding:20px;border:1px solid #DDD6C8;margin-bottom:16px;text-align:center;">
    <p style="font-size:15px;font-weight:600;color:#2C2A26;margin:0 0 6px;">${motivationalMessage(daysLogged, avgCal, goal)}</p>
    <p style="font-size:13px;color:#8A8377;margin:0;">${calMessage(avgCal, goal.target_cal)}</p>
  </div>

  <!-- 記録日数 -->
  <div style="background:white;border-radius:16px;padding:20px;border:1px solid #DDD6C8;margin-bottom:12px;">
    <p style="font-size:12px;color:#8A8377;margin:0 0 8px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">記録日数</p>
    <div style="display:flex;align-items:center;gap:12px;">
      <span style="font-size:36px;font-weight:700;color:#2C2A26;">${daysLogged}</span>
      <span style="font-size:14px;color:#8A8377;">/ 7日</span>
      <div style="flex:1;height:8px;background:#EFE8DA;border-radius:4px;overflow:hidden;">
        <div style="height:100%;width:${Math.round(daysLogged / 7 * 100)}%;background:#7A9471;border-radius:4px;"></div>
      </div>
    </div>
  </div>

  <!-- カロリー -->
  <div style="background:white;border-radius:16px;padding:20px;border:1px solid #DDD6C8;margin-bottom:12px;">
    <p style="font-size:12px;color:#8A8377;margin:0 0 8px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">平均カロリー / 日</p>
    <div style="display:flex;align-items:baseline;gap:8px;margin-bottom:10px;">
      <span style="font-size:30px;font-weight:700;color:#2C2A26;">${avgCal.toLocaleString()}</span>
      <span style="font-size:13px;color:#8A8377;">kcal</span>
      <span style="font-size:12px;color:#8A8377;margin-left:4px;">目標 ${goal.target_cal.toLocaleString()} kcal</span>
    </div>
    <div style="height:8px;background:#EFE8DA;border-radius:4px;overflow:hidden;">
      <div style="height:100%;width:${calRatio}%;background:#E8835A;border-radius:4px;"></div>
    </div>
  </div>

  <!-- PFC -->
  <div style="background:white;border-radius:16px;padding:20px;border:1px solid #DDD6C8;margin-bottom:12px;">
    <p style="font-size:12px;color:#8A8377;margin:0 0 12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">平均PFC / 日</p>
    <table style="width:100%;border-collapse:collapse;">
      <tr>
        ${[
          { label: 'タンパク質', val: avgProtein, target: goal.protein, color: '#E8835A', unit: 'g' },
          { label: '脂質', val: avgFat, target: goal.fat, color: '#D4A340', unit: 'g' },
          { label: '炭水化物', val: avgCarbs, target: goal.carbs, color: '#7A9471', unit: 'g' },
        ].map(item => `
        <td style="text-align:center;padding:0 6px;">
          <div style="font-size:22px;font-weight:700;color:${item.color};">${item.val}</div>
          <div style="font-size:10px;color:#8A8377;">${item.unit} / 目標${item.target}${item.unit}</div>
          <div style="font-size:11px;color:#5C574F;margin-top:2px;">${item.label}</div>
        </td>`).join('')}
      </tr>
    </table>
  </div>

  <!-- 体重 -->
  ${weightDiff !== null ? `
  <div style="background:white;border-radius:16px;padding:20px;border:1px solid #DDD6C8;margin-bottom:12px;">
    <p style="font-size:12px;color:#8A8377;margin:0 0 8px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">体重の変化</p>
    <div style="display:flex;align-items:center;gap:12px;">
      <span style="font-size:14px;color:#8A8377;">${weightStart} kg</span>
      <span style="font-size:13px;color:#DDD6C8;">→</span>
      <span style="font-size:26px;font-weight:700;color:#2C2A26;">${weightEnd} kg</span>
      <span style="font-size:16px;font-weight:600;color:${diffColor};">
        ${parseFloat(weightDiff) < 0 ? '↓' : parseFloat(weightDiff) > 0 ? '↑' : ''}${Math.abs(parseFloat(weightDiff))} kg
      </span>
    </div>
  </div>` : ''}

  <!-- CTA -->
  <div style="text-align:center;margin:24px 0;">
    <a href="${appUrl}" style="display:inline-block;background:#E8835A;color:white;text-decoration:none;padding:14px 32px;border-radius:14px;font-size:15px;font-weight:600;">
      今週の記録をはじめる →
    </a>
  </div>

  <!-- フッター -->
  <div style="text-align:center;border-top:1px solid #DDD6C8;padding-top:16px;">
    <p style="font-size:11px;color:#8A8377;margin:0;">
      Meal Journal · 配信停止はアプリ内のお問い合わせからご連絡ください
    </p>
  </div>

</div>
</body>
</html>`
}

export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM_EMAIL) {
    return NextResponse.json({ error: 'Resend not configured' }, { status: 500 })
  }

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const resend = new Resend(process.env.RESEND_API_KEY)
  const { weekStart, weekEnd } = getWeekRange()
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://meal-journal-eta.vercel.app'

  // 全ユーザー取得（最大1000人）
  const { data: { users } } = await admin.auth.admin.listUsers({ perPage: 1000 })
  if (!users.length) return NextResponse.json({ sent: 0 })

  // 目標設定済みユーザーのみ
  const { data: goals } = await admin.from('user_goals')
    .select('user_id, target_cal, protein, fat, carbs')
  const goalMap = new Map(goals?.map(g => [g.user_id, g]) ?? [])

  let sent = 0
  const errors: string[] = []

  for (const user of users) {
    if (!user.email || !goalMap.has(user.id)) continue
    const goal = goalMap.get(user.id)!

    // 先週の食事記録
    const { data: records } = await admin
      .from('meal_records')
      .select('recorded_at, calories, protein, fat, carbs')
      .eq('user_id', user.id)
      .gte('recorded_at', weekStart)
      .lte('recorded_at', weekEnd)

    if (!records || records.length === 0) continue

    const daysLogged = new Set(records.map(r => r.recorded_at)).size
    const avgCal = Math.round(records.reduce((s, r) => s + r.calories, 0) / daysLogged)
    const avgProtein = Math.round(records.reduce((s, r) => s + r.protein, 0) / daysLogged)
    const avgFat = Math.round(records.reduce((s, r) => s + r.fat, 0) / daysLogged)
    const avgCarbs = Math.round(records.reduce((s, r) => s + r.carbs, 0) / daysLogged)

    // 先週の体重記録
    const { data: weights } = await admin
      .from('weight_records')
      .select('recorded_at, weight')
      .eq('user_id', user.id)
      .gte('recorded_at', weekStart)
      .lte('recorded_at', weekEnd)
      .order('recorded_at', { ascending: true })

    const weightStart = weights?.length ? weights[0].weight : null
    const weightEnd = weights?.length ? weights[weights.length - 1].weight : null

    try {
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL!,
        to: user.email,
        subject: `📊 先週の振り返り（${weekStart.slice(5).replace('-', '/')}〜${weekEnd.slice(5).replace('-', '/')}）`,
        html: buildHtml({
          weekStart, weekEnd, daysLogged,
          daysWithWeight: weights?.length ?? 0,
          avgCal, avgProtein, avgFat, avgCarbs,
          weightStart, weightEnd, goal, appUrl,
        }),
      })
      sent++
    } catch (e: any) {
      errors.push(user.email)
    }
  }

  return NextResponse.json({ sent, week: `${weekStart}~${weekEnd}`, errors })
}
