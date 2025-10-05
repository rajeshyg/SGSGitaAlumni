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
import { 
  OTPValidation, 
  OTPType,
  OTPError 
} from '../types/invitation';

interface OTPVerificationPageProps {
  // No props needed - uses URL params and location state
}

interface LocationState {
  email?: string;
  otpType?: OTPType;
  redirectTo?: string;
  message?: string;
}

export const OTPVerificationPage: React.FC<OTPVerificationPageProps> = () => {
  const { email: urlEmail } = useParams<{ email: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState;
  
  // Services
  const otpService = new OTPService();
  
  // State management
  const [email] = useState<string>(urlEmail || state?.email || '');
  const [otpType] = useState<OTPType>(state?.otpType || 'login');
  const [otpCode, setOtpCode] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [remainingAttempts, setRemainingAttempts] = useState<number>(3);
  const [resendCooldown, setResendCooldown] = useState<number>(0);
  const [validation, setValidation] = useState<OTPValidation | null>(null);
  
  // Refs for OTP input focus management
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  
  // ============================================================================
  // EFFECTS
  // ============================================================================

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

      const otpValidation = await otpService.validateOTP({
        email,
        otpCode: code,
        type: otpType
      });

      setValidation(otpValidation);

      if (otpValidation.isValid) {
        setSuccess('OTP verified successfully! Redirecting...');
        
        // Redirect based on OTP type and state
        setTimeout(() => {
          if (state?.redirectTo) {
            navigate(state.redirectTo);
          } else if (otpType === 'login') {
            navigate('/dashboard');
          } else if (otpType === 'registration') {
            navigate('/profile-setup');
          } else {
            navigate('/dashboard');
          }
        }, 2000);
      } else {
        setError(otpValidation.errors.join(', '));
        setRemainingAttempts(otpValidation.remainingAttempts);
        
        if (otpValidation.remainingAttempts === 0) {
          setError('Maximum attempts exceeded. Please request a new OTP.');
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

      await otpService.sendOTP(email, '', otpType);
      
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Verify OTP</CardTitle>
          <CardDescription>
            Enter the 6-digit code sent to {email}
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
              <AlertDescription className="text-green-600">{success}</AlertDescription>
            </Alert>
          )}

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
