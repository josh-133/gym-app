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

  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', user.id)
    .single()

  if (!profile?.stripe_customer_id) {
    throw createError({
      statusCode: 400,
      message: 'No subscription found',
    })
  }

  // Get the request URL for return redirect
  const requestUrl = getRequestURL(event)
  const baseUrl = `${requestUrl.protocol}//${requestUrl.host}`

  const session = await stripe.billingPortal.sessions.create({
    customer: profile.stripe_customer_id,
    return_url: `${baseUrl}/profile`,
  })

  return { url: session.url }
})
