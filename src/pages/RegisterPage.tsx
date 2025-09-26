import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card } from '../components/ui/card';

// ============================================================================
// REGISTRATION PAGE COMPONENT
// ============================================================================

export function RegisterPage() {
  const navigate = useNavigate();
  const { register, isAuthenticated, isLoading, error, clearError } = useAuth();

  // Form state
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    graduationYear: new Date().getFullYear(),
    major: '',
    currentPosition: '',
    company: '',
    location: '',
    linkedinUrl: '',
    bio: ''
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/admin', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Clear errors when form data changes
  useEffect(() => {
    if (error) {
      clearError();
    }
    setFormErrors({});
  }, [formData, error, clearError]);

  // Password strength calculation
  useEffect(() => {
    const calculatePasswordStrength = (password: string): number => {
      let strength = 0;
      if (password.length >= 8) strength += 1;
      if (/[a-z]/.test(password)) strength += 1;
      if (/[A-Z]/.test(password)) strength += 1;
      if (/[0-9]/.test(password)) strength += 1;
      if (/[^A-Za-z0-9]/.test(password)) strength += 1;
      return strength;
    };

    setPasswordStrength(calculatePasswordStrength(formData.password));
  }, [formData.password]);

  // ============================================================================
  // FORM VALIDATION
  // ============================================================================

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    // Email validation
    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    } else if (passwordStrength < 3) {
      errors.password = 'Password must contain uppercase, lowercase, and numbers';
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    // Name validation
    if (!formData.firstName.trim()) {
      errors.firstName = 'First name is required';
    }
    if (!formData.lastName.trim()) {
      errors.lastName = 'Last name is required';
    }

    // Graduation year validation
    const currentYear = new Date().getFullYear();
    if (formData.graduationYear < 1950 || formData.graduationYear > currentYear + 10) {
      errors.graduationYear = 'Please enter a valid graduation year';
    }

    // Major validation
    if (!formData.major.trim()) {
      errors.major = 'Major/Field of study is required';
    }

    // LinkedIn URL validation (if provided)
    if (formData.linkedinUrl && !formData.linkedinUrl.includes('linkedin.com')) {
      errors.linkedinUrl = 'Please enter a valid LinkedIn URL';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ============================================================================
  // FORM HANDLERS
  // ============================================================================

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'graduationYear' ? parseInt(value) || new Date().getFullYear() : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      await register({
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        graduationYear: formData.graduationYear,
        major: formData.major,
        currentPosition: formData.currentPosition || undefined,
        company: formData.company || undefined,
        location: formData.location || undefined,
        linkedinUrl: formData.linkedinUrl || undefined,
        bio: formData.bio || undefined
      });
      
      // Navigation will be handled by the useEffect above
    } catch (registrationError) {
      // Error is handled by the auth context
      // eslint-disable-next-line no-console
      console.error('Registration failed:', registrationError);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ============================================================================
  // PASSWORD STRENGTH INDICATOR
  // ============================================================================

  const getPasswordStrengthColor = (strength: number): string => {
    if (strength <= 1) return 'bg-red-500';
    if (strength <= 2) return 'bg-yellow-500';
    if (strength <= 3) return 'bg-blue-500';
    return 'bg-green-500';
  };

  const getPasswordStrengthText = (strength: number): string => {
    if (strength <= 1) return 'Weak';
    if (strength <= 2) return 'Fair';
    if (strength <= 3) return 'Good';
    return 'Strong';
  };

  // ============================================================================
  // LOADING STATE
  // ============================================================================

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // ============================================================================
  // RENDER REGISTRATION FORM
  // ============================================================================

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-2xl space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Join SGSGita Alumni
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Create your account to connect with fellow alumni
          </p>
        </div>

        {/* Registration Form */}
        <Card className="p-6 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Global Error Message */}
            {error && (
              <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}

            {/* Personal Information Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-foreground">Personal Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* First Name */}
                <div className="space-y-2">
                  <label htmlFor="firstName" className="text-sm font-medium text-foreground">
                    First Name *
                  </label>
                  <Input
                    id="firstName"
                    name="firstName"
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className={formErrors.firstName ? 'border-destructive' : ''}
                    placeholder="Enter your first name"
                  />
                  {formErrors.firstName && (
                    <p className="text-sm text-destructive">{formErrors.firstName}</p>
                  )}
                </div>

                {/* Last Name */}
                <div className="space-y-2">
                  <label htmlFor="lastName" className="text-sm font-medium text-foreground">
                    Last Name *
                  </label>
                  <Input
                    id="lastName"
                    name="lastName"
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className={formErrors.lastName ? 'border-destructive' : ''}
                    placeholder="Enter your last name"
                  />
                  {formErrors.lastName && (
                    <p className="text-sm text-destructive">{formErrors.lastName}</p>
                  )}
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-foreground">
                  Email Address *
                </label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className={formErrors.email ? 'border-destructive' : ''}
                  placeholder="Enter your email"
                />
                {formErrors.email && (
                  <p className="text-sm text-destructive">{formErrors.email}</p>
                )}
              </div>
            </div>

            {/* Academic Information Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-foreground">Academic Information</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Graduation Year */}
                <div className="space-y-2">
                  <label htmlFor="graduationYear" className="text-sm font-medium text-foreground">
                    Graduation Year *
                  </label>
                  <Input
                    id="graduationYear"
                    name="graduationYear"
                    type="number"
                    required
                    min="1950"
                    max={new Date().getFullYear() + 10}
                    value={formData.graduationYear}
                    onChange={handleInputChange}
                    className={formErrors.graduationYear ? 'border-destructive' : ''}
                    placeholder="e.g., 2020"
                  />
                  {formErrors.graduationYear && (
                    <p className="text-sm text-destructive">{formErrors.graduationYear}</p>
                  )}
                </div>

                {/* Major */}
                <div className="space-y-2">
                  <label htmlFor="major" className="text-sm font-medium text-foreground">
                    Major/Field of Study *
                  </label>
                  <Input
                    id="major"
                    name="major"
                    type="text"
                    required
                    value={formData.major}
                    onChange={handleInputChange}
                    className={formErrors.major ? 'border-destructive' : ''}
                    placeholder="e.g., Computer Science"
                  />
                  {formErrors.major && (
                    <p className="text-sm text-destructive">{formErrors.major}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Professional Information Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-foreground">Professional Information (Optional)</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Current Position */}
                <div className="space-y-2">
                  <label htmlFor="currentPosition" className="text-sm font-medium text-foreground">
                    Current Position
                  </label>
                  <Input
                    id="currentPosition"
                    name="currentPosition"
                    type="text"
                    value={formData.currentPosition}
                    onChange={handleInputChange}
                    placeholder="e.g., Software Engineer"
                  />
                </div>

                {/* Company */}
                <div className="space-y-2">
                  <label htmlFor="company" className="text-sm font-medium text-foreground">
                    Company
                  </label>
                  <Input
                    id="company"
                    name="company"
                    type="text"
                    value={formData.company}
                    onChange={handleInputChange}
                    placeholder="e.g., Tech Corp"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Location */}
                <div className="space-y-2">
                  <label htmlFor="location" className="text-sm font-medium text-foreground">
                    Location
                  </label>
                  <Input
                    id="location"
                    name="location"
                    type="text"
                    value={formData.location}
                    onChange={handleInputChange}
                    placeholder="e.g., San Francisco, CA"
                  />
                </div>

                {/* LinkedIn URL */}
                <div className="space-y-2">
                  <label htmlFor="linkedinUrl" className="text-sm font-medium text-foreground">
                    LinkedIn Profile
                  </label>
                  <Input
                    id="linkedinUrl"
                    name="linkedinUrl"
                    type="url"
                    value={formData.linkedinUrl}
                    onChange={handleInputChange}
                    className={formErrors.linkedinUrl ? 'border-destructive' : ''}
                    placeholder="https://linkedin.com/in/yourprofile"
                  />
                  {formErrors.linkedinUrl && (
                    <p className="text-sm text-destructive">{formErrors.linkedinUrl}</p>
                  )}
                </div>
              </div>

              {/* Bio */}
              <div className="space-y-2">
                <label htmlFor="bio" className="text-sm font-medium text-foreground">
                  Bio
                </label>
                <textarea
                  id="bio"
                  name="bio"
                  rows={3}
                  value={formData.bio}
                  onChange={handleInputChange}
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Tell us a bit about yourself..."
                />
              </div>
            </div>

            {/* Password Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-foreground">Security</h3>
              
              {/* Password */}
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-foreground">
                  Password *
                </label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  className={formErrors.password ? 'border-destructive' : ''}
                  placeholder="Create a strong password"
                />
                
                {/* Password Strength Indicator */}
                {formData.password && (
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ${getPasswordStrengthColor(passwordStrength)} ${
                            passwordStrength === 1 ? 'w-1/5' :
                            passwordStrength === 2 ? 'w-2/5' :
                            passwordStrength === 3 ? 'w-3/5' :
                            passwordStrength === 4 ? 'w-4/5' :
                            passwordStrength === 5 ? 'w-full' : 'w-0'
                          }`}
                        ></div>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {getPasswordStrengthText(passwordStrength)}
                      </span>
                    </div>
                  </div>
                )}
                
                {formErrors.password && (
                  <p className="text-sm text-destructive">{formErrors.password}</p>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="text-sm font-medium text-foreground">
                  Confirm Password *
                </label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className={formErrors.confirmPassword ? 'border-destructive' : ''}
                  placeholder="Confirm your password"
                />
                {formErrors.confirmPassword && (
                  <p className="text-sm text-destructive">{formErrors.confirmPassword}</p>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating Account...
                </>
              ) : (
                'Create Account'
              )}
            </Button>
          </form>

          {/* Additional Links */}
          <div className="text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link
              to="/login"
              className="text-primary hover:text-primary/80 font-medium"
            >
              Sign in here
            </Link>
          </div>
        </Card>

        {/* Footer */}
        <div className="text-center text-xs text-muted-foreground">
          <p>© 2024 SGSGita Alumni Network. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;
