import { useState } from 'react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Label } from '../ui/label';
import { Alert, AlertDescription } from '../ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { LoadingSpinner } from '../ui/loading-spinner';
import { APIService } from '../../services/APIService';
import type { AlumniMatch, ProfileSelection } from '../../types/onboarding';

interface Props {
  profiles: AlumniMatch[];
  selections: ProfileSelection[];
  onComplete: (updatedSelections: ProfileSelection[]) => void;
}

export function YOBCollector({ profiles, selections, onComplete }: Props) {
  const [yobValues, setYobValues] = useState<Map<number, number>>(new Map());
  const [errors, setErrors] = useState<Map<number, string>>(new Map());
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  
  const currentYear = new Date().getFullYear();
  const minYear = 1950;
  const maxYear = currentYear;
  
  const handleYobChange = (alumniId: number, value: string) => {
    const year = parseInt(value);
    const newYob = new Map(yobValues);
    const newErrors = new Map(errors);
    
    if (isNaN(year)) {
      newYob.delete(alumniId);
    } else if (year < minYear || year > maxYear) {
      newErrors.set(alumniId, `Year must be between ${minYear} and ${maxYear}`);
      newYob.set(alumniId, year);
    } else {
      newErrors.delete(alumniId);
      newYob.set(alumniId, year);
    }
    
    setYobValues(newYob);
    setErrors(newErrors);
    setSubmitError(null);
  };
  
  const handleSubmit = async () => {
    // Validate all profiles have YOB
    const missing = profiles.filter(p => !yobValues.has(p.id));
    if (missing.length > 0) {
      setSubmitError('Please enter year of birth for all profiles');
      return;
    }
    
    if (errors.size > 0) {
      setSubmitError('Please fix errors before continuing');
      return;
    }
    
    setLoading(true);
    setSubmitError(null);
    
    try {
      // Submit YOB for each profile
      for (const [alumniId, yob] of yobValues) {
        await APIService.collectYob(alumniId, yob);
      }
      
      // Update selections with YOB
      const updatedSelections = selections.map(s => ({
        ...s,
        yearOfBirth: yobValues.get(s.alumniMemberId)
      }));
      
      onComplete(updatedSelections);
    } catch (err: any) {
      setSubmitError(err?.message || 'Failed to save year of birth. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Verify Age</h3>
        <p className="text-sm text-muted-foreground">
          We need to verify age for COPPA compliance. Please enter the year of birth for each profile.
        </p>
      </div>
      
      {submitError && (
        <Alert variant="destructive">
          <AlertDescription>{submitError}</AlertDescription>
        </Alert>
      )}
      
      <div className="space-y-4">
        {profiles.map(p => (
          <Card key={p.id} className="p-4">
            <div className="space-y-3">
              <div>
                <h4 className="font-semibold">
                  {p.firstName} {p.lastName}
                </h4>
                <p className="text-sm text-muted-foreground">
                  Batch {p.batch} • {p.centerName}
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor={`yob-${p.id}`}>Year of Birth</Label>
                <Select
                  value={yobValues.get(p.id)?.toString() || ''}
                  onValueChange={(value) => handleYobChange(p.id, value)}
                >
                  <SelectTrigger id={`yob-${p.id}`}>
                    <SelectValue placeholder="Select year..." />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: maxYear - minYear + 1 }, (_, i) => maxYear - i).map(year => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                {errors.has(p.id) && (
                  <p className="text-sm text-destructive">{errors.get(p.id)}</p>
                )}
                
                {yobValues.has(p.id) && !errors.has(p.id) && (
                  <p className="text-sm text-muted-foreground">
                    Age: {currentYear - yobValues.get(p.id)!} years
                  </p>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
      
      <div className="flex justify-end">
        <Button 
          onClick={handleSubmit}
          disabled={loading || profiles.some(p => !yobValues.has(p.id))}
          size="lg"
        >
          {loading ? (
            <>
              <LoadingSpinner size="sm" className="mr-2" />
              Saving...
            </>
          ) : (
            'Continue'
          )}
        </Button>
      </div>
    </div>
  );
}
