/**
 * StepIndicator Component
 * 
 * Displays a progress bar with percentage and step circles for the multi-step wizard.
 * Shows checkmarks for completed steps and highlights the current step.
 * 
 * Features:
 * - Progress bar with animated percentage
 * - Step circles (1, 2, 3, 4) with completion indicators
 * - Checkmarks for completed steps
 * - Current step highlighting
 * - Mobile-responsive design
 */

import React from 'react';
import { Progress } from '../ui/progress';
import { CheckCircle2 } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
  steps: Array<{
    number: number;
    title: string;
    completed: boolean;
  }>;
}

export const StepIndicator: React.FC<StepIndicatorProps> = ({
  currentStep,
  totalSteps,
  steps
}) => {
  const progress = (currentStep / totalSteps) * 100;

  return (
    <div className="mb-8">
      {/* Progress bar with percentage */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-muted-foreground">
          Step {currentStep} of {totalSteps}
        </span>
        <span className="text-sm font-medium text-primary">
          {Math.round(progress)}% Complete
        </span>
      </div>
      
      <Progress value={progress} className="h-2 mb-4" />
      
      {/* Step circles */}
      <div className="flex justify-between items-center">
        {steps.map((step, index) => (
          <React.Fragment key={step.number}>
            {/* Step circle */}
            <div className="flex flex-col items-center flex-1">
              <div
                className={cn(
                  "flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-200",
                  step.completed
                    ? 'bg-primary border-primary text-primary-foreground'
                    : step.number === currentStep
                    ? 'border-primary text-primary bg-primary/10'
                    : 'border-muted-foreground/30 text-muted-foreground bg-background'
                )}
              >
                {step.completed ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : (
                  <span className="font-semibold text-sm">{step.number}</span>
                )}
              </div>
              
              {/* Step title - hidden on mobile, visible on tablet+ */}
              <span
                className={cn(
                  "mt-2 text-xs font-medium text-center hidden sm:block",
                  step.number === currentStep
                    ? 'text-primary'
                    : step.completed
                    ? 'text-foreground'
                    : 'text-muted-foreground'
                )}
              >
                {step.title}
              </span>
            </div>
            
            {/* Connector line between steps */}
            {index < steps.length - 1 && (
              <div
                className={cn(
                  "h-0.5 flex-1 mx-2 transition-all duration-200",
                  step.completed
                    ? 'bg-primary'
                    : 'bg-muted-foreground/20'
                )}
              />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

