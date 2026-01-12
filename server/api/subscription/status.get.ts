import { getAuthenticatedUser } from '~/server/utils/auth'
import { getSubscriptionStatus } from '~/server/utils/subscription'

export default defineEventHandler(async (event) => {
  const user = await getAuthenticatedUser(event)
  const subscription = await getSubscriptionStatus(event, user.id)

  return {
    status: subscription.status,
    isPremium: subscription.isPremium,
    endsAt: subscription.endsAt,
  }
})
