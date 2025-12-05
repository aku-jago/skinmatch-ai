import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Navigation } from '@/components/Navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Camera, Upload, TrendingUp, Loader2, ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { compressImage } from '@/lib/imageCompression';

interface PhotoJournal {
  id: string;
  image_url: string;
  analysis_result: any;
  comparison_summary: string | null;
  created_at: string;
}

const PhotoJournal = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [journals, setJournals] = useState<PhotoJournal[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [loadingJournals, setLoadingJournals] = useState(true);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    } else if (user) {
      loadJournals();
    }
  }, [user, loading, navigate]);

  const loadJournals = async () => {
    if (!user) return;
    setLoadingJournals(true);

    try {
      const { data, error } = await supabase
        .from('photo_journals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading journals:', error);
        return;
      }

      setJournals(data || []);
    } catch (error) {
      console.error('Error loading journals:', error);
    } finally {
      setLoadingJournals(false);
    }
  };

  const handleCameraCapture = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      analyzePhoto(file);
    }
    // Reset input value to allow selecting the same file again
    event.target.value = '';
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      analyzePhoto(file);
    }
    // Reset input value
    event.target.value = '';
  };

  const uploadToStorage = async (file: Blob, userId: string): Promise<string> => {
    const fileExt = 'jpg';
    const fileName = `${userId}/${Date.now()}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from('skin-progress')
      .upload(fileName, file, {
        contentType: 'image/jpeg',
        upsert: false
      });

    if (error) {
      console.error('Storage upload error:', error);
      throw new Error('Gagal mengupload gambar ke storage');
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('skin-progress')
      .getPublicUrl(data.path);

    return urlData.publicUrl;
  };

  const analyzePhoto = async (imageFile: Blob) => {
    if (!user) return;
    
    setUploading(true);
    setAnalyzing(false);

    try {
      // Step 1: Compress image (max 500KB = 0.5MB)
      let compressedBlob: Blob = imageFile;
      try {
        compressedBlob = await compressImage(imageFile, 0.5);
        console.log('Image compressed to:', (compressedBlob.size / 1024).toFixed(2), 'KB');
      } catch (e) {
        console.warn('Compression failed, using original image:', e);
      }

      // Step 2: Upload to Supabase Storage
      toast({
        title: 'Mengupload foto...',
        description: 'Mohon tunggu sebentar',
      });
      
      const imageUrl = await uploadToStorage(compressedBlob, user.id);
      console.log('Image uploaded to:', imageUrl);
      
      setUploading(false);
      setAnalyzing(true);

      // Step 3: Convert to base64 for AI analysis
      const reader = new FileReader();
      reader.readAsDataURL(compressedBlob);
      
      const base64Promise = new Promise<string>((resolve) => {
        reader.onloadend = () => {
          const base64 = (reader.result as string).split(',')[1];
          resolve(base64);
        };
      });

      const imageBase64 = await base64Promise;
      const hasHistory = journals.length > 0;

      // Step 4: Call AI edge function for analysis
      toast({
        title: 'Menganalisis foto...',
        description: 'AI sedang menganalisis progress kulit Anda',
      });

      const { data, error: functionError } = await supabase.functions.invoke('analyze-progress-photo', {
        body: { imageBase64, hasHistory }
      });

      if (functionError) {
        throw functionError;
      }

      if (data.error) {
        throw new Error(data.error);
      }

      const analysis = data.analysis;

      // Step 5: Generate comparison summary
      let comparisonText = '';
      if (hasHistory) {
        const improvements = analysis.improvements;
        const positiveChanges = Object.entries(improvements)
          .filter(([_, value]: [string, any]) => value.status === 'improved')
          .map(([key, value]: [string, any]) => `${key}: ${value.percentage}`);
        
        comparisonText = analysis.summary || 
          `Progress bagus! Terdeteksi peningkatan pada: ${positiveChanges.join(', ')}. ${analysis.recommendations}`;
      } else {
        comparisonText = analysis.summary || 'Ini adalah foto baseline Anda. Terus tracking untuk melihat progress!';
      }

      // Step 6: Save to database with the storage URL
      const { error } = await supabase.from('photo_journals').insert([
        {
          user_id: user.id,
          image_url: imageUrl,
          analysis_result: analysis,
          comparison_summary: comparisonText
        }
      ]);

      if (error) {
        toast({
          title: "Error",
          description: "Gagal menyimpan foto journal.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Berhasil!",
          description: "Foto progress Anda telah dianalisis dan disimpan.",
        });
        loadJournals();
      }
    } catch (error) {
      console.error('Analysis error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Gagal menganalisis foto. Silakan coba lagi.",
        variant: "destructive"
      });
    } finally {
      setAnalyzing(false);
      setUploading(false);
    }
  };

  if (loading || !user) {
    return null;
  }

  const isProcessing = uploading || analyzing;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 pt-20 pb-24 lg:pb-12">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              My Skin Progress
            </h1>
            <p className="text-muted-foreground">
              Track your skin journey with AI-powered progress analysis
            </p>
          </div>

          {/* Camera/Upload Section */}
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle>Capture Progress Photo</CardTitle>
              <CardDescription>
                Take or upload a photo to track your skin improvements
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isProcessing ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                  <Loader2 className="h-12 w-12 text-primary animate-spin" />
                  <p className="text-muted-foreground">
                    {uploading ? 'Mengupload foto...' : 'Menganalisis progress kulit Anda...'}
                  </p>
                  {analyzing && (
                    <p className="text-sm text-muted-foreground">Ini mungkin memakan waktu beberapa saat</p>
                  )}
                </div>
              ) : (
                <>
                  <div className="flex flex-col gap-3">
                    <Button onClick={() => cameraInputRef.current?.click()} variant="hero" size="lg" className="w-full">
                      <Camera className="h-5 w-5" />
                      <span>Buka Kamera</span>
                    </Button>
                    <Button onClick={() => fileInputRef.current?.click()} variant="outline" size="lg" className="w-full">
                      <Upload className="h-5 w-5" />
                      <span>Upload Foto</span>
                    </Button>
                  </div>
                  <input
                    ref={cameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="user"
                    onChange={handleCameraCapture}
                    className="hidden"
                  />
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </>
              )}
            </CardContent>
          </Card>

          {/* Progress History */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <TrendingUp className="h-6 w-6 text-primary" />
              Your Progress History
            </h2>
            
            {loadingJournals ? (
              <Card className="shadow-soft">
                <CardContent className="py-12 text-center">
                  <Loader2 className="h-8 w-8 text-primary animate-spin mx-auto mb-4" />
                  <p className="text-muted-foreground">Memuat foto progress...</p>
                </CardContent>
              </Card>
            ) : journals.length === 0 ? (
              <Card className="shadow-soft">
                <CardContent className="py-12 text-center">
                  <ImageIcon className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Belum ada foto progress. Mulai tracking perjalanan kulit Anda hari ini!
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {journals.map((journal) => (
                  <Card key={journal.id} className="shadow-soft overflow-hidden">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">
                        {new Date(journal.created_at).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="relative aspect-square rounded-lg overflow-hidden bg-muted">
                        <img
                          src={journal.image_url}
                          alt="Progress photo"
                          className="w-full h-full object-cover"
                          loading="lazy"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            target.parentElement?.classList.add('flex', 'items-center', 'justify-center');
                            const placeholder = document.createElement('div');
                            placeholder.innerHTML = '<span class="text-muted-foreground text-sm">Gambar tidak tersedia</span>';
                            target.parentElement?.appendChild(placeholder);
                          }}
                        />
                      </div>
                      {journal.comparison_summary && (
                        <div className="p-4 rounded-lg bg-muted">
                          <p className="text-sm">{journal.comparison_summary}</p>
                        </div>
                      )}
                      {journal.analysis_result?.improvements && (
                        <div className="space-y-3">
                          <h4 className="font-semibold text-sm">Peningkatan yang Terdeteksi:</h4>
                          <div className="space-y-2">
                            {Object.entries(journal.analysis_result.improvements).map(([key, value]: [string, any]) => (
                              <div key={key} className="p-2 bg-muted/50 rounded-lg">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="capitalize text-sm font-medium">{key}</span>
                                  <span className={`text-sm font-bold ${
                                    value.status === 'improved' ? 'text-green-600 dark:text-green-400' : 
                                    value.status === 'worse' ? 'text-red-600 dark:text-red-400' : 
                                    'text-muted-foreground'
                                  }`}>
                                    {value.percentage}
                                  </span>
                                </div>
                                <p className="text-xs text-muted-foreground">{value.detail}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PhotoJournal;