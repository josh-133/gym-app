import { createClient } from '@supabase/supabase-js'
import type { H3Event } from 'h3'
import type { SubscriptionStatus } from '~/types/database'

export interface SubscriptionInfo {
  status: SubscriptionStatus
  isPremium: boolean
  endsAt: string | null
  stripeCustomerId: string | null
}

export async function getSubscriptionStatus(event: H3Event, userId: string): Promise<SubscriptionInfo> {
  const config = useRuntimeConfig()

  const supabase = createClient(
    config.public.supabaseUrl,
    config.supabaseServiceKey
  )

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('subscription_status, subscription_ends_at, stripe_customer_id')
    .eq('id', userId)
    .single()

  if (error || !profile) {
    return {
      status: 'free',
      isPremium: false,
      endsAt: null,
      stripeCustomerId: null,
    }
  }

  // Check if subscription has expired
  const now = new Date()
  const endsAt = profile.subscription_ends_at ? new Date(profile.subscription_ends_at) : null

  // Premium status: must be 'premium' and not expired (or no end date set)
  const isPremium = profile.subscription_status === 'premium' &&
    (!endsAt || endsAt > now)

  return {
    status: isPremium ? 'premium' : (profile.subscription_status || 'free'),
    isPremium,
    endsAt: profile.subscription_ends_at,
    stripeCustomerId: profile.stripe_customer_id,
  }
}

export function requirePremium(subscription: SubscriptionInfo): void {
  if (!subscription.isPremium) {
    throw createError({
      statusCode: 403,
      message: 'Premium subscription required',
      data: { requiresUpgrade: true },
    })
  }
}
