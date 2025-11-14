-- Remove UPDATE policies that allow users to modify subscription and usage data
-- These operations should only be performed by backend edge functions using service role

-- Drop the subscription UPDATE policy
DROP POLICY IF EXISTS "Users can update their own subscription" ON public.subscriptions;

-- Drop the daily_usage UPDATE policy
DROP POLICY IF EXISTS "Users can update their own usage" ON public.daily_usage;
