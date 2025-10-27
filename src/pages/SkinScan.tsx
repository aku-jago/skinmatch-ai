import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Navigation } from '@/components/Navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Camera, Loader2, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import scanIcon from '@/assets/scan-icon.jpg';

const skinTypes = ['oily', 'dry', 'combination', 'normal', 'sensitive'];

const SkinScan = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  const simulateScan = async () => {
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

    const scanResult = {
      skin_type: skinType,
      confidence_score: confidence,
      detected_issues: issues,
      recommendations: `Based on your ${skinType} skin type, we recommend using gentle, ${skinType === 'oily' ? 'oil-free' : 'hydrating'} products. ${issues.length > 0 ? `Focus on treating ${issues.join(', ')}.` : ''}`
    };

    setResult(scanResult);

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
              <div className="relative aspect-square max-w-sm mx-auto rounded-lg overflow-hidden bg-muted flex items-center justify-center">
                <img 
                  src={scanIcon} 
                  alt="Scan visualization" 
                  className={`w-full h-full object-cover ${scanning ? 'animate-pulse' : ''}`}
                />
                {scanning && (
                  <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                    <Loader2 className="h-12 w-12 text-primary animate-spin" />
                  </div>
                )}
              </div>

              {!result && (
                <Button 
                  onClick={simulateScan} 
                  disabled={scanning}
                  variant="hero"
                  size="lg"
                  className="w-full"
                >
                  {scanning ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Camera className="h-5 w-5" />
                      Start Scan
                    </>
                  )}
                </Button>
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
                        <p className="text-sm text-muted-foreground mb-2">Recommendations</p>
                        <p className="text-sm">{result.recommendations}</p>
                      </div>
                    </div>
                  </div>
                  <Button onClick={() => navigate('/dashboard')} className="w-full">
                    Back to Dashboard
                  </Button>
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