/**
 * User Preferences Routes
 * Task 7.7.2 - Enhanced Preferences Schema
 * 
 * Provides API endpoints for user preference management
 */

import { v4 as uuidv4 } from 'uuid';

let pool;

export const setPreferencesPool = (dbPool) => {
  pool = dbPool;
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Validate user preferences
 */
async function validatePreferences(preferences) {
  const errors = [];
  
  // 1. Primary domain validation
  if (!preferences.primary_domain_id) {
    errors.push('Primary domain is required');
  } else {
    const [primaryDomain] = await pool.query(
      'SELECT * FROM DOMAINS WHERE id = ? AND is_active = TRUE',
      [preferences.primary_domain_id]
    );
    
    if (primaryDomain.length === 0) {
      errors.push('Invalid primary domain');
    } else if (primaryDomain[0].domain_level !== 'primary') {
      errors.push('Selected domain is not a primary domain');
    }
  }
  
  // 2. Secondary domains validation
  if (preferences.secondary_domain_ids) {
    const secondaryIds = typeof preferences.secondary_domain_ids === 'string' 
      ? JSON.parse(preferences.secondary_domain_ids)
      : preferences.secondary_domain_ids;
    
    if (secondaryIds.length > 3) {
      errors.push('Maximum 3 secondary domains allowed');
    }
    
    for (const domainId of secondaryIds) {
      const [domain] = await pool.query(
        'SELECT * FROM DOMAINS WHERE id = ? AND is_active = TRUE',
        [domainId]
      );
      
      if (domain.length === 0) {
        errors.push(`Secondary domain ${domainId} not found`);
        continue;
      }
      
      if (domain[0].domain_level !== 'secondary') {
        errors.push(`Domain ${domain[0].name} is not a secondary domain`);
      }
      
      if (domain[0].parent_domain_id !== preferences.primary_domain_id) {
        errors.push(`Secondary domain ${domain[0].name} does not belong to selected primary domain`);
      }
    }
  }
  
  // 3. Areas of interest validation
  if (preferences.areas_of_interest_ids) {
    const areaIds = typeof preferences.areas_of_interest_ids === 'string'
      ? JSON.parse(preferences.areas_of_interest_ids)
      : preferences.areas_of_interest_ids;
    
    const secondaryIds = typeof preferences.secondary_domain_ids === 'string'
      ? JSON.parse(preferences.secondary_domain_ids || '[]')
      : (preferences.secondary_domain_ids || []);
    
    if (areaIds.length > 20) {
      errors.push('Maximum 20 areas of interest allowed');
    }
    
    for (const areaId of areaIds) {
      const [area] = await pool.query(
        'SELECT * FROM DOMAINS WHERE id = ? AND is_active = TRUE',
        [areaId]
      );
      
      if (area.length === 0) {
        errors.push(`Area of interest ${areaId} not found`);
        continue;
      }
      
      if (area[0].domain_level !== 'area_of_interest') {
        errors.push(`${area[0].name} is not an area of interest`);
      }
      
      // Area must belong to one of selected secondary domains
      if (!secondaryIds.includes(area[0].parent_domain_id)) {
        errors.push(`Area ${area[0].name} does not belong to selected secondary domains`);
      }
    }
  }
  
  return errors;
}

function normalizeJsonArray(value) {
  try {
    if (!value) {
      return [];
    }

    if (Array.isArray(value)) {
      return value;
    }

    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [];
      } catch (error) {
        console.warn('⚠️  Failed to parse JSON array value:', value, error.message);
        return [];
      }
    }

    if (typeof value === 'object') {
      // Handle potential Buffer objects from DB
      if (Buffer.isBuffer(value)) {
         try {
           const parsed = JSON.parse(value.toString());
           return Array.isArray(parsed) ? parsed : [];
         } catch (e) {
           return [];
         }
      }
      return Array.isArray(value) ? value : [];
    }

    return [];
  } catch (err) {
    console.error('Error in normalizeJsonArray:', err);
    return [];
  }
}

/**
 * Create default preferences for new user
 * Creates entries in all three preference tables
 */
