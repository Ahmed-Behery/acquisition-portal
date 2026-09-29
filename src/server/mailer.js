// Admin email notifications.
// A real SMTP transport is created only when SMTP_HOST is configured via env.
// Without it, admin alerts still appear in-app and are logged server-side.
import nodemailer from 'nodemailer';

export const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'Doaa.Orfy@contact.eg';

const globalRef = globalThis;

function createMailer() {
  if (!process.env.SMTP_HOST) {
    console.log('SMTP not configured — admin alerts are in-app + logged (set SMTP_HOST to enable real email).');
    return null;
  }
  console.log('SMTP configured — admin emails will be sent to', ADMIN_EMAIL);
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      : undefined,
  });
}

if (globalRef.__cgMailer === undefined) globalRef.__cgMailer = createMailer();

export const mailer = globalRef.__cgMailer;
export const smtpConfigured = !!globalRef.__cgMailer;

export async function sendAdminMail({ subject, text }) {
  if (!mailer) return { sent: false };
  try {
    await mailer.sendMail({
      from:
        process.env.SMTP_FROM ||
        `Contact Group Platform <${process.env.SMTP_USER || 'no-reply@contact.eg'}>`,
      to: ADMIN_EMAIL,
      subject,
      text,
    });
    return { sent: true };
  } catch (e) {
    return { sent: false, error: e.message };
  }
}
