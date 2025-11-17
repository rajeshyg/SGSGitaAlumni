import React, { useState } from 'react';
import { FileText } from 'lucide-react';

interface ConsentTermsCheckboxProps {
  onTermsAcceptanceChange: (accepted: boolean) => void;
  required?: boolean;
}

export const ConsentTermsCheckbox: React.FC<ConsentTermsCheckboxProps> = ({
  onTermsAcceptanceChange,
  required = false
}) => {
  const [isAccepted, setIsAccepted] = useState(false);

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const accepted = e.target.checked;
    setIsAccepted(accepted);
    onTermsAcceptanceChange(accepted);
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-foreground">
        Terms and Conditions {required && <span className="text-destructive">*</span>}
      </label>

      {/* Scrollable Terms Container */}
      <div className="border-2 border-border rounded-lg bg-muted/30 max-h-48 overflow-y-auto p-4">
        <div className="space-y-3 text-sm text-foreground">
          <div className="flex items-start gap-2">
            <FileText className="w-4 h-4 mt-0.5 text-muted-foreground flex-shrink-0" />
            <div className="space-y-2">
              <h4 className="font-semibold">COPPA Parental Consent Agreement</h4>

              <p className="text-muted-foreground">
                By providing your digital signature and checking the box below, you confirm that:
              </p>

              <ul className="list-disc list-inside space-y-1.5 text-muted-foreground pl-2">
                <li>You are the parent or legal guardian of the child listed above</li>
                <li>You authorize your child (ages 14-17) to access the SGS Gita Alumni platform</li>
                <li>You understand that your child's personal information will be collected, used, and disclosed as described in our Privacy Policy</li>
                <li>You consent to your child creating and managing their profile, participating in community discussions, and accessing age-appropriate content</li>
                <li>This consent is valid for one year from the date of signature and may be revoked at any time</li>
                <li>You have read and agree to our Terms of Service and Privacy Policy</li>
              </ul>

              <p className="text-muted-foreground">
                <strong>Your Rights:</strong> You may review your child's information, request deletion, or revoke consent at any time through your account settings or by contacting support.
              </p>

              <p className="text-xs text-muted-foreground mt-2">
                Version 1.0 | Effective Date: {new Date().toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Acceptance Checkbox */}
      <div className="flex items-start gap-2.5">
        <input
          type="checkbox"
          id="consent-terms-checkbox"
          checked={isAccepted}
          onChange={handleCheckboxChange}
          className="mt-1 w-4 h-4 text-accent border-border rounded focus:ring-2 focus:ring-accent focus:ring-offset-0"
        />
        <label
          htmlFor="consent-terms-checkbox"
          className="text-sm text-foreground cursor-pointer select-none"
        >
          I have read and agree to the terms and conditions above, and I provide my verifiable parental consent as required by COPPA (Children's Online Privacy Protection Act).
        </label>
      </div>

      {/* Visual Feedback */}
      {isAccepted && (
        <div className="flex items-center gap-1.5 text-xs text-accent">
          <FileText className="w-3.5 h-3.5" />
          <span>Terms accepted</span>
        </div>
      )}
    </div>
  );
};
