import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card } from '../components/ui/card';
import { APIService } from '../services/APIService';

// ============================================================================
// PASSWORD RESET PAGE COMPONENT
// ============================================================================

export function ResetPasswordPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  // Form state
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResetting, setIsResetting] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // ============================================================================
  // TOKEN VALIDATION
  // ============================================================================

  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setError('Invalid password reset link. Missing token.');
        setIsResetting(false);
        return;
      }

      try {
        // Verify the reset token is valid
        const response = await APIService.validatePasswordResetToken(token);
        if (!response.valid) {
          setError('This password reset link has expired or is invalid. Please request a new one.');
        }
        setIsResetting(false);
      } catch (err) {
        console.error('Token validation failed:', err);
        setError('This password reset link has expired or is invalid. Please request a new one.');
        setIsResetting(false);
      }
    };

    validateToken();
  }, [token]);

  // ============================================================================
  // PASSWORD VALIDATION
  // ============================================================================

  const validatePassword = (pwd: string): string | null => {
    if (!pwd) {
      return 'Password is required';
    }
    if (pwd.length < 8) {
      return 'Password must be at least 8 characters long';
    }
    if (pwd.length > 128) {
      return 'Password must not exceed 128 characters';
    }
    // Check for at least one uppercase, one lowercase, one number, one special character
    if (!/[A-Z]/.test(pwd)) {
      return 'Password must contain at least one uppercase letter';
    }
    if (!/[a-z]/.test(pwd)) {
      return 'Password must contain at least one lowercase letter';
    }
    if (!/[0-9]/.test(pwd)) {
      return 'Password must contain at least one number';
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd)) {
      return 'Password must contain at least one special character (!@#$%^&* etc.)';
    }
    return null;
  };

  // ============================================================================
  // FORM HANDLERS
  // ============================================================================

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear previous errors
    setError('');
    setFormErrors({});
    
    const errors: Record<string, string> = {};

    // Validate password
    const passwordError = validatePassword(password);
    if (passwordError) {
      errors.password = passwordError;
    }

    // Validate confirmation
    if (!confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    // If there are errors, display them
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsSubmitting(true);

    try {
      if (!token) {
        throw new Error('Missing reset token');
      }

      // Call the API to reset password
      await APIService.resetPassword(token, password);
      
      setIsSuccess(true);

      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (resetError) {
      console.error('Password reset failed:', resetError);
      
      if (resetError instanceof Error) {
        if (resetError.message.includes('expired') || resetError.message.includes('invalid')) {
          setError('This password reset link has expired. Please request a new one.');
        } else if (resetError.message.includes('already used')) {
          setError('This password reset link has already been used. Please request a new one.');
        } else {
          setError(resetError.message || 'Failed to reset password. Please try again.');
        }
      } else {
        setError('Failed to reset password. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // ============================================================================
  // LOADING STATE
  // ============================================================================

  if (isResetting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-sm text-muted-foreground">Validating reset link...</p>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // ERROR STATE - INVALID TOKEN
  // ============================================================================

  if (error && isResetting === false && !isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8">
          {/* Header */}
          <div className="text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Link Expired or Invalid
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              This password reset link is no longer valid
            </p>
          </div>

          {/* Message */}
          <Card className="p-6 space-y-4">
            <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-md text-sm">
              {error}
            </div>

            <p className="text-sm text-muted-foreground text-center">
              Links expire after 1 hour for security reasons. Please request a new password reset.
            </p>

            <Button asChild className="w-full">
              <Link to="/forgot-password">
                Request New Reset Link
              </Link>
            </Button>

            <div className="text-center">
              <Link
                to="/login"
                className="text-sm text-primary hover:text-primary/80 font-medium"
              >
                Back to Sign In
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

  // ============================================================================
  // SUCCESS STATE
  // ============================================================================

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8">
          {/* Header */}
          <div className="text-center">
            <div className="text-6xl mb-4">✅</div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Password Reset Successful
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Your password has been successfully reset
            </p>
          </div>

          {/* Instructions */}
          <Card className="p-6 space-y-4">
            <div className="text-center space-y-4">
              <p className="text-sm text-muted-foreground">
                You can now sign in with your new password. You will be redirected to the login page in a few moments.
              </p>
            </div>

            <Button asChild className="w-full">
              <Link to="/login">
                Go to Sign In
              </Link>
            </Button>
          </Card>

          {/* Footer */}
          <div className="text-center text-xs text-muted-foreground">
            <p>© 2024 SGSGita Alumni Network. All rights reserved.</p>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // RENDER RESET PASSWORD FORM
  // ============================================================================

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Reset Your Password
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Enter a new password for your account
          </p>
        </div>

        {/* Reset Form */}
        <Card className="p-6 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* General Error Message */}
            {error && (
              <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}

            {/* Password Field */}
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-foreground">
                New Password
              </label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={formErrors.password ? 'border-destructive' : ''}
                placeholder="Enter new password"
              />
              {formErrors.password && (
                <p className="text-sm text-destructive">{formErrors.password}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Password must contain: uppercase, lowercase, number, and special character
              </p>
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="text-sm font-medium text-foreground">
                Confirm Password
              </label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={formErrors.confirmPassword ? 'border-destructive' : ''}
                placeholder="Confirm your password"
              />
              {formErrors.confirmPassword && (
                <p className="text-sm text-destructive">{formErrors.confirmPassword}</p>
              )}
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
                  Resetting Password...
                </>
              ) : (
                'Reset Password'
              )}
            </Button>
          </form>

          {/* Additional Links */}
          <div className="space-y-4 text-center">
            <div className="text-sm text-muted-foreground">
              <Link
                to="/login"
                className="text-primary hover:text-primary/80 font-medium"
              >
                Back to Sign In
              </Link>
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

export default ResetPasswordPage;
