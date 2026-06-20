import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(req: NextRequest) {
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

    let customers = await stripe.customers.search({
      query: `metadata['userId']:'${user.id}'`,
    })
    // メタデータが未設定の場合はメールで検索
    if (!customers.data.length && user.email) {
      const byEmail = await stripe.customers.list({ email: user.email, limit: 1 })
      if (byEmail.data.length) customers = { ...customers, data: byEmail.data }
    }
    if (!customers.data.length) {
      return NextResponse.json({ error: 'No subscription found' }, { status: 404 })
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: customers.data[0].id,
      return_url: process.env.NEXT_PUBLIC_APP_URL + '/',
    })

    return NextResponse.json({ url: session.url })
  } catch (error: any) {
    console.error('Customer portal error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
