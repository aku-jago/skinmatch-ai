import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Navigation } from '@/components/Navigation';
import { OnboardingTour } from '@/components/OnboardingTour';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScanFace, MessageSquare, ShoppingBag, Calendar, Camera, ShieldAlert, ChevronRight, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import SkinHealthAnalytics from '@/components/SkinHealthAnalytics';
import StreakTracker from '@/components/StreakTracker';
import ProductRecommendations from '@/components/ProductRecommendations';
import BeforeAfterComparison from '@/components/BeforeAfterComparison';
import SkinProfileCard from '@/components/SkinProfileCard';

const Dashboard = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
        .then(({ data }) => setProfile(data));
    }
  }, [user]);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-8 w-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const greeting = getGreeting();
  const firstName = profile?.name?.split(' ')[0] || 'there';

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <OnboardingTour />
      
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary/5 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 pt-16 pb-24 lg:pb-12">
        {/* Welcome Header */}
        <header className="px-4 py-6">
          <div className="max-w-4xl mx-auto">
            <p className="text-muted-foreground text-sm">{greeting}</p>
            <h1 className="text-2xl font-bold mt-0.5">
              Hi, {firstName}! <span className="wave">👋</span>
            </h1>
          </div>
        </header>

        <div className="px-4 space-y-6 max-w-4xl mx-auto">
          {/* Quick Actions Grid */}
          <section className="animate-fade-up">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <QuickActionCard
                icon={ScanFace}
                label="Skin Scan"
                description="Analisis AI"
                path="/scan"
                gradient="from-primary to-primary/70"
              />
              <QuickActionCard
                icon={Camera}
                label="Progress"
                description="Foto jurnal"
                path="/progress"
                gradient="from-accent to-accent/70"
              />
              <QuickActionCard
                icon={ShieldAlert}
                label="Cek Produk"
                description="Scan label"
                path="/product-scan"
                gradient="from-warning to-warning/70"
              />
              <QuickActionCard
                icon={Calendar}
                label="Routine"
                description="Jadwal harian"
                path="/routine"
                gradient="from-success to-success/70"
              />
            </div>
          </section>

          {/* Skin Profile Card */}
          <section className="animate-fade-up" style={{ animationDelay: '50ms' }}>
            <SkinProfileCard onQuizComplete={() => {
              supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single()
                .then(({ data }) => setProfile(data));
            }} />
          </section>

          {/* Skin Health Analytics */}
          <section className="animate-fade-up" style={{ animationDelay: '100ms' }}>
            <SkinHealthAnalytics userId={user.id} />
          </section>

          {/* Streak Tracker */}
          <section className="animate-fade-up" style={{ animationDelay: '150ms' }}>
            <SectionHeader title="Konsistensi" action="Lihat semua" path="/routine" />
            <StreakTracker />
          </section>

          {/* Product Recommendations */}
          <section className="animate-fade-up" style={{ animationDelay: '200ms' }}>
            <SectionHeader title="Rekomendasi Produk" action="Lihat semua" path="/shop" />
            <ProductRecommendations />
          </section>

          {/* Before/After Comparison */}
          <section className="animate-fade-up" style={{ animationDelay: '250ms' }}>
            <SectionHeader title="Progress Kulit" action="Lihat semua" path="/progress" />
            <BeforeAfterComparison />
          </section>

          {/* Daily Tip */}
          <section className="animate-fade-up" style={{ animationDelay: '300ms' }}>
            <Card className="glass border-primary/20">
              <CardContent className="p-4 flex items-start gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">Tips Hari Ini</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Minum air putih minimal 8 gelas sehari untuk menjaga kelembaban kulit dari dalam.
                  </p>
                </div>
              </CardContent>
            </Card>
          </section>
        </div>
      </div>
    </div>
  );
};

interface QuickActionCardProps {
  icon: React.ElementType;
  label: string;
  description: string;
  path: string;
  gradient: string;
}

const QuickActionCard = ({ icon: Icon, label, description, path, gradient }: QuickActionCardProps) => (
  <Link to={path}>
    <Card className="h-full hover:shadow-glow transition-all duration-200 active:scale-[0.98] touch-manipulation">
      <CardContent className="p-4 flex flex-col items-start gap-3">
        <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center`}>
          <Icon className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <p className="font-semibold text-sm">{label}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </CardContent>
    </Card>
  </Link>
);

interface SectionHeaderProps {
  title: string;
  action?: string;
  path?: string;
}

const SectionHeader = ({ title, action, path }: SectionHeaderProps) => (
  <div className="flex items-center justify-between mb-3">
    <h2 className="text-base font-semibold">{title}</h2>
    {action && path && (
      <Link to={path} className="text-xs text-primary flex items-center gap-0.5 hover:underline">
        {action}
        <ChevronRight className="h-3 w-3" />
      </Link>
    )}
  </div>
);

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Selamat Pagi';
  if (hour < 17) return 'Selamat Siang';
  if (hour < 21) return 'Selamat Sore';
  return 'Selamat Malam';
}

export default Dashboard;
