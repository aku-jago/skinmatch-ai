import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Navigation } from '@/components/Navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Sun, Moon, Plus, Trash2, Bell } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface Routine {
  id: string;
  routine_name: string;
  time_of_day: string;
  products: any;
  reminder_time: string | null;
  progress: number;
  created_at: string;
}

const Routine = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newRoutine, setNewRoutine] = useState({
    name: '',
    timeOfDay: 'morning',
    reminderTime: ''
  });

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    } else if (user) {
      loadRoutines();
    }
  }, [user, loading, navigate]);

  const loadRoutines = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('skincare_routines')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading routines:', error);
      return;
    }

    setRoutines(data || []);
  };

  const handleCreateRoutine = async () => {
    if (!user || !newRoutine.name) return;

    const { error } = await supabase.from('skincare_routines').insert([
      {
        user_id: user.id,
        routine_name: newRoutine.name,
        time_of_day: newRoutine.timeOfDay,
        reminder_time: newRoutine.reminderTime || null,
        products: [],
        progress: 0
      }
    ]);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to create routine.",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Success!",
        description: "Routine created successfully.",
      });
      setShowAddDialog(false);
      setNewRoutine({ name: '', timeOfDay: 'morning', reminderTime: '' });
      loadRoutines();
    }
  };

  const handleDeleteRoutine = async (id: string) => {
    const { error } = await supabase
      .from('skincare_routines')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete routine.",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Deleted",
        description: "Routine deleted successfully.",
      });
      loadRoutines();
    }
  };

  const handleUpdateProgress = async (id: string, currentProgress: number) => {
    const newProgress = Math.min(currentProgress + 1, 30);
    
    const { error } = await supabase
      .from('skincare_routines')
      .update({ progress: newProgress })
      .eq('id', id);

    if (!error) {
      if (newProgress === 7 || newProgress === 14 || newProgress === 30) {
        toast({
          title: "Milestone Reached! 🎉",
          description: `You've maintained your routine for ${newProgress} days!`,
        });
      }
      loadRoutines();
    }
  };

  if (loading || !user) {
    return null;
  }

  const morningRoutines = routines.filter(r => r.time_of_day === 'morning');
  const nightRoutines = routines.filter(r => r.time_of_day === 'night');

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 pt-24 pb-12">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                My Skincare Routines
              </h1>
              <p className="text-muted-foreground mt-2">
                Build and track your daily skincare habits
              </p>
            </div>
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button size="lg">
                  <Plus className="h-5 w-5 mr-2" />
                  Add Routine
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Routine</DialogTitle>
                  <DialogDescription>
                    Set up a new skincare routine with reminders
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div>
                    <Label htmlFor="name">Routine Name</Label>
                    <Input
                      id="name"
                      placeholder="e.g., Morning Glow Routine"
                      value={newRoutine.name}
                      onChange={(e) => setNewRoutine({ ...newRoutine, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="timeOfDay">Time of Day</Label>
                    <Select value={newRoutine.timeOfDay} onValueChange={(value) => setNewRoutine({ ...newRoutine, timeOfDay: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="morning">Morning</SelectItem>
                        <SelectItem value="night">Night</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="reminder">Reminder Time (Optional)</Label>
                    <Input
                      id="reminder"
                      type="time"
                      value={newRoutine.reminderTime}
                      onChange={(e) => setNewRoutine({ ...newRoutine, reminderTime: e.target.value })}
                    />
                  </div>
                  <Button onClick={handleCreateRoutine} className="w-full">
                    Create Routine
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Morning Routines */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Sun className="h-6 w-6 text-yellow-500" />
              Morning Routines
            </h2>
            {morningRoutines.length === 0 ? (
              <Card className="shadow-soft">
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">
                    No morning routines yet. Create one to get started!
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {morningRoutines.map((routine) => (
                  <Card key={routine.id} className="shadow-soft">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle>{routine.routine_name}</CardTitle>
                          <CardDescription>
                            {routine.reminder_time && (
                              <span className="flex items-center gap-1 mt-1">
                                <Bell className="h-3 w-3" />
                                Reminder at {routine.reminder_time}
                              </span>
                            )}
                          </CardDescription>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteRoutine(routine.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <div className="flex justify-between text-sm mb-2">
                            <span className="text-muted-foreground">Progress Streak</span>
                            <span className="font-medium">{routine.progress} days</span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary transition-all"
                              style={{ width: `${Math.min((routine.progress / 30) * 100, 100)}%` }}
                            />
                          </div>
                        </div>
                        <Button
                          onClick={() => handleUpdateProgress(routine.id, routine.progress)}
                          size="sm"
                        >
                          Mark Complete
                        </Button>
                      </div>
                      {routine.progress >= 7 && (
                        <div className="flex gap-2">
                          {routine.progress >= 7 && <Badge>7 Day Streak 🔥</Badge>}
                          {routine.progress >= 14 && <Badge>14 Day Streak 💪</Badge>}
                          {routine.progress >= 30 && <Badge variant="secondary">30 Day Champion 🏆</Badge>}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Night Routines */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Moon className="h-6 w-6 text-blue-500" />
              Night Routines
            </h2>
            {nightRoutines.length === 0 ? (
              <Card className="shadow-soft">
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">
                    No night routines yet. Create one to get started!
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {nightRoutines.map((routine) => (
                  <Card key={routine.id} className="shadow-soft">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle>{routine.routine_name}</CardTitle>
                          <CardDescription>
                            {routine.reminder_time && (
                              <span className="flex items-center gap-1 mt-1">
                                <Bell className="h-3 w-3" />
                                Reminder at {routine.reminder_time}
                              </span>
                            )}
                          </CardDescription>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteRoutine(routine.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <div className="flex justify-between text-sm mb-2">
                            <span className="text-muted-foreground">Progress Streak</span>
                            <span className="font-medium">{routine.progress} days</span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary transition-all"
                              style={{ width: `${Math.min((routine.progress / 30) * 100, 100)}%` }}
                            />
                          </div>
                        </div>
                        <Button
                          onClick={() => handleUpdateProgress(routine.id, routine.progress)}
                          size="sm"
                        >
                          Mark Complete
                        </Button>
                      </div>
                      {routine.progress >= 7 && (
                        <div className="flex gap-2">
                          {routine.progress >= 7 && <Badge>7 Day Streak 🔥</Badge>}
                          {routine.progress >= 14 && <Badge>14 Day Streak 💪</Badge>}
                          {routine.progress >= 30 && <Badge variant="secondary">30 Day Champion 🏆</Badge>}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Routine;
