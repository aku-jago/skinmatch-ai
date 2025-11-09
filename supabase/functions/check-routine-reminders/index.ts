import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get current time in HH:MM format
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:00`;
    
    console.log('Checking reminders for time:', currentTime);

    // Get all routines with reminder time matching current time
    const { data: routines, error: routinesError } = await supabaseClient
      .from('skincare_routines')
      .select(`
        id,
        routine_name,
        time_of_day,
        reminder_time,
        user_id,
        profiles!inner (
          notification_enabled,
          email,
          name
        )
      `)
      .eq('reminder_time', currentTime)
      .eq('profiles.notification_enabled', true);

    if (routinesError) {
      console.error('Error fetching routines:', routinesError);
      throw routinesError;
    }

    if (!routines || routines.length === 0) {
      console.log('No routines found for this time');
      return new Response(
        JSON.stringify({ message: 'No reminders to send', count: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${routines.length} routines to remind`);

    // Check if user has already completed this routine today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const notificationsToCreate = [];

    for (const routine of routines) {
      // Check if routine was completed today
      const { data: completion } = await supabaseClient
        .from('routine_completions')
        .select('id')
        .eq('routine_id', routine.id)
        .gte('completed_at', today.toISOString())
        .maybeSingle();

      // Only send notification if not completed today
      if (!completion) {
        const timeOfDayEmoji = routine.time_of_day === 'morning' ? '☀️' : '🌙';
        const message = routine.time_of_day === 'morning' 
          ? `Time for your morning skincare routine!`
          : `Don't forget your night skincare routine!`;

        notificationsToCreate.push({
          user_id: routine.user_id,
          title: `${timeOfDayEmoji} ${routine.routine_name}`,
          message: message,
          type: 'routine_reminder',
          routine_id: routine.id
        });
      }
    }

    if (notificationsToCreate.length > 0) {
      const { error: insertError } = await supabaseClient
        .from('notifications')
        .insert(notificationsToCreate);

      if (insertError) {
        console.error('Error creating notifications:', insertError);
        throw insertError;
      }

      console.log(`Created ${notificationsToCreate.length} notifications`);
    }

    return new Response(
      JSON.stringify({ 
        message: 'Reminders checked', 
        routines_found: routines.length,
        notifications_created: notificationsToCreate.length 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in check-routine-reminders:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
