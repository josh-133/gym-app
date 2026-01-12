import { createClient } from '@supabase/supabase-js'
import type { H3Event } from 'h3'
import type { User } from '@supabase/supabase-js'

export async function getAuthenticatedUser(event: H3Event): Promise<User> {
  const config = useRuntimeConfig()
  const authHeader = getHeader(event, 'authorization')

  if (!authHeader?.startsWith('Bearer ')) {
    throw createError({
      statusCode: 401,
      message: 'Authentication required',
    })
  }

  const token = authHeader.substring(7)

  const supabase = createClient(
    config.public.supabaseUrl,
    config.supabaseServiceKey
  )

  const { data: { user }, error } = await supabase.auth.getUser(token)

  if (error || !user) {
    throw createError({
      statusCode: 401,
      message: 'Invalid or expired token',
    })
  }

  return user
}
