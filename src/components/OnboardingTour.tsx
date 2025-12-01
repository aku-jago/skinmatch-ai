import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Camera, 
  ScanLine, 
  MessageSquare, 
  CalendarCheck, 
  TrendingUp,
  ShoppingBag,
  Sparkles,
  ArrowRight,
  X,
  CheckCircle2
} from 'lucide-react';

interface OnboardingStep {
  id: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  gradient: string;
  features: string[];
}

const steps: OnboardingStep[] = [
  {
    id: 1,
    title: 'Selamat Datang di SkinMatch AI! 👋',
    description: 'Asisten skincare AI yang membantu kamu merawat kulit dengan lebih baik',
    icon: <Sparkles className="w-16 h-16 text-primary" />,
    gradient: 'from-primary/20 via-accent/20 to-primary/10',
    features: [
      'Analisis kulit dengan AI',
      'Rekomendasi produk personal',
      'Tracking progress otomatis',
      'Konsultasi AI 24/7'
    ]
  },
  {
    id: 2,
    title: 'AI Skin Scan 📸',
    description: 'Scan wajah untuk deteksi tipe kulit dan masalah kulit secara real-time',
    icon: <Camera className="w-16 h-16 text-teal-500" />,
    gradient: 'from-teal-500/20 via-cyan-500/20 to-blue-500/10',
    features: [
      'Deteksi tipe kulit otomatis',
      'Identifikasi masalah kulit',
      'Saran perawatan langsung',
      'Simpan riwayat analisis'
    ]
  },
  {
    id: 3,
    title: 'Product Scan 🔍',
    description: 'Scan label produk untuk cek ingredients dan kesesuaian dengan kulitmu',
    icon: <ScanLine className="w-16 h-16 text-purple-500" />,
    gradient: 'from-purple-500/20 via-pink-500/20 to-rose-500/10',
    features: [
      'Analisis ingredients otomatis',
      'Deteksi allergen & irritant',
      'Cek kompatibilitas kulit',
      'Patch test notification'
    ]
  },
  {
    id: 4,
    title: 'AI Chat Assistant 💬',
    description: 'Tanya apa saja tentang skincare ke AI assistant 24/7',
    icon: <MessageSquare className="w-16 h-16 text-green-500" />,
    gradient: 'from-green-500/20 via-emerald-500/20 to-teal-500/10',
    features: [
      'Jawaban instant & akurat',
      'Konteks personal dari profilmu',
      'Tips skincare harian',
      'Rekomendasi produk'
    ]
  },
  {
    id: 5,
    title: 'Routine Tracker 📅',
    description: 'Atur dan track rutinitas skincare pagi & malam dengan reminder',
    icon: <CalendarCheck className="w-16 h-16 text-orange-500" />,
    gradient: 'from-orange-500/20 via-amber-500/20 to-yellow-500/10',
    features: [
      'Routine pagi & malam',
      'Reminder otomatis',
      'Streak & achievement',
      'AI routine generator'
    ]
  },
  {
    id: 6,
    title: 'Progress Tracking 📊',
    description: 'Foto kulitmu secara berkala dan lihat perubahan dari waktu ke waktu',
    icon: <TrendingUp className="w-16 h-16 text-blue-500" />,
    gradient: 'from-blue-500/20 via-indigo-500/20 to-purple-500/10',
    features: [
      'Before & after comparison',
      'AI progress analysis',
      'Visual improvement chart',
      'Motivasi dari hasil nyata'
    ]
  },
  {
    id: 7,
    title: 'Product Marketplace 🛍️',
    description: 'Browse 50+ produk skincare viral Indonesia yang cocok untukmu',
    icon: <ShoppingBag className="w-16 h-16 text-pink-500" />,
    gradient: 'from-pink-500/20 via-rose-500/20 to-red-500/10',
    features: [
      '50+ produk viral Indonesia',
      'Filter by concern & skin type',
      'Review & rating',
      'AI recommendation'
    ]
  }
];

export function OnboardingTour() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem('has-seen-onboarding');
    if (!hasSeenOnboarding) {
      // Show after a brief delay for better UX
      setTimeout(() => setIsOpen(true), 1000);
    }
  }, []);

  const handleComplete = () => {
    localStorage.setItem('has-seen-onboarding', 'true');
    setIsOpen(false);
  };

  const handleSkip = () => {
    localStorage.setItem('has-seen-onboarding', 'true');
    setIsOpen(false);
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const progress = ((currentStep + 1) / steps.length) * 100;
  const step = steps[currentStep];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden border-2 border-primary/20">
        {/* Header */}
        <div className="relative p-6 pb-4">
          <button
            onClick={handleSkip}
            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Progress */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-muted-foreground">
                Step {currentStep + 1} of {steps.length}
              </span>
              <Badge variant="secondary" className="text-xs">
                {Math.round(progress)}%
              </Badge>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Dots Navigation */}
          <div className="flex items-center justify-center gap-2 mb-4">
            {steps.map((s, idx) => (
              <button
                key={s.id}
                onClick={() => setCurrentStep(idx)}
                className={`h-2 rounded-full transition-all ${
                  idx === currentStep 
                    ? 'w-8 bg-primary' 
                    : idx < currentStep
                      ? 'w-2 bg-primary/50'
                      : 'w-2 bg-muted'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Content */}
        <div className={`p-8 bg-gradient-to-br ${step.gradient} animate-fade-in`}>
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-background/50 rounded-full blur-xl"></div>
              <div className="relative p-6 bg-background/80 backdrop-blur rounded-full border-2 border-primary/20 shadow-lg">
                {step.icon}
              </div>
            </div>
          </div>

          {/* Title & Description */}
          <div className="text-center mb-6">
            <h2 className="text-2xl md:text-3xl font-bold mb-3 animate-fade-in">
              {step.title}
            </h2>
            <p className="text-muted-foreground text-base md:text-lg max-w-xl mx-auto animate-fade-in">
              {step.description}
            </p>
          </div>

          {/* Features List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8">
            {step.features.map((feature, idx) => (
              <div 
                key={idx}
                className="flex items-start gap-3 p-3 bg-background/50 backdrop-blur rounded-lg border border-border/50 animate-fade-in"
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-sm">{feature}</span>
              </div>
            ))}
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between gap-3">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className="flex-1"
            >
              Kembali
            </Button>
            
            {currentStep < steps.length - 1 ? (
              <Button
                onClick={handleNext}
                className="flex-1 gap-2"
              >
                Lanjut
                <ArrowRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                onClick={handleComplete}
                className="flex-1 gap-2 bg-gradient-to-r from-primary to-accent hover:opacity-90"
              >
                Mulai Sekarang
                <Sparkles className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* Skip Link */}
          {currentStep < steps.length - 1 && (
            <button
              onClick={handleSkip}
              className="w-full text-center text-sm text-muted-foreground hover:text-foreground mt-3 transition-colors"
            >
              Lewati tour
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Hook to restart tour from settings
export function useRestartTour() {
  return () => {
    localStorage.removeItem('has-seen-onboarding');
    window.location.reload();
  };
}
