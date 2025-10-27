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
      <section className="relative pt-24 pb-16 overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <h1 className="text-5xl lg:text-6xl font-bold leading-tight">
                Your{' '}
                <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  AI-Powered
                </span>
                <br />
                Skincare Assistant
              </h1>
              <p className="text-xl text-muted-foreground">
                Discover your unique skin type, get personalized product recommendations, 
                and consult with our AI skincare expert—all in one beautiful app.
              </p>
              <div className="flex gap-4">
                <Link to="/register">
                  <Button variant="hero" size="lg">
                    <Sparkles className="h-5 w-5" />
                    Get Started Free
                  </Button>
                </Link>
                <Link to="/login">
                  <Button variant="outline" size="lg">
                    Sign In
                  </Button>
                </Link>
              </div>
            </div>
            <div className="relative">
              <img 
                src={heroImage} 
                alt="Healthy glowing skin" 
                className="rounded-2xl shadow-glow w-full"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            Everything You Need for Healthy Skin
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-6 rounded-lg bg-card shadow-soft text-center space-y-4">
              <div className="w-12 h-12 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                <ScanFace className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-xl">AI Skin Analysis</h3>
              <p className="text-muted-foreground">
                Get instant analysis of your skin type with our advanced AI technology
              </p>
            </div>
            <div className="p-6 rounded-lg bg-card shadow-soft text-center space-y-4">
              <div className="w-12 h-12 mx-auto rounded-full bg-secondary/10 flex items-center justify-center">
                <MessageSquare className="h-6 w-6 text-secondary" />
              </div>
              <h3 className="font-semibold text-xl">AI Consultant</h3>
              <p className="text-muted-foreground">
                Chat with our AI expert for personalized skincare advice anytime
              </p>
            </div>
            <div className="p-6 rounded-lg bg-card shadow-soft text-center space-y-4">
              <div className="w-12 h-12 mx-auto rounded-full bg-accent/10 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-accent" />
              </div>
              <h3 className="font-semibold text-xl">Track Progress</h3>
              <p className="text-muted-foreground">
                Monitor your skin health journey with detailed analytics and insights
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;