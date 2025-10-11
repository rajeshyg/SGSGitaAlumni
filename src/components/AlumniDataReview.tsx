import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { InfoIcon } from 'lucide-react';
import { AlumniProfile } from '../services/AlumniDataIntegrationService';

interface AlumniDataReviewProps {
  alumniProfile: AlumniProfile;
  onAccept: () => void;
  onEdit: () => void;
}

export const AlumniDataReview: React.FC<AlumniDataReviewProps> = ({
  alumniProfile,
  onAccept,
  onEdit
}) => {
  return (
    <Card className="alumni-data-review">
      <CardHeader>
        <CardTitle>Welcome Back!</CardTitle>
        <CardDescription>
          We've found your alumni record. Please review your information.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="alumni-data-display">
          <div className="data-source-notice mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <div className="flex items-center gap-2">
              <InfoIcon className="h-4 w-4 text-blue-600" />
              <span className="text-sm text-blue-800">This information comes from your alumni records</span>
            </div>
          </div>

          <div className="profile-grid space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ProfileField label="Name" value={`${alumniProfile.firstName} ${alumniProfile.lastName}`} />
              <ProfileField label="Student ID" value={alumniProfile.studentId} />
              <ProfileField label="Graduation Year" value={alumniProfile.graduationYear.toString()} />
              <ProfileField label="Program" value={alumniProfile.program} />
              {alumniProfile.email && <ProfileField label="Email" value={alumniProfile.email} />}
              {alumniProfile.phone && <ProfileField label="Phone" value={alumniProfile.phone} />}
              {alumniProfile.degree && <ProfileField label="Degree" value={alumniProfile.degree} />}
              {alumniProfile.address && <ProfileField label="Address" value={alumniProfile.address} />}
            </div>
          </div>
        </div>

        <div className="action-buttons mt-6 flex gap-3">
          <Button onClick={onAccept} className="flex-1">
            Join Alumni Network
          </Button>
          <Button onClick={onEdit} variant="outline" className="flex-1">
            Update Information
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

interface ProfileFieldProps {
  label: string;
  value: string;
}

const ProfileField: React.FC<ProfileFieldProps> = ({ label, value }) => (
  <div className="profile-field">
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {label}
    </label>
    <div className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded border">
      {value}
    </div>
  </div>
);

export default AlumniDataReview;