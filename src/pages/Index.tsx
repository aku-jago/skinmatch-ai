import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sparkles, ScanFace, MessageSquare, TrendingUp, Shield, ArrowRight } from 'lucide-react';
import heroImage from '@/assets/hero-skincare.jpg';

const Index = () => {
  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Ambient background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-accent/10 rounded-full blur-[100px]" />
      </div>

      {/* Header */}
      <header className="relative z-10 px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-glow">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-bold text-lg gradient-text">SkinMatch</span>
        </div>
        <Link to="/login">
          <Button variant="ghost" size="sm" className="text-muted-foreground">
            Sign In
          </Button>
        </Link>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 px-4 pt-8 pb-12">
        <div className="max-w-lg mx-auto space-y-8">
          {/* Badge */}
          <div className="flex justify-center animate-fade-up">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass text-xs font-medium">
              <div className="h-2 w-2 rounded-full bg-primary animate-pulse-soft" />
              AI-Powered Skincare
            </div>
          </div>

          {/* Main heading */}
          <div className="text-center space-y-4 animate-fade-up" style={{ animationDelay: '100ms' }}>
            <h1 className="text-4xl md:text-5xl font-bold leading-[1.1] tracking-tight">
              Your Personal
              <br />
              <span className="gradient-text">Skin Expert</span>
            </h1>
            <p className="text-muted-foreground text-base md:text-lg max-w-sm mx-auto">
              Analisis kulit, rekomendasi produk, dan konsultasi AI — semua dalam satu aplikasi
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col gap-3 animate-fade-up" style={{ animationDelay: '200ms' }}>
            <Link to="/register" className="w-full">
              <Button variant="hero" size="xl" className="w-full group">
                Mulai Gratis
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            <Link to="/login" className="w-full">
              <Button variant="glass" size="lg" className="w-full">
                Sudah punya akun? Masuk
              </Button>
            </Link>
          </div>

          {/* Hero Image */}
          <div className="relative animate-fade-up" style={{ animationDelay: '300ms' }}>
            <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-accent/30 rounded-3xl blur-2xl scale-95" />
            <div className="relative rounded-3xl overflow-hidden border border-border/50 shadow-medium">
              <img 
                src={heroImage} 
                alt="Healthy glowing skin" 
                className="w-full aspect-[4/3] object-cover"
              />
              {/* Overlay gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
              
              {/* Floating stats */}
              <div className="absolute bottom-4 left-4 right-4">
                <div className="glass rounded-2xl p-4 flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center">
                    <ScanFace className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold">10.000+</p>
                    <p className="text-xs text-muted-foreground">Analisis kulit dilakukan</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 px-4 py-12">
        <div className="max-w-lg mx-auto">
          <h2 className="text-xl font-bold text-center mb-8">
            Fitur Unggulan
          </h2>
          
          <div className="space-y-4 stagger-children">
            <FeatureCard
              icon={ScanFace}
              title="AI Skin Analysis"
              description="Deteksi jenis kulit dan masalah dengan teknologi AI canggih"
              color="primary"
            />
            <FeatureCard
              icon={MessageSquare}
              title="AI Consultant"
              description="Konsultasi skincare personal 24/7 dengan AI expert"
              color="accent"
            />
            <FeatureCard
              icon={TrendingUp}
              title="Progress Tracking"
              description="Pantau perjalanan kesehatan kulit Anda dengan analytics"
              color="primary"
            />
            <FeatureCard
              icon={Shield}
              title="Product Scanner"
              description="Scan produk untuk deteksi allergen dan irritant berbahaya"
              color="accent"
            />
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="relative z-10 px-4 py-12 pb-20">
        <div className="max-w-lg mx-auto">
          <div className="glass rounded-3xl p-6 text-center space-y-4">
            <div className="h-14 w-14 mx-auto rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-glow">
              <Sparkles className="h-7 w-7 text-primary-foreground" />
            </div>
            <h3 className="text-xl font-bold">Siap memulai?</h3>
            <p className="text-sm text-muted-foreground">
              Daftar gratis dan mulai perjalanan skincare Anda
            </p>
            <Link to="/register" className="block">
              <Button variant="hero" size="lg" className="w-full">
                Daftar Sekarang
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

interface FeatureCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
  color: 'primary' | 'accent';
}

const FeatureCard = ({ icon: Icon, title, description, color }: FeatureCardProps) => (
  <div className="glass rounded-2xl p-4 flex items-center gap-4 hover:border-primary/30 transition-all duration-200">
    <div className={cn(
      "h-12 w-12 rounded-xl flex items-center justify-center shrink-0",
      color === 'primary' ? "bg-primary/15" : "bg-accent/15"
    )}>
      <Icon className={cn(
        "h-6 w-6",
        color === 'primary' ? "text-primary" : "text-accent"
      )} />
    </div>
    <div className="flex-1 min-w-0">
      <h3 className="font-semibold text-sm">{title}</h3>
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
  </div>
);

// cn helper inline for this file
function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

export default Index;
