import nodemailer from 'nodemailer';
import { getPool } from '../utils/database.js';

// ============================================================================
// EMAIL SERVICE ROUTES
// ============================================================================

// Email delivery log types
const EMAIL_TYPES = {
  invitation: 'invitation',
  otp: 'otp',
  welcome: 'welcome',
  family_invitation: 'family_invitation',
  parent_consent: 'parent_consent'
};

// Create email transporter based on environment configuration
function createTransporter() {
  const provider = process.env.SMTP_PROVIDER || 'sendgrid';

  switch (provider) {
    case 'sendgrid':
      return nodemailer.createTransporter({
        host: process.env.SMTP_HOST || 'smtp.sendgrid.net',
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER || 'apikey',
          pass: process.env.SMTP_PASS || process.env.SENDGRID_API_KEY
        }
      });

    case 'aws-ses':
      return nodemailer.createTransporter({
        host: process.env.SMTP_HOST || 'email-smtp.us-east-1.amazonaws.com',
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });

    case 'gmail':
      return nodemailer.createTransporter({
        service: 'gmail',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });

    default:
      return nodemailer.createTransporter({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });
  }
}

// Email templates
const emailTemplates = {
  'otp-verification': {
    subject: 'Your Verification Code',
    html: (data) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">Your Verification Code</h1>
        <p>Your verification code is:</p>
        <div style="background-color: #f0f0f0; padding: 20px; text-align: center; margin: 20px 0;">
          <h2 style="color: #333; margin: 0; font-size: 32px; letter-spacing: 5px;">${data.otpCode}</h2>
        </div>
        <p><strong>This code expires in ${data.expirationMinutes} minutes.</strong></p>
        <p>If you didn't request this code, please ignore this email.</p>
        <hr style="margin: 30px 0;">
        <p style="color: #666; font-size: 14px;">
          SGS Gita Alumni Network - Support: ${data.supportEmail}
        </p>
      </div>
    `,
    text: (data) => `
      Your verification code is: ${data.otpCode}
      This code expires in ${data.expirationMinutes} minutes.
      If you didn't request this code, please ignore this email.

      SGS Gita Alumni Network - Support: ${data.supportEmail}
    `
  },

  'alumni-invitation': {
    subject: 'Welcome to SGS Gita Alumni Network',
    html: (data) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">Welcome to SGS Gita Alumni Network</h1>
        <p>You've been invited to join our global alumni community.</p>
        <p><strong>Invited by:</strong> ${data.inviterName || 'SGS Gita Alumni Team'}</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${data.invitationLink}"
             style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Accept Invitation
          </a>
        </div>
        <p><strong>This invitation expires on ${data.expirationDate}.</strong></p>
        <hr style="margin: 30px 0;">
        <p style="color: #666; font-size: 14px;">
          SGS Gita Alumni Network - Support: ${data.supportEmail}
        </p>
      </div>
    `,
    text: (data) => `
      Welcome to SGS Gita Alumni Network

      You've been invited to join our global alumni community.
      Invited by: ${data.inviterName || 'SGS Gita Alumni Team'}

      Accept your invitation: ${data.invitationLink}

      This invitation expires on ${data.expirationDate}.

      SGS Gita Alumni Network - Support: ${data.supportEmail}
    `
  },

  'welcome': {
    subject: 'Welcome to SGS Gita Alumni Network!',
    html: (data) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">Welcome ${data.firstName}!</h1>
        <p>Your account has been created successfully.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${data.loginLink}"
             style="background-color: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Login to Your Account
          </a>
        </div>
        <p>Welcome to the SGS Gita Alumni Network community!</p>
        <hr style="margin: 30px 0;">
        <p style="color: #666; font-size: 14px;">
          SGS Gita Alumni Network - Support: ${data.supportEmail}
        </p>
      </div>
    `,
    text: (data) => `
      Welcome ${data.firstName}!

      Your account has been created successfully.

      Login to your account: ${data.loginLink}

      Welcome to the SGS Gita Alumni Network community!

      SGS Gita Alumni Network - Support: ${data.supportEmail}
    `
  }
};

// Send email function
export async function sendEmail(req, res) {
  try {
    const { to, from, subject, templateId, templateData, htmlContent, textContent } = req.body;

    // Validate required fields
    if (!to || !subject) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Email address and subject are required'
      });
    }

    // Create transporter
    const transporter = createTransporter();

    // Get template or use provided content
    let html, text;
    if (templateId && emailTemplates[templateId]) {
      const template = emailTemplates[templateId];
      html = template.html(templateData || {});
      text = template.text(templateData || {});
    } else if (htmlContent || textContent) {
      html = htmlContent;
      text = textContent;
    } else {
      return res.status(400).json({
        error: 'Invalid template or content',
        message: 'Must provide either templateId or htmlContent/textContent'
      });
    }

    // Prepare email options
    const mailOptions = {
      from: from || {
        name: process.env.EMAIL_FROM_NAME || 'SGS Gita Alumni Network',
        address: process.env.EMAIL_FROM || 'noreply@sgsgitaalumni.org'
      },
      to,
      subject,
      html,
      text
    };

    // Check if we should skip email sending in development
    if (process.env.DEV_SKIP_EMAIL === 'true') {
      console.log('📧 EMAIL SKIPPED (DEV MODE):', {
        to: mailOptions.to,
        subject: mailOptions.subject,
        templateId,
        templateData
      });
      return res.json({
        success: true,
        message: 'Email skipped in development mode',
        emailId: `dev-${Date.now()}`
      });
    }

    // Send email
    const result = await transporter.sendMail(mailOptions);

    // Log email delivery
    await logEmailDelivery({
      emailType: getEmailTypeFromTemplate(templateId),
      recipientEmail: to,
      templateId: templateId || 'custom',
      subject,
      messageId: result.messageId,
      status: 'sent'
    });

    res.json({
      success: true,
      message: 'Email sent successfully',
      emailId: result.messageId,
      messageId: result.messageId
    });

  } catch (error) {
    console.error('Email sending error:', error);

    // Log failed email delivery
    try {
      await logEmailDelivery({
        emailType: 'unknown',
        recipientEmail: req.body?.to || 'unknown',
        templateId: req.body?.templateId || 'unknown',
        subject: req.body?.subject || 'unknown',
        status: 'failed',
        error: error.message
      });
    } catch (logError) {
      console.error('Failed to log email delivery error:', logError);
    }

    res.status(500).json({
      error: 'Email delivery failed',
      message: error.message
    });
  }
}

// Get email delivery status
export async function getEmailDeliveryStatus(req, res) {
  try {
    const { emailId } = req.params;
    const pool = getPool();

    const [rows] = await pool.execute(`
      SELECT * FROM email_delivery_logs
      WHERE message_id = ? OR id = ?
      ORDER BY created_at DESC LIMIT 1
    `, [emailId, emailId]);

    if (rows.length === 0) {
      return res.status(404).json({
        error: 'Email not found',
        message: 'No email delivery record found'
      });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching email delivery status:', error);
    res.status(500).json({
      error: 'Failed to fetch email status',
      message: error.message
    });
  }
}

// Get email templates
export async function getEmailTemplate(req, res) {
  try {
    const { templateId } = req.params;

    if (emailTemplates[templateId]) {
      res.json(emailTemplates[templateId]);
    } else {
      res.status(404).json({
        error: 'Template not found',
        message: `Email template '${templateId}' not found`
      });
    }
  } catch (error) {
    console.error('Error fetching email template:', error);
    res.status(500).json({
      error: 'Failed to fetch email template',
      message: error.message
    });
  }
}

// Log email delivery to database
async function logEmailDelivery(logData) {
  try {
    const pool = getPool();
    const {
      emailType,
      recipientEmail,
      templateId,
      subject,
      messageId,
      status,
      error
    } = logData;

    await pool.execute(`
      INSERT INTO email_delivery_logs
      (email_type, recipient_email, template_id, subject, message_id, status, error_message, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
    `, [emailType, recipientEmail, templateId, subject, messageId, status, error]);

  } catch (error) {
    console.error('Failed to log email delivery:', error);
    // Don't throw - logging failures shouldn't break email sending
  }
}

// Helper function to determine email type from template
function getEmailTypeFromTemplate(templateId) {
  const typeMap = {
    'otp-verification': 'otp',
    'alumni-invitation': 'invitation',
    'welcome': 'welcome'
  };
  return typeMap[templateId] || 'unknown';
}

// Set email pool for testing
export function setEmailPool(pool) {
  // This function can be used for testing with a mock pool
}