// ============================================================================
// EMAIL SERVICE - OTP & INVITATION EMAIL DELIVERY
// ============================================================================
// Supports SendGrid, AWS SES, Gmail (dev), and custom SMTP

import nodemailer from 'nodemailer';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';

// ============================================================================
// EMAIL SERVICE CLASS
// ============================================================================

class EmailService {
  constructor() {
    this.provider = process.env.SMTP_PROVIDER || 'sendgrid';
    this.transporter = null;
    this.sesClient = null;
    this.devMode = process.env.NODE_ENV === 'development';
    this.skipEmail = process.env.DEV_SKIP_EMAIL === 'true';
    this.logOTP = process.env.DEV_LOG_OTP === 'true';
    
    this.initialize();
  }

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  initialize() {
    try {
      if (this.skipEmail) {
        console.log('[EmailService] Running in development mode - emails will be logged to console');
        return;
      }

      switch (this.provider) {
        case 'sendgrid':
          this.initializeSendGrid();
          break;
        case 'aws-ses':
          this.initializeAWSSES();
          break;
        case 'gmail':
          this.initializeGmail();
          break;
        case 'custom':
          this.initializeCustomSMTP();
          break;
        default:
          console.warn(`[EmailService] Unknown provider: ${this.provider}, using console logging`);
          this.skipEmail = true;
      }
    } catch (error) {
      console.error('[EmailService] Initialization error:', error);
      this.skipEmail = true;
    }
  }

