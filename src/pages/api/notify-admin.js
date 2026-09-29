import { getStore, save } from '@/server/db';
import { withAuth, methods } from '@/server/auth';
import { randomId } from '@/server/sessions';
import { ADMIN_EMAIL, sendAdminMail } from '@/server/mailer';

const MAX_LOG_ENTRIES = 500;

// Admin email notification — called whenever any user submits a request.
// Logs the message and sends a real email if SMTP is configured.
export default methods({
  POST: withAuth(async (req, res) => {
    const { subject, body } = req.body || {};
    const store = getStore();
    store.data.adminEmailLog = store.data.adminEmailLog || [];

    const entry = {
      id: randomId('mail_'),
      to: ADMIN_EMAIL,
      from: req.user.email || req.user.username,
      subject: subject || '(no subject)',
      body: body || '',
      at: new Date().toISOString(),
      sent: false,
    };

    const { sent, error } = await sendAdminMail({ subject: entry.subject, text: entry.body });
    entry.sent = sent;
    if (error) entry.error = error;

    store.data.adminEmailLog.unshift(entry);
    if (store.data.adminEmailLog.length > MAX_LOG_ENTRIES) {
      store.data.adminEmailLog.length = MAX_LOG_ENTRIES;
    }
    save();
    res.json({ ok: true, sent: entry.sent });
  }),
});
