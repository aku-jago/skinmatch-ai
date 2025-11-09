import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Bell, BellOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function NotificationSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [browserPermission, setBrowserPermission] = useState<NotificationPermission>('default');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      loadSettings();
    }
    
    // Check browser notification permission
    if ('Notification' in window) {
      setBrowserPermission(Notification.permission);
    }
  }, [user]);

  const loadSettings = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('profiles')
      .select('notification_enabled, notification_permission')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('Error loading settings:', error);
      return;
    }

    if (data) {
      setNotificationsEnabled(data.notification_enabled ?? true);
    }
  };

  const handleToggleNotifications = async (enabled: boolean) => {
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ notification_enabled: enabled })
        .eq('id', user.id);

      if (error) throw error;

      setNotificationsEnabled(enabled);
      toast({
        title: enabled ? 'Notifications Enabled' : 'Notifications Disabled',
        description: enabled 
          ? 'You will receive routine reminders' 
          : 'You will not receive routine reminders',
      });
    } catch (error) {
      console.error('Error updating settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to update notification settings',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const requestBrowserPermission = async () => {
    if (!('Notification' in window)) {
      toast({
        title: 'Not Supported',
        description: 'Your browser does not support notifications',
        variant: 'destructive',
      });
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setBrowserPermission(permission);

      if (permission === 'granted') {
        // Update in database
        await supabase
          .from('profiles')
          .update({ notification_permission: permission })
          .eq('id', user?.id);

        toast({
          title: 'Permission Granted',
          description: 'You will now receive browser notifications',
        });

        // Show test notification
        new Notification('SkinMatch Notifications', {
          body: 'You will receive reminders for your skincare routine!',
          icon: '/favicon.ico',
        });
      } else {
        toast({
          title: 'Permission Denied',
          description: 'You can enable notifications in your browser settings',
        });
      }
    } catch (error) {
      console.error('Error requesting permission:', error);
    }
  };

  return (
    <Card className="shadow-soft">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notification Settings
        </CardTitle>
        <CardDescription>
          Manage how you receive reminders for your skincare routine
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* In-App Notifications */}
        <div className="flex items-center justify-between space-x-4">
          <div className="flex-1 space-y-1">
            <Label htmlFor="in-app-notifications" className="text-base font-medium">
              Routine Reminders
            </Label>
            <p className="text-sm text-muted-foreground">
              Receive reminders for your scheduled skincare routines
            </p>
          </div>
          <Switch
            id="in-app-notifications"
            checked={notificationsEnabled}
            onCheckedChange={handleToggleNotifications}
            disabled={loading}
          />
        </div>

        {/* Browser Notifications */}
        <div className="flex items-center justify-between space-x-4">
          <div className="flex-1 space-y-1">
            <Label className="text-base font-medium">Browser Notifications</Label>
            <p className="text-sm text-muted-foreground">
              Get push notifications even when the app is closed
            </p>
          </div>
          <div className="flex items-center gap-2">
            {browserPermission === 'granted' ? (
              <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                <Bell className="h-4 w-4" />
                Enabled
              </div>
            ) : browserPermission === 'denied' ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <BellOff className="h-4 w-4" />
                Blocked
              </div>
            ) : (
              <Button onClick={requestBrowserPermission} variant="outline" size="sm">
                Enable
              </Button>
            )}
          </div>
        </div>

        {browserPermission === 'denied' && (
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">
              Browser notifications are blocked. To enable them, please update your browser settings
              and allow notifications for this site.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
