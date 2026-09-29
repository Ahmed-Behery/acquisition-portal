import { getStore, publicUser, bcrypt } from '@/server/db';
import { newSession } from '@/server/sessions';
import { setSessionCookie, methods } from '@/server/auth';

export default methods({
  POST: (req, res) => {
    const { username, password } = req.body || {};
    const store = getStore();
    const uname = (username || '').trim().toLowerCase();
    const user = store.users.find((u) => u.username && u.username.toLowerCase() === uname);
    if (!user || !bcrypt.compareSync(password || '', user.passHash)) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }
    setSessionCookie(res, newSession(user.id));
    res.json({ user: publicUser(user) });
  },
});
