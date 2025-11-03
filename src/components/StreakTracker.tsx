import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Flame, Trophy, Target, Award, Zap, Star } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Achievement {
  id: string;
  achievement_type: string;
  title: string;
  description: string | null;
  earned_at: string;
  icon: string | null;
}

interface StreakData {
  current_streak: number;
  longest_streak: number;
  total_completions: number;
}

export default function StreakTracker() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [streak, setStreak] = useState<StreakData | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadStreakData();
      loadAchievements();
    }
  }, [user]);

  const loadStreakData = async () => {
    try {
      const { data, error } = await supabase
        .from('user_streaks')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading streak:', error);
        return;
      }

      setStreak(data || { current_streak: 0, longest_streak: 0, total_completions: 0 });
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const loadAchievements = async () => {
    try {
      const { data, error } = await supabase
        .from('achievements')
        .select('*')
        .eq('user_id', user?.id)
        .order('earned_at', { ascending: false })
        .limit(6);

      if (error) throw error;
      setAchievements(data || []);
    } catch (error) {
      console.error('Error loading achievements:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAchievementIcon = (type: string) => {
    switch (type) {
      case 'first_routine':
        return <Star className="w-5 h-5" />;
      case 'week_streak':
        return <Flame className="w-5 h-5" />;
      case 'month_streak':
        return <Trophy className="w-5 h-5" />;
      case 'consistency':
        return <Target className="w-5 h-5" />;
      case 'milestone':
        return <Award className="w-5 h-5" />;
      default:
        return <Zap className="w-5 h-5" />;
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-muted rounded w-1/3"></div>
          <div className="h-20 bg-muted rounded"></div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Streak Stats */}
      <Card className="p-6 bg-gradient-to-br from-primary/5 via-accent/5 to-background border-2">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold">Konsistensi Routine</h3>
          <Flame className="w-8 h-8 text-primary animate-pulse" />
        </div>
        
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 bg-background/50 rounded-lg border">
            <div className="text-3xl font-bold text-primary mb-1">
              {streak?.current_streak || 0}
            </div>
            <div className="text-sm text-muted-foreground">Hari Beruntun</div>
          </div>
          
          <div className="text-center p-4 bg-background/50 rounded-lg border">
            <div className="text-3xl font-bold text-accent mb-1">
              {streak?.longest_streak || 0}
            </div>
            <div className="text-sm text-muted-foreground">Rekor Tertinggi</div>
          </div>
          
          <div className="text-center p-4 bg-background/50 rounded-lg border">
            <div className="text-3xl font-bold text-secondary mb-1">
              {streak?.total_completions || 0}
            </div>
            <div className="text-sm text-muted-foreground">Total Selesai</div>
          </div>
        </div>

        {streak && streak.current_streak >= 7 && (
          <div className="mt-4 p-3 bg-primary/10 rounded-lg border border-primary/20">
            <p className="text-sm font-medium text-center">
              🎉 Luar biasa! Kamu sudah konsisten {streak.current_streak} hari berturut-turut!
            </p>
          </div>
        )}
      </Card>

      {/* Achievements */}
      {achievements.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold">Pencapaian Terbaru</h3>
            <Trophy className="w-6 h-6 text-accent" />
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {achievements.map((achievement) => (
              <div
                key={achievement.id}
                className="p-4 bg-gradient-to-br from-accent/10 to-background rounded-lg border hover:border-accent/50 transition-all"
              >
                <div className="flex flex-col items-center text-center space-y-2">
                  <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center text-accent">
                    {getAchievementIcon(achievement.achievement_type)}
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{achievement.title}</p>
                    {achievement.description && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {achievement.description}
                      </p>
                    )}
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {new Date(achievement.earned_at).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short'
                    })}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Upcoming Milestones */}
      <Card className="p-6 bg-gradient-to-br from-secondary/5 to-background">
        <h3 className="text-lg font-bold mb-3">Target Berikutnya</h3>
        <div className="space-y-3">
          {streak && streak.current_streak < 7 && (
            <div className="flex items-center justify-between p-3 bg-background rounded-lg border">
              <div className="flex items-center gap-3">
                <Flame className="w-5 h-5 text-muted-foreground" />
                <span className="text-sm">Streak 7 Hari</span>
              </div>
              <span className="text-xs text-muted-foreground">
                {7 - (streak?.current_streak || 0)} hari lagi
              </span>
            </div>
          )}
          
          {streak && streak.current_streak >= 7 && streak.current_streak < 30 && (
            <div className="flex items-center justify-between p-3 bg-background rounded-lg border">
              <div className="flex items-center gap-3">
                <Trophy className="w-5 h-5 text-muted-foreground" />
                <span className="text-sm">Streak 30 Hari</span>
              </div>
              <span className="text-xs text-muted-foreground">
                {30 - (streak?.current_streak || 0)} hari lagi
              </span>
            </div>
          )}
          
          {streak && streak.total_completions < 50 && (
            <div className="flex items-center justify-between p-3 bg-background rounded-lg border">
              <div className="flex items-center gap-3">
                <Award className="w-5 h-5 text-muted-foreground" />
                <span className="text-sm">50 Routine Selesai</span>
              </div>
              <span className="text-xs text-muted-foreground">
                {50 - (streak?.total_completions || 0)} lagi
              </span>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}