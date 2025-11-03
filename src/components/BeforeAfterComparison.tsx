import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ImageIcon, TrendingUp, Calendar } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { id } from 'date-fns/locale';

interface PhotoJournal {
  id: string;
  image_url: string;
  created_at: string;
  analysis_result: any;
  comparison_summary: string | null;
}

export default function BeforeAfterComparison() {
  const { user } = useAuth();
  const [photos, setPhotos] = useState<PhotoJournal[]>([]);
  const [selectedBefore, setSelectedBefore] = useState<PhotoJournal | null>(null);
  const [selectedAfter, setSelectedAfter] = useState<PhotoJournal | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadPhotos();
    }
  }, [user]);

  const loadPhotos = async () => {
    try {
      const { data, error } = await supabase
        .from('photo_journals')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setPhotos(data || []);
      
      // Auto-select first and latest if we have at least 2 photos
      if (data && data.length >= 2) {
        setSelectedBefore(data[data.length - 1]); // Oldest
        setSelectedAfter(data[0]); // Newest
      }
    } catch (error) {
      console.error('Error loading photos:', error);
    } finally {
      setLoading(false);
    }
  };

  const getProgressIndicator = () => {
    if (!selectedBefore || !selectedAfter) return null;

    const beforeIssues = selectedBefore.analysis_result?.issues?.length || 0;
    const afterIssues = selectedAfter.analysis_result?.issues?.length || 0;
    const improvement = beforeIssues - afterIssues;

    const daysDiff = differenceInDays(
      new Date(selectedAfter.created_at),
      new Date(selectedBefore.created_at)
    );

    return {
      improvement,
      daysDiff,
      percentage: beforeIssues > 0 ? Math.round((improvement / beforeIssues) * 100) : 0
    };
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-muted rounded w-1/3"></div>
          <div className="h-96 bg-muted rounded"></div>
        </div>
      </Card>
    );
  }

  if (photos.length < 2) {
    return (
      <Card className="p-6">
        <div className="text-center py-12">
          <ImageIcon className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h4 className="text-lg font-semibold mb-2">Belum Cukup Foto</h4>
          <p className="text-muted-foreground">
            Upload minimal 2 foto di Photo Journal untuk melihat perbandingan progres
          </p>
        </div>
      </Card>
    );
  }

  const progress = getProgressIndicator();

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-primary" />
          <h3 className="text-xl font-bold">Perbandingan Progress</h3>
        </div>
      </div>

      {/* Before/After Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Before */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Badge variant="secondary">Sebelum</Badge>
            {selectedBefore && (
              <span className="text-xs text-muted-foreground">
                {format(new Date(selectedBefore.created_at), 'dd MMM yyyy', { locale: id })}
              </span>
            )}
          </div>
          
          <div className="relative aspect-square rounded-lg overflow-hidden border-2 border-secondary/50 bg-muted">
            {selectedBefore ? (
              <img
                src={selectedBefore.image_url}
                alt="Before"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ImageIcon className="w-16 h-16 text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Photo selector */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {photos.slice().reverse().map((photo) => (
              <button
                key={photo.id}
                onClick={() => setSelectedBefore(photo)}
                className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                  selectedBefore?.id === photo.id
                    ? 'border-secondary ring-2 ring-secondary/50'
                    : 'border-transparent hover:border-secondary/30'
                }`}
              >
                <img
                  src={photo.image_url}
                  alt="Thumbnail"
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>

        {/* After */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Badge variant="default">Sesudah</Badge>
            {selectedAfter && (
              <span className="text-xs text-muted-foreground">
                {format(new Date(selectedAfter.created_at), 'dd MMM yyyy', { locale: id })}
              </span>
            )}
          </div>
          
          <div className="relative aspect-square rounded-lg overflow-hidden border-2 border-primary/50 bg-muted">
            {selectedAfter ? (
              <img
                src={selectedAfter.image_url}
                alt="After"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ImageIcon className="w-16 h-16 text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Photo selector */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {photos.map((photo) => (
              <button
                key={photo.id}
                onClick={() => setSelectedAfter(photo)}
                className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                  selectedAfter?.id === photo.id
                    ? 'border-primary ring-2 ring-primary/50'
                    : 'border-transparent hover:border-primary/30'
                }`}
              >
                <img
                  src={photo.image_url}
                  alt="Thumbnail"
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Progress Summary */}
      {progress && (
        <div className="p-6 bg-gradient-to-br from-primary/10 via-accent/5 to-background rounded-lg border-2 border-primary/20">
          <div className="flex items-center gap-3 mb-4">
            <Calendar className="w-5 h-5 text-primary" />
            <span className="font-semibold">Progress dalam {progress.daysDiff} hari</span>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-background/50 rounded-lg text-center">
              <div className={`text-3xl font-bold mb-1 ${
                progress.improvement > 0 ? 'text-green-500' : 
                progress.improvement < 0 ? 'text-red-500' : 
                'text-muted-foreground'
              }`}>
                {progress.improvement > 0 ? '+' : ''}{progress.percentage}%
              </div>
              <div className="text-sm text-muted-foreground">Perubahan</div>
            </div>
            
            <div className="p-4 bg-background/50 rounded-lg">
              <div className="text-sm space-y-1">
                {progress.improvement > 0 ? (
                  <p className="text-green-600 font-medium">
                    ✓ Kondisi kulit membaik!
                  </p>
                ) : progress.improvement < 0 ? (
                  <p className="text-amber-600 font-medium">
                    ⚠ Perlu perhatian lebih
                  </p>
                ) : (
                  <p className="text-muted-foreground font-medium">
                    → Kondisi stabil
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Lanjutkan perawatan rutin Anda
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}