/**
 * OMR Result Notifier — Phase 3-E
 *
 * Sends email and SMS notifications to students/guardians after their
 * OMR result is published.
 *
 * Email uses Resend (already installed in project).
 * SMS uses BulkSMSBD gateway (lib/sms.ts already in project).
 */

import { Resend } from 'resend';
import { sendSMS } from '@/lib/sms';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface OMRNotificationPayload {
  studentName:     string;
  studentEmail:    string | null;
  guardianEmail:   string | null;
  guardianPhone:   string | null;
  examName:        string;
  instituteName:   string;
  totalScore:      number;
  maxScore:        number;
  percentage:      number;
  grade:           string;
  rollNumber:      string;
  registrationNo:  string;
  scanId:          string;
  appUrl?:         string;
}

export interface NotificationResult {
  emailSent:  boolean;
  smsSent:    boolean;
  errors:     string[];
}

// ─── Email template ───────────────────────────────────────────────────────────

function buildEmailHTML(p: OMRNotificationPayload): string {
  const certUrl = `${p.appUrl || 'https://rofazacademy.dev'}/api/omr/certificate/${p.scanId}`;
  const resultUrl = `${p.appUrl || 'https://rofazacademy.dev'}/exams/results`;

  const gradeColor = p.percentage >= 80 ? '#10b981'
    : p.percentage >= 60 ? '#f59e0b'
    : p.percentage >= 33 ? '#6366f1'
    : '#ef4444';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>OMR Result — ${p.examName}</title>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Inter,Helvetica,Arial,sans-serif;">
  <div style="max-width:560px;margin:32px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#5b21b6,#7c3aed);padding:28px 32px;">
      <div style="font-size:20px;font-weight:700;color:#ffffff;letter-spacing:0.3px;">${p.instituteName}</div>
      <div style="font-size:12px;color:#c4b5fd;margin-top:4px;">Official OMR Examination Result</div>
    </div>

    <!-- Body -->
    <div style="padding:28px 32px;">
      <p style="font-size:14px;color:#374151;margin:0 0 20px;">Dear <strong>${p.studentName}</strong>,</p>
      <p style="font-size:14px;color:#374151;margin:0 0 24px;">
        Your OMR result for <strong>${p.examName}</strong> has been published.
      </p>

      <!-- Score card -->
      <div style="background:#f8f7ff;border:1px solid #e5e7eb;border-radius:12px;padding:20px;margin-bottom:24px;text-align:center;">
        <div style="font-size:11px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px;">Total Marks</div>
        <div style="font-size:40px;font-weight:800;color:#1e1b4b;line-height:1;">${p.totalScore.toFixed(2)}</div>
        <div style="font-size:12px;color:#6b7280;margin-top:4px;">out of ${p.maxScore}</div>
        <div style="margin-top:16px;display:flex;justify-content:center;gap:32px;">
          <div>
            <div style="font-size:11px;color:#9ca3af;">Percentage</div>
            <div style="font-size:18px;font-weight:700;color:#374151;">${p.percentage.toFixed(1)}%</div>
          </div>
          <div>
            <div style="font-size:11px;color:#9ca3af;">Grade</div>
            <div style="font-size:18px;font-weight:700;color:${gradeColor};">${p.grade}</div>
          </div>
          <div>
            <div style="font-size:11px;color:#9ca3af;">Roll</div>
            <div style="font-size:18px;font-weight:700;color:#374151;">${p.rollNumber}</div>
          </div>
        </div>
      </div>

      <!-- CTAs -->
      <div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:24px;">
        <a href="${certUrl}" style="flex:1;min-width:140px;display:block;text-align:center;background:#5b21b6;color:#ffffff;text-decoration:none;padding:12px 16px;border-radius:10px;font-size:13px;font-weight:600;">
          📄 Download Marksheet
        </a>
        <a href="${resultUrl}" style="flex:1;min-width:140px;display:block;text-align:center;background:#f3f4f6;color:#374151;text-decoration:none;padding:12px 16px;border-radius:10px;font-size:13px;font-weight:600;border:1px solid #e5e7eb;">
          🔍 View All Results
        </a>
      </div>

      <p style="font-size:12px;color:#9ca3af;margin:0;">
        This is an official computer-generated result from ${p.instituteName}. 
        If you have questions, contact your teacher or the examination office.
      </p>
    </div>

    <!-- Footer -->
    <div style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:16px 32px;text-align:center;">
      <div style="font-size:11px;color:#9ca3af;">${p.instituteName} · Powered by Rofaz Academy OMR Intelligence</div>
      <div style="font-size:10px;color:#d1d5db;margin-top:4px;">rofazacademy.dev</div>
    </div>
  </div>
</body>
</html>`;
}

function buildSMSText(p: OMRNotificationPayload): string {
  return `${p.instituteName}: Dear ${p.studentName}, your ${p.examName} result: ${p.totalScore.toFixed(0)}/${p.maxScore} (${p.percentage.toFixed(1)}% - Grade ${p.grade}). Download marksheet: ${p.appUrl || 'https://rofazacademy.dev'}/api/omr/certificate/${p.scanId}`;
}

// ─── Notifier function ────────────────────────────────────────────────────────

/**
 * Sends result notification via email (Resend) and/or SMS (BulkSMSBD).
 * Both are non-fatal — errors are collected and returned without throwing.
 */
export async function sendOMRResultNotification(
  payload: OMRNotificationPayload
): Promise<NotificationResult> {
  const result: NotificationResult = { emailSent: false, smsSent: false, errors: [] };
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'noreply@rofazacademy.dev';
  const resendKey = process.env.RESEND_API_KEY;

  // ── Email ────────────────────────────────────────────────────────────────
  const emailRecipients = [payload.studentEmail, payload.guardianEmail]
    .filter((e): e is string => !!e && e.includes('@'));

  if (emailRecipients.length > 0 && resendKey) {
    try {
      const resend = new Resend(resendKey);
      await resend.emails.send({
        from:    `${payload.instituteName} <${fromEmail}>`,
        to:      emailRecipients,
        subject: `📋 OMR Result Published — ${payload.examName} | ${payload.grade} (${payload.percentage.toFixed(1)}%)`,
        html:    buildEmailHTML(payload),
      });
      result.emailSent = true;
    } catch (err: any) {
      result.errors.push(`Email error: ${err.message}`);
    }
  }

  // ── SMS ──────────────────────────────────────────────────────────────────
  const smsPhone = payload.guardianPhone;
  if (smsPhone && process.env.SMS_API_KEY) {
    try {
      const smsResult = await sendSMS(smsPhone, buildSMSText(payload));
      result.smsSent = smsResult.success;
      if (!smsResult.success) {
        result.errors.push(`SMS error: ${smsResult.error || 'Unknown SMS failure'}`);
      }
    } catch (err: any) {
      result.errors.push(`SMS exception: ${err.message}`);
    }
  }

  return result;
}
