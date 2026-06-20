import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function DELETE(req: NextRequest) {
  try {
    const accessToken = req.headers.get('Authorization')?.replace('Bearer ', '')
    if (!accessToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: `Bearer ${accessToken}` } } }
    )
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // 全データを明示的に削除（cascade設定に依存しない）
    await Promise.all([
      admin.from('meal_records').delete().eq('user_id', user.id),
      admin.from('weight_records').delete().eq('user_id', user.id),
      admin.from('user_goals').delete().eq('user_id', user.id),
      admin.from('my_meals').delete().eq('user_id', user.id),
      admin.from('my_dishes').delete().eq('user_id', user.id),
      admin.from('contact_messages').delete().eq('user_id', user.id),
      admin.from('push_subscriptions').delete().eq('user_id', user.id),
      admin.from('api_usage').delete().eq('user_id', user.id),
    ])

    const { error } = await admin.auth.admin.deleteUser(user.id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
