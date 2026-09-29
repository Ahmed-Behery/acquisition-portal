import { SESSION_COOKIE, destroySession } from '@/server/sessions';
import { clearSessionCookie, methods } from '@/server/auth';

export default methods({
  POST: (req, res) => {
    destroySession(req.cookies && req.cookies[SESSION_COOKIE]);
    clearSessionCookie(res);
    res.json({ ok: true });
  },
});
