import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Navigation } from '@/components/Navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Camera, Loader2, Upload, ShieldAlert, ShieldCheck, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { compressImage } from '@/lib/imageCompression';

const ProductScan = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  const handleCameraCapture = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageUrl = e.target?.result as string;
        setCapturedImage(imageUrl);
        analyzeProduct(file, imageUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageUrl = e.target?.result as string;
        setCapturedImage(imageUrl);
        analyzeProduct(file, imageUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzeProduct = async (imageFile: Blob, imageUrl: string) => {
    setScanning(true);
    setResult(null);

    try {
      // Compress image first (fallback to original if compression fails or format unsupported)
      let blobToEncode: Blob = imageFile;
      try {
        blobToEncode = await compressImage(imageFile);
      } catch (e) {
        console.warn('Compression failed, using original image:', e);
      }
      
      // Convert to base64
      const reader = new FileReader();
      reader.readAsDataURL(blobToEncode);
      
      const base64Promise = new Promise<string>((resolve) => {
        reader.onloadend = () => {
          const base64 = (reader.result as string).split(',')[1];
          resolve(base64);
        };
      });

      const imageBase64 = await base64Promise;

      // Call AI edge function
      const { data, error: functionError } = await supabase.functions.invoke('analyze-product-image', {
        body: { imageBase64 }
      });

      if (functionError) throw functionError;
      if (data.error) throw new Error(data.error);

      const analysis = data.analysis;
      setResult(analysis);

      // Save to database
      if (user) {
        const { error } = await supabase.from('product_scans').insert([
          {
            user_id: user.id,
            product_name: analysis.product_name,
            image_url: imageUrl,
            ingredients_detected: analysis.ingredients_detected,
            allergens_detected: analysis.allergens,
            irritants_detected: analysis.irritants,
            patch_test_recommended: analysis.patch_test_recommended,
            safety_score: analysis.safety_score,
            analysis_summary: analysis.analysis_summary,
            recommendations: analysis.recommendations
          }
        ]);

        if (error) {
          console.error('Save error:', error);
        } else {
          toast({
            title: "Analisis Selesai!",
            description: "Hasil scan produk telah disimpan.",
          });
        }
      }
    } catch (error) {
      console.error('Analysis error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Gagal menganalisis produk.",
        variant: "destructive"
      });
    } finally {
      setScanning(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-red-600 dark:text-red-400';
      case 'medium': return 'text-orange-600 dark:text-orange-400';
      case 'low': return 'text-yellow-600 dark:text-yellow-400';
      default: return 'text-muted-foreground';
    }
  };

  if (loading || !user) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 pt-24 pb-12">
        <div className="max-w-2xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Product Safety Scanner
            </h1>
            <p className="text-sm md:text-base text-muted-foreground">
              Scan produk skincare untuk mendeteksi potensi allergen dan irritant
            </p>
          </div>

          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle>Scan Produk</CardTitle>
              <CardDescription>
                Foto label ingredients produk dengan pencahayaan yang baik
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {scanning ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                  {capturedImage && (
                    <img src={capturedImage} alt="Product" className="w-64 h-64 object-cover rounded-lg mb-4" />
                  )}
                  <Loader2 className="h-12 w-12 text-primary animate-spin" />
                  <p className="text-muted-foreground">Menganalisis produk...</p>
                </div>
              ) : !result ? (
                <div className="space-y-4">
                  <div className="aspect-square max-w-sm mx-auto rounded-lg bg-gradient-card border border-primary/20 flex items-center justify-center p-8">
                    <div className="text-center space-y-4">
                      <ShieldAlert className="h-16 w-16 text-primary mx-auto" />
                      <div>
                        <h3 className="font-semibold text-lg">Ready to Scan</h3>
                        <p className="text-sm text-muted-foreground mt-2">
                          Scan ingredients label produk skincare Anda
                        </p>
                      </div>
                    </div>
                  </div>
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
                    capture="environment"
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
                </div>
              ) : (
                <div className="space-y-6">
                  {capturedImage && (
                    <img src={capturedImage} alt="Product" className="w-full rounded-lg" />
                  )}

                  {/* Safety Score */}
                  <div className="p-6 rounded-lg bg-gradient-card border border-primary/20">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        {result.safety_score >= 0.7 ? (
                          <ShieldCheck className="h-6 w-6 text-green-600" />
                        ) : (
                          <ShieldAlert className="h-6 w-6 text-orange-600" />
                        )}
                        <h3 className="font-semibold text-lg">Safety Score</h3>
                      </div>
                      <span className="text-3xl font-bold">{(result.safety_score * 100).toFixed(0)}%</span>
                    </div>
                    <p className="text-sm font-medium mb-2">Produk: {result.product_name}</p>
                    <p className="text-sm text-muted-foreground">{result.analysis_summary}</p>
                  </div>

                  {/* Allergens */}
                  {result.allergens?.items?.length > 0 && (
                    <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-red-900 dark:text-red-300 mb-2">
                            Potensi Allergen
                            <Badge variant="destructive" className="ml-2 text-xs">
                              {result.allergens.severity}
                            </Badge>
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {result.allergens.items.map((item: string, idx: number) => (
                              <span key={idx} className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 rounded-full text-sm break-all">
                                {item}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Irritants */}
                  {result.irritants?.items?.length > 0 && (
                    <div className="p-4 rounded-lg bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-orange-900 dark:text-orange-300 mb-2">
                            Potensi Irritant
                            <Badge className="ml-2 text-xs bg-orange-600">
                              {result.irritants.severity}
                            </Badge>
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {result.irritants.items.map((item: string, idx: number) => (
                              <span key={idx} className="px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 rounded-full text-sm break-all">
                                {item}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Patch Test Warning */}
                  {result.patch_test_recommended && (
                    <div className="p-4 rounded-lg bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-yellow-900 dark:text-yellow-300 mb-1">Patch Test Direkomendasikan</h4>
                          <p className="text-sm text-yellow-800 dark:text-yellow-300">
                            Disarankan untuk melakukan patch test (uji coba kecil di kulit) sebelum menggunakan produk ini secara menyeluruh.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Recommendations */}
                  <div className="p-4 rounded-lg bg-muted">
                    <h4 className="font-semibold mb-2">Rekomendasi</h4>
                    <p className="text-sm leading-relaxed">{result.recommendations}</p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button onClick={() => { setResult(null); setCapturedImage(null); }} variant="outline" className="flex-1">
                      Scan Lagi
                    </Button>
                    <Button onClick={() => navigate('/dashboard')} className="flex-1">
                      Kembali
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProductScan;
