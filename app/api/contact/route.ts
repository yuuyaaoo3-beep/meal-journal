import { createClient } from '@supabase/supabase-js'
import { NextRequest } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { accessToken, category, message } = await req.json()
    if (!accessToken || !category?.trim() || !message?.trim()) {
      return Response.json({ error: 'Invalid request' }, { status: 400 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: `Bearer ${accessToken}` } } }
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const { error } = await supabase.from('contact_messages').insert({
      user_id: user.id,
      user_email: user.email,
      category: category.trim(),
      message: message.trim(),
    })

    if (error) throw error
    return Response.json({ success: true })
  } catch {
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
