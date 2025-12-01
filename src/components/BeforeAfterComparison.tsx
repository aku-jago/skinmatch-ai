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
      const rawEntry = (improvements as any)[key];
      // Support both numeric values and objects like { detail, status, percentage }
      const improvementValue = typeof rawEntry === 'object' && rawEntry !== null
        ? typeof rawEntry.percentage === 'number'
          ? rawEntry.percentage
          : 0
        : typeof rawEntry === 'number'
          ? rawEntry
          : 0;

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
                    {analysis.issues.slice(0, 4).map((issue: any, idx: number) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {typeof issue === 'string' ? issue : issue?.detail || issue?.name || 'Unknown'}
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
    <Card className="p-4 md:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-primary" />
          <h3 className="text-xl font-bold">Perbandingan Progress</h3>
        </div>
        <Badge variant="outline" className="gap-1 w-fit">
          <ImageIcon className="w-3 h-3" />
          {photos.length} foto
        </Badge>
      </div>

      {/* Help Text */}
      <div className="mb-4 p-3 bg-accent/10 rounded-lg border border-accent/20">
        <p className="text-xs text-muted-foreground">
          💡 Pilih 2 foto dari timeline untuk membandingkan progress kulitmu
        </p>
      </div>

      {/* Timeline Selector - Improved */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium">Pilih Foto untuk Dibandingkan</span>
        </div>
        
        {/* Mobile: Dropdown selectors */}
        <div className="grid grid-cols-2 gap-3 md:hidden mb-4">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Sebelum</label>
            <select 
              className="w-full p-2 rounded-md border bg-background text-sm"
              value={selectedBefore?.id}
              onChange={(e) => {
                const photo = photos.find(p => p.id === e.target.value);
                if (photo) setSelectedBefore(photo);
              }}
            >
              {photos.slice().reverse().map(photo => (
                <option key={photo.id} value={photo.id}>
                  {format(new Date(photo.created_at), 'dd MMM yyyy', { locale: id })}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Sesudah</label>
            <select 
              className="w-full p-2 rounded-md border bg-background text-sm"
              value={selectedAfter?.id}
              onChange={(e) => {
                const photo = photos.find(p => p.id === e.target.value);
                if (photo) setSelectedAfter(photo);
              }}
            >
              {photos.slice().reverse().map(photo => (
                <option key={photo.id} value={photo.id}>
                  {format(new Date(photo.created_at), 'dd MMM yyyy', { locale: id })}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Desktop: Visual timeline */}
        <div className="hidden md:block relative">
          <div className="absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-secondary via-primary/30 to-primary rounded-full -translate-y-1/2"></div>
          <div className="relative flex justify-between px-2">
            {photos.slice().reverse().map((photo, idx) => {
              const isSelected = selectedBefore?.id === photo.id || selectedAfter?.id === photo.id;
              const isBefore = selectedBefore?.id === photo.id;
              const isAfter = selectedAfter?.id === photo.id;
              
              return (
                <button
                  key={photo.id}
                  onClick={() => {
                    if (isBefore) {
                      setSelectedAfter(photo);
                      setSelectedBefore(photos[Math.max(0, photos.indexOf(photo) - 1)]);
                    } else if (isAfter) {
                      setSelectedBefore(photo);
                      setSelectedAfter(photos[Math.min(photos.length - 1, photos.indexOf(photo) + 1)]);
                    } else {
                      const photoDate = new Date(photo.created_at);
                      const afterDate = selectedAfter ? new Date(selectedAfter.created_at) : new Date();
                      if (photoDate < afterDate) {
                        setSelectedBefore(photo);
                      } else {
                        setSelectedAfter(photo);
                      }
                    }
                  }}
                  className="relative flex flex-col items-center group"
                  title={format(new Date(photo.created_at), 'dd MMMM yyyy', { locale: id })}
                >
                  <div className={`w-5 h-5 rounded-full border-3 transition-all shadow-lg ${
                    isBefore 
                      ? 'bg-secondary border-secondary scale-150 ring-4 ring-secondary/20' 
                      : isAfter 
                        ? 'bg-primary border-primary scale-150 ring-4 ring-primary/20'
                        : 'bg-background border-border hover:border-primary/50 hover:scale-125 cursor-pointer'
                  }`}>
                    {isSelected && (
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap">
                        <Badge variant={isBefore ? 'secondary' : 'default'} className="text-xs px-2 py-0.5 shadow-md">
                          {isBefore ? '📷 Sebelum' : '📷 Sesudah'}
                        </Badge>
                      </div>
                    )}
                  </div>
                  <span className={`text-xs mt-2 group-hover:text-foreground transition-colors font-medium ${
                    isSelected ? 'text-foreground' : 'text-muted-foreground'
                  }`}>
                    {format(new Date(photo.created_at), 'dd/MM', { locale: id })}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Before/After Images - Enhanced */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Before */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Badge variant="secondary" className="gap-1.5">
              <Calendar className="w-3 h-3" />
              Sebelum
            </Badge>
            <span className="text-xs text-muted-foreground">
              {format(new Date(selectedBefore?.created_at || new Date()), 'dd MMM yyyy', { locale: id })}
            </span>
          </div>
          <div className="relative aspect-square rounded-xl overflow-hidden border-2 border-secondary shadow-lg bg-muted group">
            {selectedBefore && (
              <>
                <img
                  src={selectedBefore.image_url}
                  alt="Before"
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="absolute bottom-3 left-3 right-3">
                    <p className="text-white text-sm font-medium">Kondisi Awal</p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* After */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Badge variant="default" className="gap-1.5">
              <Sparkles className="w-3 h-3" />
              Sesudah
            </Badge>
            <span className="text-xs text-muted-foreground">
              {format(new Date(selectedAfter?.created_at || new Date()), 'dd MMM yyyy', { locale: id })}
            </span>
          </div>
          <div className="relative aspect-square rounded-xl overflow-hidden border-2 border-primary shadow-lg bg-muted group">
            {selectedAfter && (
              <>
                <img
                  src={selectedAfter.image_url}
                  alt="After"
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="absolute bottom-3 left-3 right-3">
                    <p className="text-white text-sm font-medium">Progress Terkini</p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Days Difference Indicator */}
      <div className="flex items-center justify-center gap-2 mb-6 p-3 bg-gradient-to-r from-secondary/10 via-primary/10 to-primary/10 rounded-lg border border-primary/20">
        <Clock className="w-4 h-4 text-primary" />
        <span className="text-sm font-medium">
          Progress dalam <span className="text-primary font-bold">{daysDiff}</span> hari
        </span>
        <ArrowRight className="w-4 h-4 text-primary" />
      </div>

      {/* Progress Metrics - Enhanced */}
      <div className="p-5 bg-gradient-to-br from-primary/5 via-accent/5 to-background rounded-xl border border-primary/20 mb-4 shadow-sm">
        <div className="flex items-center gap-2 mb-5">
          <div className="p-2 bg-primary/10 rounded-lg">
            <TrendingUp className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h4 className="font-semibold text-base">Detail Perubahan</h4>
            <p className="text-xs text-muted-foreground">Analisis per kategori</p>
          </div>
        </div>

        <div className="space-y-4">
          {metrics.map((metric, idx) => (
            <div key={idx} className="space-y-2 p-3 bg-background/50 rounded-lg border border-border/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{metric.label}</span>
                  {metric.category === 'positive' && (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-green-500/10 text-green-600 border-green-500/20">
                      Membaik
                    </Badge>
                  )}
                  {metric.category === 'negative' && (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-red-500/10 text-red-600 border-red-500/20">
                      Menurun
                    </Badge>
                  )}
                </div>
                <span className={`font-bold text-base flex items-center gap-1 ${
                  metric.category === 'positive' 
                    ? 'text-green-600' 
                    : metric.category === 'negative' 
                      ? 'text-red-500' 
                      : 'text-muted-foreground'
                }`}>
                  {metric.improvement > 0 ? '+' : ''}{metric.improvement}%
                </span>
              </div>
              <div className="relative h-3 bg-muted rounded-full overflow-hidden shadow-inner">
                <div 
                  className={`absolute left-0 top-0 h-full rounded-full transition-all duration-700 ${
                    metric.category === 'positive' 
                      ? 'bg-gradient-to-r from-green-400 to-green-500 shadow-sm' 
                      : metric.category === 'negative' 
                        ? 'bg-gradient-to-r from-red-400 to-red-500 shadow-sm' 
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
        <div className="p-4 bg-gradient-to-br from-accent/10 to-accent/5 rounded-xl border border-accent/20 mb-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-accent/10 rounded-lg flex-shrink-0">
              <Sparkles className="w-5 h-5 text-accent" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                Ringkasan AI
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Powered by AI</Badge>
              </h4>
              <p className="text-sm text-muted-foreground leading-relaxed">{comparisonSummary}</p>
            </div>
          </div>
        </div>
      )}

      {/* CTA for more photos */}
      <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-border">
        <Button 
          variant="default" 
          className="flex-1 gap-2"
          onClick={() => navigate('/photo-journal')}
        >
          <Camera className="w-4 h-4" />
          Tambah Foto Progress Baru
        </Button>
        <Button 
          variant="outline" 
          className="gap-2"
          onClick={() => navigate('/photo-journal')}
        >
          <ImageIcon className="w-4 h-4" />
          Lihat Semua Foto
        </Button>
      </div>
    </Card>
  );
}
