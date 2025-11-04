import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Bell, Mail, Smartphone, Loader2 } from 'lucide-react';
import APIService from '../../services/api';

interface NotificationPreferences {
  email_notifications: boolean;
  email_frequency: 'instant' | 'daily' | 'weekly';
  posting_updates: boolean;
  connection_requests: boolean;
  event_reminders: boolean;
  weekly_digest: boolean;
  push_notifications: boolean;
}

interface NotificationsTabProps {
  userId: string;
  onPreferencesChange?: (hasChanges: boolean) => void;
  onSaveRequest?: () => Promise<void>;
}

export const NotificationsTab = React.forwardRef<{ save: () => Promise<void> }, NotificationsTabProps>(
  ({ userId, onPreferencesChange, onSaveRequest }, ref) => {
  const [loading, setLoading] = useState(true);
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    email_notifications: true,
    email_frequency: 'daily',
    posting_updates: true,
    connection_requests: true,
    event_reminders: true,
    weekly_digest: true,
    push_notifications: false
  });
  const [originalPreferences, setOriginalPreferences] = useState<NotificationPreferences>(preferences);

  useEffect(() => {
    loadPreferences();
  }, [userId]);

  useEffect(() => {
    const hasChanges = JSON.stringify(preferences) !== JSON.stringify(originalPreferences);
    onPreferencesChange?.(hasChanges);
  }, [preferences, originalPreferences, onPreferencesChange]);

  const loadPreferences = async () => {
    setLoading(true);
    try {
      const response = await APIService.get<{ success: boolean; preferences: NotificationPreferences }>(
        `/api/users/${userId}/notification-preferences`
      );
      if (response.success && response.preferences) {
        setPreferences(response.preferences);
        setOriginalPreferences(response.preferences);
      }
    } catch (error) {
      console.error('Failed to load notification preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const updatePreference = <K extends keyof NotificationPreferences>(
    key: K,
    value: NotificationPreferences[K]
  ) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
  };

  const savePreferences = async () => {
    try {
      await APIService.put(`/api/users/${userId}/notification-preferences`, preferences);
      setOriginalPreferences(preferences);
    } catch (error) {
      console.error('Failed to save notification preferences:', error);
      throw error;
    }
  };

  // Expose save method via ref
  React.useImperativeHandle(ref, () => ({
    save: savePreferences
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Email Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Notifications
          </CardTitle>
          <CardDescription>
            Manage how you receive email notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Master Email Toggle */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="email-notifications">Enable Email Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive notifications via email
              </p>
            </div>
            <Switch
              id="email-notifications"
              checked={preferences.email_notifications}
              onCheckedChange={(checked) => updatePreference('email_notifications', checked)}
            />
          </div>

          {/* Email Frequency */}
          {preferences.email_notifications && (
            <div className="space-y-3 pl-6 border-l-2 border-muted">
              <Label>Email Frequency</Label>
              <RadioGroup
                value={preferences.email_frequency}
                onValueChange={(value) => updatePreference('email_frequency', value as 'instant' | 'daily' | 'weekly')}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="instant" id="instant" />
                  <Label htmlFor="instant" className="font-normal cursor-pointer">
                    Instant - Receive emails immediately
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="daily" id="daily" />
                  <Label htmlFor="daily" className="font-normal cursor-pointer">
                    Daily Digest - Once per day summary
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="weekly" id="weekly" />
                  <Label htmlFor="weekly" className="font-normal cursor-pointer">
                    Weekly Digest - Once per week summary
                  </Label>
                </div>
              </RadioGroup>
            </div>
          )}

          {/* Specific Email Preferences */}
          {preferences.email_notifications && (
            <div className="space-y-4 pl-6 border-l-2 border-muted">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="posting-updates">Posting Updates</Label>
                  <p className="text-sm text-muted-foreground">
                    New postings matching your interests
                  </p>
                </div>
                <Switch
                  id="posting-updates"
                  checked={preferences.posting_updates}
                  onCheckedChange={(checked) => updatePreference('posting_updates', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="connection-requests">Connection Requests</Label>
                  <p className="text-sm text-muted-foreground">
                    When someone wants to connect with you
                  </p>
                </div>
                <Switch
                  id="connection-requests"
                  checked={preferences.connection_requests}
                  onCheckedChange={(checked) => updatePreference('connection_requests', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="event-reminders">Event Reminders</Label>
                  <p className="text-sm text-muted-foreground">
                    Upcoming events and deadlines
                  </p>
                </div>
                <Switch
                  id="event-reminders"
                  checked={preferences.event_reminders}
                  onCheckedChange={(checked) => updatePreference('event_reminders', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="weekly-digest">Weekly Digest</Label>
                  <p className="text-sm text-muted-foreground">
                    Summary of weekly activity
                  </p>
                </div>
                <Switch
                  id="weekly-digest"
                  checked={preferences.weekly_digest}
                  onCheckedChange={(checked) => updatePreference('weekly_digest', checked)}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Push Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Push Notifications
          </CardTitle>
          <CardDescription>
            Receive notifications on your mobile device
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="push-notifications">Enable Push Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Get real-time updates on your device
              </p>
            </div>
            <Switch
              id="push-notifications"
              checked={preferences.push_notifications}
              onCheckedChange={(checked) => updatePreference('push_notifications', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="bg-[--info-bg] border-[--info-border]">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <Bell className="h-5 w-5 text-[--info] flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-[--info-foreground]">
                Notification Preferences
              </p>
              <p className="text-sm text-[--info-foreground]/80">
                Your notification settings will be saved when you click the "Save Changes" button at the top of the page.
                You can adjust these settings at any time.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
});

NotificationsTab.displayName = 'NotificationsTab';

export default NotificationsTab;

