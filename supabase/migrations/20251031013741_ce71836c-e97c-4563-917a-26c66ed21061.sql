-- Add detailed_analysis column to skin_analyses table
ALTER TABLE public.skin_analyses
ADD COLUMN detailed_analysis TEXT;