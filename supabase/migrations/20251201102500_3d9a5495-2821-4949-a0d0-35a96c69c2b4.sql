-- Create table for skin type questionnaire results
CREATE TABLE public.skin_questionnaires (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- Answers stored as JSON
  answers JSONB NOT NULL DEFAULT '{}',
  -- Calculated results
  skin_type TEXT NOT NULL,
  is_sensitive BOOLEAN NOT NULL DEFAULT false,
  confidence_score NUMERIC DEFAULT 0.85,
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  -- One questionnaire per user (can be updated)
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.skin_questionnaires ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own questionnaire" 
ON public.skin_questionnaires 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own questionnaire" 
ON public.skin_questionnaires 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own questionnaire" 
ON public.skin_questionnaires 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_skin_questionnaires_updated_at
BEFORE UPDATE ON public.skin_questionnaires
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();