export async function createDefaultPreferences(userId) {
  try {
    console.log(`[createDefaultPreferences] Starting for user ${userId}`);
    let preferenceId;

    const [existingPreferences] = await pool.query(
      'SELECT id FROM USER_PREFERENCES WHERE user_id = ?',
      [userId]
    );

    if (existingPreferences.length === 0) {
      preferenceId = uuidv4();
      console.log(`✅ Creating USER_PREFERENCES for user ${userId}...`);
      await pool.query(`
        INSERT INTO USER_PREFERENCES (
          id, user_id,
          preference_type, max_postings,
          notification_settings, privacy_settings, interface_settings,
          is_professional, education_status
        ) VALUES (
          ?, ?,
          'both', 5,
          '{"email_notifications": true, "push_notifications": true, "frequency": "daily"}',
          '{"profile_visibility": "alumni_only", "show_email": false, "show_phone": false}',
          '{"theme": "system", "language": "en", "timezone": "UTC"}',
          FALSE, 'professional'
        )
      `, [preferenceId, userId]);
      console.log(`✅ Created USER_PREFERENCES for user ${userId}`);
    } else {
      preferenceId = existingPreferences[0].id;
      console.log(`ℹ️  USER_PREFERENCES already exist for user ${userId} (id: ${preferenceId})`);
    }

    // Create USER_NOTIFICATION_PREFERENCES
    console.log(`✅ Ensuring USER_NOTIFICATION_PREFERENCES for user ${userId}...`);
    await pool.query(`
      INSERT INTO USER_NOTIFICATION_PREFERENCES (
        user_id, email_notifications, email_frequency, posting_updates,
        connection_requests, event_reminders, weekly_digest, push_notifications
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE user_id = VALUES(user_id)
    `, [userId, true, 'daily', true, true, true, true, false]);
    console.log(`✅ USER_NOTIFICATION_PREFERENCES ready for user ${userId}`);

    // Create USER_PRIVACY_SETTINGS
    console.log(`✅ Ensuring USER_PRIVACY_SETTINGS for user ${userId}...`);
    await pool.query(`
      INSERT INTO USER_PRIVACY_SETTINGS (
        user_id, profile_visibility, show_email, show_phone, show_location,
        searchable_by_name, searchable_by_email, allow_messaging
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE user_id = VALUES(user_id)
    `, [userId, 'alumni_only', false, false, true, true, false, 'alumni_only']);
    console.log(`✅ USER_PRIVACY_SETTINGS ready for user ${userId}`);

    return preferenceId;
  } catch (error) {
    console.error(`❌ Error creating default preferences for user ${userId}:`, error);
    throw error;
  }
}

// ============================================================================
// API ENDPOINTS
// ============================================================================

/**
 * GET /api/preferences/:userId
 * Get user preferences with populated domain details
 * Automatically creates default preferences if none exist
 */
export const getUserPreferences = async (req, res) => {
  const { userId } = req.params;

  try {
    // Require an active profile in the session; callers must select a profile before hitting this endpoint
    if (!req.session?.activeProfileId) {
      return res.status(401).json({
        success: false,
        error: 'Active profile required'
      });
    }

    // Enforce that callers can only access their active profile preferences
    if (userId !== req.session.activeProfileId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied for this profile'
      });
    }

    // Strictly require a valid profile id; do not fall back to account ids or other values
    let targetProfileId = userId;
    const [profileRows] = await pool.query('SELECT id FROM user_profiles WHERE id = ?', [targetProfileId]);

    if (profileRows.length === 0) {
      console.warn(`⚠️  Preferences requested for non-profile id ${targetProfileId}`);
      return res.status(404).json({
        success: false,
        error: 'Profile not found'
      });
    }

    const [preferences] = await pool.query(`
      SELECT
        up.*,
        pd.name as primary_domain_name,
        pd.icon as primary_domain_icon,
        pd.color_code as primary_domain_color
      FROM USER_PREFERENCES up
      LEFT JOIN DOMAINS pd ON up.primary_domain_id = pd.id
      WHERE up.user_id = ?
    `, [targetProfileId]);

    // If no preferences exist, create default preferences
    if (preferences.length === 0) {
      console.log(`📋 No preferences found for profile ${targetProfileId}, creating defaults...`);

      // Create default preferences
      await createDefaultPreferences(targetProfileId);

      // Fetch the newly created preferences
      const [newPreferences] = await pool.query(`
        SELECT
          up.*,
          pd.name as primary_domain_name,
          pd.icon as primary_domain_icon,
          pd.color_code as primary_domain_color
        FROM USER_PREFERENCES up
        LEFT JOIN DOMAINS pd ON up.primary_domain_id = pd.id
        WHERE up.user_id = ?
      `, [targetProfileId]);

      if (newPreferences.length === 0) {
        console.error('❌ Failed to retrieve preferences after creation');
        return res.status(500).json({
          success: false,
          error: 'Failed to create default preferences'
        });
      }

      console.log(`✅ Default preferences created for profile ${targetProfileId}`);

      // Return the newly created preferences with empty arrays for domains
      const pref = newPreferences[0];
      pref.secondary_domains = [];
      pref.areas_of_interest = [];

      return res.json({
        success: true,
        preferences: pref
      });
    }

    const pref = preferences[0];

    // Populate secondary domains
    const secondaryIds = normalizeJsonArray(pref.secondary_domain_ids);

    if (secondaryIds.length > 0) {
        const [secondaryDomains] = await pool.query(`
          SELECT id, name, icon, color_code
          FROM DOMAINS
          WHERE id IN (?)
        `, [secondaryIds]);
        pref.secondary_domains = secondaryDomains;
    } else {
      pref.secondary_domains = [];
    }

    // Populate areas of interest
    const areaIds = normalizeJsonArray(pref.areas_of_interest_ids);

    if (areaIds.length > 0) {
        const [areas] = await pool.query(`
          SELECT id, name, parent_domain_id
          FROM DOMAINS
          WHERE id IN (?)
        `, [areaIds]);
        pref.areas_of_interest = areas;
    } else {
      pref.areas_of_interest = [];
    }

    res.json({
      success: true,
      preferences: pref
    });
  } catch (error) {
    console.error('❌ Error fetching preferences:', error);
    // Log stack trace for deeper debugging of database errors
    if (error.sql) {
        console.error('SQL Error Details:', {
            message: error.message,
            code: error.code,
            sqlState: error.sqlState,
            sql: error.sql
        });
    }
    res.status(500).json({
      success: false,
      error: 'Failed to fetch preferences',
      details: error.message
    });
  }
};

