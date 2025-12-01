import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Loader2, CheckCircle2, Sun, Moon, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

interface RoutineStep {
  order: number;
  step_name: string;
  product_name: string;
  product_id: string | null;
  instructions: string;
  why: string;
}

interface RoutineData {
  routine_name: string;
  steps: RoutineStep[];
}

interface WeeklyTreatment {
  treatment_name: string;
  frequency: string;
  product_name: string;
  product_id: string | null;
  instructions: string;
  why: string;
}

interface GeneratedRoutine {
  morning_routine: RoutineData;
  evening_routine: RoutineData;
  weekly_treatments: WeeklyTreatment[];
  tips: string[];
}

export function PersonalizedRoutineGenerator({ onRoutineSaved }: { onRoutineSaved: () => void }) {
  const [generating, setSaving] = useState(false);
  const [generatedRoutine, setGeneratedRoutine] = useState<GeneratedRoutine | null>(null);
  const { toast } = useToast();

  const handleGenerate = async () => {
    setSaving(true);
    try {
      // Get the current session for authentication
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      
      if (!accessToken) {
        throw new Error("Silakan login terlebih dahulu");
      }

      const { data, error } = await supabase.functions.invoke('generate-personalized-routine', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (error) throw error;

      if (data.error && !data.routine) {
        throw new Error(data.error);
      }

      setGeneratedRoutine(data.routine);
      toast({
        title: "Routine Generated! ✨",
        description: data.isDefault 
          ? "Rutinitas default berdasarkan tipe kulit Anda."
          : "Your personalized skincare routine is ready.",
      });
    } catch (error: any) {
      console.error('Error generating routine:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate routine. Please make sure you have completed a skin scan.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveRoutine = async (routineData: RoutineData, timeOfDay: 'morning' | 'night') => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase.from('skincare_routines').insert([{
        user_id: user.id,
        routine_name: routineData.routine_name,
        time_of_day: timeOfDay,
        products: routineData.steps as any,
        progress: 0,
      }]);

      if (error) throw error;

      toast({
        title: "Saved!",
        description: `${routineData.routine_name} has been saved to your routines.`,
      });
      
      onRoutineSaved();
    } catch (error) {
      console.error('Error saving routine:', error);
      toast({
        title: "Error",
        description: "Failed to save routine.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-elegant border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Personalized Routine Generator
          </CardTitle>
          <CardDescription>
            Generate a customized skincare routine based on your skin analysis and product recommendations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={handleGenerate} 
            disabled={generating || !!generatedRoutine}
            size="lg"
            className="w-full"
          >
            {generating ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Generating Your Perfect Routine...
              </>
            ) : generatedRoutine ? (
              <>
                <CheckCircle2 className="h-5 w-5 mr-2" />
                Routine Generated
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5 mr-2" />
                Generate Personalized Routine
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {generatedRoutine && (
        <div className="space-y-6">
          {/* Morning Routine */}
          <Card className="shadow-soft">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Sun className="h-5 w-5 text-yellow-500" />
                    {generatedRoutine.morning_routine.routine_name}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {generatedRoutine.morning_routine.steps.length} steps
                  </CardDescription>
                </div>
                <Button onClick={() => handleSaveRoutine(generatedRoutine.morning_routine, 'morning')}>
                  Save Routine
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {generatedRoutine.morning_routine.steps.map((step) => (
                  <div key={step.order} className="border-l-4 border-primary pl-4 py-2">
                    <div className="flex items-start gap-3">
                      <Badge variant="outline" className="mt-1">{step.order}</Badge>
                      <div className="flex-1 space-y-1">
                        <h4 className="font-semibold">{step.step_name}</h4>
                        <p className="text-sm font-medium text-primary">{step.product_name}</p>
                        <p className="text-sm text-muted-foreground">{step.instructions}</p>
                        <p className="text-xs text-muted-foreground italic">{step.why}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Evening Routine */}
          <Card className="shadow-soft">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Moon className="h-5 w-5 text-blue-500" />
                    {generatedRoutine.evening_routine.routine_name}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {generatedRoutine.evening_routine.steps.length} steps
                  </CardDescription>
                </div>
                <Button onClick={() => handleSaveRoutine(generatedRoutine.evening_routine, 'night')}>
                  Save Routine
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {generatedRoutine.evening_routine.steps.map((step) => (
                  <div key={step.order} className="border-l-4 border-blue-500 pl-4 py-2">
                    <div className="flex items-start gap-3">
                      <Badge variant="outline" className="mt-1">{step.order}</Badge>
                      <div className="flex-1 space-y-1">
                        <h4 className="font-semibold">{step.step_name}</h4>
                        <p className="text-sm font-medium text-blue-600 dark:text-blue-400">{step.product_name}</p>
                        <p className="text-sm text-muted-foreground">{step.instructions}</p>
                        <p className="text-xs text-muted-foreground italic">{step.why}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Weekly Treatments */}
          {generatedRoutine.weekly_treatments.length > 0 && (
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-accent" />
                  Weekly Treatments
                </CardTitle>
                <CardDescription>
                  Additional treatments to enhance your routine
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {generatedRoutine.weekly_treatments.map((treatment, index) => (
                    <div key={index} className="border-l-4 border-accent pl-4 py-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold">{treatment.treatment_name}</h4>
                          <Badge variant="secondary">{treatment.frequency}</Badge>
                        </div>
                        <p className="text-sm font-medium text-accent">{treatment.product_name}</p>
                        <p className="text-sm text-muted-foreground">{treatment.instructions}</p>
                        <p className="text-xs text-muted-foreground italic">{treatment.why}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tips */}
          {generatedRoutine.tips.length > 0 && (
            <Card className="shadow-soft bg-gradient-to-br from-primary/5 to-accent/5">
              <CardHeader>
                <CardTitle>💡 Tips untuk Kulit Sehat</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {generatedRoutine.tips.map((tip, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span className="text-sm">{tip}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