  initializeSendGrid() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.sendgrid.net',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER || 'apikey',
        pass: process.env.SMTP_PASS || process.env.SENDGRID_API_KEY
      }
    });
    console.log('[EmailService] Initialized with SendGrid');
  }

  initializeAWSSES() {
    this.sesClient = new SESClient({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
      }
    });
    console.log('[EmailService] Initialized with AWS SES');
  }

  initializeGmail() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
    console.log('[EmailService] Initialized with Gmail (Development Only)');
  }

  initializeCustomSMTP() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
    console.log('[EmailService] Initialized with custom SMTP');
  }

  // ============================================================================
  // OTP EMAIL TEMPLATE
  // ============================================================================

  getOTPEmailTemplate(otpCode, expiryMinutes = 5) {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Your OTP Code</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              background-color: #f5f5f5;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 600px;
              margin: 40px auto;
              background-color: #ffffff;
              border-radius: 8px;
              overflow: hidden;
              box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: #ffffff;
              padding: 30px 20px;
              text-align: center;
            }
            .header h1 {
              margin: 0;
              font-size: 24px;
              font-weight: 600;
            }
            .content {
              padding: 40px 30px;
            }
            .otp-box {
              background-color: #f8f9fa;
              border: 2px dashed #667eea;
              border-radius: 8px;
              padding: 30px;
              text-align: center;
              margin: 30px 0;
            }
            .otp-code {
              font-size: 36px;
              font-weight: bold;
              color: #667eea;
              letter-spacing: 8px;
              font-family: 'Courier New', monospace;
            }
            .expiry {
              color: #e74c3c;
              font-size: 14px;
              margin-top: 15px;
              font-weight: 500;
            }
            .info {
              background-color: #e3f2fd;
              border-left: 4px solid #2196f3;
              padding: 15px;
              margin: 20px 0;
              border-radius: 4px;
            }
            .footer {
              background-color: #f8f9fa;
              padding: 20px;
              text-align: center;
              font-size: 12px;
              color: #6c757d;
              border-top: 1px solid #e9ecef;
            }
            .button {
              display: inline-block;
              padding: 12px 30px;
              background-color: #667eea;
              color: #ffffff;
              text-decoration: none;
              border-radius: 5px;
              margin: 20px 0;
              font-weight: 500;
            }
            .warning {
              color: #856404;
              background-color: #fff3cd;
              border: 1px solid #ffeaa7;
              padding: 12px;
              border-radius: 4px;
              margin: 20px 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 Your OTP Code</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">SGS Gita Alumni Network</p>
            </div>
            
            <div class="content">
              <p>Hello,</p>
              <p>We received a request to authenticate your account. Please use the following One-Time Password (OTP) to complete your verification:</p>
              
              <div class="otp-box">
                <div class="otp-code">${otpCode}</div>
                <div class="expiry">⏱️ Expires in ${expiryMinutes} minutes</div>
              </div>
              
              <div class="info">
                <strong>ℹ️ Important:</strong>
                <ul style="margin: 10px 0; padding-left: 20px;">
                  <li>This code is valid for ${expiryMinutes} minutes only</li>
                  <li>Do not share this code with anyone</li>
                  <li>We will never ask for your OTP via phone or email</li>
                </ul>
              </div>
              
              <p>If you didn't request this code, please ignore this email or contact our support team if you have concerns.</p>
              
              <div class="warning">
                <strong>⚠️ Security Notice:</strong> SGS Gita Alumni Network staff will never ask you to share your OTP code.
              </div>
            </div>
            
            <div class="footer">
              <p>© 2025 SGS Gita Alumni Network. All rights reserved.</p>
              <p style="margin: 5px 0;">
                <a href="mailto:${process.env.EMAIL_SUPPORT || 'support@sgsgitaalumni.org'}" style="color: #667eea; text-decoration: none;">
                  Contact Support
                </a>
              </p>
            </div>
          </div>
        </body>
      </html>
    `;

    const text = `
Your OTP Code - SGS Gita Alumni Network

Hello,

We received a request to authenticate your account. Please use the following One-Time Password (OTP):

OTP CODE: ${otpCode}

This code expires in ${expiryMinutes} minutes.

IMPORTANT:
- Do not share this code with anyone
- We will never ask for your OTP via phone or email
- If you didn't request this code, please ignore this email

© 2025 SGS Gita Alumni Network
Contact: ${process.env.EMAIL_SUPPORT || 'support@sgsgitaalumni.org'}
    `.trim();

    return { html, text };
  }

  // ============================================================================
  // INVITATION EMAIL TEMPLATE
  // ============================================================================

  getInvitationEmailTemplate(invitationToken, inviteeEmail, inviterName) {
    const invitationUrl = `${process.env.INVITATION_BASE_URL || 'http://localhost:5173/invitation'}/${invitationToken}`;
    const expiryDays = process.env.INVITATION_EXPIRY_DAYS || 30;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>You're Invited!</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              background-color: #f5f5f5;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 600px;
              margin: 40px auto;
              background-color: #ffffff;
              border-radius: 8px;
              overflow: hidden;
              box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: #ffffff;
              padding: 40px 20px;
              text-align: center;
            }
            .header h1 {
              margin: 0;
              font-size: 28px;
              font-weight: 600;
            }
            .content {
              padding: 40px 30px;
            }
            .button {
              display: inline-block;
              padding: 15px 40px;
              background-color: #667eea;
              color: #ffffff !important;
              text-decoration: none;
              border-radius: 5px;
              margin: 25px 0;
              font-weight: 600;
              font-size: 16px;
            }
            .footer {
              background-color: #f8f9fa;
              padding: 20px;
              text-align: center;
              font-size: 12px;
              color: #6c757d;
              border-top: 1px solid #e9ecef;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 You're Invited!</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">Join SGS Gita Alumni Network</p>
            </div>
            
            <div class="content">
              <p>Hello,</p>
              <p><strong>${inviterName}</strong> has invited you to join the <strong>SGS Gita Alumni Network</strong>!</p>
              
              <p>Our platform connects alumni, enables collaboration, and helps you stay connected with the SGS Gita community.</p>
              
              <div style="text-align: center;">
                <a href="${invitationUrl}" class="button">Accept Invitation</a>
              </div>
              
              <p style="font-size: 14px; color: #6c757d;">
                Or copy and paste this link into your browser:<br>
                <a href="${invitationUrl}" style="color: #667eea; word-break: break-all;">${invitationUrl}</a>
              </p>
              
              <p style="margin-top: 30px; padding: 15px; background-color: #fff3cd; border-radius: 4px; font-size: 14px;">
                ⏰ This invitation expires in <strong>${expiryDays} days</strong>. Please accept it soon!
              </p>
            </div>
            
            <div class="footer">
              <p>© 2025 SGS Gita Alumni Network. All rights reserved.</p>
              <p style="margin: 5px 0;">
                Questions? <a href="mailto:${process.env.EMAIL_SUPPORT || 'support@sgsgitaalumni.org'}" style="color: #667eea; text-decoration: none;">Contact Support</a>
              </p>
            </div>
          </div>
        </body>
      </html>
    `;

    const text = `
You're Invited to Join SGS Gita Alumni Network!

Hello,

${inviterName} has invited you to join the SGS Gita Alumni Network.

To accept this invitation, please visit:
${invitationUrl}

This invitation expires in ${expiryDays} days.

© 2025 SGS Gita Alumni Network
Questions? Contact: ${process.env.EMAIL_SUPPORT || 'support@sgsgitaalumni.org'}
    `.trim();

    return { html, text };
  }

  // ============================================================================
  // SEND EMAIL METHODS
  // ============================================================================

  async sendOTPEmail(toEmail, otpCode, expiryMinutes = 5) {
    try {
      const { html, text } = this.getOTPEmailTemplate(otpCode, expiryMinutes);
      const subject = `Your OTP Code: ${otpCode}`;

      // Re-check dev mode at runtime to ensure env vars are loaded
      const isDev = process.env.NODE_ENV === 'development';
      const shouldSkip = process.env.DEV_SKIP_EMAIL === 'true' || this.skipEmail || this.devMode;

      if (shouldSkip || isDev) {
        console.log('\n' + '='.repeat(60));
        console.log('📧 [EmailService] OTP EMAIL (Development Mode)');
        console.log('='.repeat(60));
        console.log(`To: ${toEmail}`);
        console.log(`Subject: ${subject}`);
        console.log(`OTP Code: ${otpCode}`);
        console.log(`Expires: ${expiryMinutes} minutes`);
        console.log('='.repeat(60) + '\n');
        return { success: true, mode: 'development' };
      }

      if (this.provider === 'aws-ses') {
        return await this.sendViaSES(toEmail, subject, html, text);
      } else {
        return await this.sendViaSMTP(toEmail, subject, html, text);
      }
    } catch (error) {
      console.error('[EmailService] Send OTP email error:', error);
      throw error;
    }
  }

  async sendInvitationEmail(toEmail, invitationToken, inviterName = 'An administrator') {
    try {
      const { html, text } = this.getInvitationEmailTemplate(invitationToken, toEmail, inviterName);
      const subject = `You're invited to join SGS Gita Alumni Network!`;

      // Re-check dev mode at runtime to ensure env vars are loaded
      const isDev = process.env.NODE_ENV === 'development';
      const shouldSkip = process.env.DEV_SKIP_EMAIL === 'true' || this.skipEmail || this.devMode;

      if (shouldSkip || isDev) {
        console.log('\n' + '='.repeat(60));
        console.log('📧 [EmailService] INVITATION EMAIL (Development Mode)');
        console.log('='.repeat(60));
        console.log(`To: ${toEmail}`);
        console.log(`Subject: ${subject}`);
        console.log(`Token: ${invitationToken}`);
        console.log(`Invited by: ${inviterName}`);
        console.log('='.repeat(60) + '\n');
        return { success: true, mode: 'development' };
      }

      if (this.provider === 'aws-ses') {
        return await this.sendViaSES(toEmail, subject, html, text);
      } else {
        return await this.sendViaSMTP(toEmail, subject, html, text);
      }
    } catch (error) {
      console.error('[EmailService] Send invitation email error:', error);
      throw error;
    }
  }

  // ============================================================================
  // SMTP TRANSPORT
  // ============================================================================

  async sendViaSMTP(to, subject, html, text) {
    if (!this.transporter) {
      throw new Error('SMTP transporter not initialized');
    }

    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || 'SGS Gita Alumni'}" <${process.env.EMAIL_FROM || 'noreply@sgsgitaalumni.org'}>`,
      to,
      subject,
      html,
      text
    };

    const info = await this.transporter.sendMail(mailOptions);
    console.log('[EmailService] Email sent via SMTP:', info.messageId);
    
    return {
      success: true,
      messageId: info.messageId,
      provider: this.provider
    };
  }

  // ============================================================================
  // AWS SES TRANSPORT
  // ============================================================================

  async sendViaSES(to, subject, html, text) {
    if (!this.sesClient) {
      throw new Error('AWS SES client not initialized');
    }

    const params = {
      Source: `"${process.env.EMAIL_FROM_NAME || 'SGS Gita Alumni'}" <${process.env.EMAIL_FROM || 'noreply@sgsgitaalumni.org'}>`,
      Destination: {
        ToAddresses: [to]
      },
      Message: {
        Subject: {
          Data: subject,
          Charset: 'UTF-8'
        },
        Body: {
          Html: {
            Data: html,
            Charset: 'UTF-8'
          },
          Text: {
            Data: text,
            Charset: 'UTF-8'
          }
        }
      }
    };

    const command = new SendEmailCommand(params);
    const result = await this.sesClient.send(command);
    
    console.log('[EmailService] Email sent via AWS SES:', result.MessageId);
    
    return {
      success: true,
      messageId: result.MessageId,
      provider: 'aws-ses'
    };
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const emailService = new EmailService();
export default emailService;
