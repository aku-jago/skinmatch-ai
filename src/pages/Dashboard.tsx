import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Navigation } from '@/components/Navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScanFace, MessageSquare, Sparkles, TrendingUp, ShoppingBag, Calendar, Camera } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const Dashboard = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [latestAnalysis, setLatestAnalysis] = useState<any>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      // Fetch user profile
      supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
        .then(({ data }) => setProfile(data));

      // Fetch latest analysis
      supabase
        .from('skin_analyses')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()
        .then(({ data }) => setLatestAnalysis(data));
    }
  }, [user]);

  if (loading || !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 pt-24 pb-12">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Welcome Section */}
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Welcome back, {profile?.name || 'there'}! ✨
            </h1>
            <p className="text-muted-foreground">
              Your personalized skincare journey continues
            </p>
          </div>

          {/* Quick Stats */}
          {latestAnalysis && (
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Your Latest Skin Analysis
                </CardTitle>
                <CardDescription>
                  {new Date(latestAnalysis.created_at).toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-lg">
                    <span className="font-semibold">Skin Type:</span>{' '}
                    <span className="text-primary capitalize">{latestAnalysis.skin_type}</span>
                  </p>
                  {latestAnalysis.confidence_score && (
                    <p className="text-sm text-muted-foreground">
                      Confidence: {(latestAnalysis.confidence_score * 100).toFixed(0)}%
                    </p>
                  )}
                  {latestAnalysis.recommendations && (
                    <p className="text-sm mt-4">{latestAnalysis.recommendations}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          <div>
            <h2 className="text-2xl font-bold mb-4">Fitur Utama</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="shadow-soft hover:shadow-glow transition-all duration-300 cursor-pointer group" onClick={() => navigate('/scan')}>
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-gradient-to-br from-primary to-primary/80 group-hover:scale-110 transition-transform">
                      <ScanFace className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <div>
                      <CardTitle>Skin Scan</CardTitle>
                      <CardDescription>Analisis AI jenis kulit</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">
                    Dapatkan analisis mendalam tentang jenis kulit Anda dengan teknologi AI
                  </p>
                  <Button variant="hero" className="w-full">
                    Mulai Scan
                  </Button>
                </CardContent>
              </Card>

              <Card className="shadow-soft hover:shadow-glow transition-all duration-300 cursor-pointer group" onClick={() => navigate('/chat')}>
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-gradient-to-br from-secondary to-secondary/80 group-hover:scale-110 transition-transform">
                      <MessageSquare className="h-6 w-6 text-secondary-foreground" />
                    </div>
                    <div>
                      <CardTitle>AI Consultant</CardTitle>
                      <CardDescription>Chat dengan AI expert</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">
                    Konsultasi skincare personal dengan AI assistant kami
                  </p>
                  <Button variant="hero" className="w-full">
                    Mulai Chat
                  </Button>
                </CardContent>
              </Card>

              <Card className="shadow-soft hover:shadow-glow transition-all duration-300 cursor-pointer group" onClick={() => navigate('/progress')}>
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-gradient-to-br from-accent to-accent/80 group-hover:scale-110 transition-transform">
                      <Camera className="h-6 w-6 text-accent-foreground" />
                    </div>
                    <div>
                      <CardTitle>Progress Tracker</CardTitle>
                      <CardDescription>Track perjalanan kulit</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">
                    Pantau perkembangan kulit Anda dari waktu ke waktu
                  </p>
                  <Button variant="outline" className="w-full">
                    Lihat Progress
                  </Button>
                </CardContent>
              </Card>

              <Card className="shadow-soft hover:shadow-glow transition-all duration-300 cursor-pointer group" onClick={() => navigate('/shop')}>
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-gradient-to-br from-primary/70 to-accent/70 group-hover:scale-110 transition-transform">
                      <ShoppingBag className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <div>
                      <CardTitle>Shop Products</CardTitle>
                      <CardDescription>Produk skincare terbaik</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">
                    Temukan produk skincare yang cocok untuk kulit Anda
                  </p>
                  <Button variant="outline" className="w-full">
                    Jelajahi Produk
                  </Button>
                </CardContent>
              </Card>

              <Card className="shadow-soft hover:shadow-glow transition-all duration-300 cursor-pointer group" onClick={() => navigate('/routine')}>
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-gradient-to-br from-secondary/70 to-primary/70 group-hover:scale-110 transition-transform">
                      <Calendar className="h-6 w-6 text-secondary-foreground" />
                    </div>
                    <div>
                      <CardTitle>My Routine</CardTitle>
                      <CardDescription>Routine harian Anda</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">
                    Kelola dan pantau routine skincare harian Anda
                  </p>
                  <Button variant="outline" className="w-full">
                    Lihat Routine
                  </Button>
                </CardContent>
              </Card>

              <Card className="shadow-soft hover:shadow-glow transition-all duration-300 cursor-pointer group" onClick={() => navigate('/profile')}>
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-gradient-to-br from-accent/70 to-secondary/70 group-hover:scale-110 transition-transform">
                      <TrendingUp className="h-6 w-6 text-accent-foreground" />
                    </div>
                    <div>
                      <CardTitle>My Profile</CardTitle>
                      <CardDescription>Profil & preferensi</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">
                    Kelola profil dan preferensi skincare Anda
                  </p>
                  <Button variant="outline" className="w-full">
                    Lihat Profile
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Tips Section */}
          <Card className="shadow-soft bg-gradient-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-accent" />
                Daily Skincare Tip
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Remember to stay hydrated! Drinking plenty of water helps maintain skin moisture from within, 
                promoting a healthy, glowing complexion. Aim for at least 8 glasses a day.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;