-- Add DELETE policy for product_recommendations so users can refresh their recommendations
CREATE POLICY "Users can delete own recommendations" 
ON public.product_recommendations 
FOR DELETE 
USING (auth.uid() = user_id);