import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { NextRequest } from 'next/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = req.headers.get('stripe-signature')

  if (!signature) {
    return Response.json({ error: 'No signature' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err: any) {
    return Response.json({ error: `Webhook error: ${err.message}` }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const userId = session.metadata?.userId
    if (userId) {
      await supabaseAdmin
        .from('user_goals')
        .update({ is_premium: true })
        .eq('user_id', userId)
    }
  }

  if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object as Stripe.Subscription
    const customerId = subscription.customer as string
    const customer = await stripe.customers.retrieve(customerId)
    if (!customer.deleted) {
      const userId = customer.metadata?.userId
      if (userId) {
        await supabaseAdmin
          .from('user_goals')
          .update({ is_premium: false })
          .eq('user_id', userId)
      }
    }
  }

  return Response.json({ received: true })
}
