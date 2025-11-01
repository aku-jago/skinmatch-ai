import { useEffect, useState } from 'react';
import { Star, ThumbsUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';

interface Review {
  id: string;
  rating: number;
  review_text: string | null;
  would_recommend: boolean;
  skin_type: string | null;
  helpful_count: number;
  created_at: string;
  profiles: {
    name: string;
  };
}

interface ProductReviewsProps {
  productId: string;
}

const ProductReviews = ({ productId }: ProductReviewsProps) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [averageRating, setAverageRating] = useState<number>(0);

  useEffect(() => {
    loadReviews();
  }, [productId]);

  const loadReviews = async () => {
    try {
      const { data: reviewsData, error } = await supabase
        .from('product_reviews')
        .select('*')
        .eq('product_id', productId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch user profiles separately
      if (reviewsData && reviewsData.length > 0) {
        const userIds = reviewsData.map((r) => r.user_id);
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, name')
          .in('id', userIds);

        const profilesMap = new Map(
          profilesData?.map((p) => [p.id, p]) || []
        );

        const reviewsWithProfiles = reviewsData.map((review) => ({
          ...review,
          profiles: profilesMap.get(review.user_id) || { name: 'Anonymous' },
        }));

        setReviews(reviewsWithProfiles);
      } else {
        setReviews([]);
      }

      // Calculate average rating
      if (reviewsData && reviewsData.length > 0) {
        const avg = reviewsData.reduce((sum, review) => sum + review.rating, 0) / reviewsData.length;
        setAverageRating(avg);
      }
    } catch (error) {
      console.error('Error loading reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating ? 'fill-yellow-500 text-yellow-500' : 'text-muted-foreground'
            }`}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <Card className="shadow-soft">
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">Loading reviews...</div>
        </CardContent>
      </Card>
    );
  }

  if (reviews.length === 0) {
    return (
      <Card className="shadow-soft">
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">
            No reviews yet. Be the first to review this product!
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overall Rating Summary */}
      <Card className="shadow-soft bg-gradient-to-br from-card to-primary/5">
        <CardHeader>
          <CardTitle>Customer Reviews</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-4xl font-bold text-primary">
                {averageRating.toFixed(1)}
              </div>
              <div className="mt-2">{renderStars(Math.round(averageRating))}</div>
              <div className="text-sm text-muted-foreground mt-1">
                Based on {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}
              </div>
            </div>
            <div className="flex-1">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = reviews.filter((r) => r.rating === star).length;
                const percentage = (count / reviews.length) * 100;
                return (
                  <div key={star} className="flex items-center gap-2 mb-1">
                    <span className="text-sm w-12">{star} stars</span>
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-sm text-muted-foreground w-8">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Individual Reviews */}
      <div className="space-y-4">
        {reviews.map((review) => (
          <Card key={review.id} className="shadow-soft">
            <CardContent className="pt-6">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{review.profiles.name}</span>
                      {review.skin_type && (
                        <Badge variant="secondary" className="text-xs">
                          {review.skin_type}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      {renderStars(review.rating)}
                      <span className="text-xs text-muted-foreground">
                        {new Date(review.created_at).toLocaleDateString('id-ID', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>
                  {review.would_recommend && (
                    <Badge className="bg-primary/10 text-primary">
                      <ThumbsUp className="h-3 w-3 mr-1" />
                      Recommended
                    </Badge>
                  )}
                </div>
                {review.review_text && (
                  <p className="text-sm text-foreground/80 leading-relaxed">
                    {review.review_text}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ProductReviews;