/**
 * PUT /api/preferences/:userId
 * Update user preferences with validation
 */
export const updateUserPreferences = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!req.session?.activeProfileId) {
      return res.status(401).json({
        success: false,
        error: 'Active profile required'
      });
    }

    if (userId !== req.session.activeProfileId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied for this profile'
      });
    }
    // Strictly require a valid profile id; do not fall back to account ids or other values
    let targetProfileId = userId;
    const [profileRows] = await pool.query('SELECT id FROM user_profiles WHERE id = ?', [targetProfileId]);
    if (profileRows.length === 0) {
      console.warn(`⚠️  Update requested for non-profile id ${targetProfileId}`);
      return res.status(404).json({
        success: false,
        error: 'Profile not found'
      });
    }
    const preferences = req.body;
    
    // Validate preferences
    const errors = await validatePreferences({
      ...preferences,
      user_id: targetProfileId
    });
    
    if (errors.length > 0) {
      console.warn('⚠️  Preference validation failed for user', userId, 'errors:', errors);
      return res.status(400).json({
        success: false,
        errors
      });
    }
    
    // Check if preferences exist
    const [existing] = await pool.query(
      'SELECT id FROM USER_PREFERENCES WHERE user_id = ?',
      [targetProfileId]
    );
    
    if (existing.length === 0) {
      // Create new preferences
      const id = uuidv4();
      await pool.query(`
        INSERT INTO USER_PREFERENCES (
          id, user_id, primary_domain_id, secondary_domain_ids, areas_of_interest_ids,
          preference_type, max_postings, notification_settings, privacy_settings,
          interface_settings, is_professional, education_status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        id,
        targetProfileId,
        preferences.primary_domain_id,
        JSON.stringify(preferences.secondary_domain_ids || []),
        JSON.stringify(preferences.areas_of_interest_ids || []),
        preferences.preference_type || 'both',
        preferences.max_postings || 5,
        JSON.stringify(preferences.notification_settings || {}),
        JSON.stringify(preferences.privacy_settings || {}),
        JSON.stringify(preferences.interface_settings || {}),
        preferences.is_professional || false,
        preferences.education_status || 'professional'
      ]);
    } else {
      // Update existing preferences
      await pool.query(`
        UPDATE USER_PREFERENCES
        SET 
          primary_domain_id = ?,
          secondary_domain_ids = ?,
          areas_of_interest_ids = ?,
          preference_type = ?,
          max_postings = ?,
          notification_settings = ?,
          privacy_settings = ?,
          interface_settings = ?,
          is_professional = ?,
          education_status = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ?
      `, [
        preferences.primary_domain_id,
        JSON.stringify(preferences.secondary_domain_ids || []),
        JSON.stringify(preferences.areas_of_interest_ids || []),
        preferences.preference_type,
        preferences.max_postings,
        JSON.stringify(preferences.notification_settings),
        JSON.stringify(preferences.privacy_settings),
        JSON.stringify(preferences.interface_settings),
        preferences.is_professional,
        preferences.education_status,
          targetProfileId
      ]);
    }
    
    res.json({
      success: true,
      message: 'Preferences updated successfully'
    });
  } catch (error) {
    console.error('Error updating preferences:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to update preferences' 
    });
  }
};

/**
 * GET /api/preferences/domains/available
 * Get available domains based on current selection
 */
export const getAvailableDomains = async (req, res) => {
  try {
    const { primary_domain_id, secondary_domain_ids } = req.query;
    
    // Get primary domains
    const [primaryDomains] = await pool.query(`
      SELECT id, name, description, icon, color_code
      FROM DOMAINS
      WHERE domain_level = 'primary' AND is_active = TRUE
      ORDER BY display_order, name
    `);
    
    let secondaryDomains = [];
    let areasOfInterest = [];
    
    // Get secondary domains for selected primary
    if (primary_domain_id) {
      const [secondaries] = await pool.query(`
        SELECT id, name, description, icon
        FROM DOMAINS
        WHERE domain_level = 'secondary' 
          AND parent_domain_id = ?
          AND is_active = TRUE
        ORDER BY display_order, name
      `, [primary_domain_id]);
      secondaryDomains = secondaries;
    }
    
    // Get areas for selected secondaries
    if (secondary_domain_ids) {
      const secondaryIds = secondary_domain_ids.split(',');
      const [areas] = await pool.query(`
        SELECT id, name, parent_domain_id
        FROM DOMAINS
        WHERE domain_level = 'area_of_interest'
          AND parent_domain_id IN (?)
          AND is_active = TRUE
        ORDER BY parent_domain_id, display_order, name
      `, [secondaryIds]);
      areasOfInterest = areas;
    }
    
    res.json({
      success: true,
      primary_domains: primaryDomains,
      secondary_domains: secondaryDomains,
      areas_of_interest: areasOfInterest
    });
  } catch (error) {
    console.error('Error fetching available domains:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch available domains' 
    });
  }
};

/**
 * POST /api/preferences/validate
 * Validate preference configuration without saving
 */
export const validatePreferencesEndpoint = async (req, res) => {
  try {
    const preferences = req.body;
    const errors = await validatePreferences(preferences);

    res.json({
      success: errors.length === 0,
      valid: errors.length === 0,
      errors
    });
  } catch (error) {
    console.error('Error validating preferences:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to validate preferences'
    });
  }
};

// ============================================================================
// NOTIFICATION PREFERENCES ENDPOINTS (Task 7.7.4)
// ============================================================================

/**
 * GET /api/users/:userId/notification-preferences
 * Get user notification preferences
 */
export const getNotificationPreferences = async (req, res) => {
  try {
    const { userId } = req.params;

    const [preferences] = await pool.query(`
      SELECT * FROM USER_NOTIFICATION_PREFERENCES WHERE user_id = ?
    `, [userId]);

    if (preferences.length === 0) {
      // Return default preferences if none exist
      return res.json({
        success: true,
        preferences: {
          email_notifications: true,
          email_frequency: 'daily',
          posting_updates: true,
          connection_requests: true,
          event_reminders: true,
          weekly_digest: true,
          push_notifications: false
        }
      });
    }

    res.json({
      success: true,
      preferences: preferences[0]
    });
  } catch (error) {
    console.error('Error fetching notification preferences:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch notification preferences'
    });
  }
};

/**
 * PUT /api/users/:userId/notification-preferences
 * Update user notification preferences
 */
export const updateNotificationPreferences = async (req, res) => {
  try {
    const { userId } = req.params;
    const {
      email_notifications,
      email_frequency,
      posting_updates,
      connection_requests,
      event_reminders,
      weekly_digest,
      push_notifications
    } = req.body;

    // Check if preferences exist
    const [existing] = await pool.query(
      'SELECT user_id FROM USER_NOTIFICATION_PREFERENCES WHERE user_id = ?',
      [userId]
    );

    if (existing.length === 0) {
      // Create new preferences
      await pool.query(`
        INSERT INTO USER_NOTIFICATION_PREFERENCES (
          user_id, email_notifications, email_frequency, posting_updates,
          connection_requests, event_reminders, weekly_digest, push_notifications
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        userId,
        email_notifications ?? true,
        email_frequency || 'daily',
        posting_updates ?? true,
        connection_requests ?? true,
        event_reminders ?? true,
        weekly_digest ?? true,
        push_notifications ?? false
      ]);
    } else {
      // Update existing preferences
      await pool.query(`
        UPDATE USER_NOTIFICATION_PREFERENCES
        SET
          email_notifications = ?,
          email_frequency = ?,
          posting_updates = ?,
          connection_requests = ?,
          event_reminders = ?,
          weekly_digest = ?,
          push_notifications = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ?
      `, [
        email_notifications,
        email_frequency,
        posting_updates,
        connection_requests,
        event_reminders,
        weekly_digest,
        push_notifications,
        userId
      ]);
    }

    res.json({
      success: true,
      message: 'Notification preferences updated successfully'
    });
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update notification preferences'
    });
  }
};

