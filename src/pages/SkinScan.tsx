import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Navigation } from '@/components/Navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Camera, Loader2, Sparkles, Upload, ShoppingBag } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { compressImage } from '@/lib/imageCompression';
import { formatRupiah } from '@/lib/formatCurrency';

const skinTypes = ['oily', 'dry', 'combination', 'normal', 'sensitive', 'acne-prone'];

const SkinScan = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [recommendedProducts, setRecommendedProducts] = useState<any[]>([]);
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
        analyzeSkin(file, imageUrl);
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
        analyzeSkin(file, imageUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadToStorage = async (file: Blob, userId: string): Promise<string> => {
    const fileExt = 'jpg';
    const fileName = `${userId}/skin-${Date.now()}.${fileExt}`;

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

    const { data: urlData } = supabase.storage
      .from('skin-progress')
      .getPublicUrl(data.path);

    return urlData.publicUrl;
  };

  const analyzeSkin = async (imageFile: Blob, previewUrl: string) => {
    setScanning(true);
    setResult(null);
    setCapturedImage(previewUrl);

    try {
      // Compress image first
      let compressedBlob: Blob = imageFile;
      try {
        compressedBlob = await compressImage(imageFile, 0.5);
        console.log('Image compressed to:', (compressedBlob.size / 1024).toFixed(2), 'KB');
      } catch (e) {
        console.warn('Compression failed, using original image:', e);
      }

      // Upload to Supabase Storage
      toast({
        title: 'Mengupload foto...',
        description: 'Mohon tunggu sebentar',
      });
      
      const storageUrl = await uploadToStorage(compressedBlob, user!.id);
      console.log('Image uploaded to:', storageUrl);
      
      // Convert compressed blob to base64 for AI analysis
      const reader = new FileReader();
      reader.readAsDataURL(compressedBlob);
      
      const base64Promise = new Promise<string>((resolve) => {
        reader.onloadend = () => {
          const base64 = (reader.result as string).split(',')[1];
          resolve(base64);
        };
      });

      const imageBase64 = await base64Promise;

      toast({
        title: 'Menganalisis kulit...',
        description: 'AI sedang menganalisis foto Anda',
      });

      // Call AI edge function
      const { data, error: functionError } = await supabase.functions.invoke('analyze-skin-image', {
        body: { imageBase64 }
      });

      if (functionError) {
        throw functionError;
      }

      if (data.error) {
        throw new Error(data.error);
      }

      const analysis = data.analysis;
      
      const scanResult = {
        skin_type: analysis.skin_type,
        confidence_score: analysis.confidence_score,
        detected_issues: analysis.detected_issues,
        recommendations: analysis.recommendations,
        detailed_analysis: analysis.detailed_analysis,
        image_url: storageUrl // Use storage URL instead of base64
      };

      setResult(scanResult);

      // Load recommended products
      const { data: products } = await supabase
        .from('products')
        .select('*')
        .contains('skin_types', [scanResult.skin_type])
        .limit(5);

      if (products) {
        setRecommendedProducts(products);
      }

      // Save to database
      if (user) {
        const { error } = await supabase.from('skin_analyses').insert([
          {
            user_id: user.id,
            ...scanResult
          }
        ]);

        if (error) {
          toast({
            title: "Error",
            description: "Gagal menyimpan analisis. Silakan coba lagi.",
            variant: "destructive"
          });
        } else {
          // Update profile skin type
          await supabase
            .from('profiles')
            .update({ skin_type: scanResult.skin_type })
            .eq('id', user.id);

          toast({
            title: "Analisis Selesai!",
            description: "Analisis kulit Anda telah disimpan.",
          });
        }
      }
    } catch (error) {
      console.error('Analysis error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Gagal menganalisis foto. Silakan coba lagi.",
        variant: "destructive"
      });
    } finally {
      setScanning(false);
    }
  };

  if (loading || !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 pt-24 pb-12">
        <div className="max-w-2xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              AI Skin Analysis
            </h1>
            <p className="text-muted-foreground">
              Let our AI analyze your skin type and provide personalized recommendations
            </p>
          </div>

          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle>Scan Your Face</CardTitle>
              <CardDescription>
                Position your face in good lighting and click scan
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {scanning ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                  {capturedImage && (
                    <img src={capturedImage} alt="Captured" className="w-64 h-64 object-cover rounded-lg mb-4" />
                  )}
                  <Loader2 className="h-12 w-12 text-primary animate-spin" />
                  <p className="text-muted-foreground">Menganalisis kulit Anda dengan AI...</p>
                  <p className="text-sm text-muted-foreground">Ini mungkin memakan waktu beberapa saat</p>
                </div>
              ) : !result ? (
                <div className="space-y-4">
                  <div className="aspect-square max-w-sm mx-auto rounded-lg overflow-hidden bg-gradient-card border border-primary/20 flex items-center justify-center p-8">
                    <div className="text-center space-y-4">
                      <Camera className="h-16 w-16 text-primary mx-auto" />
                      <div>
                        <h3 className="font-semibold text-lg">Ready to Scan</h3>
                        <p className="text-sm text-muted-foreground mt-2">
                          Use your camera or upload a photo for AI analysis
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button 
                      onClick={() => cameraInputRef.current?.click()} 
                      variant="hero"
                      size="lg"
                      className="w-full sm:flex-1"
                    >
                      <Camera className="h-5 w-5" />
                      <span>Buka Kamera</span>
                    </Button>
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      variant="outline"
                      size="lg"
                      className="w-full sm:flex-1"
                    >
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
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Captured Image */}
                  {capturedImage && (
                    <div className="w-full max-w-md mx-auto">
                      <img src={capturedImage} alt="Scanned face" className="w-full rounded-lg shadow-soft" />
                    </div>
                  )}

                  {/* Analysis Results */}
                  <div className="grid gap-6">
                    <div className="flex items-start gap-4 p-4 bg-gradient-card rounded-lg border border-primary/20">
                      <Sparkles className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-2">Your Skin Type</h3>
                        <Badge className="bg-primary/10 text-primary border-primary/20">
                          {result.skin_type.toUpperCase()}
                        </Badge>
                        <p className="text-sm text-muted-foreground mt-2">
                          Confidence: {(result.confidence_score * 100).toFixed(1)}%
                        </p>
                      </div>
                    </div>

                    {result.detected_issues && result.detected_issues.length > 0 && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">Detected Concerns</p>
                        <div className="flex flex-wrap gap-2">
                          {result.detected_issues.map((issue: string, index: number) => (
                            <Badge key={index} variant="secondary">{issue}</Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Analisis Detail</p>
                      <div className="text-sm leading-relaxed p-4 bg-muted/50 rounded-lg">
                        {result.detailed_analysis}
                      </div>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Rekomendasi AI</p>
                      <div className="text-sm whitespace-pre-line leading-relaxed p-4 bg-primary/5 rounded-lg">
                        {result.recommendations}
                      </div>
                    </div>
                  </div>

                  {/* Recommended Products */}
                  {recommendedProducts.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="font-semibold text-lg flex items-center gap-2">
                        <ShoppingBag className="h-5 w-5 text-primary" />
                        Recommended Products for You
                      </h3>
                      <div className="space-y-3">
                        {recommendedProducts.map((product) => (
                          <Card key={product.id} className="hover:shadow-md transition-shadow">
                            <CardContent className="p-4">
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <h4 className="font-semibold">{product.name}</h4>
                                  <p className="text-sm text-muted-foreground">{product.brand}</p>
                                  <p className="text-sm mt-1 line-clamp-2">{product.description}</p>
                                  <div className="flex gap-2 mt-2">
                                    <Badge variant="secondary">{product.category}</Badge>
                                    <Badge variant="outline">{formatRupiah(product.price)}</Badge>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                      <Button 
                        onClick={() => navigate('/shop')} 
                        variant="outline"
                        className="w-full"
                      >
                        View All Products
                      </Button>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <Button onClick={() => { setResult(null); setRecommendedProducts([]); setCapturedImage(null); }} variant="outline" className="flex-1">
                      Scan Lagi
                    </Button>
                    <Button onClick={() => navigate('/dashboard')} className="flex-1">
                      Kembali ke Dashboard
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

export default SkinScan;