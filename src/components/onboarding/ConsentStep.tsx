import { useState } from 'react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { Checkbox } from '../ui/checkbox';
import { Label } from '../ui/label';
import { LoadingSpinner } from '../ui/loading-spinner';
import { APIService } from '../../services/APIService';
import type { UserProfile } from '../../types/accounts';

interface Props {
  profiles: UserProfile[];
  onComplete: () => void;
}

export function ConsentStep({ profiles, onComplete }: Props) {
  const [consented, setConsented] = useState<Set<string>>(new Set());
  const [acknowledged, setAcknowledged] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const handleConsent = async (profileId: string) => {
    if (!acknowledged) {
      setError('Please read and acknowledge the terms below before granting consent.');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      await APIService.grantConsent(profileId);
      setConsented(prev => new Set(prev).add(profileId));
    } catch (err: any) {
      setError(err?.message || 'Failed to grant consent. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const allConsented = profiles.every(p => consented.has(p.id));
  
  const handleComplete = () => {
    if (!allConsented) {
      setError('Please grant consent for all child profiles before continuing.');
      return;
    }
    onComplete();
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Parental Consent Required</h3>
        <p className="text-sm text-muted-foreground">
          The following profiles belong to minors (ages 14-17) and require your
          parental consent to access the platform.
        </p>
      </div>
      
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <div className="space-y-4">
        {profiles.map(p => (
          <Card key={p.id} className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h4 className="font-semibold">
                  {p.firstName} {p.lastName}
                </h4>
                <p className="text-sm text-muted-foreground">
                  Age: {p.yearOfBirth ? new Date().getFullYear() - p.yearOfBirth : 'Unknown'} years
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Batch {p.batch} • {p.centerName}
                </p>
              </div>
              
              <div>
                {consented.has(p.id) ? (
                  <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span className="font-medium">Consent Granted</span>
                  </div>
                ) : (
                  <Button
                    onClick={() => handleConsent(p.id)}
                    disabled={loading || !acknowledged}
                    variant="outline"
                  >
                    {loading ? (
                      <LoadingSpinner size="sm" />
                    ) : (
                      'Grant Consent'
                    )}
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
      
      <Card className="p-6 bg-muted/50">
        <div className="space-y-4">
          <h4 className="font-semibold">Parental Consent Agreement</h4>
          
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>
              By granting consent, you confirm that:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>You are the parent or legal guardian of this child</li>
              <li>You authorize them to access the SGS Gita Alumni platform</li>
              <li>Their access will be supervised with age-appropriate restrictions</li>
              <li>You understand they will not have full platform access until age 18</li>
              <li>You can revoke consent at any time from account settings</li>
            </ul>
            <p className="mt-4 font-medium">
              Important: Consent will expire after 1 year and will need to be renewed
              to maintain platform access.
            </p>
          </div>
          
          <div className="flex items-center space-x-2 pt-4">
            <Checkbox
              id="acknowledge"
              checked={acknowledged}
              onCheckedChange={(checked) => setAcknowledged(checked === true)}
            />
            <Label
              htmlFor="acknowledge"
              className="text-sm font-normal cursor-pointer"
            >
              I have read and understood the parental consent agreement
            </Label>
          </div>
        </div>
      </Card>
      
      <div className="flex justify-end">
        <Button 
          onClick={handleComplete}
          disabled={!allConsented}
          size="lg"
        >
          Complete Setup
        </Button>
      </div>
    </div>
  );
}
