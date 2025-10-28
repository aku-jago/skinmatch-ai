-- Create products table for marketplace
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  brand TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  ingredients TEXT,
  benefits TEXT,
  image_url TEXT,
  skin_types TEXT[], -- array of compatible skin types
  concerns TEXT[], -- array of skin concerns it addresses
  rating NUMERIC(3,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create orders table for purchase tracking
CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  total_price NUMERIC(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'completed',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create photo journals table for progress tracking
CREATE TABLE public.photo_journals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  analysis_result JSONB,
  comparison_summary TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create skincare routines table
CREATE TABLE public.skincare_routines (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  routine_name TEXT NOT NULL,
  time_of_day TEXT NOT NULL, -- 'morning' or 'night'
  products JSONB NOT NULL DEFAULT '[]'::jsonb,
  reminder_time TIME,
  progress INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photo_journals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skincare_routines ENABLE ROW LEVEL SECURITY;

-- RLS Policies for products (public read)
CREATE POLICY "Products are viewable by everyone"
ON public.products FOR SELECT
USING (true);

-- RLS Policies for orders
CREATE POLICY "Users can view own orders"
ON public.orders FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own orders"
ON public.orders FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- RLS Policies for photo journals
CREATE POLICY "Users can view own photo journals"
ON public.photo_journals FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own photo journals"
ON public.photo_journals FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own photo journals"
ON public.photo_journals FOR DELETE
USING (auth.uid() = user_id);

-- RLS Policies for skincare routines
CREATE POLICY "Users can view own routines"
ON public.skincare_routines FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own routines"
ON public.skincare_routines FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own routines"
ON public.skincare_routines FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own routines"
ON public.skincare_routines FOR DELETE
USING (auth.uid() = user_id);

-- Add trigger for skincare_routines updated_at
CREATE TRIGGER update_skincare_routines_updated_at
BEFORE UPDATE ON public.skincare_routines
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample products
INSERT INTO public.products (name, brand, price, category, description, ingredients, benefits, skin_types, concerns, rating) VALUES
('Gentle Foaming Cleanser', 'CeraVe', 14.99, 'Cleanser', 'A gentle foaming cleanser that removes oil and dirt without disrupting the skin barrier.', 'Ceramides, Hyaluronic Acid, Niacinamide', 'Cleanses without stripping, maintains skin barrier, hydrates', ARRAY['normal', 'oily', 'combination'], ARRAY['acne', 'oiliness'], 4.5),
('Hydrating Toner', 'Klairs', 22.00, 'Toner', 'A lightweight, hydrating toner that preps skin for better absorption.', 'Hyaluronic Acid, Beta-Glucan, Centella Asiatica', 'Hydrates, soothes, preps skin', ARRAY['dry', 'normal', 'sensitive'], ARRAY['dryness', 'redness'], 4.7),
('Niacinamide Serum', 'The Ordinary', 6.50, 'Serum', 'A high-strength niacinamide serum that balances oil production and minimizes pores.', 'Niacinamide 10%, Zinc 1%', 'Controls oil, reduces pores, brightens', ARRAY['oily', 'combination', 'acne-prone'], ARRAY['acne', 'oiliness', 'texture'], 4.3),
('Vitamin C Serum', 'Timeless', 25.95, 'Serum', 'A potent vitamin C serum that brightens and evens skin tone.', 'L-Ascorbic Acid 20%, Vitamin E, Ferulic Acid', 'Brightens, evens tone, antioxidant protection', ARRAY['normal', 'dry', 'combination'], ARRAY['dullness', 'uneven tone'], 4.6),
('Lightweight Moisturizer', 'Neutrogena', 16.99, 'Moisturizer', 'An oil-free gel moisturizer perfect for oily and combination skin.', 'Hyaluronic Acid, Glycerin', 'Hydrates without heaviness, non-comedogenic', ARRAY['oily', 'combination', 'acne-prone'], ARRAY['oiliness', 'acne'], 4.4),
('Rich Night Cream', 'La Roche-Posay', 39.99, 'Moisturizer', 'A deeply nourishing night cream for dry and mature skin.', 'Shea Butter, Ceramides, Glycerin', 'Deeply hydrates, repairs barrier, anti-aging', ARRAY['dry', 'normal'], ARRAY['dryness', 'aging'], 4.8),
('Salicylic Acid Cleanser', 'Paula''s Choice', 19.00, 'Cleanser', 'A BHA cleanser that unclogs pores and prevents breakouts.', 'Salicylic Acid 2%, Green Tea Extract', 'Exfoliates, unclogs pores, prevents acne', ARRAY['oily', 'acne-prone', 'combination'], ARRAY['acne', 'texture'], 4.5),
('Soothing Gel Moisturizer', 'Cosrx', 18.00, 'Moisturizer', 'A calming gel moisturizer with snail mucin for sensitive skin.', 'Snail Secretion Filtrate, Hyaluronic Acid', 'Soothes, hydrates, repairs', ARRAY['sensitive', 'dry', 'normal'], ARRAY['redness', 'dryness'], 4.7),
('Retinol Serum', 'Inkey List', 9.99, 'Serum', 'A beginner-friendly retinol serum for anti-aging and texture improvement.', 'Retinol 1%, Squalane', 'Reduces fine lines, improves texture, anti-aging', ARRAY['normal', 'dry', 'combination'], ARRAY['aging', 'texture'], 4.4),
('Mineral Sunscreen SPF 50', 'EltaMD', 34.00, 'Sunscreen', 'A broad-spectrum mineral sunscreen suitable for all skin types.', 'Zinc Oxide, Niacinamide, Hyaluronic Acid', 'Protects from UV, non-greasy, brightens', ARRAY['all'], ARRAY['sun protection'], 4.9);