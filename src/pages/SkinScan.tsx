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

const skinTypes = ['oily', 'dry', 'combination', 'normal', 'sensitive', 'acne-prone'];

const SkinScan = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [scanning, setScanning] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [recommendedProducts, setRecommendedProducts] = useState<any[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  const startCamera = async () => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('getUserMedia is not supported in this browser');
      }

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: 'user' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };

      let mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);

      if (videoRef.current) {
        const videoEl = videoRef.current;
        videoEl.srcObject = mediaStream;

        const playIfReady = () => {
          videoEl.play().catch(() => {
            // Ignore play errors; often resolved after user gesture or metadata load
          });
        };

        if ('onloadedmetadata' in videoEl) {
          videoEl.onloadedmetadata = playIfReady;
        }
        // Try to play immediately as well
        videoEl.play().catch(() => {/* will try after metadata */});
      }

      setCapturing(true);
    } catch (primaryError) {
      // Retry with a more permissive constraint as fallback
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          await videoRef.current.play().catch(() => {});
        }
        setCapturing(true);
      } catch (error) {
        console.error('Error accessing camera:', primaryError, error);
        toast({
          title: "Camera Error",
          description: "Tidak dapat mengakses kamera. Pastikan izin sudah diberikan dan coba gunakan tombol Upload Photo sebagai alternatif.",
          variant: "destructive"
        });
      }
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setCapturing(false);
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
          analyzeSkin(blob);
        }
      }, 'image/jpeg');
    }

    stopCamera();
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      analyzeSkin(file);
    }
  };

  const analyzeSkin = async (imageFile: Blob) => {
    setScanning(true);
    setResult(null);

    // Simulate AI processing
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Generate random result (simulation)
    const skinType = skinTypes[Math.floor(Math.random() * skinTypes.length)];
    const confidence = 0.75 + Math.random() * 0.2;
    const issues = [];
    
    if (Math.random() > 0.5) issues.push('mild redness');
    if (Math.random() > 0.6) issues.push('enlarged pores');
    if (Math.random() > 0.7) issues.push('minor acne');

    const aiAdvice = `Your skin analysis shows a ${skinType} skin type with ${confidence > 0.85 ? 'high' : 'moderate'} confidence.

${issues.length > 0 ? `We've detected the following areas that need attention:\n• ${issues.join('\n• ')}\n\n` : ''}Key Recommendations:
1. Use a gentle cleanser suitable for ${skinType} skin
2. ${skinType === 'oily' ? 'Opt for oil-free, lightweight moisturizers' : 'Focus on deep hydration with rich creams'}
3. Always apply SPF during the day
4. ${issues.includes('mild acne') ? 'Consider products with salicylic acid or benzoyl peroxide' : 'Maintain a consistent routine'}

${issues.length > 0 ? 'We\'ve selected products below that specifically address your concerns.' : 'Check out our recommended products tailored for your skin type.'}`;

    const scanResult = {
      skin_type: skinType,
      confidence_score: confidence,
      detected_issues: issues,
      recommendations: aiAdvice
    };

    setResult(scanResult);

    // Load recommended products
    const { data: products } = await supabase
      .from('products')
      .select('*')
      .contains('skin_types', [skinType])
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
          description: "Failed to save analysis. Please try again.",
          variant: "destructive"
        });
      } else {
        // Update profile skin type
        await supabase
          .from('profiles')
          .update({ skin_type: skinType })
          .eq('id', user.id);

        toast({
          title: "Scan Complete!",
          description: "Your skin analysis has been saved.",
        });
      }
    }

    setScanning(false);
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
                      Camera Active
                    </div>
                  </div>
                  <p className="text-sm text-center text-muted-foreground">
                    Position your face in the frame with good lighting
                  </p>
                  <div className="flex gap-3">
                    <Button onClick={capturePhoto} className="flex-1" size="lg">
                      <Camera className="h-5 w-5 mr-2" />
                      Capture Photo
                    </Button>
                    <Button onClick={stopCamera} variant="outline" size="lg">
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : scanning ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                  <Loader2 className="h-12 w-12 text-primary animate-spin" />
                  <p className="text-muted-foreground">Analyzing your skin with AI...</p>
                  <p className="text-sm text-muted-foreground">This may take a few moments</p>
                </div>
              ) : !result && (
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
                  <div className="flex gap-3">
                    <Button 
                      onClick={startCamera} 
                      variant="hero"
                      size="lg"
                      className="flex-1"
                    >
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
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>
              )}

              {result && (
                <div className="space-y-4 animate-in fade-in-50 duration-500">
                  <div className="p-6 rounded-lg bg-gradient-card border border-primary/20">
                    <div className="flex items-center gap-2 mb-4">
                      <Sparkles className="h-5 w-5 text-primary" />
                      <h3 className="font-semibold text-lg">Analysis Results</h3>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-muted-foreground">Skin Type</p>
                        <p className="text-2xl font-bold capitalize text-primary">{result.skin_type}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Confidence</p>
                        <p className="text-lg font-semibold">{(result.confidence_score * 100).toFixed(0)}%</p>
                      </div>
                      {result.detected_issues.length > 0 && (
                        <div>
                          <p className="text-sm text-muted-foreground">Detected Issues</p>
                          <p className="text-sm capitalize">{result.detected_issues.join(', ')}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">AI Advice</p>
                        <div className="text-sm whitespace-pre-line leading-relaxed">
                          {result.recommendations}
                        </div>
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
                                    <Badge variant="outline">${product.price}</Badge>
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
                    <Button onClick={() => { setResult(null); setRecommendedProducts([]); }} variant="outline" className="flex-1">
                      Scan Again
                    </Button>
                    <Button onClick={() => navigate('/dashboard')} className="flex-1">
                      Back to Dashboard
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