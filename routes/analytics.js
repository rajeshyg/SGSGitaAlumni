import mysql from 'mysql2/promise';

// Get database pool - will be passed from main server
let pool = null;

export function setAnalyticsPool(dbPool) {
  pool = dbPool;
}

// ============================================================================
// ANALYTICS API ENDPOINTS
// ============================================================================

// Get user invitation history
export const getUserInvitationHistory = async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const { userId } = req.params;

    const query = `
      SELECT ui.*
      FROM USER_INVITATIONS ui
      WHERE ui.user_id = ?
      ORDER BY ui.created_at DESC
    `;

    const [rows] = await connection.execute(query, [userId]);
    connection.release();

    const invitations = rows.map(row => ({
      id: row.id,
      email: row.email,
      userId: row.user_id,
      invitationToken: row.invitation_token,
      invitedBy: row.invited_by,
      invitationData: (() => {
        try {
          return JSON.parse(row.invitation_data || '{}');
        } catch (error) {
          return {};
        }
      })(),
      sentAt: row.sent_at,
      expiresAt: row.expires_at,
      isUsed: row.is_used,
      usedAt: row.used_at,
      acceptedBy: row.accepted_by,
      resendCount: row.resend_count,
      lastResentAt: row.last_resent_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      user: null
    }));

    res.json({ invitations });
  } catch (error) {
    console.error('Error fetching user invitation history:', error);
    res.status(500).json({ error: 'Failed to fetch user invitation history' });
  }
};

// Get invitation analytics summary
export const getInvitationAnalyticsSummary = async (req, res) => {
  try {
    const connection = await pool.getConnection();

    // Profile completion success rate
    const profileCompletionQuery = `
      SELECT
        COUNT(CASE WHEN status = 'accepted' THEN 1 END) as accepted,
        COUNT(*) as total,
        ROUND(
          (COUNT(CASE WHEN status = 'accepted' THEN 1 END) * 100.0) / COUNT(*),
          2
        ) as success_rate
      FROM USER_INVITATIONS
      WHERE invitation_type = 'profile_completion' AND user_id IS NOT NULL
    `;

    // Invitation funnel analytics
    const funnelQuery = `
      SELECT
        status,
        COUNT(*) as count,
        AVG(
          CASE
            WHEN used_at IS NOT NULL AND sent_at IS NOT NULL
            THEN TIMESTAMPDIFF(HOUR, sent_at, used_at)
            ELSE NULL
          END
        ) as avg_response_time_hours
      FROM USER_INVITATIONS
      WHERE user_id IS NOT NULL
      GROUP BY status
    `;

    // Overall invitation statistics
    const overallQuery = `
      SELECT
        COUNT(*) as total_invitations,
        COUNT(CASE WHEN status = 'accepted' THEN 1 END) as accepted_invitations,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_invitations,
        COUNT(CASE WHEN status = 'expired' THEN 1 END) as expired_invitations,
        COUNT(CASE WHEN user_id IS NOT NULL THEN 1 END) as user_linked_invitations,
        ROUND(
          (COUNT(CASE WHEN status = 'accepted' THEN 1 END) * 100.0) / COUNT(*),
          2
        ) as overall_conversion_rate
      FROM USER_INVITATIONS
    `;

    const [profileCompletionRows] = await connection.execute(profileCompletionQuery);
    const [funnelRows] = await connection.execute(funnelQuery);
    const [overallRows] = await connection.execute(overallQuery);

    connection.release();

    const profileCompletion = profileCompletionRows[0];
    const funnel = funnelRows.map(row => ({
      status: row.status,
      count: row.count,
      avgResponseTimeHours: row.avg_response_time_hours
    }));
    const overall = overallRows[0];

    res.json({
      profileCompletion,
      funnel,
      overall
    });
  } catch (error) {
    console.error('Error fetching invitation analytics:', error);
    res.status(500).json({ error: 'Failed to fetch invitation analytics' });
  }
};

// Get invitation conversion rates over time
export const getInvitationConversionTrends = async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const { days = 30 } = req.query;

    const query = `
      SELECT
        DATE(created_at) as date,
        COUNT(*) as total_sent,
        COUNT(CASE WHEN status = 'accepted' THEN 1 END) as accepted,
        ROUND(
          (COUNT(CASE WHEN status = 'accepted' THEN 1 END) * 100.0) / COUNT(*),
          2
        ) as conversion_rate
      FROM USER_INVITATIONS
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
        AND user_id IS NOT NULL
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `;

    const [rows] = await connection.execute(query, [days]);
    connection.release();

    const trends = rows.map(row => ({
      date: row.date,
      totalSent: row.total_sent,
      accepted: row.accepted,
      conversionRate: row.conversion_rate
    }));

    res.json({ trends });
  } catch (error) {
    console.error('Error fetching conversion trends:', error);
    res.status(500).json({ error: 'Failed to fetch conversion trends' });
  }
};