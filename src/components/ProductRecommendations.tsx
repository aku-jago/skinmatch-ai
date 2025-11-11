import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, ShoppingCart, Heart } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Product {
  id: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  image_url: string | null;
  rating: number | null;
  description: string | null;
}

interface Recommendation {
  id: string;
  product_id: string;
  reason: string | null;
  confidence_score: number | null;
  products: Product;
}

export default function ProductRecommendations() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (user) {
      loadRecommendations();
    }
  }, [user]);

  const loadRecommendations = async () => {
    try {
      const { data, error } = await supabase
        .from('product_recommendations')
        .select(`
          *,
          products:product_id (*)
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(6);

      if (error) throw error;
      setRecommendations(data || []);
    } catch (error) {
      console.error('Error loading recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateRecommendations = async () => {
    setGenerating(true);
    try {
      // Get user profile and latest skin analysis
      const { data: profile } = await supabase
        .from('profiles')
        .select('skin_type, preferences')
        .eq('id', user?.id)
        .single();

      const { data: latestAnalysis } = await supabase
        .from('skin_analyses')
        .select('skin_type, detected_issues, recommendations')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      // Get up to 50 products for recommendation analysis
      const { data: products } = await supabase
        .from('products')
        .select('*')
        .limit(50);

      if (!products || products.length === 0) {
        toast({
          title: 'Tidak ada produk',
          description: 'Belum ada produk yang tersedia untuk rekomendasi.',
          variant: 'destructive'
        });
        return;
      }

      // Simple recommendation logic based on skin type and concerns
      const skinType = latestAnalysis?.skin_type || profile?.skin_type || 'normal';
      const concerns = latestAnalysis?.detected_issues || [];
      
      // Filter products that match user's skin type
      const matchedProducts = products.filter(product => {
        if (!product.skin_types || product.skin_types.length === 0) return true;
        return product.skin_types.includes(skinType);
      });

      // Take top 6 products with highest ratings
      const topProducts = matchedProducts
        .sort((a, b) => (b.rating || 0) - (a.rating || 0))
        .slice(0, 6);

      // Clear existing recommendations
      await supabase
        .from('product_recommendations')
        .delete()
        .eq('user_id', user?.id);

      // Insert new recommendations
      const recommendationsToInsert = topProducts.map(product => ({
        user_id: user?.id,
        product_id: product.id,
        reason: `Cocok untuk kulit ${skinType}${product.category ? ` - ${product.category}` : ''}`,
        confidence_score: product.rating || 4.0
      }));

      const { error: insertError } = await supabase
        .from('product_recommendations')
        .insert(recommendationsToInsert);

      if (insertError) throw insertError;

      toast({
        title: 'Rekomendasi berhasil dibuat!',
        description: `${topProducts.length} produk direkomendasikan untuk Anda.`,
      });

      await loadRecommendations();
    } catch (error) {
      console.error('Error generating recommendations:', error);
      toast({
        title: 'Gagal membuat rekomendasi',
        description: 'Terjadi kesalahan saat membuat rekomendasi produk.',
        variant: 'destructive'
      });
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-muted rounded w-1/2"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-primary" />
          <h3 className="text-xl font-bold">Rekomendasi Produk untuk Anda</h3>
        </div>
        <Button
          onClick={generateRecommendations}
          disabled={generating}
          variant="outline"
          size="sm"
        >
          {generating ? 'Membuat...' : 'Refresh'}
        </Button>
      </div>

      {recommendations.length === 0 ? (
        <div className="text-center py-12">
          <Sparkles className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h4 className="text-lg font-semibold mb-2">Belum Ada Rekomendasi</h4>
          <p className="text-muted-foreground mb-4">
            Dapatkan rekomendasi produk yang cocok dengan jenis kulit Anda
          </p>
          <Button onClick={generateRecommendations} disabled={generating}>
            {generating ? 'Membuat...' : 'Buat Rekomendasi'}
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recommendations.map((rec) => (
            <div
              key={rec.id}
              className="flex gap-4 p-4 bg-gradient-to-br from-background to-accent/5 rounded-lg border hover:border-primary/50 transition-all"
            >
              <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                {rec.products.image_url ? (
                  <img
                    src={rec.products.image_url}
                    alt={rec.products.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ShoppingCart className="w-8 h-8 text-muted-foreground" />
                  </div>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-sm mb-1 truncate">
                  {rec.products.name}
                </h4>
                <p className="text-xs text-muted-foreground mb-2">
                  {rec.products.brand}
                </p>
                
                {rec.reason && (
                  <Badge variant="secondary" className="text-xs mb-2">
                    {rec.reason}
                  </Badge>
                )}
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-primary">
                    Rp {rec.products.price.toLocaleString('id-ID')}
                  </span>
                  {rec.products.rating && (
                    <div className="flex items-center gap-1">
                      <span className="text-xs">⭐</span>
                      <span className="text-xs font-medium">
                        {rec.products.rating.toFixed(1)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}