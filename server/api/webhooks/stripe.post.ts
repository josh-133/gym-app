import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()

  if (!config.stripeSecretKey || !config.stripeWebhookSecret) {
    throw createError({
      statusCode: 500,
      message: 'Stripe is not configured',
    })
  }

  const stripe = new Stripe(config.stripeSecretKey)

  // Get raw body for signature verification
  const body = await readRawBody(event)
  const signature = getHeader(event, 'stripe-signature')

  if (!body || !signature) {
    throw createError({ statusCode: 400, message: 'Missing body or signature' })
  }

  let stripeEvent: Stripe.Event

  try {
    stripeEvent = stripe.webhooks.constructEvent(
      body,
      signature,
      config.stripeWebhookSecret
    )
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    throw createError({ statusCode: 400, message: 'Invalid signature' })
  }

  const supabase = createClient(config.public.supabaseUrl, config.supabaseServiceKey)

  // Helper to log subscription event
  async function logEvent(userId: string, eventType: string, subscriptionId?: string) {
    await supabase.from('subscription_events').insert({
      user_id: userId,
      event_type: eventType,
      stripe_event_id: stripeEvent.id,
      stripe_subscription_id: subscriptionId,
      metadata: stripeEvent.data.object,
    })
  }

  switch (stripeEvent.type) {
    case 'checkout.session.completed': {
      const session = stripeEvent.data.object as Stripe.Checkout.Session
      const userId = session.metadata?.supabase_user_id

      if (userId && session.subscription) {
        const subscription = await stripe.subscriptions.retrieve(session.subscription as string)

        await supabase
          .from('profiles')
          .update({
            subscription_status: 'premium',
            stripe_subscription_id: subscription.id,
            subscription_started_at: new Date(subscription.current_period_start * 1000).toISOString(),
            subscription_ends_at: new Date(subscription.current_period_end * 1000).toISOString(),
          })
          .eq('id', userId)

        await logEvent(userId, 'subscription_created', subscription.id)
      }
      break
    }

    case 'customer.subscription.updated': {
      const subscription = stripeEvent.data.object as Stripe.Subscription
      const userId = subscription.metadata.supabase_user_id

      if (userId) {
        let status: string
        if (subscription.status === 'active' && !subscription.cancel_at_period_end) {
          status = 'premium'
        } else if (subscription.cancel_at_period_end) {
          status = 'cancelled'
        } else if (subscription.status === 'past_due') {
          status = 'past_due'
        } else {
          status = 'free'
        }

        await supabase
          .from('profiles')
          .update({
            subscription_status: status,
            subscription_ends_at: new Date(subscription.current_period_end * 1000).toISOString(),
          })
          .eq('id', userId)

        await logEvent(userId, 'subscription_updated', subscription.id)
      }
      break
    }

    case 'customer.subscription.deleted': {
      const subscription = stripeEvent.data.object as Stripe.Subscription
      const userId = subscription.metadata.supabase_user_id

      if (userId) {
        await supabase
          .from('profiles')
          .update({
            subscription_status: 'free',
            stripe_subscription_id: null,
            subscription_ends_at: null,
          })
          .eq('id', userId)

        await logEvent(userId, 'subscription_cancelled', subscription.id)
      }
      break
    }

    case 'invoice.payment_failed': {
      const invoice = stripeEvent.data.object as Stripe.Invoice
      if (invoice.subscription) {
        const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string)
        const userId = subscription.metadata.supabase_user_id

        if (userId) {
          await supabase
            .from('profiles')
            .update({ subscription_status: 'past_due' })
            .eq('id', userId)

          await logEvent(userId, 'payment_failed', invoice.subscription as string)
        }
      }
      break
    }

    case 'invoice.payment_succeeded': {
      const invoice = stripeEvent.data.object as Stripe.Invoice
      if (invoice.subscription && invoice.billing_reason === 'subscription_cycle') {
        const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string)
        const userId = subscription.metadata.supabase_user_id

        if (userId) {
          await supabase
            .from('profiles')
            .update({
              subscription_status: 'premium',
              subscription_ends_at: new Date(subscription.current_period_end * 1000).toISOString(),
            })
            .eq('id', userId)

          await logEvent(userId, 'subscription_renewed', invoice.subscription as string)
        }
      }
      break
    }
  }

  return { received: true }
})
