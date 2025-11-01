import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Navigation } from '@/components/Navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search, ShoppingCart, Star, MessageCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ProductReviews from '@/components/ProductReviews';
import ProductReviewDialog from '@/components/ProductReviewDialog';

interface Product {
  id: string;
  name: string;
  brand: string;
  price: number;
  category: string;
  description: string | null;
  ingredients: string | null;
  benefits: string | null;
  image_url: string | null;
  skin_types: string[] | null;
  concerns: string[] | null;
  rating: number | null;
}

const Shop = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [concernFilter, setConcernFilter] = useState('all');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [userSkinType, setUserSkinType] = useState<string | null>(null);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [reviewsKey, setReviewsKey] = useState(0);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    } else if (user) {
      loadProducts();
      loadUserProfile();
    }
  }, [user, loading, navigate]);

  const loadUserProfile = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('profiles')
      .select('skin_type')
      .eq('id', user.id)
      .single();
    
    if (data) setUserSkinType(data.skin_type);
  };

  const loadProducts = async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('rating', { ascending: false });

    if (error) {
      console.error('Error loading products:', error);
      return;
    }

    setProducts(data || []);
    setFilteredProducts(data || []);
  };

  useEffect(() => {
    let filtered = products;

    if (searchQuery) {
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.ingredients?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(p => p.category === categoryFilter);
    }

    if (concernFilter !== 'all') {
      filtered = filtered.filter(p => 
        p.concerns?.includes(concernFilter)
      );
    }

    setFilteredProducts(filtered);
  }, [searchQuery, categoryFilter, concernFilter, products]);

  const isSuitableForUserSkin = (product: Product) => {
    if (!userSkinType) return false;
    return product.skin_types?.includes(userSkinType) || product.skin_types?.includes('all');
  };

  const handleBuyNow = async (product: Product) => {
    if (!user) return;

    const { error } = await supabase.from('orders').insert([
      {
        user_id: user.id,
        product_id: product.id,
        quantity: 1,
        total_price: product.price,
        status: 'completed'
      }
    ]);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to complete purchase. Please try again.",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Purchase Successful!",
        description: `You've purchased ${product.name}. Check your order history.`,
      });
      setSelectedProduct(null);
    }
  };

  if (loading || !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 pt-24 pb-12">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Product Marketplace
            </h1>
            <p className="text-muted-foreground">
              Discover skincare products perfect for your skin type
            </p>
          </div>

          {/* Filters */}
          <Card className="shadow-soft">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search products, brands, ingredients..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="Cleanser">Cleanser</SelectItem>
                    <SelectItem value="Toner">Toner</SelectItem>
                    <SelectItem value="Serum">Serum</SelectItem>
                    <SelectItem value="Moisturizer">Moisturizer</SelectItem>
                    <SelectItem value="Sunscreen">Sunscreen</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={concernFilter} onValueChange={setConcernFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Skin Concern" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Concerns</SelectItem>
                    <SelectItem value="acne">Acne</SelectItem>
                    <SelectItem value="dryness">Dryness</SelectItem>
                    <SelectItem value="oiliness">Oiliness</SelectItem>
                    <SelectItem value="redness">Redness</SelectItem>
                    <SelectItem value="aging">Aging</SelectItem>
                    <SelectItem value="texture">Texture</SelectItem>
                    <SelectItem value="dullness">Dullness</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Products Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => (
              <Card key={product.id} className="shadow-soft hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setSelectedProduct(product)}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{product.name}</CardTitle>
                      <CardDescription>{product.brand}</CardDescription>
                    </div>
                    {isSuitableForUserSkin(product) && (
                      <Badge variant="secondary" className="ml-2">
                        For You
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1 mt-2">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-medium">{product.rating?.toFixed(1)}</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-primary">
                      ${product.price.toFixed(2)}
                    </span>
                    <Badge variant="outline">{product.category}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {product.description}
                  </p>
                  {product.concerns && product.concerns.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {product.concerns.slice(0, 3).map((concern) => (
                        <Badge key={concern} variant="secondary" className="text-xs">
                          {concern}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredProducts.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No products found matching your filters.</p>
            </div>
          )}
        </div>
      </div>

      {/* Product Detail Modal */}
      <Dialog open={!!selectedProduct} onOpenChange={() => setSelectedProduct(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedProduct && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl">{selectedProduct.name}</DialogTitle>
                <DialogDescription className="text-lg">{selectedProduct.brand}</DialogDescription>
              </DialogHeader>
              
              <Tabs defaultValue="details" className="mt-4">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="details">Product Details</TabsTrigger>
                  <TabsTrigger value="reviews">Reviews</TabsTrigger>
                </TabsList>
                
                <TabsContent value="details" className="space-y-6 mt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                      <span className="text-lg font-medium">{selectedProduct.rating?.toFixed(1)}</span>
                    </div>
                    <span className="text-3xl font-bold text-primary">
                      ${selectedProduct.price.toFixed(2)}
                    </span>
                  </div>

                  {isSuitableForUserSkin(selectedProduct) && (
                    <Badge variant="secondary" className="text-sm">
                      ✨ Suitable for your {userSkinType} skin type
                    </Badge>
                  )}

                  <div>
                    <h3 className="font-semibold mb-2">Description</h3>
                    <p className="text-muted-foreground">{selectedProduct.description}</p>
                  </div>

                  {selectedProduct.ingredients && (
                    <div>
                      <h3 className="font-semibold mb-2">Key Ingredients</h3>
                      <p className="text-sm text-muted-foreground">{selectedProduct.ingredients}</p>
                    </div>
                  )}

                  {selectedProduct.benefits && (
                    <div>
                      <h3 className="font-semibold mb-2">Benefits</h3>
                      <p className="text-sm text-muted-foreground">{selectedProduct.benefits}</p>
                    </div>
                  )}

                  {selectedProduct.concerns && selectedProduct.concerns.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-2">Addresses Concerns</h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedProduct.concerns.map((concern) => (
                          <Badge key={concern} variant="outline">
                            {concern}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3 pt-4">
                    <Button
                      onClick={() => handleBuyNow(selectedProduct)}
                      className="flex-1"
                      size="lg"
                    >
                      <ShoppingCart className="h-5 w-5 mr-2" />
                      Buy Now
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowReviewDialog(true)}
                      size="lg"
                    >
                      <MessageCircle className="h-5 w-5 mr-2" />
                      Write Review
                    </Button>
                  </div>
                </TabsContent>
                
                <TabsContent value="reviews" className="mt-6">
                  <ProductReviews key={reviewsKey} productId={selectedProduct.id} />
                </TabsContent>
              </Tabs>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Review Dialog */}
      {selectedProduct && (
        <ProductReviewDialog
          productId={selectedProduct.id}
          productName={selectedProduct.name}
          open={showReviewDialog}
          onOpenChange={setShowReviewDialog}
          onReviewSubmitted={() => {
            setReviewsKey(prev => prev + 1);
            toast({
              title: "Review Posted!",
              description: "Thank you for sharing your experience",
            });
          }}
        />
      )}
    </div>
  );
};

export default Shop;
