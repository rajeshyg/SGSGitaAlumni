/**
 * Moderation Notification Service
 * 
 * Handles sending email notifications for moderation actions:
 * - Approval notifications to posting authors
 * - Rejection notifications with feedback
 * - Escalation notifications to admins and authors
 * 
 * Task: Action 8 - Moderator Review System
 * Date: November 3, 2025
 */

const nodemailer = require('nodemailer');
const db = require('../db');

// Email configuration (should match existing email service)
const transporter = nodemailer.createTransporter({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: process.env.EMAIL_PORT || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

/**
 * Send moderation notification
 * 
 * @param {string} type - Type of notification: 'approval', 'rejection', 'escalation'
 * @param {object} data - Notification data
 */
async function sendModerationNotification(type, data) {
  try {
    switch (type) {
      case 'approval':
        await sendApprovalNotification(data);
        break;
      case 'rejection':
        await sendRejectionNotification(data);
        break;
      case 'escalation':
        await sendEscalationNotification(data);
        break;
      default:
        throw new Error(`Unknown notification type: ${type}`);
    }
  } catch (error) {
    console.error(`Failed to send ${type} notification:`, error);
    throw error;
  }
}

/**
 * Send approval notification to posting author
 */
async function sendApprovalNotification(data) {
  const { postingId, postingTitle, authorEmail, moderatorName } = data;
  
  // Get author email if not provided
  let recipientEmail = authorEmail;
  if (!recipientEmail || !recipientEmail.includes('@')) {
    const [users] = await db.query(
      `SELECT u.email 
       FROM app_users u 
       INNER JOIN POSTINGS p ON p.created_by = u.id 
       WHERE p.id = ?`,
      [postingId]
    );
    if (users.length > 0) {
      recipientEmail = users[0].email;
    }
  }
  
  const postingUrl = `${process.env.APP_URL || 'http://localhost:3000'}/postings/${postingId}`;
  
  const subject = '✅ Your posting has been approved!';
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #10b981; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background-color: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }
        .button { 
          display: inline-block; 
          padding: 12px 24px; 
          background-color: #10b981; 
          color: white; 
          text-decoration: none; 
          border-radius: 6px; 
          margin: 20px 0; 
        }
        .footer { margin-top: 20px; font-size: 12px; color: #6b7280; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Great News!</h1>
        </div>
        <div class="content">
          <p>Hello,</p>
          
          <p>Your posting <strong>"${postingTitle}"</strong> has been approved by our moderation team and is now live on the platform!</p>
          
          <p>Community members can now see and interact with your posting.</p>
          
          <a href="${postingUrl}" class="button">View Your Posting</a>
          
          <p>Thank you for contributing to our community!</p>
          
          <div class="footer">
            <p>This posting was reviewed by ${moderatorName}</p>
            <p>If you have any questions, please contact our support team.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
  
  await transporter.sendMail({
    from: `"Alumni Platform" <${process.env.EMAIL_USER}>`,
    to: recipientEmail,
    subject,
    html
  });
  
  console.log(`Approval notification sent to ${recipientEmail} for posting ${postingId}`);
}

/**
 * Send rejection notification with feedback to posting author
 */
async function sendRejectionNotification(data) {
  const { postingId, postingTitle, authorEmail, rejectionReason, feedback, moderatorName } = data;
  
  // Get author email if not provided
  let recipientEmail = authorEmail;
  if (!recipientEmail || !recipientEmail.includes('@')) {
    const [users] = await db.query(
      `SELECT u.email 
       FROM app_users u 
       INNER JOIN POSTINGS p ON p.created_by = u.id 
       WHERE p.id = ?`,
      [postingId]
    );
    if (users.length > 0) {
      recipientEmail = users[0].email;
    }
  }
  
  const editUrl = `${process.env.APP_URL || 'http://localhost:3000'}/postings/${postingId}/edit`;
  
  // Get human-readable rejection reason
  const reasonLabels = {
    SPAM: 'Spam or unsolicited content',
    INAPPROPRIATE: 'Inappropriate or offensive content',
    DUPLICATE: 'Duplicate posting',
    SCAM: 'Potential scam or fraudulent content',
    INCOMPLETE: 'Incomplete information',
    OTHER: 'Does not meet community guidelines'
  };
  const reasonText = reasonLabels[rejectionReason] || rejectionReason;
  
  const subject = '📝 Action needed: Your posting requires changes';
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #ef4444; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background-color: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }
        .reason-box { 
          background-color: #fef2f2; 
          border-left: 4px solid #ef4444; 
          padding: 15px; 
          margin: 20px 0; 
        }
        .feedback-box { 
          background-color: #fff; 
          border: 1px solid #e5e7eb; 
          padding: 15px; 
          margin: 20px 0; 
          border-radius: 6px; 
        }
        .button { 
          display: inline-block; 
          padding: 12px 24px; 
          background-color: #3b82f6; 
          color: white; 
          text-decoration: none; 
          border-radius: 6px; 
          margin: 20px 0; 
        }
        .footer { margin-top: 20px; font-size: 12px; color: #6b7280; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📝 Posting Requires Changes</h1>
        </div>
        <div class="content">
          <p>Hello,</p>
          
          <p>Your posting <strong>"${postingTitle}"</strong> was not approved for the following reason:</p>
          
          <div class="reason-box">
            <strong>${reasonText}</strong>
          </div>
          
          <div class="feedback-box">
            <h3>Moderator Feedback:</h3>
            <p>${feedback}</p>
          </div>
          
          <p>You can edit your posting and resubmit it for review:</p>
          
          <a href="${editUrl}" class="button">Edit Your Posting</a>
          
          <p>If you have questions about this decision, please contact our moderator team.</p>
          
          <div class="footer">
            <p>This posting was reviewed by ${moderatorName}</p>
            <p>We're here to help ensure all postings meet our community standards.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
  
  await transporter.sendMail({
    from: `"Alumni Platform" <${process.env.EMAIL_USER}>`,
    to: recipientEmail,
    subject,
    html
  });
  
  console.log(`Rejection notification sent to ${recipientEmail} for posting ${postingId}`);
}

/**
 * Send escalation notification to admins and inform author
 */
async function sendEscalationNotification(data) {
  const { postingId, postingTitle, authorEmail, escalationReason, escalationNotes, moderatorName } = data;
  
  // Get all admin emails
  const [admins] = await db.query(
    `SELECT email FROM app_users WHERE role = 'admin'`
  );
  const adminEmails = admins.map(admin => admin.email);
  
  if (adminEmails.length === 0) {
    console.warn('No admin users found for escalation notification');
    return;
  }
  
  // Get author email if not provided
  let authorRecipientEmail = authorEmail;
  if (!authorRecipientEmail || !authorRecipientEmail.includes('@')) {
    const [users] = await db.query(
      `SELECT u.email 
       FROM app_users u 
       INNER JOIN POSTINGS p ON p.created_by = u.id 
       WHERE p.id = ?`,
      [postingId]
    );
    if (users.length > 0) {
      authorRecipientEmail = users[0].email;
    }
  }
  
  const reviewUrl = `${process.env.APP_URL || 'http://localhost:3000'}/moderator/queue?posting=${postingId}`;
  
  // Get human-readable escalation reason
  const reasonLabels = {
    SUSPECTED_SCAM: 'Suspected scam - needs admin review',
    POLICY_QUESTION: 'Policy question - admin guidance needed',
    TECHNICAL_ISSUE: 'Technical issue with posting',
    OTHER: 'Other escalation reason'
  };
  const reasonText = reasonLabels[escalationReason] || escalationReason;
  
  // Send notification to admins
  const adminSubject = '⚠️ Posting escalated for admin review';
  const adminHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #f59e0b; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background-color: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }
        .info-box { 
          background-color: #fff; 
          border: 1px solid #e5e7eb; 
          padding: 15px; 
          margin: 20px 0; 
          border-radius: 6px; 
        }
        .button { 
          display: inline-block; 
          padding: 12px 24px; 
          background-color: #f59e0b; 
          color: white; 
          text-decoration: none; 
          border-radius: 6px; 
          margin: 20px 0; 
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>⚠️ Posting Escalated</h1>
        </div>
        <div class="content">
          <p>Hello Admin Team,</p>
          
          <p>A posting has been escalated for your review:</p>
          
          <div class="info-box">
            <p><strong>Posting:</strong> "${postingTitle}"</p>
            <p><strong>Escalation Reason:</strong> ${reasonText}</p>
            <p><strong>Moderator Notes:</strong></p>
            <p>${escalationNotes}</p>
            <p><strong>Escalated by:</strong> ${moderatorName}</p>
          </div>
          
          <p>Please review this posting and take appropriate action:</p>
          
          <a href="${reviewUrl}" class="button">Review Posting</a>
        </div>
      </div>
    </body>
    </html>
  `;
  
  // Send to all admins
  for (const adminEmail of adminEmails) {
    await transporter.sendMail({
      from: `"Alumni Platform" <${process.env.EMAIL_USER}>`,
      to: adminEmail,
      subject: adminSubject,
      html: adminHtml
    });
  }
  
  console.log(`Escalation notification sent to ${adminEmails.length} admins for posting ${postingId}`);
  
  // Send notification to author
  const authorSubject = '⏳ Your posting is under additional review';
  const authorHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #3b82f6; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background-color: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }
        .footer { margin-top: 20px; font-size: 12px; color: #6b7280; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>⏳ Additional Review in Progress</h1>
        </div>
        <div class="content">
          <p>Hello,</p>
          
          <p>Your posting <strong>"${postingTitle}"</strong> is currently under additional review by our admin team.</p>
          
          <p>We'll notify you as soon as a decision is made.</p>
          
          <p>Thank you for your patience!</p>
          
          <div class="footer">
            <p>If you have urgent questions, please contact our support team.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
  
  await transporter.sendMail({
    from: `"Alumni Platform" <${process.env.EMAIL_USER}>`,
    to: authorRecipientEmail,
    subject: authorSubject,
    html: authorHtml
  });
  
  console.log(`Escalation notification sent to author ${authorRecipientEmail} for posting ${postingId}`);
}

module.exports = {
  sendModerationNotification
};
