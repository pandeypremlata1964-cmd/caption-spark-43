-- Create enum for subscription tiers
CREATE TYPE subscription_tier AS ENUM ('freemium', 'monthly', 'six_months', 'yearly');

-- Create subscriptions table
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  tier subscription_tier NOT NULL DEFAULT 'freemium',
  status TEXT NOT NULL DEFAULT 'active',
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  razorpay_subscription_id TEXT,
  razorpay_payment_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create daily usage tracking table
CREATE TABLE public.daily_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  usage_date DATE NOT NULL DEFAULT CURRENT_DATE,
  generation_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, usage_date)
);

-- Enable RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_usage ENABLE ROW LEVEL SECURITY;

-- RLS Policies for subscriptions
CREATE POLICY "Users can view their own subscription"
  ON public.subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subscription"
  ON public.subscriptions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscription"
  ON public.subscriptions
  FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for daily_usage
CREATE POLICY "Users can view their own usage"
  ON public.daily_usage
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own usage"
  ON public.daily_usage
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own usage"
  ON public.daily_usage
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_daily_usage_updated_at
  BEFORE UPDATE ON public.daily_usage
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Create function to get user's current tier and remaining quota
CREATE OR REPLACE FUNCTION public.get_user_quota(user_id_param UUID)
RETURNS TABLE (
  tier subscription_tier,
  daily_limit INTEGER,
  used_today INTEGER,
  remaining INTEGER
) AS $$
DECLARE
  user_tier subscription_tier;
  limit_count INTEGER;
  used_count INTEGER;
BEGIN
  -- Get user's subscription tier
  SELECT s.tier INTO user_tier
  FROM public.subscriptions s
  WHERE s.user_id = user_id_param
    AND s.status = 'active'
    AND (s.expires_at IS NULL OR s.expires_at > now())
  ORDER BY s.created_at DESC
  LIMIT 1;
  
  -- Default to freemium if no subscription found
  IF user_tier IS NULL THEN
    user_tier := 'freemium';
  END IF;
  
  -- Set daily limits based on tier
  CASE user_tier
    WHEN 'freemium' THEN limit_count := 3;
    WHEN 'monthly' THEN limit_count := 999999;  -- Unlimited
    WHEN 'six_months' THEN limit_count := 999999;  -- Unlimited
    WHEN 'yearly' THEN limit_count := 999999;  -- Unlimited
  END CASE;
  
  -- Get today's usage
  SELECT COALESCE(du.generation_count, 0) INTO used_count
  FROM public.daily_usage du
  WHERE du.user_id = user_id_param
    AND du.usage_date = CURRENT_DATE;
  
  IF used_count IS NULL THEN
    used_count := 0;
  END IF;
  
  RETURN QUERY SELECT 
    user_tier,
    limit_count,
    used_count,
    GREATEST(0, limit_count - used_count);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;