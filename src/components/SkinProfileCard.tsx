import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ClipboardList, Sparkles, RefreshCw, CheckCircle2 } from 'lucide-react';
import SkinQuizModal from './SkinQuizModal';

interface SkinProfileCardProps {
  onQuizComplete?: () => void;
}

interface QuestionnaireResult {
  skin_type: string;
  is_sensitive: boolean;
  created_at: string;
  updated_at: string;
}

const SkinProfileCard = ({ onQuizComplete }: SkinProfileCardProps) => {
  const { user } = useAuth();
  const [showQuiz, setShowQuiz] = useState(false);
  const [questionnaire, setQuestionnaire] = useState<QuestionnaireResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchQuestionnaire();
    }
  }, [user]);

  const fetchQuestionnaire = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('skin_questionnaires')
        .select('skin_type, is_sensitive, created_at, updated_at')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching questionnaire:', error);
      }
      
      setQuestionnaire(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleQuizComplete = () => {
    fetchQuestionnaire();
    onQuizComplete?.();
  };

  const getSkinTypeDisplay = (skinType: string) => {
    const typeMap: Record<string, string> = {
      'dry': 'Kering',
      'oily': 'Berminyak',
      'combination': 'Kombinasi',
      'normal': 'Normal',
      'dry sensitive': 'Kering & Sensitif',
      'oily sensitive': 'Berminyak & Sensitif',
      'combination sensitive': 'Kombinasi & Sensitif',
      'normal sensitive': 'Normal & Sensitif',
    };
    return typeMap[skinType.toLowerCase()] || skinType;
  };

  if (loading) {
    return (
      <Card className="shadow-soft animate-pulse">
        <CardContent className="p-6">
          <div className="h-24 bg-muted rounded-lg"></div>
        </CardContent>
      </Card>
    );
  }

  // User hasn't completed questionnaire
  if (!questionnaire) {
    return (
      <>
        <Card className="shadow-soft border-2 border-dashed border-primary/30 bg-gradient-to-br from-primary/5 to-accent/5">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <ClipboardList className="h-5 w-5 text-primary" />
              Lengkapi Profil Kulitmu
            </CardTitle>
            <CardDescription>
              Jawab 3 pertanyaan singkat untuk mendapatkan rekomendasi yang lebih akurat
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => setShowQuiz(true)} 
              className="w-full"
              variant="hero"
              size="lg"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Mulai Kuesioner
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

  // User has completed questionnaire - show results
  return (
    <>
      <Card className="shadow-soft bg-gradient-to-br from-green-50/50 to-emerald-50/50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200/50 dark:border-green-800/30">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            Profil Kulit Tersimpan
          </CardTitle>
          <CardDescription>
            Berdasarkan kuesioner yang kamu isi
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-background/80 rounded-lg">
            <div>
              <p className="text-sm text-muted-foreground">Jenis Kulit</p>
              <p className="text-xl font-bold text-primary capitalize">
                {getSkinTypeDisplay(questionnaire.skin_type)}
              </p>
            </div>
            <div className="p-3 rounded-full bg-primary/10">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              Terakhir diupdate: {new Date(questionnaire.updated_at).toLocaleDateString('id-ID')}
            </span>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setShowQuiz(true)}
              className="text-primary hover:text-primary/80"
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Update
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
