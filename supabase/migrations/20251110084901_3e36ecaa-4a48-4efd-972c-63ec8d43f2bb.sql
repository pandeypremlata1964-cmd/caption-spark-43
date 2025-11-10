-- Fix search_path for handle_updated_at function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Fix search_path for get_user_quota function  
CREATE OR REPLACE FUNCTION public.get_user_quota(user_id_param UUID)
RETURNS TABLE (
  tier subscription_tier,
  daily_limit INTEGER,
  used_today INTEGER,
  remaining INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
    WHEN 'monthly' THEN limit_count := 999999;
    WHEN 'six_months' THEN limit_count := 999999;
    WHEN 'yearly' THEN limit_count := 999999;
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
$$;