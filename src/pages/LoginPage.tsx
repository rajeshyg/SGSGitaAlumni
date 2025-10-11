import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card } from '../components/ui/card';
import { OTPService } from '../services/OTPService';

// ============================================================================
// LOGIN PAGE COMPONENT
// ============================================================================

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, isLoading, error, clearError, user } = useAuth();
  const otpService = new OTPService();

  // Form state
  const [formData, setFormData] = useState({
    email: location.state?.email || '',
    password: ''
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRequestingOTP, setIsRequestingOTP] = useState(false);
  const [showPasswordlessLogin, setShowPasswordlessLogin] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      const userRole = user.role?.toLowerCase();
      const defaultRedirect = userRole === 'admin' ? '/admin' : '/dashboard';
      const from = location.state?.from?.pathname || defaultRedirect;
      console.log('🔄 LoginPage: Authenticated user detected');
      console.log('👤 User role:', user.role, 'Normalized role:', userRole);
      console.log('🎯 Default redirect:', defaultRedirect, 'Final redirect to:', from);
      console.log('📍 Location state:', location.state);
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, user, navigate, location]);

  // Clear errors when form data changes
  useEffect(() => {
    if (error) {
      clearError();
    }
    setFormErrors({});
  }, [formData, error, clearError]);

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
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ============================================================================
  // FORM HANDLERS
  // ============================================================================

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    console.log('Login form submitted with:', formData);

    if (!validateForm()) {
      console.log('Form validation failed');
      return;
    }

    console.log('Form validation passed, attempting login');
    setIsSubmitting(true);

    try {
      console.log('Calling login function...');
      await login({
        email: formData.email,
        password: formData.password
      });

      console.log('Login function completed successfully');
      // Navigation will be handled by the useEffect above
    } catch (loginError) {
      // Error is handled by the auth context
      console.error('Login failed:', loginError);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ============================================================================
  // OTP PASSWORDLESS LOGIN
  // ============================================================================

  const handleRequestOTP = async () => {
    // Validate email
    if (!formData.email) {
      setFormErrors({ email: 'Email is required for passwordless login' });
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setFormErrors({ email: 'Please enter a valid email address' });
      return;
    }

    setIsRequestingOTP(true);
    setFormErrors({});

    try {
      console.log('[LoginPage] Requesting OTP for email:', formData.email);

      // Generate OTP using OTPService (this also sends the email)
      await otpService.generateOTP({
        email: formData.email,
        type: 'login'
      });

      console.log('[LoginPage] OTP generated and sent successfully');

      // Redirect to OTP verification page
      navigate(`/verify-otp/${encodeURIComponent(formData.email)}`, {
        state: {
          email: formData.email,
          otpType: 'login',
          verificationMethod: 'email',
          message: 'Please check your email for the verification code.'
        }
      });

    } catch (error) {
      console.error('[LoginPage] OTP request error:', error);
      setFormErrors({
        email: error instanceof Error ? error.message : 'Failed to send OTP. Please try again.'
      });
    } finally {
      setIsRequestingOTP(false);
    }
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
  // RENDER LOGIN FORM
  // ============================================================================

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Sign In
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign in to your SGSGita Alumni account
          </p>
        </div>

        {/* Login Form */}
        <Card className="p-6 space-y-6">
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {/* Global Error Message */}
            {error && (
              <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}

            {/* Success Message from state */}
            {location.state?.message && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md text-sm">
                {location.state.message}
              </div>
            )}

            {/* Email Field */}
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-foreground">
                Email Address
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

            {/* Password Field - Only show if not using passwordless login */}
            {!showPasswordlessLogin && (
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-foreground">
                  Password
                </label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  className={formErrors.password ? 'border-destructive' : ''}
                  placeholder="Enter your password"
                />
                {formErrors.password && (
                  <p className="text-sm text-destructive">{formErrors.password}</p>
                )}
              </div>
            )}

            {/* Submit Button */}
            {!showPasswordlessLogin && (
              <Button
                onClick={handleSubmit}
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            )}

            {/* Passwordless Login Toggle */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">or</span>
              </div>
            </div>

            {/* Request OTP Button */}
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                if (showPasswordlessLogin) {
                  handleRequestOTP();
                } else {
                  setShowPasswordlessLogin(true);
                }
              }}
              className="w-full"
              disabled={isRequestingOTP}
            >
              {isRequestingOTP ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                  Sending OTP...
                </>
              ) : showPasswordlessLogin ? (
                '📧 Send Verification Code'
              ) : (
                '🔐 Sign in without password'
              )}
            </Button>

            {/* Back to password login */}
            {showPasswordlessLogin && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowPasswordlessLogin(false)}
                className="w-full text-sm"
              >
                Back to password login
              </Button>
            )}
          </form>

          {/* Additional Links */}
          <div className="space-y-4 text-center">
            <div className="text-sm">
              <Link
                to="/forgot-password"
                className="text-primary hover:text-primary/80 font-medium"
              >
                Forgot your password?
              </Link>
            </div>

            <div className="text-sm text-muted-foreground">
              New to SGSGita Alumni? Contact an administrator for an invitation.
            </div>
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

export default LoginPage;
