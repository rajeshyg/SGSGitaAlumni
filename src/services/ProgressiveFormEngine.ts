import { AlumniProfile } from './AlumniDataIntegrationService';

export interface FormStep {
  id: string;
  title: string;
  description: string;
  component: string; // Component name or type
  isRequired: boolean;
  estimatedTime: number;
  data: any;
  validationRules: ValidationRule[];
  isCompleted?: boolean;
}

export interface ValidationRule {
  field: string;
  type: 'required' | 'email' | 'phone' | 'minLength' | 'maxLength' | 'pattern';
  value?: any;
  message: string;
}

export interface FormProgress {
  currentStep: number;
  totalSteps: number;
  completedSteps: number;
  canProceed: boolean;
  estimatedTimeRemaining: number;
}

export interface FormSession {
  sessionId: string;
  invitationToken: string;
  currentStep: number;
  formData: Record<string, any>;
  startedAt: Date;
  lastUpdatedAt: Date;
  isCompleted: boolean;
}

export class ProgressiveFormEngine {
  private sessions: Map<string, FormSession> = new Map();

  /**
   * Generate form steps based on registration data
   */
  generateFormSteps(alumniProfile?: AlumniProfile, missingFields: string[] = []): FormStep[] {
    const steps: FormStep[] = [];

    // Step 1: Alumni Data Review (always first)
    if (alumniProfile) {
      steps.push({
        id: 'alumni-review',
        title: 'Review Your Information',
        description: 'Please review the information we found from your alumni records',
        component: 'AlumniDataReview',
        isRequired: true,
        estimatedTime: 30,
        data: { alumniProfile },
        validationRules: [],
        isCompleted: false
      });
    }

    // Step 2: Additional Information (if needed)
    if (missingFields.length > 0) {
      const additionalFields = this.getAdditionalFields(missingFields);
      steps.push({
        id: 'additional-info',
        title: 'Additional Information',
        description: 'Please provide the missing information to complete your profile',
        component: 'AdditionalInfoForm',
        isRequired: true,
        estimatedTime: 120,
        data: { requiredFields: missingFields, optionalFields: additionalFields },
        validationRules: this.generateValidationRules(missingFields),
        isCompleted: false
      });
    }

    // Step 3: Age Verification (if under 18)
    if (alumniProfile?.requiresParentConsent) {
      steps.push({
        id: 'parent-consent',
        title: 'Parent Consent Required',
        description: 'Since you appear to be under 18, we need parent consent to proceed',
        component: 'ParentConsentForm',
        isRequired: true,
        estimatedTime: 60,
        data: { alumniProfile },
        validationRules: [
          {
            field: 'parentEmail',
            type: 'email',
            message: 'Please provide a valid parent email address'
          },
          {
            field: 'consentGiven',
            type: 'required',
            message: 'Parent consent is required for users under 18'
          }
        ],
        isCompleted: false
      });
    }

    // Step 4: Terms and Conditions
    steps.push({
      id: 'terms-acceptance',
      title: 'Terms and Conditions',
      description: 'Please review and accept our terms of service',
      component: 'TermsAcceptanceForm',
      isRequired: true,
      estimatedTime: 45,
      data: {},
      validationRules: [
        {
          field: 'termsAccepted',
          type: 'required',
          message: 'You must accept the terms and conditions to continue'
        },
        {
          field: 'privacyAccepted',
          type: 'required',
          message: 'You must accept the privacy policy to continue'
        }
      ],
      isCompleted: false
    });

    return steps;
  }

