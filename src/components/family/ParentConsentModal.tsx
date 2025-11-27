import React, { useState } from 'react';
import { X, CheckCircle } from 'lucide-react';
import { grantConsent, type FamilyMember } from '../../services/familyMemberService';

interface ParentConsentModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: FamilyMember | null;
  onConsentGranted?: (member: FamilyMember) => void;
}

/**
 * Parent Consent Modal for Supervised Access (Ages 14-17)
 *
 * COPPA Compliance: Collects parental consent for minors aged 14-17
 * to access the platform under supervision.
 *
 * Features:
 * - Shows child's information
 * - Consent checkboxes (terms, COPPA acknowledgment)
 * - Optional digital signature
 * - Creates audit trail in PARENT_CONSENT_RECORDS table
 */
const ParentConsentModal: React.FC<ParentConsentModalProps> = ({
  isOpen,
  onClose,
  member,
  onConsentGranted
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [consentData, setConsentData] = useState({
    termsAccepted: false,
    coppaAcknowledged: false,
    digitalSignature: ''
  });

  const handleCheckboxChange = (field: 'termsAccepted' | 'coppaAcknowledged') => {
    setConsentData(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handleSignatureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConsentData(prev => ({ ...prev, digitalSignature: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!member) return;

    // Validation
    if (!consentData.termsAccepted) {
      setError('You must accept the Terms of Service to grant consent');
      return;
    }

    if (!consentData.coppaAcknowledged) {
      setError('You must acknowledge COPPA requirements to grant consent');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Call backend API to grant consent
      const updatedMember = await grantConsent(member.id, {
        digitalSignature: consentData.digitalSignature || null,
        termsAccepted: consentData.termsAccepted,
        termsVersion: '1.0'
      });

      setSuccess(true);

      // Show success message briefly
      setTimeout(() => {
        if (onConsentGranted) {
          onConsentGranted(updatedMember);
        }
        onClose();

        // Reset state
        setSuccess(false);
        setConsentData({
          termsAccepted: false,
          coppaAcknowledged: false,
          digitalSignature: ''
        });
      }, 1500);

    } catch (err) {
      setError('Failed to grant consent. Please try again.');
      console.error('Error granting consent:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) return; // Prevent closing during submission
    setError(null);
    setSuccess(false);
    setConsentData({
      termsAccepted: false,
      coppaAcknowledged: false,
      digitalSignature: ''
    });
    onClose();
  };

  if (!isOpen || !member) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-[--foreground]">Parent Consent Required</h2>
          <button
            onClick={handleClose}
            disabled={loading}
            className="text-[--muted-foreground] hover:text-[--foreground] transition-colors disabled:opacity-50"
            title="Close"
            aria-label="Close modal"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Success State */}
        {success ? (
          <div className="p-8 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-[--foreground] mb-2">
              Consent Granted Successfully!
            </h3>
            <p className="text-[--muted-foreground]">
              {member.display_name} can now access the platform under supervision.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {error && (
              <div className="bg-[--destructive-bg] border border-[--destructive-border] text-[--destructive-foreground] px-4 py-3 rounded">
                {error}
              </div>
            )}

            {/* Member Info */}
            <div className="bg-[--info-bg] border border-[--info-border] rounded-lg p-4">
              <div className="flex items-center space-x-3">
                {member.profile_image_url ? (
                  <img
                    src={member.profile_image_url}
                    alt={member.display_name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-[--primary] flex items-center justify-center">
                    <span className="text-[--primary-foreground] text-lg font-bold">
                      {member.first_name.charAt(0)}{member.last_name.charAt(0)}
                    </span>
                  </div>
                )}
                <div>
                  <h3 className="font-semibold text-[--foreground]">{member.display_name}</h3>
                  <p className="text-sm text-[--muted-foreground]">
                    Age {member.current_age} • {member.relationship}
                  </p>
                </div>
              </div>
            </div>

            {/* Consent Information */}
            <div className="space-y-3">
              <p className="text-[--foreground]">
                This family member requires parental consent to access the platform with supervised access.
              </p>

              <div className="bg-[--muted] rounded-md p-4 space-y-2 text-sm">
                <p className="font-medium text-[--foreground]">By granting consent, you agree to:</p>
                <ul className="list-disc list-inside space-y-1 text-[--muted-foreground]">
                  <li>Allow supervised platform access for this minor (ages 14-17)</li>
                  <li>Monitor their activity and content interactions</li>
                  <li>Consent expires after 1 year and must be renewed</li>
                  <li>You can revoke consent at any time from Family Settings</li>
                </ul>
              </div>
            </div>

            {/* Consent Checkboxes */}
            <div className="space-y-3">
              <label className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={consentData.termsAccepted}
                  onChange={() => handleCheckboxChange('termsAccepted')}
                  className="mt-1 h-4 w-4 rounded border-[--border] text-[--primary] focus:ring-[--ring]"
                />
                <span className="text-sm text-[--foreground]">
                  I accept the <a href="/terms" target="_blank" className="text-[--primary] hover:underline">Terms of Service</a> (v1.0) on behalf of this minor
                </span>
              </label>

              <label className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={consentData.coppaAcknowledged}
                  onChange={() => handleCheckboxChange('coppaAcknowledged')}
                  className="mt-1 h-4 w-4 rounded border-[--border] text-[--primary] focus:ring-[--ring]"
                />
                <span className="text-sm text-[--foreground]">
                  I acknowledge COPPA compliance requirements and provide verifiable parental consent
                </span>
              </label>
            </div>

            {/* Digital Signature (Optional) */}
            <div>
              <label htmlFor="digitalSignature" className="block text-sm font-medium text-[--muted-foreground] mb-1">
                Digital Signature (Optional)
              </label>
              <input
                type="text"
                id="digitalSignature"
                value={consentData.digitalSignature}
                onChange={handleSignatureChange}
                placeholder="Type your full name"
                className="w-full px-3 py-2 border border-[--border] rounded-md focus:outline-none focus:ring-2 focus:ring-[--ring]"
              />
              <p className="text-xs text-[--muted-foreground] mt-1">
                Optional: Type your full name to digitally sign this consent
              </p>
            </div>

            {/* Legal Notice */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
              <p className="text-xs text-yellow-800">
                <strong>Legal Notice:</strong> This consent will be recorded with timestamp, IP address, and user agent for COPPA compliance audit trail.
              </p>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="px-4 py-2 border border-[--border] rounded-md text-[--muted-foreground] hover:bg-[--muted] transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !consentData.termsAccepted || !consentData.coppaAcknowledged}
                className="px-4 py-2 bg-[--primary] text-[--primary-foreground] rounded-md hover:bg-[--primary]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Granting Consent...' : 'Grant Consent'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ParentConsentModal;
