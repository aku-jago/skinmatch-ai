import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { CheckCircle2, Sparkles, ArrowRight, ArrowLeft, Loader2 } from 'lucide-react';

interface SkinQuizModalProps {
  open: boolean;
  onClose: () => void;
  onComplete: (result: QuizResult) => void;
}

interface QuizResult {
  skinType: string;
  isSensitive: boolean;
  answers: Record<string, string>;
}

interface Question {
  id: string;
  question: string;
  options: {
    value: string;
    label: string;
    score: string[];
  }[];
}

const questions: Question[] = [
  {
    id: 'q1',
    question: 'Bagaimana rasanya kulitmu 2 jam setelah cuci muka (tanpa skincare)?',
    options: [
      { value: 'a', label: 'Terasa ketat/tarik', score: ['dry'] },
      { value: 'b', label: 'Berminyak di seluruh wajah', score: ['oily'] },
      { value: 'c', label: 'Berminyak di dahi/hidung saja', score: ['combination'] },
      { value: 'd', label: 'Nyaman/Biasa saja', score: ['normal'] },
    ],
  },
  {
    id: 'q2',
    question: 'Bagaimana tampilan pori-pori wajahmu?',
    options: [
      { value: 'a', label: 'Sangat kecil/tak terlihat', score: ['dry', 'normal'] },
      { value: 'b', label: 'Terlihat jelas di area hidung', score: ['combination'] },
      { value: 'c', label: 'Terlihat besar di pipi dan hidung', score: ['oily'] },
    ],
  },
  {
    id: 'q3',
    question: 'Apakah kulitmu mudah merah/gatal saat ganti produk atau kena matahari?',
    options: [
      { value: 'a', label: 'Ya, sering', score: ['sensitive'] },
      { value: 'b', label: 'Jarang/Tidak', score: ['not_sensitive'] },
    ],
  },
];

const calculateSkinType = (answers: Record<string, string>): QuizResult => {
  const scores: Record<string, number> = {
    dry: 0,
    oily: 0,
    combination: 0,
    normal: 0,
  };
  
  let isSensitive = false;
  
  // Process each answer
  Object.entries(answers).forEach(([questionId, answerValue]) => {
    const question = questions.find(q => q.id === questionId);
    if (!question) return;
    
    const selectedOption = question.options.find(opt => opt.value === answerValue);
    if (!selectedOption) return;
    
    // Handle sensitivity question separately
    if (questionId === 'q3') {
      isSensitive = selectedOption.score.includes('sensitive');
      return;
    }
    
    // Add scores for skin type
    selectedOption.score.forEach(scoreType => {
      if (scores[scoreType] !== undefined) {
        scores[scoreType]++;
      }
    });
  });
  
  // Determine dominant skin type
  let skinType = 'normal';
  let maxScore = 0;
  
  Object.entries(scores).forEach(([type, score]) => {
    if (score > maxScore) {
      maxScore = score;
      skinType = type;
    }
  });
  
  // Handle ties - prefer combination if mixed
  const scoreValues = Object.values(scores);
  const hasMultipleHighScores = scoreValues.filter(s => s === maxScore).length > 1;
  if (hasMultipleHighScores && maxScore > 0) {
    skinType = 'combination';
  }
  
  return {
    skinType,
    isSensitive,
    answers,
  };
};

