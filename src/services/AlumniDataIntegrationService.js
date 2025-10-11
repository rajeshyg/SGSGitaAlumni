// ============================================================================
// ALUMNI DATA INTEGRATION SERVICE (JavaScript stub)
// ============================================================================
// Basic alumni data service for server-side compatibility

export class AlumniDataIntegrationService {
  constructor(pool) {
    this.pool = pool;
  }

  async fetchAlumniDataForInvitation(email) {
    let connection;
    try {
      connection = await this.pool.getConnection();

      const query = `
        SELECT am.*
        FROM alumni_members am
        WHERE am.email = ? AND am.email IS NOT NULL AND am.email != ''
        LIMIT 1
      `;

      const [rows] = await connection.execute(query, [email]);

      if (!Array.isArray(rows) || rows.length === 0) {
        return null;
      }

      const alumni = rows[0];
      const validation = this.validateAlumniDataCompleteness(alumni);

      return {
        id: alumni.id,
        studentId: alumni.student_id,
        firstName: alumni.first_name,
        lastName: alumni.last_name,
        email: alumni.email,
        phone: alumni.phone,
        degree: alumni.degree,
        program: alumni.program,
        address: alumni.address,
        estimatedAge: null, // Removed graduation_year calculation
        isCompleteProfile: validation.isComplete,
        missingFields: validation.missingFields,
        canAutoPopulate: validation.canAutoPopulate,
        requiresParentConsent: false // Removed age check
      };

    } catch (error) {
      console.error('Error fetching alumni data for invitation:', error);
      throw new Error('Failed to fetch alumni data');
    } finally {
      // CRITICAL: Always release connection in finally block
      if (connection) {
        connection.release();
        console.log('AlumniDataIntegrationService: Released database connection');
      }
    }
  }

  validateAlumniDataCompleteness(alumniData) {
    const requiredFields = ['first_name', 'last_name', 'email'];
    const missingFields = [];

    for (const field of requiredFields) {
      if (!alumniData[field] || alumniData[field].toString().trim() === '') {
        missingFields.push(field);
      }
    }

    const isComplete = missingFields.length === 0;
    const canAutoPopulate = isComplete;

    return {
      isComplete,
      missingFields,
      estimatedAge: null,
      requiresParentConsent: false,
      canAutoPopulate
    };
  }

  mergeAlumniDataWithUserInput(alumniData, userInput) {
    const mergedProfile = {
      firstName: userInput.firstName || alumniData.firstName,
      lastName: userInput.lastName || alumniData.lastName,
      email: alumniData.email,
      phone: userInput.phone || alumniData.phone,
      program: alumniData.program,
      address: userInput.address || alumniData.address
    };

    const dataSources = [
      { field: 'firstName', source: userInput.firstName ? 'user' : 'alumni', value: mergedProfile.firstName },
      { field: 'lastName', source: userInput.lastName ? 'user' : 'alumni', value: mergedProfile.lastName },
      { field: 'email', source: 'alumni', value: mergedProfile.email },
      { field: 'phone', source: userInput.phone ? 'user' : 'alumni', value: mergedProfile.phone },
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

  createProfileSnapshot(alumniData) {
    const snapshot = {
      alumniId: alumniData.id,
      data: alumniData,
      capturedAt: new Date()
    };

    return JSON.stringify(snapshot);
  }

  async syncAlumniDataIfChanged(userId) {
    return false;
  }
}

export default AlumniDataIntegrationService;