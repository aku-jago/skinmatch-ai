import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Navigation } from '@/components/Navigation';
import { Sparkles, ScanFace, MessageSquare, TrendingUp } from 'lucide-react';
import heroImage from '@/assets/hero-skincare.jpg';

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative pt-20 md:pt-24 pb-12 md:pb-16 overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-8 md:gap-12 items-center">
            <div className="space-y-6 md:space-y-8 text-center lg:text-left">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                Your{' '}
                <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  AI-Powered
                </span>
                <br />
                Skincare Assistant
              </h1>
              <p className="text-base md:text-xl text-muted-foreground">
                Discover your skin type, scan products for allergens, track your progress, 
                and get personalized recommendations—all powered by AI.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center lg:justify-start">
                <Link to="/register" className="w-full sm:w-auto">
                  <Button variant="hero" size="lg" className="w-full sm:w-auto">
                    <Sparkles className="h-5 w-5" />
                    Get Started Free
                  </Button>
                </Link>
                <Link to="/login" className="w-full sm:w-auto">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto">
                    Sign In
                  </Button>
                </Link>
              </div>
            </div>
            <div className="relative order-first lg:order-last">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 rounded-2xl blur-3xl" />
              <img 
                src={heroImage} 
                alt="Healthy glowing skin" 
                className="relative rounded-2xl shadow-glow w-full"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-12 md:py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8 md:mb-12">
            Everything You Need for Healthy Skin
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            <div className="p-6 rounded-lg bg-card shadow-soft hover:shadow-glow transition-all text-center space-y-4">
              <div className="w-14 h-14 mx-auto rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
                <ScanFace className="h-7 w-7 text-primary-foreground" />
              </div>
              <h3 className="font-semibold text-lg md:text-xl">AI Skin Analysis</h3>
              <p className="text-sm text-muted-foreground">
                Analisis instan jenis kulit dengan teknologi AI canggih
              </p>
            </div>
            <div className="p-6 rounded-lg bg-card shadow-soft hover:shadow-glow transition-all text-center space-y-4">
              <div className="w-14 h-14 mx-auto rounded-full bg-gradient-to-br from-secondary to-secondary/70 flex items-center justify-center">
                <MessageSquare className="h-7 w-7 text-secondary-foreground" />
              </div>
              <h3 className="font-semibold text-lg md:text-xl">AI Consultant</h3>
              <p className="text-sm text-muted-foreground">
                Konsultasi skincare personal dengan AI expert kapan saja
              </p>
            </div>
            <div className="p-6 rounded-lg bg-card shadow-soft hover:shadow-glow transition-all text-center space-y-4">
              <div className="w-14 h-14 mx-auto rounded-full bg-gradient-to-br from-accent to-accent/70 flex items-center justify-center">
                <TrendingUp className="h-7 w-7 text-accent-foreground" />
              </div>
              <h3 className="font-semibold text-lg md:text-xl">Track Progress</h3>
              <p className="text-sm text-muted-foreground">
                Monitor perjalanan kesehatan kulit dengan analytics detail
              </p>
            </div>
            <div className="p-6 rounded-lg bg-card shadow-soft hover:shadow-glow transition-all text-center space-y-4">
              <div className="w-14 h-14 mx-auto rounded-full bg-gradient-to-br from-primary/70 to-accent/70 flex items-center justify-center">
                <Sparkles className="h-7 w-7 text-primary-foreground" />
              </div>
              <h3 className="font-semibold text-lg md:text-xl">Product Scanner</h3>
              <p className="text-sm text-muted-foreground">
                Scan produk untuk deteksi allergen dan irritant berbahaya
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;