-- Add subscription fields to profiles table
ALTER TABLE public.profiles
ADD COLUMN subscription_status TEXT DEFAULT 'free'
  CHECK (subscription_status IN ('free', 'premium', 'cancelled', 'past_due')),
ADD COLUMN stripe_customer_id TEXT UNIQUE,
ADD COLUMN stripe_subscription_id TEXT UNIQUE,
ADD COLUMN subscription_started_at TIMESTAMPTZ,
ADD COLUMN subscription_ends_at TIMESTAMPTZ;

-- Create indexes for subscription queries
CREATE INDEX idx_profiles_subscription_status ON public.profiles(subscription_status);
CREATE INDEX idx_profiles_stripe_customer ON public.profiles(stripe_customer_id)
  WHERE stripe_customer_id IS NOT NULL;

-- Create subscription events table for audit logging
CREATE TABLE public.subscription_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  stripe_event_id TEXT,
  stripe_subscription_id TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_subscription_events_user ON public.subscription_events(user_id);
CREATE INDEX idx_subscription_events_stripe ON public.subscription_events(stripe_event_id);

-- Enable RLS on subscription events
ALTER TABLE public.subscription_events ENABLE ROW LEVEL SECURITY;

-- Users can view their own subscription events
CREATE POLICY "Users can view own subscription events"
  ON public.subscription_events FOR SELECT
  USING (auth.uid() = user_id);
