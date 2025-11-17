/**
 * PDF Generation Service
 *
 * Generates PDF consent forms for COPPA compliance
 */

import jsPDF from 'jspdf';
import type { FamilyMember } from './familyMemberService';

export interface ConsentFormData {
  familyMember: FamilyMember;
  digitalSignature: string; // base64 PNG
  termsVersion: string;
  parentName?: string;
  consentDate: Date;
  ipAddress?: string;
}

export class PDFGenerationService {
  /**
   * Generate a COPPA parental consent form PDF
   */
  static generateConsentForm(data: ConsentFormData): jsPDF {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const contentWidth = pageWidth - 2 * margin;
    let yPos = 20;

    // Header
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('COPPA Parental Consent Form', pageWidth / 2, yPos, { align: 'center' });
    yPos += 15;

    // Subtitle
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('SGS Gita Alumni Platform', pageWidth / 2, yPos, { align: 'center' });
    yPos += 15;

    // Horizontal line
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 10;

    // Child Information Section
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Child Information', margin, yPos);
    yPos += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Name: ${data.familyMember.display_name}`, margin, yPos);
    yPos += 6;
    doc.text(`Age: ${data.familyMember.current_age || 'N/A'}`, margin, yPos);
    yPos += 6;
    doc.text(`Relationship: ${data.familyMember.relationship}`, margin, yPos);
    yPos += 10;

    // Consent Details Section
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Consent Details', margin, yPos);
    yPos += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Date: ${data.consentDate.toLocaleDateString()}`, margin, yPos);
    yPos += 6;
    doc.text(`Time: ${data.consentDate.toLocaleTimeString()}`, margin, yPos);
    yPos += 6;
    doc.text(`Terms Version: ${data.termsVersion}`, margin, yPos);
    yPos += 6;
    if (data.ipAddress) {
      doc.text(`IP Address: ${data.ipAddress}`, margin, yPos);
      yPos += 6;
    }
    yPos += 10;

    // Terms and Conditions Section
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Terms and Conditions', margin, yPos);
    yPos += 8;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    const termsText = [
      'By providing my digital signature below, I confirm that:',
      '',
      '• I am the parent or legal guardian of the child listed above',
      '• I authorize my child (ages 14-17) to access the SGS Gita Alumni platform',
      '• I understand that my child\'s personal information will be collected, used, and',
      '  disclosed as described in the Privacy Policy',
      '• I consent to my child creating and managing their profile, participating in',
      '  community discussions, and accessing age-appropriate content',
      '• This consent is valid for one year from the date of signature and may be',
      '  revoked at any time',
      '• I have read and agree to the Terms of Service and Privacy Policy',
      '',
      'Your Rights: You may review your child\'s information, request deletion, or revoke',
      'consent at any time through your account settings or by contacting support.'
    ];

    termsText.forEach(line => {
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }
      doc.text(line, margin, yPos);
      yPos += 5;
    });

    yPos += 10;

    // Digital Signature Section
    if (yPos > 220) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Parent/Guardian Digital Signature', margin, yPos);
    yPos += 8;

    // Add signature image
    try {
      // Add signature with a border
      const sigHeight = 30;
      const sigWidth = 80;

      // Draw border for signature
      doc.setDrawColor(150, 150, 150);
      doc.rect(margin, yPos, sigWidth, sigHeight);

      // Add signature image
      doc.addImage(data.digitalSignature, 'PNG', margin + 2, yPos + 2, sigWidth - 4, sigHeight - 4);
      yPos += sigHeight + 8;
    } catch (error) {
      console.error('Error adding signature to PDF:', error);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'italic');
      doc.text('[Signature could not be embedded]', margin, yPos);
      yPos += 10;
    }

    if (data.parentName) {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Signed by: ${data.parentName}`, margin, yPos);
      yPos += 8;
    }

    // Footer
    yPos = doc.internal.pageSize.getHeight() - 20;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(100, 100, 100);
    doc.text(
      'This document was electronically generated and is legally binding.',
      pageWidth / 2,
      yPos,
      { align: 'center' }
    );
    yPos += 4;
    doc.text(
      `Document ID: ${data.familyMember.id} | Generated: ${new Date().toISOString()}`,
      pageWidth / 2,
      yPos,
      { align: 'center' }
    );

    return doc;
  }

  /**
   * Generate and download consent form
   */
  static downloadConsentForm(data: ConsentFormData): void {
    const pdf = this.generateConsentForm(data);
    const fileName = `consent_${data.familyMember.display_name.replace(/\s+/g, '_')}_${
      data.consentDate.toISOString().split('T')[0]
    }.pdf`;
    pdf.save(fileName);
  }

  /**
   * Generate and get blob for upload
   */
  static getConsentFormBlob(data: ConsentFormData): Blob {
    const pdf = this.generateConsentForm(data);
    return pdf.output('blob');
  }

  /**
   * Generate and get base64 string
   */
  static getConsentFormBase64(data: ConsentFormData): string {
    const pdf = this.generateConsentForm(data);
    return pdf.output('dataurlstring');
  }
}
