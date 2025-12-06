import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { AlumniProfile } from '../services/AlumniDataIntegrationService';

interface AdditionalInfoFormProps {
  alumniProfile: AlumniProfile;
  requiredFields: string[];
  optionalFields: string[];
  onSubmit: (data: Record<string, any>) => void;
  isSubmitting?: boolean;
}

export const AdditionalInfoForm: React.FC<AdditionalInfoFormProps> = ({
  alumniProfile,
  requiredFields,
  optionalFields,
  onSubmit,
  isSubmitting = false
}) => {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validate required fields
    for (const field of requiredFields) {
      if (!formData[field] || formData[field].toString().trim() === '') {
        newErrors[field] = `${getFieldLabel(field)} is required`;
      }
    }

    // Validate email format
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Validate phone format - supports US and international formats
    if (formData.phone) {
      const trimmedPhone = formData.phone.trim();
      const digitsAndPlus = trimmedPhone.replace(/[\s\-\(\)]/g, '');

      // Check for valid characters
      if (!/^[\d\s\-\(\)+]+$/.test(trimmedPhone)) {
        newErrors.phone = 'Phone number contains invalid characters';
      } else if (digitsAndPlus.length === 0) {
        newErrors.phone = 'Phone number must contain at least one digit';
      } else {
        // US format: (555) 123-4567, 555-123-4567, etc.
        const usPattern = /^(\+?1)?[\s.-]?\(?([0-9]{3})\)?[\s.-]?([0-9]{3})[\s.-]?([0-9]{4})$/;
        // International format: +[1-9][1-14 more digits]
        const intlPattern = /^\+?[1-9]\d{1,14}$/;

        if (!usPattern.test(trimmedPhone) && !intlPattern.test(digitsAndPlus)) {
          newErrors.phone = 'Please enter a valid phone number like (555) 123-4567 or +1 555 123 4567';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      onSubmit(formData);
    }
  };

  return (
    <div className="additional-info-form">
      <div className="alumni-data-summary mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Your Alumni Information</CardTitle>
            <CardDescription>
              This information will be used as the basis for your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div><strong>Name:</strong> {alumniProfile.firstName} {alumniProfile.lastName}</div>
              <div><strong>Student ID:</strong> {alumniProfile.studentId}</div>
              <div><strong>Graduation:</strong> {alumniProfile.graduationYear}</div>
              <div><strong>Program:</strong> {alumniProfile.program}</div>
              {alumniProfile.email && <div><strong>Email:</strong> {alumniProfile.email}</div>}
              {alumniProfile.phone && <div><strong>Phone:</strong> {alumniProfile.phone}</div>}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Additional Information</CardTitle>
          <CardDescription>
            Please provide the following information to complete your registration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Required Fields */}
            {requiredFields.length > 0 && (
              <div className="required-fields">
                <h3 className="text-lg font-medium mb-4">Required Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {requiredFields.map(field => (
                    <FormField
                      key={field}
                      name={field}
                      label={getFieldLabel(field)}
                      required
                      value={formData[field] || ''}
                      error={errors[field]}
                      onChange={(value) => handleInputChange(field, value)}
                      component={getFieldComponent(field)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Optional Fields */}
            {optionalFields.length > 0 && (
              <div className="optional-fields">
                <h3 className="text-lg font-medium mb-4">Optional Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {optionalFields.map(field => (
                    <FormField
                      key={field}
                      name={field}
                      label={getFieldLabel(field)}
                      value={formData[field] || ''}
                      error={errors[field]}
                      onChange={(value) => handleInputChange(field, value)}
                      component={getFieldComponent(field)}
                    />
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Completing Registration...' : 'Complete Registration'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

interface FormFieldProps {
  name: string;
  label: string;
  required?: boolean;
  value: string;
  error?: string;
  onChange: (value: string) => void;
  component: 'input' | 'textarea' | 'select';
}

const FormField: React.FC<FormFieldProps> = ({
  name,
  label,
  required,
  value,
  error,
  onChange,
  component
}) => {
  const Component = component === 'textarea' ? Textarea : Input;

  return (
    <div className="form-field">
      <Label htmlFor={name} className="block text-sm font-medium text-foreground mb-1">
        {label} {required && <span className="text-destructive">*</span>}
      </Label>

      <Component
        id={name}
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={error ? 'border-red-500' : ''}
        placeholder={`Enter ${label.toLowerCase()}`}
      />

      {error && (
        <p className="mt-1 text-sm text-destructive">{error}</p>
      )}
    </div>
  );
};

// Helper functions
function getFieldLabel(field: string): string {
  // eslint-disable-next-line custom/no-hardcoded-mock-data -- This is a UI label mapping, not mock data
  const labels: Record<string, string> = {
    firstName: 'First Name',
    lastName: 'Last Name',
    email: 'Email Address',
    phone: 'Phone Number',
    address: 'Address',
    bio: 'Bio',
    linkedin_url: 'LinkedIn URL',
    current_position: 'Current Position',
    company: 'Company',
    location: 'Location',
    graduationYear: 'Graduation Year',
    program: 'Program'
  };

  return labels[field] || field.charAt(0).toUpperCase() + field.slice(1);
}

function getFieldComponent(field: string): 'input' | 'textarea' | 'select' {
  const textAreaFields = ['bio', 'address'];

  if (textAreaFields.includes(field)) {
    return 'textarea';
  }

  return 'input';
}

export default AdditionalInfoForm;