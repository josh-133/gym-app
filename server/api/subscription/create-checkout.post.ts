import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { getAuthenticatedUser } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const user = await getAuthenticatedUser(event)

  if (!config.stripeSecretKey) {
    throw createError({
      statusCode: 500,
      message: 'Stripe is not configured',
    })
  }

  const stripe = new Stripe(config.stripeSecretKey)
  const supabase = createClient(config.public.supabaseUrl, config.supabaseServiceKey)

  // Get or create Stripe customer
  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_customer_id, username')
    .eq('id', user.id)
    .single()

  let customerId = profile?.stripe_customer_id

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: {
        supabase_user_id: user.id,
        username: profile?.username || '',
      },
    })
    customerId = customer.id

    // Save customer ID to profile
    await supabase
      .from('profiles')
      .update({ stripe_customer_id: customerId })
      .eq('id', user.id)
  }

  // Get the request URL for success/cancel redirects
  const requestUrl = getRequestURL(event)
  const baseUrl = `${requestUrl.protocol}//${requestUrl.host}`

  // Create checkout session
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [
      {
        price: config.public.stripePriceId,
        quantity: 1,
      },
    ],
    success_url: `${baseUrl}/upgrade?success=true`,
    cancel_url: `${baseUrl}/upgrade?cancelled=true`,
    metadata: {
      supabase_user_id: user.id,
    },
    subscription_data: {
      metadata: {
        supabase_user_id: user.id,
      },
    },
  })

  return { url: session.url }
})
