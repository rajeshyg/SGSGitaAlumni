import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card } from '../components/ui/card';
import { APIService } from '../services/APIService';

// ============================================================================
// FORGOT PASSWORD PAGE COMPONENT
// ============================================================================

export function ForgotPasswordPage() {
  // Form state
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');

  // ============================================================================
  // FORM VALIDATION
  // ============================================================================

  const validateEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  // ============================================================================
  // FORM HANDLERS
  // ============================================================================

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      setError('Email is required');
      return;
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsSubmitting(true);
    setError('');
    
    try {
      // Call the password reset API
      await APIService.requestPasswordReset(email);
      
      setIsSubmitted(true);
    } catch (resetError) {
      const errorMessage = resetError instanceof Error ? resetError.message : 'Failed to send reset email. Please try again.';
      setError(errorMessage);
      // eslint-disable-next-line no-console
      console.error('Password reset failed:', resetError);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ============================================================================
  // SUCCESS STATE
  // ============================================================================

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8">
          {/* Header */}
          <div className="text-center">
            <div className="text-6xl mb-4">📧</div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Check Your Email
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              We've sent a password reset link to your email address
            </p>
          </div>

          {/* Instructions */}
          <Card className="p-6 space-y-4">
            <div className="text-center space-y-4">
              <p className="text-sm text-muted-foreground">
                We've sent a password reset link to:
              </p>
              <p className="font-medium text-foreground">{email}</p>
              <p className="text-sm text-muted-foreground">
                Click the link in the email to reset your password. If you don't see the email, 
                check your spam folder.
              </p>
            </div>

            <div className="space-y-4">
              <Button
                onClick={() => {
                  setIsSubmitted(false);
                  setEmail('');
                }}
                variant="outline"
                className="w-full"
              >
                Try Different Email
              </Button>
              
              <div className="text-center">
                <Link
                  to="/login"
                  className="text-sm text-primary hover:text-primary/80 font-medium"
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

  // ============================================================================
  // RENDER FORGOT PASSWORD FORM
  // ============================================================================

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Forgot Password?
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Enter your email address and we'll send you a link to reset your password
          </p>
        </div>

        {/* Reset Form */}
        <Card className="p-6 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Error Message */}
            {error && (
              <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-md text-sm">
                {error}
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
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={error ? 'border-destructive' : ''}
                placeholder="Enter your email address"
              />
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
                  Sending Reset Link...
                </>
              ) : (
                'Send Reset Link'
              )}
            </Button>
          </form>

          {/* Additional Links */}
          <div className="space-y-4 text-center">
            <div className="text-sm text-muted-foreground">
              Remember your password?{' '}
              <Link
                to="/login"
                className="text-primary hover:text-primary/80 font-medium"
              >
                Sign in here
              </Link>
            </div>
            
            <div className="text-sm text-muted-foreground">
              Don't have an account?{' '}
              <Link
                to="/register"
                className="text-primary hover:text-primary/80 font-medium"
              >
                Sign up here
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

export default ForgotPasswordPage;
