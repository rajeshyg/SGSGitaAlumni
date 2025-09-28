import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Checkbox } from '../ui/checkbox';
import { Alert, AlertDescription } from '../ui/alert';
import { User, Edit, Save, X, Send, Mail, Phone, MapPin, Calendar, Briefcase, GraduationCap, FileText, CheckCircle } from 'lucide-react';
import { APIService } from '../../services/APIService';

interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  birthDate?: string;
  graduationYear?: number;
  program?: string;
  currentPosition?: string;
  bio?: string;
  linkedinUrl?: string;
  company?: string;
  location?: string;
  ageVerified: boolean;
  parentConsentRequired: boolean;
  parentConsentGiven: boolean;
  requiresOtp: boolean;
  alumniProfile: {
    familyName?: string;
    fatherName?: string;
    batch?: number;
    centerName?: string;
    result?: string;
    category?: string;
    phone?: string;
    email?: string;
    studentId?: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface UserEditorProps {
  userId: string;
  onClose: () => void;
  onSave: (user: UserProfile) => void;
}

export function UserEditor({ userId, onClose, onSave }: UserEditorProps) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sendingInvitation, setSendingInvitation] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [invitationSuccess, setInvitationSuccess] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    birthDate: '',
    graduationYear: '',
    program: '',
    currentPosition: '',
    bio: '',
    linkedinUrl: '',
    company: '',
    location: '',
    ageVerified: false,
    parentConsentRequired: false,
    parentConsentGiven: false,
    requiresOtp: true,
    alumniProfile: {
      familyName: '',
      fatherName: '',
      batch: '',
      centerName: '',
      result: '',
      category: '',
      phone: '',
      email: '',
      studentId: ''
    }
  });

  // Load user data
  useEffect(() => {
    loadUser();
  }, [userId]);

  const loadUser = async () => {
    setLoading(true);
    try {
      console.log('[UserEditor] Loading user data for userId:', userId);
      // Fetch real user data from API
      const response = await APIService.getUserById(userId);
      console.log('[UserEditor] API response:', response);

      const apiUser = response.user;
      console.log('[UserEditor] API user data:', apiUser);

      // The API response already includes both user and alumni data
      const user: UserProfile = {
        id: apiUser.id,
        firstName: apiUser.firstName,
        lastName: apiUser.lastName,
        email: apiUser.email,
        birthDate: apiUser.birthDate,
        graduationYear: apiUser.graduationYear,
        program: apiUser.program,
        currentPosition: apiUser.currentPosition,
        bio: apiUser.bio,
        linkedinUrl: apiUser.linkedinUrl,
        company: apiUser.company,
        location: apiUser.location,
        ageVerified: apiUser.ageVerified,
        parentConsentRequired: apiUser.parentConsentRequired,
        parentConsentGiven: apiUser.parentConsentGiven,
        requiresOtp: apiUser.requiresOtp || true,
        alumniProfile: {
          familyName: apiUser.alumniProfile?.familyName || '',
          fatherName: apiUser.alumniProfile?.fatherName || '',
          batch: apiUser.alumniProfile?.batch || apiUser.graduationYear,
          centerName: apiUser.alumniProfile?.centerName || apiUser.program,
          result: apiUser.alumniProfile?.result || '',
          category: apiUser.alumniProfile?.category || '',
          phone: apiUser.alumniProfile?.phone || '',
          email: apiUser.alumniProfile?.email || apiUser.email,
          studentId: apiUser.alumniProfile?.studentId || ''
        },
        createdAt: apiUser.createdAt,
        updatedAt: apiUser.updatedAt || apiUser.createdAt
      };

      setUser(user);
      setFormData({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        birthDate: user.birthDate || '',
        graduationYear: user.graduationYear?.toString() || '',
        program: user.program || '',
        currentPosition: user.currentPosition || '',
        bio: user.bio || '',
        linkedinUrl: user.linkedinUrl || '',
        company: user.company || '',
        location: user.location || '',
        ageVerified: user.ageVerified,
        parentConsentRequired: user.parentConsentRequired,
        parentConsentGiven: user.parentConsentGiven,
        requiresOtp: user.requiresOtp,
        alumniProfile: {
          familyName: user.alumniProfile.familyName || '',
          fatherName: user.alumniProfile.fatherName || '',
          batch: user.alumniProfile.batch?.toString() || '',
          centerName: user.alumniProfile.centerName || '',
          result: user.alumniProfile.result || '',
          category: user.alumniProfile.category || '',
          phone: user.alumniProfile.phone || '',
          email: user.alumniProfile.email || '',
          studentId: user.alumniProfile.studentId || ''
        }
      });
    } catch (err) {
      console.error('[UserEditor] Error loading user data:', err);
      setError('Failed to load user data');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    if (field.startsWith('alumniProfile.')) {
      const profileField = field.replace('alumniProfile.', '');
      setFormData(prev => ({
        ...prev,
        alumniProfile: {
          ...prev.alumniProfile,
          [profileField]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const updates = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        birthDate: formData.birthDate,
        graduationYear: formData.graduationYear ? parseInt(formData.graduationYear) : undefined,
        program: formData.program,
        currentPosition: formData.currentPosition,
        bio: formData.bio,
        linkedinUrl: formData.linkedinUrl,
        company: formData.company,
        location: formData.location,
        ageVerified: formData.ageVerified,
        parentConsentRequired: formData.parentConsentRequired,
        parentConsentGiven: formData.parentConsentGiven,
        requiresOtp: formData.requiresOtp,
        alumniProfile: {
          familyName: formData.alumniProfile.familyName,
          fatherName: formData.alumniProfile.fatherName,
          batch: formData.alumniProfile.batch ? parseInt(formData.alumniProfile.batch) : undefined,
          centerName: formData.alumniProfile.centerName,
          result: formData.alumniProfile.result,
          category: formData.alumniProfile.category,
          phone: formData.alumniProfile.phone,
          email: formData.alumniProfile.email,
          studentId: formData.alumniProfile.studentId
        }
      };

      await APIService.updateUser(userId, updates);

      setSuccess('User profile updated successfully!');
      if (user) {
        onSave({ ...user, ...updates });
      }
    } catch (err) {
      setError('Failed to update user profile');
    } finally {
      setSaving(false);
    }
  };

  const handleSendInvitation = async () => {
    setSendingInvitation(true);
    setInvitationSuccess(null);

    try {
      await APIService.sendInvitationToUser(userId, 'profile_completion', 7);
      setInvitationSuccess('Invitation sent successfully!');
    } catch (err) {
      setError('Failed to send invitation');
    } finally {
      setSendingInvitation(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading user data...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!user) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">
            <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>User not found</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Edit className="h-5 w-5" />
                Edit User Profile
              </CardTitle>
              <CardDescription>
                Update user information and send invitations
              </CardDescription>
            </div>
            <Button variant="outline" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <User className="h-5 w-5" />
              Basic Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="birthDate">Birth Date</Label>
                <Input
                  id="birthDate"
                  type="date"
                  value={formData.birthDate}
                  onChange={(e) => handleInputChange('birthDate', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Academic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              Academic Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="graduationYear">Graduation Year</Label>
                <Input
                  id="graduationYear"
                  type="number"
                  value={formData.graduationYear}
                  onChange={(e) => handleInputChange('graduationYear', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="program">Program</Label>
                <Input
                  id="program"
                  value={formData.program}
                  onChange={(e) => handleInputChange('program', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Professional Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              Professional Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="currentPosition">Current Position</Label>
                <Input
                  id="currentPosition"
                  value={formData.currentPosition}
                  onChange={(e) => handleInputChange('currentPosition', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="company">Company</Label>
                <Input
                  id="company"
                  value={formData.company}
                  onChange={(e) => handleInputChange('company', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="linkedinUrl">LinkedIn URL</Label>
                <Input
                  id="linkedinUrl"
                  value={formData.linkedinUrl}
                  onChange={(e) => handleInputChange('linkedinUrl', e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleInputChange('bio', e.target.value)}
                rows={3}
              />
            </div>
          </div>

          {/* Alumni Profile Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Alumni Profile Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="familyName">Family Name</Label>
                <Input
                  id="familyName"
                  value={formData.alumniProfile.familyName}
                  onChange={(e) => handleInputChange('alumniProfile.familyName', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="fatherName">Father Name</Label>
                <Input
                  id="fatherName"
                  value={formData.alumniProfile.fatherName}
                  onChange={(e) => handleInputChange('alumniProfile.fatherName', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="batch">Batch</Label>
                <Input
                  id="batch"
                  type="number"
                  value={formData.alumniProfile.batch}
                  onChange={(e) => handleInputChange('alumniProfile.batch', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="centerName">Center Name</Label>
                <Input
                  id="centerName"
                  value={formData.alumniProfile.centerName}
                  onChange={(e) => handleInputChange('alumniProfile.centerName', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="result">Result</Label>
                <Input
                  id="result"
                  value={formData.alumniProfile.result}
                  onChange={(e) => handleInputChange('alumniProfile.result', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={formData.alumniProfile.category}
                  onChange={(e) => handleInputChange('alumniProfile.category', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="alumniPhone">Phone</Label>
                <Input
                  id="alumniPhone"
                  value={formData.alumniProfile.phone}
                  onChange={(e) => handleInputChange('alumniProfile.phone', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="alumniEmail">Alumni Email</Label>
                <Input
                  id="alumniEmail"
                  type="email"
                  value={formData.alumniProfile.email}
                  onChange={(e) => handleInputChange('alumniProfile.email', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="studentId">Student ID</Label>
                <Input
                  id="studentId"
                  value={formData.alumniProfile.studentId}
                  onChange={(e) => handleInputChange('alumniProfile.studentId', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Settings</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="ageVerified"
                  checked={formData.ageVerified}
                  onCheckedChange={(checked) => handleInputChange('ageVerified', checked as boolean)}
                />
                <Label htmlFor="ageVerified">Age Verified</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="parentConsentRequired"
                  checked={formData.parentConsentRequired}
                  onCheckedChange={(checked) => handleInputChange('parentConsentRequired', checked as boolean)}
                />
                <Label htmlFor="parentConsentRequired">Parent Consent Required</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="parentConsentGiven"
                  checked={formData.parentConsentGiven}
                  onCheckedChange={(checked) => handleInputChange('parentConsentGiven', checked as boolean)}
                />
                <Label htmlFor="parentConsentGiven">Parent Consent Given</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="requiresOtp"
                  checked={formData.requiresOtp}
                  onCheckedChange={(checked) => handleInputChange('requiresOtp', checked as boolean)}
                />
                <Label htmlFor="requiresOtp">Requires OTP</Label>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <Button onClick={handleSave} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
            <Button variant="outline" onClick={handleSendInvitation} disabled={sendingInvitation}>
              <Send className="h-4 w-4 mr-2" />
              {sendingInvitation ? 'Sending...' : 'Send Invitation'}
            </Button>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>

          {/* Status Messages */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          {invitationSuccess && (
            <Alert>
              <Mail className="h-4 w-4" />
              <AlertDescription>{invitationSuccess}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}