const SkinQuizModal = ({ open, onClose, onComplete }: SkinQuizModalProps) => {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState<QuizResult | null>(null);
  
  const totalSteps = questions.length;
  const progress = ((currentStep + 1) / totalSteps) * 100;
  const currentQuestion = questions[currentStep];
  
  const handleAnswer = (value: string) => {
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: value,
    }));
  };
  
  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleSubmit();
    }
  };
  
  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };
  
  const handleSubmit = async () => {
    if (!user) return;
    
    setIsSubmitting(true);
    
    // Calculate result
    const calculatedResult = calculateSkinType(answers);
    setResult(calculatedResult);
    
    // Simulate loading for better UX
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    try {
      // Format skin type with sensitivity
      const fullSkinType = calculatedResult.isSensitive 
        ? `${calculatedResult.skinType} sensitive` 
        : calculatedResult.skinType;
      
      // Save to database
      const { error } = await supabase
        .from('skin_questionnaires')
        .upsert({
          user_id: user.id,
          answers: calculatedResult.answers,
          skin_type: fullSkinType,
          is_sensitive: calculatedResult.isSensitive,
          confidence_score: 0.85,
        }, {
          onConflict: 'user_id',
        });
      
      if (error) throw error;
      
      // Also update profile skin_type
      await supabase
        .from('profiles')
        .update({ skin_type: fullSkinType })
        .eq('id', user.id);
      
      setShowResult(true);
      toast.success('Profil kulit berhasil disimpan!');
      
    } catch (error) {
      console.error('Error saving questionnaire:', error);
      toast.error('Gagal menyimpan hasil kuesioner');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleFinish = () => {
    if (result) {
      onComplete(result);
    }
    // Reset state
    setCurrentStep(0);
    setAnswers({});
    setShowResult(false);
    setResult(null);
    onClose();
  };
  
  const getSkinTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      dry: 'Kering (Dry)',
      oily: 'Berminyak (Oily)',
      combination: 'Kombinasi (Combination)',
      normal: 'Normal',
    };
    return labels[type] || type;
  };
  
  const getSkinTypeDescription = (type: string, isSensitive: boolean) => {
    const descriptions: Record<string, string> = {
      dry: 'Kulit Anda cenderung kering dan membutuhkan hidrasi ekstra. Pilih produk dengan kandungan pelembab yang kuat.',
      oily: 'Kulit Anda memproduksi minyak berlebih. Gunakan produk oil-free dan non-comedogenic.',
      combination: 'Kulit Anda memiliki area berminyak (T-zone) dan kering di bagian lain. Perlu perawatan yang seimbang.',
      normal: 'Kulit Anda seimbang! Fokus pada menjaga kesehatan kulit dengan rutinitas dasar yang baik.',
    };
    
    let desc = descriptions[type] || 'Kulit Anda memiliki karakteristik unik.';
    
    if (isSensitive) {
      desc += ' Karena kulit Anda sensitif, pilih produk dengan formula lembut dan hindari bahan iritan.';
    }
    
    return desc;
  };
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        {!showResult ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Kenali Jenis Kulitmu
              </DialogTitle>
              <DialogDescription>
                Jawab {totalSteps} pertanyaan singkat untuk menentukan jenis kulitmu
              </DialogDescription>
            </DialogHeader>
            
            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Pertanyaan {currentStep + 1} dari {totalSteps}</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
            
            {/* Question */}
            <div className="py-4">
              <h3 className="text-lg font-medium mb-4">{currentQuestion.question}</h3>
              
              {/* Answer Options */}
              <div className="space-y-3">
                {currentQuestion.options.map((option) => (
                  <Button
                    key={option.value}
                    variant={answers[currentQuestion.id] === option.value ? 'default' : 'outline'}
                    className={`w-full justify-start text-left h-auto py-4 px-4 ${
                      answers[currentQuestion.id] === option.value 
                        ? 'bg-primary text-primary-foreground ring-2 ring-primary' 
                        : 'hover:bg-muted'
                    }`}
                    onClick={() => handleAnswer(option.value)}
                  >
                    <span className="flex items-center gap-3">
                      <span className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-sm font-medium ${
                        answers[currentQuestion.id] === option.value 
                          ? 'border-primary-foreground bg-primary-foreground text-primary' 
                          : 'border-muted-foreground'
                      }`}>
                        {option.value.toUpperCase()}
                      </span>
                      <span className="flex-1">{option.label}</span>
                      {answers[currentQuestion.id] === option.value && (
                        <CheckCircle2 className="h-5 w-5" />
                      )}
                    </span>
                  </Button>
                ))}
              </div>
            </div>
            
            {/* Navigation Buttons */}
            <div className="flex gap-3 pt-4">
              {currentStep > 0 && (
                <Button
                  variant="outline"
                  onClick={handleBack}
                  className="flex-1"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Kembali
                </Button>
              )}
              <Button
                onClick={handleNext}
                disabled={!answers[currentQuestion.id] || isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Menganalisis...
                  </>
                ) : currentStep === totalSteps - 1 ? (
                  <>
                    Lihat Hasil
                    <Sparkles className="h-4 w-4 ml-2" />
                  </>
                ) : (
                  <>
                    Lanjut
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </>
        ) : (
          <>
            {/* Result Screen */}
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-green-500" />
                Hasil Analisis Kulit
              </DialogTitle>
            </DialogHeader>
            
            <div className="py-6 space-y-6">
              {/* Skin Type Result */}
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-primary to-accent mb-4">
                  <Sparkles className="h-10 w-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-primary">
                  {result && getSkinTypeLabel(result.skinType)}
                </h3>
                {result?.isSensitive && (
                  <span className="inline-block mt-2 px-3 py-1 bg-rose-100 text-rose-700 rounded-full text-sm font-medium">
                    + Kulit Sensitif
                  </span>
                )}
              </div>
              
              {/* Description */}
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {result && getSkinTypeDescription(result.skinType, result.isSensitive)}
                </p>
              </div>
              
              {/* Confidence */}
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <span>Tingkat Keyakinan:</span>
                <span className="font-semibold text-primary">85%</span>
              </div>
            </div>
            
            <Button onClick={handleFinish} className="w-full" size="lg">
              Selesai
            </Button>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SkinQuizModal;
