import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ClipboardList, Sparkles, RefreshCw, CheckCircle2, Camera, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import SkinQuizModal from './SkinQuizModal';

interface SkinProfileCardProps {
  onQuizComplete?: () => void;
}

interface QuestionnaireResult {
  skin_type: string;
  is_sensitive: boolean;
  confidence_score: number;
  created_at: string;
  updated_at: string;
}

interface SkinAnalysisResult {
  skin_type: string;
  confidence_score: number | null;
  detected_issues: unknown;
  recommendations: string | null;
  created_at: string;
}

interface CombinedSkinProfile {
  skinType: string;
  isSensitive: boolean;
  confidenceScore: number;
  sources: {
    questionnaire: boolean;
    aiAnalysis: boolean;
  };
  detectedIssues: string[];
  recommendations: string | null;
  lastUpdated: string;
}

const SkinProfileCard = ({ onQuizComplete }: SkinProfileCardProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showQuiz, setShowQuiz] = useState(false);
  const [questionnaire, setQuestionnaire] = useState<QuestionnaireResult | null>(null);
  const [skinAnalysis, setSkinAnalysis] = useState<SkinAnalysisResult | null>(null);
  const [combinedProfile, setCombinedProfile] = useState<CombinedSkinProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    
    setLoading(true);
    
    try {
      // Fetch questionnaire result
      const { data: questionnaireData } = await supabase
        .from('skin_questionnaires')
        .select('skin_type, is_sensitive, confidence_score, created_at, updated_at')
        .eq('user_id', user.id)
        .maybeSingle();

      // Fetch latest AI skin analysis
      const { data: analysisData } = await supabase
        .from('skin_analyses')
        .select('skin_type, confidence_score, detected_issues, recommendations, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      setQuestionnaire(questionnaireData);
      setSkinAnalysis(analysisData);

      // Combine results if we have at least one source
      if (questionnaireData || analysisData) {
        const combined = combineSkinProfiles(questionnaireData, analysisData);
        setCombinedProfile(combined);
        
        // Update profile with combined skin type
        if (combined) {
          const fullSkinType = combined.isSensitive 
            ? `${combined.skinType} sensitive` 
            : combined.skinType;
          
          await supabase
            .from('profiles')
            .update({ skin_type: fullSkinType })
            .eq('id', user.id);
        }
      }
    } catch (error) {
      console.error('Error fetching skin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const combineSkinProfiles = (
    questionnaire: QuestionnaireResult | null, 
    analysis: SkinAnalysisResult | null
  ): CombinedSkinProfile | null => {
    if (!questionnaire && !analysis) return null;

    // Normalize skin types
    const normalizeSkinType = (type: string): string => {
      const normalized = type.toLowerCase().replace(' sensitive', '').trim();
      const typeMap: Record<string, string> = {
        'kering': 'dry',
        'berminyak': 'oily',
        'kombinasi': 'combination',
        'normal': 'normal',
      };
      return typeMap[normalized] || normalized;
    };

    const questionnaireSkinType = questionnaire ? normalizeSkinType(questionnaire.skin_type) : null;
    const analysisSkinType = analysis ? normalizeSkinType(analysis.skin_type) : null;
    const questionnaireConfidence = questionnaire?.confidence_score || 0;
    const analysisConfidence = analysis?.confidence_score || 0;

    let finalSkinType: string;
    let finalConfidence: number;

    if (questionnaireSkinType && analysisSkinType) {
      // Both sources available - combine with weighted average
      if (questionnaireSkinType === analysisSkinType) {
        // Both agree - high confidence!
        finalSkinType = questionnaireSkinType;
        finalConfidence = Math.min(0.95, (questionnaireConfidence + analysisConfidence) / 2 + 0.1);
      } else {
        // They disagree - use AI analysis with adjusted confidence, 
        // but consider questionnaire for edge cases
        // Weight: AI 60%, Questionnaire 40%
        const aiWeight = 0.6;
        const questionnaireWeight = 0.4;
        
        // If AI confidence is high, prefer AI
        if (analysisConfidence > 0.7) {
          finalSkinType = analysisSkinType;
        } else {
          // Use questionnaire as it reflects user's actual experience
          finalSkinType = questionnaireSkinType;
        }
        
        finalConfidence = (analysisConfidence * aiWeight + questionnaireConfidence * questionnaireWeight);
      }
    } else if (questionnaireSkinType) {
      finalSkinType = questionnaireSkinType;
      finalConfidence = questionnaireConfidence * 0.85; // Lower confidence with single source
    } else if (analysisSkinType) {
      finalSkinType = analysisSkinType;
      finalConfidence = analysisConfidence * 0.9;
    } else {
      return null;
    }

    // Determine sensitivity
    const isSensitive = questionnaire?.is_sensitive || 
      questionnaire?.skin_type.toLowerCase().includes('sensitive') || 
      analysis?.skin_type.toLowerCase().includes('sensitive') || 
      false;

    // Get detected issues from AI analysis
    const detectedIssues = Array.isArray(analysis?.detected_issues)
      ? (analysis.detected_issues as any[]).map((issue) =>
          typeof issue === 'string'
            ? issue
            : issue?.detail || issue?.name || issue?.status || 'Tidak diketahui'
        )
      : [];

    // Get recommendations from AI analysis
    const recommendations = analysis?.recommendations || null;

    // Get the most recent update date
    const dates = [
      questionnaire?.updated_at,
      analysis?.created_at
    ].filter(Boolean) as string[];
    const lastUpdated = dates.sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0] || new Date().toISOString();

    return {
      skinType: finalSkinType,
      isSensitive,
      confidenceScore: Math.round(finalConfidence * 100) / 100,
      sources: {
        questionnaire: !!questionnaire,
        aiAnalysis: !!analysis,
      },
      detectedIssues,
      recommendations,
      lastUpdated,
    };
  };

  const handleQuizComplete = () => {
    fetchData();
    onQuizComplete?.();
  };

  const getSkinTypeDisplay = (skinType: string) => {
    const typeMap: Record<string, string> = {
      'dry': 'Kering',
      'oily': 'Berminyak',
      'combination': 'Kombinasi',
      'normal': 'Normal',
    };
    return typeMap[skinType.toLowerCase()] || skinType;
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-orange-600';
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 0.8) return 'Tinggi';
    if (confidence >= 0.6) return 'Sedang';
    return 'Rendah';
  };

  if (loading) {
    return (
      <Card className="shadow-soft animate-pulse">
        <CardContent className="p-6">
          <div className="h-32 bg-muted rounded-lg"></div>
        </CardContent>
      </Card>
    );
  }

  // No data at all - prompt to complete both
  if (!combinedProfile) {
    return (
      <>
        <Card className="shadow-soft border-2 border-dashed border-primary/30 bg-gradient-to-br from-primary/5 to-accent/5">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <ClipboardList className="h-5 w-5 text-primary" />
              Lengkapi Profil Kulitmu
            </CardTitle>
            <CardDescription>
              Kombinasi kuesioner + AI scan akan memberikan hasil paling akurat
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              onClick={() => setShowQuiz(true)} 
              className="w-full"
              variant="hero"
              size="lg"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Isi Kuesioner Kulit
            </Button>
            <Button 
              onClick={() => navigate('/scan')} 
              className="w-full"
              variant="outline"
              size="lg"
            >
              <Camera className="h-4 w-4 mr-2" />
              Scan Wajah dengan AI
            </Button>
          </CardContent>
        </Card>
        
        <SkinQuizModal 
          open={showQuiz} 
          onClose={() => setShowQuiz(false)}
          onComplete={handleQuizComplete}
        />
      </>
    );
  }

  // Has combined profile - show unified results
  const missingSource = !combinedProfile.sources.questionnaire || !combinedProfile.sources.aiAnalysis;

  return (
    <>
      <Card className="shadow-soft bg-gradient-to-br from-green-50/50 to-emerald-50/50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200/50 dark:border-green-800/30">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            Profil Kulit Anda
          </CardTitle>
          <CardDescription>
            Hasil gabungan dari {combinedProfile.sources.questionnaire ? 'kuesioner' : ''} 
            {combinedProfile.sources.questionnaire && combinedProfile.sources.aiAnalysis ? ' + ' : ''}
            {combinedProfile.sources.aiAnalysis ? 'AI scan' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Main Result */}
          <div className="flex items-center justify-between p-4 bg-background/80 rounded-lg">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Jenis Kulit</p>
              <p className="text-2xl font-bold text-primary capitalize">
                {getSkinTypeDisplay(combinedProfile.skinType)}
              </p>
              {combinedProfile.isSensitive && (
                <Badge variant="secondary" className="bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300">
                  + Sensitif
                </Badge>
              )}
            </div>
            <div className="text-right space-y-1">
              <p className="text-sm text-muted-foreground">Akurasi</p>
              <p className={`text-2xl font-bold ${getConfidenceColor(combinedProfile.confidenceScore)}`}>
                {Math.round(combinedProfile.confidenceScore * 100)}%
              </p>
              <p className={`text-xs ${getConfidenceColor(combinedProfile.confidenceScore)}`}>
                {getConfidenceLabel(combinedProfile.confidenceScore)}
              </p>
            </div>
          </div>

          {/* Data Sources */}
          <div className="flex gap-2">
            <Badge 
              variant={combinedProfile.sources.questionnaire ? "default" : "outline"}
              className={combinedProfile.sources.questionnaire ? "bg-primary/20 text-primary" : "opacity-50"}
            >
              <ClipboardList className="h-3 w-3 mr-1" />
              Kuesioner {combinedProfile.sources.questionnaire ? '✓' : '✗'}
            </Badge>
            <Badge 
              variant={combinedProfile.sources.aiAnalysis ? "default" : "outline"}
              className={combinedProfile.sources.aiAnalysis ? "bg-primary/20 text-primary" : "opacity-50"}
            >
              <Camera className="h-3 w-3 mr-1" />
              AI Scan {combinedProfile.sources.aiAnalysis ? '✓' : '✗'}
            </Badge>
          </div>

          {/* Missing source warning */}
          {missingSource && (
            <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/30">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-amber-800 dark:text-amber-200">
                    Tingkatkan akurasi hasil
                  </p>
                  <p className="text-amber-700 dark:text-amber-300 text-xs mt-1">
                    {!combinedProfile.sources.questionnaire && 'Lengkapi kuesioner untuk validasi lebih baik.'}
                    {!combinedProfile.sources.aiAnalysis && 'Lakukan AI skin scan untuk analisis visual.'}
                  </p>
                </div>
              </div>
              <Button 
                size="sm" 
                variant="outline" 
                className="mt-2 w-full border-amber-300 dark:border-amber-700"
                onClick={() => {
                  if (!combinedProfile.sources.questionnaire) {
                    setShowQuiz(true);
                  } else {
                    navigate('/scan');
                  }
                }}
              >
                {!combinedProfile.sources.questionnaire ? (
                  <>
                    <ClipboardList className="h-3 w-3 mr-1" />
                    Isi Kuesioner
                  </>
                ) : (
                  <>
                    <Camera className="h-3 w-3 mr-1" />
                    Scan Wajah
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Detected Issues */}
          {combinedProfile.detectedIssues.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Masalah Terdeteksi</p>
              <div className="flex flex-wrap gap-2">
                {combinedProfile.detectedIssues.slice(0, 5).map((issue, idx) => (
                  <Badge key={idx} variant="secondary" className="bg-accent/20 text-accent-foreground">
                    {issue}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* AI Recommendations */}
          {combinedProfile.recommendations && (
            <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
              <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                Rekomendasi AI
              </p>
              <p className="text-sm whitespace-pre-line leading-relaxed text-foreground/90">
                {combinedProfile.recommendations}
              </p>
            </div>
          )}
          
          {/* Actions */}
          <div className="flex items-center justify-between text-sm pt-2">
            <span className="text-muted-foreground">
              Update: {new Date(combinedProfile.lastUpdated).toLocaleDateString('id-ID')}
            </span>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setShowQuiz(true)}
              className="text-primary hover:text-primary/80"
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Update Kuesioner
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <SkinQuizModal 
        open={showQuiz} 
        onClose={() => setShowQuiz(false)}
        onComplete={handleQuizComplete}
      />
    </>
  );
};

export default SkinProfileCard;
