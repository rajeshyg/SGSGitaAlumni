import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { User, Mail, Lock, Shield, CheckCircle, XCircle, Calendar, Loader2 } from 'lucide-react';
import APIService from '../../services/api';

interface AccountSettings {
  email: string;
  email_verified: boolean;
  email_verified_at: string | null;
  last_login_at: string | null;
  created_at: string;
  two_factor_enabled: boolean;
  last_password_change: string | null;
}

interface AccountTabProps {
  userId: string;
}

export const AccountTab: React.FC<AccountTabProps> = ({ userId }) => {
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<AccountSettings | null>(null);

  useEffect(() => {
    loadSettings();
  }, [userId]);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const response = await APIService.get<{ success: boolean; settings: AccountSettings }>(
        `/api/users/${userId}/account-settings`
      );
      if (response.success && response.settings) {
        setSettings(response.settings);
      }
    } catch (error) {
      console.error('Failed to load account settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Failed to load account settings</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Email Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Address
          </CardTitle>
          <CardDescription>
            Manage your email address and verification status
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Current Email</Label>
              <p className="text-sm font-mono">{settings.email}</p>
            </div>
            <div className="flex items-center gap-2">
              {settings.email_verified ? (
                <Badge variant="default" className="bg-[--success]">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Verified
                </Badge>
              ) : (
                <Badge variant="destructive">
                  <XCircle className="h-3 w-3 mr-1" />
                  Not Verified
                </Badge>
              )}
            </div>
          </div>

          {settings.email_verified && settings.email_verified_at && (
            <div className="text-sm text-muted-foreground">
              Verified on {formatDate(settings.email_verified_at)}
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button variant="outline" size="sm" disabled>
              Change Email
            </Button>
            {!settings.email_verified && (
              <Button variant="outline" size="sm" disabled>
                Resend Verification
              </Button>
            )}
          </div>

          <p className="text-xs text-muted-foreground">
            Email management features coming soon
          </p>
        </CardContent>
      </Card>

      {/* Password Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Password
          </CardTitle>
          <CardDescription>
            Manage your account password
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label>Last Password Change</Label>
            <p className="text-sm text-muted-foreground">
              {formatDate(settings.last_password_change)}
            </p>
          </div>

          <Button variant="outline" size="sm" disabled>
            Change Password
          </Button>

          <p className="text-xs text-muted-foreground">
            Password management features coming soon
          </p>
        </CardContent>
      </Card>

      {/* Two-Factor Authentication */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Two-Factor Authentication
          </CardTitle>
          <CardDescription>
            Add an extra layer of security to your account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>2FA Status</Label>
              <p className="text-sm text-muted-foreground">
                {settings.two_factor_enabled ? 'Enabled' : 'Disabled'}
              </p>
            </div>
            <div>
              {settings.two_factor_enabled ? (
                <Badge variant="default" className="bg-[--success]">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Active
                </Badge>
              ) : (
                <Badge variant="secondary">
                  <XCircle className="h-3 w-3 mr-1" />
                  Inactive
                </Badge>
              )}
            </div>
          </div>

          <Button variant="outline" size="sm" disabled>
            {settings.two_factor_enabled ? 'Disable 2FA' : 'Enable 2FA'}
          </Button>

          <p className="text-xs text-muted-foreground">
            Two-factor authentication features coming soon
          </p>
        </CardContent>
      </Card>

      {/* Account Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Account Information
          </CardTitle>
          <CardDescription>
            View your account details and activity
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                Account Created
              </Label>
              <p className="text-sm text-muted-foreground">
                {formatDate(settings.created_at)}
              </p>
            </div>

            <div className="space-y-1">
              <Label className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                Last Login
              </Label>
              <p className="text-sm text-muted-foreground">
                {formatDate(settings.last_login_at)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="bg-[--info-bg] border-[--info-border]">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <Shield className="h-5 w-5 text-[--info] flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-[--info-foreground]">
                Account Security
              </p>
              <p className="text-sm text-[--info-foreground]/80">
                Keep your account secure by using a strong password and enabling two-factor authentication.
                Additional account management features will be available soon.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AccountTab;