  /**
   * Validate step completion
   */
  validateStepCompletion(stepId: string, data: any, step: FormStep): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    for (const rule of step.validationRules) {
      const value = data[rule.field];

      switch (rule.type) {
        case 'required':
          if (!value || (typeof value === 'string' && value.trim() === '')) {
            errors.push(rule.message);
          }
          break;

        case 'email':
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (value && !emailRegex.test(value)) {
            errors.push(rule.message);
          }
          break;

        case 'phone':
          const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
          if (value && !phoneRegex.test(value.replace(/[\s\-\(\)]/g, ''))) {
            errors.push(rule.message);
          }
          break;

        case 'minLength':
          if (value && typeof value === 'string' && value.length < rule.value) {
            errors.push(rule.message);
          }
          break;

        case 'maxLength':
          if (value && typeof value === 'string' && value.length > rule.value) {
            errors.push(rule.message);
          }
          break;

        case 'pattern':
          if (value && !rule.value.test(value)) {
            errors.push(rule.message);
          }
          break;
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Save partial progress
   */
  savePartialProgress(sessionId: string, stepData: any): Promise<void> {
    return new Promise((resolve) => {
      const session = this.sessions.get(sessionId);
      if (session) {
        session.formData = { ...session.formData, ...stepData };
        session.lastUpdatedAt = new Date();
        this.sessions.set(sessionId, session);
      }
      resolve();
    });
  }

  /**
   * Resume from last step
   */
  resumeFromLastStep(sessionId: string): Promise<FormStep | null> {
    return new Promise((resolve) => {
      const session = this.sessions.get(sessionId);
      if (!session || session.isCompleted) {
        resolve(null);
        return;
      }

      // Return the current step (this would be more complex in a real implementation)
      resolve(null); // Simplified for now
    });
  }

  /**
   * Complete form submission
   */
  completeFormSubmission(sessionId: string, finalData: any): Promise<any> {
    return new Promise((resolve) => {
      const session = this.sessions.get(sessionId);
      if (session) {
        session.isCompleted = true;
        session.formData = { ...session.formData, ...finalData };
        session.lastUpdatedAt = new Date();
        this.sessions.set(sessionId, session);
      }
      resolve(session?.formData || finalData);
    });
  }

  /**
   * Get form progress
   */
  getFormProgress(steps: FormStep[], currentStepIndex: number): FormProgress {
    const completedSteps = steps.slice(0, currentStepIndex).filter(step => step.isCompleted).length;
    const totalSteps = steps.length;
    const estimatedTimeRemaining = steps
      .slice(currentStepIndex)
      .reduce((total, step) => total + step.estimatedTime, 0);

    return {
      currentStep: currentStepIndex + 1,
      totalSteps,
      completedSteps,
      canProceed: currentStepIndex < totalSteps - 1,
      estimatedTimeRemaining
    };
  }

  /**
   * Create new form session
   */
  createFormSession(invitationToken: string, initialData: any = {}): string {
    const sessionId = `form_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const session: FormSession = {
      sessionId,
      invitationToken,
      currentStep: 0,
      formData: initialData,
      startedAt: new Date(),
      lastUpdatedAt: new Date(),
      isCompleted: false
    };

    this.sessions.set(sessionId, session);
    return sessionId;
  }

  /**
   * Get additional optional fields
   */
  private getAdditionalFields(missingFields: string[]): string[] {
    const allOptionalFields = [
      'phone',
      'address',
      'bio',
      'linkedin_url',
      'current_position',
      'company',
      'location'
    ];

    return allOptionalFields.filter(field => !missingFields.includes(field));
  }

  /**
   * Generate validation rules for fields
   */
  private generateValidationRules(fields: string[]): ValidationRule[] {
    const rules: ValidationRule[] = [];

    for (const field of fields) {
      switch (field) {
        case 'firstName':
        case 'lastName':
          rules.push({
            field,
            type: 'required',
            message: `${field === 'firstName' ? 'First' : 'Last'} name is required`
          });
          break;

        case 'email':
          rules.push({
            field,
            type: 'required',
            message: 'Email is required'
          }, {
            field,
            type: 'email',
            message: 'Please enter a valid email address'
          });
          break;

        case 'phone':
          rules.push({
            field,
            type: 'phone',
            message: 'Please enter a valid phone number'
          });
          break;

        case 'graduationYear':
          rules.push({
            field,
            type: 'required',
            message: 'Graduation year is required'
          });
          break;

        case 'program':
          rules.push({
            field,
            type: 'required',
            message: 'Program is required'
          });
          break;
      }
    }

    return rules;
  }
}

export default ProgressiveFormEngine;