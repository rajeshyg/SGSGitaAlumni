import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Shield, Eye, Mail, Phone, MapPin, Search, MessageSquare, Loader2 } from 'lucide-react';
import APIService from '../../services/api';

interface PrivacySettings {
  profile_visibility: 'public' | 'alumni_only' | 'connections_only' | 'private';
  show_email: boolean;
  show_phone: boolean;
  show_location: boolean;
  searchable_by_name: boolean;
  searchable_by_email: boolean;
  allow_messaging: 'everyone' | 'alumni_only' | 'connections_only';
}

interface PrivacyTabProps {
  userId: string;
  onSettingsChange?: (hasChanges: boolean) => void;
}

export const PrivacyTab = React.forwardRef<{ save: () => Promise<void> }, PrivacyTabProps>(
  ({ userId, onSettingsChange }, ref) => {
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<PrivacySettings>({
    profile_visibility: 'alumni_only',
    show_email: false,
    show_phone: false,
    show_location: true,
    searchable_by_name: true,
    searchable_by_email: false,
    allow_messaging: 'alumni_only'
  });
  const [originalSettings, setOriginalSettings] = useState<PrivacySettings>(settings);

  useEffect(() => {
    loadSettings();
  }, [userId]);

  useEffect(() => {
    const hasChanges = JSON.stringify(settings) !== JSON.stringify(originalSettings);
    onSettingsChange?.(hasChanges);
  }, [settings, originalSettings, onSettingsChange]);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const response = await APIService.get<{ success: boolean; settings: PrivacySettings }>(
        `/api/users/${userId}/privacy-settings`
      );
      if (response.success && response.settings) {
        setSettings(response.settings);
        setOriginalSettings(response.settings);
      }
    } catch (error) {
      console.error('Failed to load privacy settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = <K extends keyof PrivacySettings>(
    key: K,
    value: PrivacySettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const saveSettings = async () => {
    try {
      await APIService.put(`/api/users/${userId}/privacy-settings`, settings);
      setOriginalSettings(settings);
    } catch (error) {
      console.error('Failed to save privacy settings:', error);
      throw error;
    }
  };

  // Expose save method via ref
  React.useImperativeHandle(ref, () => ({
    save: saveSettings
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
      {/* Profile Visibility */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Profile Visibility
          </CardTitle>
          <CardDescription>
            Control who can see your profile information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="profile-visibility">Who can view your profile?</Label>
            <Select
              value={settings.profile_visibility}
              onValueChange={(value) => updateSetting('profile_visibility', value as PrivacySettings['profile_visibility'])}
            >
              <SelectTrigger id="profile-visibility">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">
                  <div className="flex flex-col items-start">
                    <span className="font-medium">Public</span>
                    <span className="text-xs text-muted-foreground">Anyone can view your profile</span>
                  </div>
                </SelectItem>
                <SelectItem value="alumni_only">
                  <div className="flex flex-col items-start">
                    <span className="font-medium">Alumni Only</span>
                    <span className="text-xs text-muted-foreground">Only verified alumni members</span>
                  </div>
                </SelectItem>
                <SelectItem value="connections_only">
                  <div className="flex flex-col items-start">
                    <span className="font-medium">Connections Only</span>
                    <span className="text-xs text-muted-foreground">Only your connections</span>
                  </div>
                </SelectItem>
                <SelectItem value="private">
                  <div className="flex flex-col items-start">
                    <span className="font-medium">Private</span>
                    <span className="text-xs text-muted-foreground">Hidden from everyone</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Contact Information
          </CardTitle>
          <CardDescription>
            Choose which contact details are visible on your profile
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <div className="space-y-0.5">
                <Label htmlFor="show-email">Show Email Address</Label>
                <p className="text-sm text-muted-foreground">
                  Display your email on your profile
                </p>
              </div>
            </div>
            <Switch
              id="show-email"
              checked={settings.show_email}
              onCheckedChange={(checked) => updateSetting('show_email', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <div className="space-y-0.5">
                <Label htmlFor="show-phone">Show Phone Number</Label>
                <p className="text-sm text-muted-foreground">
                  Display your phone number on your profile
                </p>
              </div>
            </div>
            <Switch
              id="show-phone"
              checked={settings.show_phone}
              onCheckedChange={(checked) => updateSetting('show_phone', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <div className="space-y-0.5">
                <Label htmlFor="show-location">Show Location</Label>
                <p className="text-sm text-muted-foreground">
                  Display your city/region on your profile
                </p>
              </div>
            </div>
            <Switch
              id="show-location"
              checked={settings.show_location}
              onCheckedChange={(checked) => updateSetting('show_location', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Search Visibility */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search Visibility
          </CardTitle>
          <CardDescription>
            Control how others can find you
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="searchable-name">Searchable by Name</Label>
              <p className="text-sm text-muted-foreground">
                Allow others to find you by searching your name
              </p>
            </div>
            <Switch
              id="searchable-name"
              checked={settings.searchable_by_name}
              onCheckedChange={(checked) => updateSetting('searchable_by_name', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="searchable-email">Searchable by Email</Label>
              <p className="text-sm text-muted-foreground">
                Allow others to find you by searching your email
              </p>
            </div>
            <Switch
              id="searchable-email"
              checked={settings.searchable_by_email}
              onCheckedChange={(checked) => updateSetting('searchable_by_email', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Messaging Permissions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Messaging Permissions
          </CardTitle>
          <CardDescription>
            Control who can send you messages
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="allow-messaging">Who can message you?</Label>
            <Select
              value={settings.allow_messaging}
              onValueChange={(value) => updateSetting('allow_messaging', value as PrivacySettings['allow_messaging'])}
            >
              <SelectTrigger id="allow-messaging">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="everyone">Everyone</SelectItem>
                <SelectItem value="alumni_only">Alumni Only</SelectItem>
                <SelectItem value="connections_only">Connections Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <Shield className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                Privacy & Security
              </p>
              <p className="text-sm text-amber-700 dark:text-amber-300">
                Your privacy settings will be saved when you click the "Save Changes" button.
                We recommend keeping your profile visible to alumni only for the best networking experience.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
});

PrivacyTab.displayName = 'PrivacyTab';

export default PrivacyTab;

