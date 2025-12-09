import { useState } from 'react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Label } from '../ui/label';
import { Alert, AlertDescription } from '../ui/alert';
import type { AlumniMatch, ProfileSelection } from '../../types/onboarding';

interface Props {
  alumni: AlumniMatch[];
  onComplete: (selections: ProfileSelection[]) => void;
}

export function AlumniSelector({ alumni, onComplete }: Props) {
  const [selections, setSelections] = useState<Map<number, ProfileSelection>>(new Map());
  const [showError, setShowError] = useState(false);
  
  const toggleSelection = (alumniId: number, relationship: 'parent' | 'child') => {
    const newSelections = new Map(selections);
    
    if (newSelections.has(alumniId)) {
      // Update relationship or remove
      const existing = newSelections.get(alumniId)!;
      if (existing.relationship === relationship) {
        newSelections.delete(alumniId);
      } else {
        newSelections.set(alumniId, { ...existing, relationship });
      }
    } else {
      newSelections.set(alumniId, { alumniMemberId: alumniId, relationship });
    }
    
    setSelections(newSelections);
    setShowError(false);
  };
  
  const handleSubmit = () => {
    if (selections.size === 0) {
      setShowError(true);
      return;
    }
    onComplete(Array.from(selections.values()));
  };
  
  const getCoppaStatusColor = (status: string) => {
    switch (status) {
      case 'blocked': return 'destructive';
      case 'requires_consent': return 'secondary';
      case 'full_access': return 'default';
      default: return 'outline';
    }
  };
  
  const getCoppaStatusLabel = (status: string) => {
    switch (status) {
      case 'blocked': return 'Under 14 - Blocked';
      case 'requires_consent': return '14-17 - Needs Consent';
      case 'full_access': return '18+ - Full Access';
      default: return 'Age Unknown';
    }
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Select Your Profiles</h3>
        <p className="text-sm text-muted-foreground">
          Choose which alumni profiles belong to you or your children. You can claim multiple profiles.
        </p>
      </div>
      
      {showError && (
        <Alert variant="destructive">
          <AlertDescription>
            Please select at least one profile to continue.
          </AlertDescription>
        </Alert>
      )}
      
      <div className="space-y-4">
        {alumni.map(a => (
          <Card 
            key={a.id} 
            className={`p-4 transition-all ${
              selections.has(a.id) 
                ? 'border-primary ring-2 ring-primary ring-offset-2' 
                : 'hover:border-muted-foreground'
            } ${!a.canCreateProfile ? 'opacity-60' : ''}`}
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold">
                      {a.firstName} {a.lastName}
                    </h4>
                    {a.age !== null && (
                      <Badge variant={getCoppaStatusColor(a.coppaStatus)}>
                        {getCoppaStatusLabel(a.coppaStatus)}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Batch {a.batch} • {a.centerName}
                  </p>
                  {a.age !== null && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Age: {a.age} years
                    </p>
                  )}
                </div>
              </div>
              
              {a.canCreateProfile ? (
                <RadioGroup
                  value={selections.get(a.id)?.relationship || ''}
                  onValueChange={(value) => toggleSelection(a.id, value as 'parent' | 'child')}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="parent" id={`parent-${a.id}`} />
                    <Label 
                      htmlFor={`parent-${a.id}`}
                      className="cursor-pointer font-normal"
                    >
                      This is me
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="child" id={`child-${a.id}`} />
                    <Label 
                      htmlFor={`child-${a.id}`}
                      className="cursor-pointer font-normal"
                    >
                      This is my child
                    </Label>
                  </div>
                </RadioGroup>
              ) : (
                <Alert variant="destructive">
                  <AlertDescription className="text-sm">
                    Cannot create profile: User is under 14 years old
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </Card>
        ))}
      </div>
      
      <div className="flex justify-end">
        <Button 
          onClick={handleSubmit}
          disabled={selections.size === 0}
          size="lg"
        >
          Continue
        </Button>
      </div>
    </div>
  );
}
