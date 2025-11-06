-- Create table for product scan results
CREATE TABLE public.product_scans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  product_name TEXT,
  image_url TEXT NOT NULL,
  ingredients_detected TEXT[],
  allergens_detected JSONB,
  irritants_detected JSONB,
  patch_test_recommended BOOLEAN DEFAULT false,
  safety_score NUMERIC,
  analysis_summary TEXT,
  recommendations TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.product_scans ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own product scans"
ON public.product_scans
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own product scans"
ON public.product_scans
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own product scans"
ON public.product_scans
FOR DELETE
USING (auth.uid() = user_id);

-- Create index for better query performance
CREATE INDEX idx_product_scans_user_id ON public.product_scans(user_id);
CREATE INDEX idx_product_scans_created_at ON public.product_scans(created_at DESC);