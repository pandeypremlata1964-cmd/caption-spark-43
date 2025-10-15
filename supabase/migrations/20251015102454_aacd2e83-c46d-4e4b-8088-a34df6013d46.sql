-- Create saved_posts table for storing generated captions and hashtags
CREATE TABLE IF NOT EXISTS public.saved_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  caption TEXT NOT NULL,
  hashtags TEXT[] NOT NULL,
  mood TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.saved_posts ENABLE ROW LEVEL SECURITY;

-- Policies: Users can only see and manage their own posts
CREATE POLICY "Users can view their own saved posts"
  ON public.saved_posts
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own saved posts"
  ON public.saved_posts
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saved posts"
  ON public.saved_posts
  FOR DELETE
  USING (auth.uid() = user_id);