import React, { useState } from 'react';
import { X, AlertCircle, CheckCircle, XCircle, Info } from 'lucide-react';
import type { FamilyMember } from '../../services/familyMemberService';
import { SignatureCapture } from './SignatureCapture';
import { ConsentTermsCheckbox } from './ConsentTermsCheckbox';

interface ConsentData {
  digitalSignature: string | null;
  termsAccepted: boolean;
  termsVersion: string;
}

interface ConsentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  member: FamilyMember;
  action: 'grant' | 'revoke';
  onConfirm: (memberId: string, consentData?: ConsentData, reason?: string) => Promise<void>;
}

export const ConsentDialog: React.FC<ConsentDialogProps> = ({
  isOpen,
  onClose,
  member,
  action,
  onConfirm,
}) => {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Digital signature and terms state (for grant action)
  const [digitalSignature, setDigitalSignature] = useState<string | null>(null);
  const [termsAccepted, setTermsAccepted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation for grant action
    if (action === 'grant') {
      if (!digitalSignature) {
        setError('Please provide your digital signature');
        return;
      }
      if (!termsAccepted) {
        setError('Please accept the terms and conditions');
        return;
      }
    }

    // Validation for revoke action
    if (action === 'revoke' && !reason.trim()) {
      setError('Please provide a reason for revoking consent');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      if (action === 'grant') {
        // Pass consent data for grant action
        const consentData: ConsentData = {
          digitalSignature,
          termsAccepted,
          termsVersion: '1.0'
        };
        await onConfirm(member.id, consentData);
      } else {
        // Pass reason for revoke action
        await onConfirm(member.id, undefined, reason.trim());
      }

      onClose();
      setReason('');
      setDigitalSignature(null);
      setTermsAccepted(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setReason('');
      setError(null);
      setDigitalSignature(null);
      setTermsAccepted(false);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-xl font-semibold text-foreground">
            {action === 'grant' ? 'Grant Parent Consent' : 'Revoke Parent Consent'}
          </h2>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
            title="Close"
            aria-label="Close dialog"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Content */}
          <div className="p-6 space-y-4">
            {/* Member Info */}
            <div className="bg-muted rounded-lg p-4 border border-border">
              <div className="flex items-center gap-3">
                {member.profile_image_url ? (
                  <img
                    src={member.profile_image_url}
                    alt={member.display_name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                    <span className="text-primary-foreground text-lg font-bold">
                      {member.first_name.charAt(0).toUpperCase()}
                      {member.last_name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <div>
                  <p className="font-semibold text-foreground">{member.display_name}</p>
                  <p className="text-sm text-muted-foreground">
                    Age: {member.current_age} • {member.relationship}
                  </p>
                </div>
              </div>
            </div>

            {/* Current Status */}
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Current Status:</span>
              {member.parent_consent_given ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-accent/10 text-accent rounded-full font-medium">
                  <CheckCircle className="w-4 h-4" />
                  Consent Given
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-destructive/10 text-destructive rounded-full font-medium">
                  <AlertCircle className="w-4 h-4" />
                  Consent Required
                </span>
              )}
            </div>

            {/* Action Message */}
            <div className={`rounded-lg p-4 border ${
              action === 'grant' 
                ? 'bg-accent/10 border-accent/20' 
                : 'bg-destructive/10 border-destructive/20'
            }`}>
              <div className="flex items-start gap-3">
                {action === 'grant' ? (
                  <CheckCircle className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-grow">
                  <p className={`font-semibold mb-1 ${
                    action === 'grant' ? 'text-accent-foreground' : 'text-destructive-foreground'
                  }`}>
                    {action === 'grant' 
                      ? 'Allow supervised access' 
                      : 'Remove supervised access'}
                  </p>
                  <p className={`text-sm ${
                    action === 'grant' ? 'text-accent-foreground/80' : 'text-destructive-foreground/80'
                  }`}>
                    {action === 'grant'
                      ? `${member.display_name} will be able to access the platform with parental supervision.`
                      : `${member.display_name} will no longer be able to access the platform.`}
                  </p>
                </div>
              </div>
            </div>

            {/* COPPA Compliance Notice */}
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div className="text-sm text-primary-foreground">
                  <p className="font-semibold mb-1">COPPA Compliance</p>
                  <ul className="space-y-1 text-primary-foreground/80">
                    {action === 'grant' ? (
                      <>
                        <li>• As a parent/guardian, you consent to supervised access</li>
                        <li>• You understand the platform features your child will access</li>
                        <li>• Consent must be renewed annually</li>
                        <li>• You can revoke consent at any time</li>
                      </>
                    ) : (
                      <>
                        <li>• Access will be immediately suspended</li>
                        <li>• Active sessions will be terminated</li>
                        <li>• You can re-grant consent at any time</li>
                      </>
                    )}
                  </ul>
                </div>
              </div>
            </div>

            {/* Signature and Terms for Grant Action */}
            {action === 'grant' && (
              <>
                <ConsentTermsCheckbox
                  onTermsAcceptanceChange={setTermsAccepted}
                  required={true}
                />
                <SignatureCapture
                  onSignatureChange={setDigitalSignature}
                  required={true}
                />
              </>
            )}

            {/* Reason Input for Revoke */}
            {action === 'revoke' && (
              <div>
                <label htmlFor="reason" className="block text-sm font-medium text-foreground mb-2">
                  Reason for Revoking Consent <span className="text-destructive">*</span>
                </label>
                <textarea
                  id="reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground"
                  placeholder="Please explain why you're revoking consent..."
                  disabled={isSubmitting}
                  required
                />
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 flex items-center gap-2 text-destructive">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-4 border-t border-border bg-muted">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-foreground bg-card border border-border rounded-lg hover:bg-muted transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 ${
                action === 'grant'
                  ? 'bg-accent text-accent-foreground hover:bg-accent/90'
                  : 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
              }`}
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Processing...
                </span>
              ) : (
                action === 'grant' ? 'Grant Consent' : 'Revoke Consent'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
