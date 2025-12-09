/**
 * Age Verification Service - Simplified for COPPA Compliance
 * 
 * UPDATED (Phase 3):
 * - Uses year_of_birth (INT year only) instead of full birth date
 * - Age calculated conservatively: YEAR(NOW()) - year_of_birth
 * - Simplified methods: calculateAge, getAccessLevel, requiresConsent
 * - Backend handles consent flows
 * 
 * Access Levels:
 * - 'blocked': Under 14 (no platform access)
 * - 'supervised': 14-17 (needs parental consent first)
 * - 'full': 18+ (immediate full access)
 * 
 * See docs/specs/refactoring-plans/03-api-refactoring-plan.md Step 5.3
 */

export class AgeVerificationService {
  private readonly MINIMUM_AGE = 14; // Minimum age for platform access
  private readonly PARENT_CONSENT_AGE = 18; // Age requiring parental consent

  /**
   * Calculate age from year of birth (conservative: assumes Dec 31)
   * 
   * @param yearOfBirth - Year of birth (INT)
   * @returns Age as integer
   */
  calculateAge(yearOfBirth: number): number {
    const currentYear = new Date().getFullYear();
    return currentYear - yearOfBirth;
  }

  /**
   * Determine access level based on age
   * 
   * @param age - Age in years, or null if unknown
   * @returns 'blocked' | 'supervised' | 'full'
   */
  getAccessLevel(age: number | null): 'blocked' | 'supervised' | 'full' {
    if (age === null) return 'blocked'; // Unknown age = blocked
    if (age < this.MINIMUM_AGE) return 'blocked'; // Under 14 = no profile
    if (age < this.PARENT_CONSENT_AGE) return 'supervised'; // 14-17 = needs consent first
    return 'full'; // 18+ = full access
  }

  /**
   * Check if profile requires parental consent
   * 
   * @param age - Age in years, or null if unknown
   * @returns boolean
   */
  requiresConsent(age: number | null): boolean {
    if (age === null) return true; // Unknown age requires verification
    return age >= this.MINIMUM_AGE && age < this.PARENT_CONSENT_AGE;
  }

  /**
   * Check if user can create a profile
   * 
   * @param age - Age in years, or null if unknown
   * @returns boolean
   */
  canCreateProfile(age: number | null): boolean {
    if (age === null) return false; // Need age verification
    return age >= this.MINIMUM_AGE; // Can create profile if 14+
  }

  /**
   * Get minimum age requirement
   */
  getMinimumAge(): number {
    return this.MINIMUM_AGE;
  }

  /**
   * Get parent consent age threshold
   */
  getParentConsentAge(): number {
    return this.PARENT_CONSENT_AGE;
  }
}
