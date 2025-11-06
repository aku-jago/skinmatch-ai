import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Navigation } from '@/components/Navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Camera, Upload, TrendingUp, Loader2 } from 'lucide-react';
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
  const [capturing, setCapturing] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    } else if (user) {
      loadJournals();
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  const loadJournals = async () => {
    if (!user) return;

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
  };

  const startCamera = async () => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('getUserMedia is not supported');
      }

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: 'user' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      
      if (videoRef.current) {
        const videoEl = videoRef.current;
        videoEl.srcObject = mediaStream;
        
        videoEl.onloadedmetadata = () => {
          videoEl.play().catch(() => {});
        };
        videoEl.play().catch(() => {});
      }
      
      setCapturing(true);
    } catch (error) {
      console.error('Error accessing camera:', error);
      toast({
        title: "Camera Error",
        description: "Tidak dapat mengakses kamera. Pastikan izin sudah diberikan.",
        variant: "destructive"
      });
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0);
      canvas.toBlob((blob) => {
        if (blob) {
          analyzePhoto(blob);
        }
      }, 'image/jpeg');
    }

    stopCamera();
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setCapturing(false);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      analyzePhoto(file);
    }
  };

  const analyzePhoto = async (imageFile: Blob) => {
    if (!user) return;
    
    setAnalyzing(true);

    try {
      // Compress image first
      const compressedBlob = await compressImage(imageFile);
      
      // Convert compressed blob to base64
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

      // Call AI edge function
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
      const mockImageUrl = URL.createObjectURL(imageFile);

      let comparisonText = '';
      if (hasHistory) {
        // Generate summary from improvements
        const improvements = analysis.improvements;
        const positiveChanges = Object.entries(improvements)
          .filter(([_, value]: [string, any]) => value.status === 'improved')
          .map(([key, value]: [string, any]) => `${key}: ${value.percentage}`);
        
        comparisonText = analysis.summary || 
          `Progress bagus! Terdeteksi peningkatan pada: ${positiveChanges.join(', ')}. ${analysis.recommendations}`;
      } else {
        comparisonText = analysis.summary || 'Ini adalah foto baseline Anda. Terus tracking untuk melihat progress!';
      }

      const { error } = await supabase.from('photo_journals').insert([
        {
          user_id: user.id,
          image_url: mockImageUrl,
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
          title: "Analisis Selesai!",
          description: "Foto Anda telah dianalisis dan disimpan.",
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
    }
  };

  if (loading || !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 pt-24 pb-12">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
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
              {capturing ? (
                <div className="space-y-4">
                  <div className="relative rounded-lg overflow-hidden bg-black">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full rounded-lg"
                    />
                    <div className="absolute top-4 left-4 bg-primary/90 text-primary-foreground px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                      Kamera Aktif
                    </div>
                  </div>
                  <p className="text-sm text-center text-muted-foreground">
                    Posisikan wajah Anda dengan pencahayaan yang baik
                  </p>
                  <div className="flex gap-3">
                    <Button onClick={capturePhoto} className="flex-1" size="lg">
                      <Camera className="h-5 w-5 mr-2" />
                      Ambil Foto
                    </Button>
                    <Button onClick={stopCamera} variant="outline" size="lg">
                      Batal
                    </Button>
                  </div>
                </div>
              ) : analyzing ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                  <Loader2 className="h-12 w-12 text-primary animate-spin" />
                  <p className="text-muted-foreground">Menganalisis progress kulit Anda...</p>
                </div>
              ) : (
                <div className="flex gap-3">
                  <Button onClick={startCamera} variant="hero" size="lg" className="flex-1">
                    <Camera className="h-5 w-5 mr-2" />
                    Open Camera
                  </Button>
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    variant="outline"
                    size="lg"
                    className="flex-1"
                  >
                    <Upload className="h-5 w-5 mr-2" />
                    Upload Photo
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Progress History */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <TrendingUp className="h-6 w-6 text-primary" />
              Your Progress History
            </h2>
            
            {journals.length === 0 ? (
              <Card className="shadow-soft">
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">
                    No progress photos yet. Start tracking your skin journey today!
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {journals.map((journal) => (
                  <Card key={journal.id} className="shadow-soft">
                    <CardHeader>
                      <CardTitle className="text-lg">
                        {new Date(journal.created_at).toLocaleDateString('en-US', {
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <img
                        src={journal.image_url}
                        alt="Progress photo"
                        className="w-full rounded-lg"
                      />
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
