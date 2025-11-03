-- Create achievements table for gamification
CREATE TABLE public.achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  achievement_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  earned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  icon TEXT,
  CONSTRAINT achievements_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id)
);

-- Create user_streaks table for tracking routine consistency
CREATE TABLE public.user_streaks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_completion_date DATE,
  total_completions INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT user_streaks_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id)
);

-- Create product_recommendations table
CREATE TABLE public.product_recommendations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  product_id UUID NOT NULL,
  reason TEXT,
  confidence_score NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT product_recommendations_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id),
  CONSTRAINT product_recommendations_product_id_fkey FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Enable RLS
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_recommendations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for achievements
CREATE POLICY "Users can view own achievements"
  ON public.achievements FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own achievements"
  ON public.achievements FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for user_streaks
CREATE POLICY "Users can view own streaks"
  ON public.user_streaks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own streaks"
  ON public.user_streaks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own streaks"
  ON public.user_streaks FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for product_recommendations
CREATE POLICY "Users can view own recommendations"
  ON public.product_recommendations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own recommendations"
  ON public.product_recommendations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Add indexes for performance
CREATE INDEX idx_achievements_user_id ON public.achievements(user_id);
CREATE INDEX idx_achievements_earned_at ON public.achievements(earned_at DESC);
CREATE INDEX idx_user_streaks_user_id ON public.user_streaks(user_id);
CREATE INDEX idx_product_recommendations_user_id ON public.product_recommendations(user_id);
CREATE INDEX idx_product_recommendations_created_at ON public.product_recommendations(created_at DESC);

-- Add trigger for updated_at on user_streaks
CREATE TRIGGER update_user_streaks_updated_at
  BEFORE UPDATE ON public.user_streaks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();