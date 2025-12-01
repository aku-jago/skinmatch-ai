import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Calendar, Award, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

interface SkinHealthAnalyticsProps {
  userId: string;
}

interface ProgressData {
  date: string;
  improvements: number;
}

const SkinHealthAnalytics = ({ userId }: SkinHealthAnalyticsProps) => {
  const [healthScore, setHealthScore] = useState<number>(0);
  const [totalScans, setTotalScans] = useState<number>(0);
  const [totalPhotos, setTotalPhotos] = useState<number>(0);
  const [progressData, setProgressData] = useState<ProgressData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, [userId]);

  const loadAnalytics = async () => {
    try {
      // Load skin analyses
      const { data: analyses } = await supabase
        .from('skin_analyses')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      // Load progress photos
      const { data: photos } = await supabase
        .from('photo_journals')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      setTotalScans(analyses?.length || 0);
      setTotalPhotos(photos?.length || 0);

      // Calculate health score based on recent analyses and progress
      if (analyses && analyses.length > 0) {
        const latestAnalysis = analyses[0] as any;
        
        // Try to use skin_health_score from AI analysis first (0-100)
        let calculatedScore = 50; // Default score
        
        if (typeof latestAnalysis.skin_health_score === 'number' && latestAnalysis.skin_health_score >= 0 && latestAnalysis.skin_health_score <= 100) {
          // Use AI-provided skin health score directly
          calculatedScore = latestAnalysis.skin_health_score;
        } else {
          // Fallback calculation based on confidence_score and issues
          const confidenceScore = latestAnalysis.confidence_score || 0.75;
          const issuesCount = Array.isArray(latestAnalysis.detected_issues) ? latestAnalysis.detected_issues.length : 0;
          
          // Base score from confidence (0-1 → 50-85)
          const baseScore = 50 + (confidenceScore * 35);
          
          // Deduct points for each issue detected
          const issuesPenalty = issuesCount * 8;
          
          // Progress bonus (max 15 points)
          const progressBonus = Math.min((photos?.length || 0) * 2, 15);
          
          calculatedScore = Math.min(Math.max(baseScore - issuesPenalty + progressBonus, 15), 100);
        }
        
        setHealthScore(Math.round(calculatedScore));
      } else {
        // No analyses yet - set a neutral starting score
        setHealthScore(50);
      }

      // Prepare progress chart data from photo journals
      if (photos && photos.length > 0) {
        const chartData = photos.slice(0, 10).reverse().map((photo: any) => {
          const analysisResult = photo.analysis_result || {};
          
          // Count actual improvements from analysis
          const improvements = Object.values(analysisResult).filter(
            (item: any) => item?.status === 'Membaik'
          ).length;
          
          // Count stable conditions (not worsening)
          const stable = Object.values(analysisResult).filter(
            (item: any) => item?.status === 'Stabil'
          ).length;
          
          // Calculate score based on actual data (no artificial index boost)
          const score = (improvements * 15) + (stable * 5);
          
          return {
            date: new Date(photo.created_at).toLocaleDateString('id-ID', { 
              month: 'short', 
              day: 'numeric' 
            }),
            improvements: score
          };
        });
        setProgressData(chartData);
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'hsl(var(--primary))';
    if (score >= 60) return 'hsl(var(--accent))';
    return 'hsl(var(--secondary))';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Needs Improvement';
  };

  if (loading) {
    return (
      <Card className="shadow-soft">
        <CardContent className="py-12">
          <div className="flex items-center justify-center">
            <div className="animate-pulse text-muted-foreground">Loading analytics...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Health Score Card */}
      <Card className="shadow-soft border-primary/20 bg-gradient-to-br from-card to-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Skin Health Score
          </CardTitle>
          <CardDescription>Overall skin health assessment based on your scans</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-6xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                {healthScore}
              </div>
              <div className="text-sm text-muted-foreground mt-2">
                {getScoreLabel(healthScore)}
              </div>
            </div>
            <div className="relative w-32 h-32">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="hsl(var(--muted))"
                  strokeWidth="8"
                  fill="none"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke={getScoreColor(healthScore)}
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={`${(healthScore / 100) * 352} 352`}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dasharray 1s ease-in-out' }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <Award className="h-12 w-12 text-primary/60" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="shadow-soft hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Total Scans
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{totalScans}</div>
            <p className="text-xs text-muted-foreground mt-1">Skin analyses completed</p>
          </CardContent>
        </Card>

        <Card className="shadow-soft hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-4 w-4 text-accent" />
              Progress Photos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-accent">{totalPhotos}</div>
            <p className="text-xs text-muted-foreground mt-1">Journey documented</p>
          </CardContent>
        </Card>
      </div>

      {/* Progress Chart */}
      {progressData.length > 0 && (
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>Improvement Trend</CardTitle>
            <CardDescription>Your skin health progress over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={progressData}>
                <defs>
                  <linearGradient id="colorImprovement" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="date" 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="improvements" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  fill="url(#colorImprovement)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SkinHealthAnalytics;