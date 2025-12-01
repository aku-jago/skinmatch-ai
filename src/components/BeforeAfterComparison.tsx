import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  ImageIcon, 
  TrendingUp, 
  Calendar, 
  Camera, 
  Sparkles,
  Clock,
  ArrowRight,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { id } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

interface PhotoJournal {
  id: string;
  image_url: string;
  created_at: string;
  analysis_result: any;
  comparison_summary: string | null;
}

interface ProgressMetric {
  label: string;
  beforeValue: number;
  afterValue: number;
  improvement: number;
  category: 'positive' | 'negative' | 'neutral';
}

export default function BeforeAfterComparison() {
  const { user } = useAuth();
  const navigate = useNavigate();
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
      
      if (data && data.length >= 2) {
        setSelectedBefore(data[data.length - 1]);
        setSelectedAfter(data[0]);
      }
    } catch (error) {
      console.error('Error loading photos:', error);
    } finally {
      setLoading(false);
    }
  };

  const getProgressMetrics = (): ProgressMetric[] => {
    if (!selectedBefore || !selectedAfter) return [];

    const metrics: ProgressMetric[] = [];
    const beforeAnalysis = selectedBefore.analysis_result || {};
    const afterAnalysis = selectedAfter.analysis_result || {};

    // Extract improvements from AI analysis
    const improvements = afterAnalysis.improvements || {};
    
    // Common skin metrics to track
    const metricDefinitions = [
      { key: 'texture', label: 'Tekstur Kulit' },
      { key: 'hydration', label: 'Hidrasi' },
      { key: 'acne', label: 'Jerawat', inverse: true },
      { key: 'redness', label: 'Kemerahan', inverse: true },
      { key: 'pores', label: 'Pori-pori', inverse: true },
      { key: 'brightness', label: 'Kecerahan' },
      { key: 'elasticity', label: 'Elastisitas' },
      { key: 'overall', label: 'Keseluruhan' },
    ];

    metricDefinitions.forEach(({ key, label, inverse }) => {
      const improvementValue = improvements[key] || 0;
      if (improvementValue !== 0 || key === 'overall') {
        const normalizedValue = inverse ? -improvementValue : improvementValue;
        metrics.push({
          label,
          beforeValue: 50,
          afterValue: Math.min(100, Math.max(0, 50 + normalizedValue)),
          improvement: normalizedValue,
          category: normalizedValue > 0 ? 'positive' : normalizedValue < 0 ? 'negative' : 'neutral'
        });
      }
    });

    // If no metrics from AI, calculate from issues
    if (metrics.length === 0) {
      const beforeIssues = beforeAnalysis.issues?.length || 0;
      const afterIssues = afterAnalysis.issues?.length || 0;
      const improvement = beforeIssues > 0 
        ? Math.round(((beforeIssues - afterIssues) / beforeIssues) * 100)
        : 0;
      
      metrics.push({
        label: 'Kondisi Keseluruhan',
        beforeValue: 50,
        afterValue: Math.min(100, Math.max(0, 50 + improvement / 2)),
        improvement,
        category: improvement > 0 ? 'positive' : improvement < 0 ? 'negative' : 'neutral'
      });
    }

    return metrics;
  };

  const getDaysDiff = () => {
    if (!selectedBefore || !selectedAfter) return 0;
    return differenceInDays(
      new Date(selectedAfter.created_at),
      new Date(selectedBefore.created_at)
    );
  };

  // Loading State
  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-muted rounded w-1/3"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </Card>
    );
  }

  // Empty State (0 photos)
  if (photos.length === 0) {
    return (
      <Card className="p-6 md:p-8">
        <div className="text-center py-8">
          <div className="relative mx-auto w-24 h-24 mb-6">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full animate-pulse"></div>
            <div className="absolute inset-2 bg-background rounded-full flex items-center justify-center">
              <Camera className="w-10 h-10 text-primary" />
            </div>
          </div>
          
          <h4 className="text-xl font-bold mb-3">Mulai Tracking Progress Kulit Anda</h4>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Foto kondisi kulit Anda secara rutin untuk melihat perubahan dari waktu ke waktu. 
            AI kami akan menganalisis dan membandingkan hasilnya.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="w-4 h-4 text-primary" />
              <span>Analisis AI otomatis</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="w-4 h-4 text-primary" />
              <span>Tracking perubahan detail</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="w-4 h-4 text-primary" />
              <span>Rekomendasi personal</span>
            </div>
          </div>
          
          <Button 
            variant="hero" 
            size="lg"
            onClick={() => navigate('/photo-journal')}
            className="gap-2"
          >
            <Camera className="w-5 h-5" />
            Ambil Foto Pertama
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </Card>
    );
  }

  // Baseline State (1 photo)
  if (photos.length === 1) {
    const baselinePhoto = photos[0];
    const analysis = baselinePhoto.analysis_result || {};
    
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <Sparkles className="w-6 h-6 text-primary" />
          <h3 className="text-xl font-bold">Baseline Kulit Anda</h3>
          <Badge variant="secondary" className="ml-auto">Foto ke-1</Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Photo */}
          <div className="space-y-3">
            <div className="relative aspect-square rounded-xl overflow-hidden border-2 border-primary/30 bg-muted">
              <img
                src={baselinePhoto.image_url}
                alt="Baseline"
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/60 to-transparent">
                <div className="flex items-center gap-2 text-white text-sm">
                  <Calendar className="w-4 h-4" />
                  {format(new Date(baselinePhoto.created_at), 'dd MMMM yyyy', { locale: id })}
                </div>
              </div>
            </div>
          </div>

          {/* Analysis & CTA */}
          <div className="space-y-4">
            <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                Kondisi Awal
              </h4>
              {analysis.skinType && (
                <p className="text-sm mb-2">
                  <span className="text-muted-foreground">Tipe Kulit:</span>{' '}
                  <span className="font-medium">{analysis.skinType}</span>
                </p>
              )}
              {analysis.issues && analysis.issues.length > 0 && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Masalah Terdeteksi:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {analysis.issues.slice(0, 4).map((issue: string, idx: number) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {issue}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {analysis.summary && (
                <p className="text-sm text-muted-foreground mt-2 line-clamp-3">
                  {analysis.summary}
                </p>
              )}
            </div>

            <div className="p-4 bg-accent/10 rounded-lg border border-accent/20">
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-accent mt-0.5" />
                <div>
                  <h4 className="font-semibold mb-1">Foto Lagi dalam 7-14 Hari</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Untuk melihat perubahan yang signifikan, ambil foto progress setelah 1-2 minggu rutin skincare.
                  </p>
                  <Button 
                    variant="default" 
                    size="sm"
                    onClick={() => navigate('/photo-journal')}
                    className="gap-2"
                  >
                    <Camera className="w-4 h-4" />
                    Ambil Foto Progress
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  // Full Comparison State (2+ photos)
  const metrics = getProgressMetrics();
  const daysDiff = getDaysDiff();
  const comparisonSummary = selectedAfter?.comparison_summary;

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-primary" />
          <h3 className="text-xl font-bold">Perbandingan Progress</h3>
        </div>
        <Badge variant="outline" className="gap-1">
          <ImageIcon className="w-3 h-3" />
          {photos.length} foto
        </Badge>
      </div>

      {/* Timeline Selector */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Timeline Progress</span>
        </div>
        <div className="relative">
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-border -translate-y-1/2"></div>
          <div className="relative flex justify-between">
            {photos.slice().reverse().map((photo, idx) => {
              const isSelected = selectedBefore?.id === photo.id || selectedAfter?.id === photo.id;
              const isBefore = selectedBefore?.id === photo.id;
              const isAfter = selectedAfter?.id === photo.id;
              
              return (
                <button
                  key={photo.id}
                  onClick={() => {
                    if (selectedBefore?.id === photo.id) return;
                    if (selectedAfter?.id === photo.id) return;
                    // Smart selection: set as before if older than current after, otherwise as after
                    const photoDate = new Date(photo.created_at);
                    const afterDate = selectedAfter ? new Date(selectedAfter.created_at) : new Date();
                    if (photoDate < afterDate) {
                      setSelectedBefore(photo);
                    } else {
                      setSelectedAfter(photo);
                    }
                  }}
                  className={`relative flex flex-col items-center group ${
                    photos.length > 5 && idx % 2 !== 0 ? 'hidden sm:flex' : ''
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full border-2 transition-all ${
                    isBefore 
                      ? 'bg-secondary border-secondary scale-125' 
                      : isAfter 
                        ? 'bg-primary border-primary scale-125'
                        : 'bg-background border-muted-foreground/30 hover:border-primary/50 hover:scale-110'
                  }`}>
                    {isSelected && (
                      <div className="absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap">
                        <Badge variant={isBefore ? 'secondary' : 'default'} className="text-[10px] px-1.5 py-0">
                          {isBefore ? 'Sebelum' : 'Sesudah'}
                        </Badge>
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] text-muted-foreground mt-1 group-hover:text-foreground transition-colors">
                    {format(new Date(photo.created_at), 'dd/MM', { locale: id })}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Before/After Images */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* Before */}
        <div className="space-y-2">
          <Badge variant="secondary" className="w-full justify-center">Sebelum</Badge>
          <div className="relative aspect-square rounded-lg overflow-hidden border-2 border-secondary/50 bg-muted">
            {selectedBefore && (
              <>
                <img
                  src={selectedBefore.image_url}
                  alt="Before"
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent">
                  <span className="text-white text-xs">
                    {format(new Date(selectedBefore.created_at), 'dd MMM yyyy', { locale: id })}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* After */}
        <div className="space-y-2">
          <Badge variant="default" className="w-full justify-center">Sesudah</Badge>
          <div className="relative aspect-square rounded-lg overflow-hidden border-2 border-primary/50 bg-muted">
            {selectedAfter && (
              <>
                <img
                  src={selectedAfter.image_url}
                  alt="After"
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent">
                  <span className="text-white text-xs">
                    {format(new Date(selectedAfter.created_at), 'dd MMM yyyy', { locale: id })}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Progress Metrics */}
      <div className="p-4 bg-gradient-to-br from-primary/5 via-accent/5 to-background rounded-lg border border-primary/20 mb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            <span className="font-semibold">Progress dalam {daysDiff} hari</span>
          </div>
        </div>

        <div className="space-y-3">
          {metrics.map((metric, idx) => (
            <div key={idx} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{metric.label}</span>
                <span className={`font-medium flex items-center gap-1 ${
                  metric.category === 'positive' 
                    ? 'text-green-600' 
                    : metric.category === 'negative' 
                      ? 'text-red-500' 
                      : 'text-muted-foreground'
                }`}>
                  {metric.improvement > 0 ? '+' : ''}{metric.improvement}%
                  {metric.category === 'positive' && <TrendingUp className="w-3 h-3" />}
                  {metric.category === 'negative' && <AlertCircle className="w-3 h-3" />}
                </span>
              </div>
              <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className={`absolute left-0 top-0 h-full rounded-full transition-all duration-500 ${
                    metric.category === 'positive' 
                      ? 'bg-gradient-to-r from-green-400 to-green-500' 
                      : metric.category === 'negative' 
                        ? 'bg-gradient-to-r from-red-400 to-red-500' 
                        : 'bg-gradient-to-r from-muted-foreground/50 to-muted-foreground/70'
                  }`}
                  style={{ width: `${metric.afterValue}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AI Summary */}
      {comparisonSummary && (
        <div className="p-4 bg-accent/10 rounded-lg border border-accent/20">
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-semibold mb-1">Ringkasan AI</h4>
              <p className="text-sm text-muted-foreground">{comparisonSummary}</p>
            </div>
          </div>
        </div>
      )}

      {/* CTA for more photos */}
      <div className="mt-4 pt-4 border-t border-border">
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full gap-2"
          onClick={() => navigate('/photo-journal')}
        >
          <Camera className="w-4 h-4" />
          Tambah Foto Progress Baru
        </Button>
      </div>
    </Card>
  );
}
