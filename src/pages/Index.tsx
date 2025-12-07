import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sparkles, ScanFace, MessageSquare, TrendingUp, Shield, ArrowRight, Star, Users, Zap } from 'lucide-react';
import heroImage from '@/assets/hero-skincare.jpg';

const Index = () => {
  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Subtle background pattern */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-20 right-10 w-72 h-72 bg-primary/8 rounded-full blur-3xl" />
        <div className="absolute bottom-40 left-10 w-64 h-64 bg-accent/8 rounded-full blur-3xl" />
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

      {/* Hero Section - New Design */}
      <section className="relative z-10 px-4 pt-6 pb-10">
        <div className="max-w-lg mx-auto space-y-6">
          {/* Badge */}
          <div className="flex justify-center animate-fade-up">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-xs font-medium text-primary">
              <Zap className="h-3.5 w-3.5" />
              AI-Powered Skincare
            </div>
          </div>

          {/* Main heading */}
          <div className="text-center space-y-3 animate-fade-up" style={{ animationDelay: '100ms' }}>
            <h1 className="text-4xl md:text-5xl font-bold leading-[1.1] tracking-tight">
              Your Personal
              <br />
              <span className="gradient-text">Skin Expert</span>
            </h1>
            <p className="text-muted-foreground text-base max-w-xs mx-auto">
              Analisis kulit, rekomendasi produk, dan konsultasi AI dalam satu aplikasi
            </p>
          </div>

          {/* Hero Image with Creative Frame */}
          <div className="relative animate-fade-up" style={{ animationDelay: '200ms' }}>
            {/* Main Image Container */}
            <div className="relative mx-auto w-48 h-48 md:w-56 md:h-56">
              {/* Decorative ring */}
              <div className="absolute inset-0 rounded-full border-2 border-dashed border-primary/30 animate-[spin_20s_linear_infinite]" />
              
              {/* Image */}
              <div className="absolute inset-3 rounded-full overflow-hidden border-4 border-background shadow-medium">
                <img 
                  src={heroImage} 
                  alt="Healthy glowing skin" 
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Floating badges */}
              <div className="absolute -top-2 -right-2 glass rounded-xl px-3 py-2 shadow-soft animate-float">
                <div className="flex items-center gap-1.5">
                  <div className="h-6 w-6 rounded-lg bg-primary/15 flex items-center justify-center">
                    <ScanFace className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs font-bold">10K+</p>
                    <p className="text-[10px] text-muted-foreground">Scans</p>
                  </div>
                </div>
              </div>

              <div className="absolute -bottom-1 -left-4 glass rounded-xl px-3 py-2 shadow-soft animate-float" style={{ animationDelay: '1s' }}>
                <div className="flex items-center gap-1.5">
                  <div className="h-6 w-6 rounded-lg bg-warning/15 flex items-center justify-center">
                    <Star className="h-3.5 w-3.5 text-warning fill-warning" />
                  </div>
                  <div>
                    <p className="text-xs font-bold">4.9</p>
                    <p className="text-[10px] text-muted-foreground">Rating</p>
                  </div>
                </div>
              </div>

              <div className="absolute top-1/2 -right-8 glass rounded-xl px-3 py-2 shadow-soft animate-float" style={{ animationDelay: '0.5s' }}>
                <div className="flex items-center gap-1.5">
                  <div className="h-6 w-6 rounded-lg bg-success/15 flex items-center justify-center">
                    <Users className="h-3.5 w-3.5 text-success" />
                  </div>
                  <div>
                    <p className="text-xs font-bold">5K+</p>
                    <p className="text-[10px] text-muted-foreground">Users</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col gap-3 pt-4 animate-fade-up" style={{ animationDelay: '300ms' }}>
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
