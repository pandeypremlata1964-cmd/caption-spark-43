-- Create payment_history table to track all payment transactions
CREATE TABLE IF NOT EXISTS public.payment_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  amount INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'INR',
  tier subscription_tier NOT NULL,
  duration_months INTEGER NOT NULL,
  razorpay_order_id TEXT,
  razorpay_payment_id TEXT,
  razorpay_signature TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  payment_method TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.payment_history ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own payment history"
  ON public.payment_history
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own payment history"
  ON public.payment_history
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_payment_history_updated_at
  BEFORE UPDATE ON public.payment_history
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Create index for faster queries
CREATE INDEX idx_payment_history_user_id ON public.payment_history(user_id);
CREATE INDEX idx_payment_history_created_at ON public.payment_history(created_at DESC);