import mysql from 'mysql2/promise';

export interface AlumniProfile {
  id: number;
  studentId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  graduationYear: number;
  degree?: string;
  program: string;
  address?: string;
  birthDate?: string | null;
  estimatedBirthYear?: number | null;
  estimatedAge?: number;
  isCompleteProfile: boolean;
  missingFields: string[];
  canAutoPopulate: boolean;
  requiresParentConsent: boolean;
}

export interface ValidationResult {
  isComplete: boolean;
  missingFields: string[];
  estimatedAge?: number;
  requiresParentConsent: boolean;
  canAutoPopulate: boolean;
}

export interface MergedProfile {
  alumniData: AlumniProfile;
  userAdditions: any;
  mergedProfile: CompleteProfile;
  dataSources: DataSource[];
}

export interface CompleteProfile {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  graduationYear: number;
  program: string;
  address?: string;
}

export interface DataSource {
  field: string;
  source: 'alumni' | 'user';
  value: any;
}

export interface AlumniDataSnapshot {
  alumniId: number;
  data: AlumniProfile;
  capturedAt: Date;
}

export class AlumniDataIntegrationService {
  private pool: mysql.Pool;

  constructor(pool: mysql.Pool) {
    this.pool = pool;
  }

  /**
   * Fetch alumni data for invitation acceptance
   */
  async fetchAlumniDataForInvitation(email: string): Promise<AlumniProfile | null> {
    try {
      const connection = await this.pool.getConnection();

      // Include birth_date and estimated_birth_year for COPPA age calculation
      // Priority: actual birth_date > estimated_birth_year > graduation_year-based estimate
      const query = `
        SELECT am.*,
               am.birth_date,
               am.estimated_birth_year,
               CASE 
                 WHEN am.birth_date IS NOT NULL THEN TIMESTAMPDIFF(YEAR, am.birth_date, CURDATE())
                 WHEN am.estimated_birth_year IS NOT NULL THEN YEAR(CURDATE()) - am.estimated_birth_year
                 WHEN am.batch IS NOT NULL THEN YEAR(CURDATE()) - (am.batch - 22)
                 ELSE NULL
               END as estimated_age
        FROM alumni_members am
        WHERE am.email = ? AND am.email IS NOT NULL AND am.email != ''
        LIMIT 1
      `;

      const [rows] = await connection.execute(query, [email]);
      connection.release();

      if (!Array.isArray(rows) || rows.length === 0) {
        return null;
      }

      const alumni = rows[0] as any;
      const validation = this.validateAlumniDataCompleteness(alumni);

      return {
        id: alumni.id,
        studentId: alumni.student_id,
        firstName: alumni.first_name,
        lastName: alumni.last_name,
        email: alumni.email,
        phone: alumni.phone,
        graduationYear: alumni.batch || alumni.graduation_year,
        degree: alumni.degree || alumni.result,
        program: alumni.program || alumni.center_name,
        address: alumni.address,
        birthDate: alumni.birth_date ? alumni.birth_date.toISOString().split('T')[0] : null,
        estimatedBirthYear: alumni.estimated_birth_year || (alumni.batch ? alumni.batch - 22 : null),
        estimatedAge: alumni.estimated_age,
        isCompleteProfile: validation.isComplete,
        missingFields: validation.missingFields,
        canAutoPopulate: validation.canAutoPopulate,
        requiresParentConsent: validation.requiresParentConsent
      };

    } catch (error) {
      console.error('Error fetching alumni data for invitation:', error);
      throw new Error('Failed to fetch alumni data');
    }
  }

  /**
   * Validate completeness of alumni data
   */
  validateAlumniDataCompleteness(alumniData: any): ValidationResult {
    const requiredFields = ['first_name', 'last_name', 'email', 'graduation_year', 'program'];
    const missingFields: string[] = [];

    // Check required fields
    for (const field of requiredFields) {
      if (!alumniData[field] || alumniData[field].toString().trim() === '') {
        missingFields.push(field);
      }
    }

    const isComplete = missingFields.length === 0;
    const estimatedAge = alumniData.estimated_age;
    const requiresParentConsent = estimatedAge !== null && estimatedAge < 18;
    const canAutoPopulate = isComplete && !requiresParentConsent;

    return {
      isComplete,
      missingFields,
      estimatedAge,
      requiresParentConsent,
      canAutoPopulate
    };
  }

  /**
   * Merge alumni data with user input
   */
  mergeAlumniDataWithUserInput(alumniData: AlumniProfile, userInput: any): MergedProfile {
    const mergedProfile: CompleteProfile = {
      firstName: userInput.firstName || alumniData.firstName,
      lastName: userInput.lastName || alumniData.lastName,
      email: alumniData.email, // Email always from alumni data
      phone: userInput.phone || alumniData.phone,
      graduationYear: alumniData.graduationYear,
      program: alumniData.program,
      address: userInput.address || alumniData.address
    };

    const dataSources: DataSource[] = [
      { field: 'firstName', source: userInput.firstName ? 'user' : 'alumni', value: mergedProfile.firstName },
      { field: 'lastName', source: userInput.lastName ? 'user' : 'alumni', value: mergedProfile.lastName },
      { field: 'email', source: 'alumni', value: mergedProfile.email },
      { field: 'phone', source: userInput.phone ? 'user' : 'alumni', value: mergedProfile.phone },
      { field: 'graduationYear', source: 'alumni', value: mergedProfile.graduationYear },
      { field: 'program', source: 'alumni', value: mergedProfile.program },
      { field: 'address', source: userInput.address ? 'user' : 'alumni', value: mergedProfile.address }
    ];

    return {
      alumniData,
      userAdditions: userInput,
      mergedProfile,
      dataSources
    };
  }

  /**
   * Create a snapshot of alumni data
   */
  createProfileSnapshot(alumniData: AlumniProfile): string {
    const snapshot: AlumniDataSnapshot = {
      alumniId: alumniData.id,
      data: alumniData,
      capturedAt: new Date()
    };

    return JSON.stringify(snapshot);
  }

  /**
   * Sync alumni data if changed (for future use)
   */
  async syncAlumniDataIfChanged(userId: string): Promise<boolean> {
    // Implementation for future data synchronization
    // This would compare current alumni data with stored snapshot
    // and update user profile if alumni data has changed
    return false;
  }
}

export default AlumniDataIntegrationService;