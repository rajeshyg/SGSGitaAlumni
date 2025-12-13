// ============================================================================
// OTP VERIFICATION PAGE IMPLEMENTATION
// ============================================================================
// Secure OTP verification with resend functionality and rate limiting

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Alert, AlertDescription } from '../components/ui/alert';
import { OTPService } from '../services/OTPService';
import { TOTPService } from '../lib/auth/TOTPService';
import { useAuth } from '../contexts/AuthContext';
import {
  OTPType,
  OTPError
} from '../types/invitation';

interface OTPVerificationPageProps {}

interface LocationState {
  email?: string;
  otpType?: OTPType;
  redirectTo?: string;
  message?: string;
  verificationMethod?: 'email' | 'sms' | 'totp';
  totpSecret?: string;
  phoneNumber?: string;
  user?: any; // User data from registration
}

export const OTPVerificationPage: React.FC<OTPVerificationPageProps> = () => {
  const { email: urlEmail } = useParams<{ email: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState;
  const { login, isAuthenticated, user } = useAuth(); // Get auth state
  
  // Services
  const otpService = new OTPService();
  const totpService = new TOTPService();

  // State management
  const [email] = useState<string>(urlEmail || state?.email || '');
  const [otpType] = useState<OTPType>(state?.otpType || 'login');
  const [verificationMethod, setVerificationMethod] = useState<'email' | 'sms' | 'totp'>(
    state?.verificationMethod || 'email'
  );
  const [totpSecret] = useState<string>(state?.totpSecret || '');
  const [otpCode, setOtpCode] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [remainingAttempts, setRemainingAttempts] = useState<number>(3);
  const [resendCooldown, setResendCooldown] = useState<number>(0);
  
  // Refs for OTP input focus management
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  
  // ============================================================================
  // EFFECTS
  // ============================================================================

  // Redirect if already authenticated (e.g., user refreshes page after login)
  useEffect(() => {
    if (isAuthenticated && user) {
      console.log('[OTPVerificationPage] User already authenticated, checking profile status...');
      const hasActiveProfile = !!(user.activeProfileId || user.profileId);
      const redirectTo = hasActiveProfile ? '/dashboard' : '/onboarding';
      console.log('[OTPVerificationPage] Redirecting to:', redirectTo);
      navigate(redirectTo, { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  useEffect(() => {
    if (!email) {
      setError('No email provided for OTP verification');
      return;
    }

    // Load remaining attempts
    loadRemainingAttempts();
    
    // Focus first OTP input
    if (otpInputRefs.current[0]) {
      otpInputRefs.current[0].focus();
    }
  }, [email]);

  useEffect(() => {
    // Handle resend cooldown
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown(resendCooldown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // ============================================================================
  // DATA LOADING
  // ============================================================================

  const loadRemainingAttempts = async () => {
    try {
      const attempts = await otpService.getRemainingOTPAttempts(email);
      setRemainingAttempts(attempts);

      // Don't show error on page load - only show it after failed validation attempts
      // The validation response will set the error if attempts are exhausted
    } catch (err) {
      // Default to 3 attempts if we can't load
      setRemainingAttempts(3);
    }
  };

  // ============================================================================
  // OTP INPUT HANDLING
  // ============================================================================

  const handleOTPInputChange = (index: number, value: string) => {
    // Only allow digits
    const digit = value.replace(/\D/g, '').slice(-1);
    
    // Update OTP code
    const newOtpCode = otpCode.split('');
    newOtpCode[index] = digit;
    const updatedCode = newOtpCode.join('').slice(0, 6);
    setOtpCode(updatedCode);
    
    // Auto-focus next input
    if (digit && index < 5 && otpInputRefs.current[index + 1]) {
      otpInputRefs.current[index + 1]?.focus();
    }
    
    // Auto-submit when 6 digits entered
    if (updatedCode.length === 6) {
      handleOTPSubmit(updatedCode);
    }
  };

  const handleOTPInputKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otpCode[index] && index > 0) {
      // Focus previous input on backspace
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleOTPInputPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    setOtpCode(pastedData);
    
    if (pastedData.length === 6) {
      handleOTPSubmit(pastedData);
    }
  };

  // ============================================================================
  // OTP VERIFICATION
  // ============================================================================

  const handleOTPSubmit = async (codeToVerify?: string) => {
    const code = codeToVerify || otpCode;

    if (code.length !== 6) {
      setError('Please enter a complete 6-digit OTP code');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      let isValid = false;

      // Handle different verification methods
      switch (verificationMethod) {
        case 'email':
        case 'sms':
          const otpValidation = await otpService.validateOTP({
            email,
            otpCode: code,
            type: otpType
          });
          isValid = otpValidation.isValid;

          if (!isValid) {
            setError(otpValidation.errors.join(', '));
            setRemainingAttempts(otpValidation.remainingAttempts);

            if (otpValidation.remainingAttempts === 0) {
              setError('Maximum attempts exceeded. Please request a new OTP.');
            }
          }
          break;

        case 'totp':
          if (!totpSecret) {
            setError('TOTP secret not available. Please try email verification.');
            return;
          }

          const totpValidation = totpService.verifyTOTP(code, totpSecret);
          isValid = totpValidation.isValid;

          if (!isValid) {
            setError('Invalid TOTP code. Please try again.');
            setRemainingAttempts(prev => Math.max(0, prev - 1));

            if (remainingAttempts <= 1) {
              setError('Maximum attempts exceeded. Please request a new OTP.');
            }
          }
          break;

        default:
          setError('Unsupported verification method');
          return;
      }

      if (isValid) {
        setSuccess('OTP verified successfully! Authenticating...');

        // Handle authentication after successful OTP verification
        if (otpType === 'registration') {
          // For registration flow: authenticate the user
          try {
            // If we have user credentials from state, use them for automatic login
            if (state?.user) {
              // Create session for the newly registered user using OTP-verified login
              await login({
                email: email,
                password: '', // OTP verification serves as authentication
                otpVerified: true
              });
            }

            // Redirect to dashboard
            navigate('/dashboard', {
              replace: true,
              state: {
                message: 'Welcome to SGS Gita Alumni Network!',
                user: state?.user
              }
            });

          } catch (authError) {
            // If auto-login fails, redirect to login page
            navigate('/login', {
              replace: true,
              state: {
                message: 'Verification successful! Please log in with your credentials.',
                email: email
              }
            });
          }
        } else if (otpType === 'login') {
          // For login flow: authenticate the user
          try {
            console.log('[OTPVerificationPage] 🔐 Starting login authentication...');
            
            // OTP verification serves as authentication for passwordless login
            // Use the login function from useAuth hook to update auth context
            const loginResult = await login({
              email: email,
              password: '', // OTP verification serves as authentication
              otpVerified: true
            });

            console.log('[OTPVerificationPage] ✅ Login successful, checking profile status...');
            console.log('[OTPVerificationPage] Login result user:', loginResult.user);
            
            // Check if user has an active profile
            const hasActiveProfile = !!(loginResult.user.activeProfileId || loginResult.user.profileId);
            console.log('[OTPVerificationPage] Has active profile:', hasActiveProfile);
            
            const redirectTo = !hasActiveProfile ? '/onboarding' : (state?.redirectTo || '/dashboard');
            console.log('[OTPVerificationPage] 🎯 Redirecting to:', redirectTo);

            navigate(redirectTo, {
              replace: true,
              state: {
                message: 'Login successful!',
                fromOTPLogin: true
              }
            });

          } catch (authError) {
            console.error('[OTPVerificationPage] ❌ Authentication failed:', authError);
            setError('Authentication failed. Please try again or contact support.');
          }
        } else {
          // For other OTP types (password_reset, etc.), just redirect
          const redirectTo = state?.redirectTo || '/dashboard';
          navigate(redirectTo, {
            replace: true,
            state: {
              message: 'Verification successful!',
              email: email,
              otpType: otpType
            }
          });
        }
      }

    } catch (err) {
      if (err instanceof OTPError) {
        setError(err.message);
      } else {
        setError('OTP verification failed. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // ============================================================================
  // OTP RESEND
  // ============================================================================

  const handleResendOTP = async () => {
    try {
      setIsResending(true);
      setError(null);

      await otpService.generateOTP({
        email,
        type: otpType
      });

      setSuccess('New OTP sent to your email');
      setResendCooldown(60); // 60 second cooldown
      setOtpCode(''); // Clear current OTP

      // Focus first input
      if (otpInputRefs.current[0]) {
        otpInputRefs.current[0].focus();
      }

    } catch (err) {
      if (err instanceof OTPError) {
        setError(err.message);
      } else {
        setError('Failed to resend OTP. Please try again.');
      }
    } finally {
      setIsResending(false);
    }
  };

  // ============================================================================
  // RENDER HELPERS
  // ============================================================================

  const renderOTPInputs = () => (
    <div className="flex justify-center space-x-2 mb-6">
      {[0, 1, 2, 3, 4, 5].map((index) => (
        <Input
          key={index}
          ref={(el) => (otpInputRefs.current[index] = el)}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={otpCode[index] || ''}
          onChange={(e) => handleOTPInputChange(index, e.target.value)}
          onKeyDown={(e) => handleOTPInputKeyDown(index, e)}
          onPaste={index === 0 ? handleOTPInputPaste : undefined}
          className="w-12 h-12 text-center text-lg font-semibold border-2 focus:border-primary"
          disabled={isSubmitting}
        />
      ))}
    </div>
  );

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  if (!email) {
    return (
      <div className="min-h-screen bg-[--muted] flex items-center justify-center p-4">
        <Card className="w-full max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>Invalid OTP verification request</CardDescription>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertDescription>
                No email provided for OTP verification. Please try again.
              </AlertDescription>
            </Alert>
            <Button 
              onClick={() => navigate('/login')} 
              className="w-full mt-4"
            >
              Return to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[--muted] flex items-center justify-center p-4">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Verify OTP</CardTitle>
          <CardDescription>
            {verificationMethod === 'email' && `Enter the 6-digit code sent to ${email}`}
            {verificationMethod === 'sms' && `Enter the 6-digit code sent to your phone`}
            {verificationMethod === 'totp' && `Enter the 6-digit code from your authenticator app`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Status Messages */}
          {error && (
            <Alert className="mb-4">
              <AlertDescription className="text-destructive">{error}</AlertDescription>
            </Alert>
          )}
          
          {success && (
            <Alert className="mb-4">
              <AlertDescription className="text-[--success]">{success}</AlertDescription>
            </Alert>
          )}

          {/* Verification Method Selector */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-[--muted-foreground] mb-2">
              Verification Method
            </label>
            <div className="flex space-x-2">
              <Button
                type="button"
                variant={verificationMethod === 'email' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setVerificationMethod('email')}
                disabled={isSubmitting}
              >
                Email
              </Button>
              <Button
                type="button"
                variant={verificationMethod === 'sms' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setVerificationMethod('sms')}
                disabled={isSubmitting || !state?.phoneNumber}
              >
                SMS
              </Button>
              <Button
                type="button"
                variant={verificationMethod === 'totp' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setVerificationMethod('totp')}
                disabled={isSubmitting || !totpSecret}
              >
                Authenticator
              </Button>
            </div>
          </div>

          {/* OTP Input */}
          {renderOTPInputs()}

          {/* Remaining Attempts */}
          {remainingAttempts > 0 && remainingAttempts < 3 && (
            <p className="text-sm text-muted-foreground text-center mb-4">
              {remainingAttempts} attempt{remainingAttempts !== 1 ? 's' : ''} remaining
            </p>
          )}

          {/* Submit Button */}
          <Button
            onClick={() => handleOTPSubmit()}
            className="w-full mb-4"
            disabled={isSubmitting || otpCode.length !== 6}
          >
            {isSubmitting ? 'Verifying...' : 'Verify OTP'}
          </Button>

          {/* Resend OTP */}
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-2">
              Didn't receive the code?
            </p>
            <Button
              variant="outline"
              onClick={handleResendOTP}
              disabled={isResending || resendCooldown > 0}
              className="w-full"
            >
              {isResending 
                ? 'Sending...' 
                : resendCooldown > 0 
                  ? `Resend in ${resendCooldown}s`
                  : 'Resend OTP'
              }
            </Button>
          </div>

          {/* Help Link */}
          <div className="text-center mt-4">
            <Button
              variant="ghost"
              onClick={() => navigate('/login')}
              className="text-sm"
            >
              Back to Login
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OTPVerificationPage;