// ============================================================================
// PRIVACY SETTINGS ENDPOINTS (Task 7.7.4)
// ============================================================================

/**
 * GET /api/users/:userId/privacy-settings
 * Get user privacy settings
 */
export const getPrivacySettings = async (req, res) => {
  try {
    const { userId } = req.params;

    const [settings] = await pool.query(`
      SELECT * FROM USER_PRIVACY_SETTINGS WHERE user_id = ?
    `, [userId]);

    if (settings.length === 0) {
      // Return default settings if none exist
      return res.json({
        success: true,
        settings: {
          profile_visibility: 'alumni_only',
          show_email: false,
          show_phone: false,
          show_location: true,
          searchable_by_name: true,
          searchable_by_email: false,
          allow_messaging: 'alumni_only'
        }
      });
    }

    res.json({
      success: true,
      settings: settings[0]
    });
  } catch (error) {
    console.error('Error fetching privacy settings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch privacy settings'
    });
  }
};

/**
 * PUT /api/users/:userId/privacy-settings
 * Update user privacy settings
 */
export const updatePrivacySettings = async (req, res) => {
  try {
    const { userId } = req.params;
    const {
      profile_visibility,
      show_email,
      show_phone,
      show_location,
      searchable_by_name,
      searchable_by_email,
      allow_messaging
    } = req.body;

    // Check if settings exist
    const [existing] = await pool.query(
      'SELECT user_id FROM USER_PRIVACY_SETTINGS WHERE user_id = ?',
      [userId]
    );

    if (existing.length === 0) {
      // Create new settings
      await pool.query(`
        INSERT INTO USER_PRIVACY_SETTINGS (
          user_id, profile_visibility, show_email, show_phone, show_location,
          searchable_by_name, searchable_by_email, allow_messaging
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        userId,
        profile_visibility || 'alumni_only',
        show_email ?? false,
        show_phone ?? false,
        show_location ?? true,
        searchable_by_name ?? true,
        searchable_by_email ?? false,
        allow_messaging || 'alumni_only'
      ]);
    } else {
      // Update existing settings
      await pool.query(`
        UPDATE USER_PRIVACY_SETTINGS
        SET
          profile_visibility = ?,
          show_email = ?,
          show_phone = ?,
          show_location = ?,
          searchable_by_name = ?,
          searchable_by_email = ?,
          allow_messaging = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ?
      `, [
        profile_visibility,
        show_email,
        show_phone,
        show_location,
        searchable_by_name,
        searchable_by_email,
        allow_messaging,
        userId
      ]);
    }

    res.json({
      success: true,
      message: 'Privacy settings updated successfully'
    });
  } catch (error) {
    console.error('Error updating privacy settings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update privacy settings'
    });
  }
};

/**
 * GET /api/users/:userId/account-settings
 * Get user account settings (email, 2FA status, etc.)
 */
export const getAccountSettings = async (req, res) => {
  try {
    const { userId } = req.params;

    const [users] = await pool.query(`
      SELECT
        email,
        email_verified,
        email_verified_at,
        last_login_at,
        created_at,
        requires_otp,
        status
      FROM accounts
      WHERE id = ?
    `, [userId]);

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Ensure proper defaults for nullable fields
    const settings = {
      email: users[0].email,
      email_verified: users[0].email_verified || false,
      email_verified_at: users[0].email_verified_at || null,
      last_login_at: users[0].last_login_at || null,
      created_at: users[0].created_at,
      requires_otp: users[0].requires_otp || false,
      status: users[0].status || 'pending'
    };

    res.json({
      success: true,
      settings
    });
  } catch (error) {
    console.error('Error fetching account settings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch account settings'
    });
  }
};

