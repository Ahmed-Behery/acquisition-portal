import { getStore, publicUser, save, bcrypt } from '@/server/db';
import { newSession, randomId } from '@/server/sessions';
import { setSessionCookie, methods } from '@/server/auth';

// Register a new Relationship Manager account.
export default methods({
  POST: (req, res) => {
    const { name, username, email, department, jobTitle, password, confirm } = req.body || {};
    const store = getStore();

    if (!name || !username || !email || !department || !password) {
      return res.status(400).json({ error: 'All fields except Job Title are required.' });
    }
    if (username.trim().length < 3) {
      return res.status(400).json({ error: 'Username must be at least 3 characters.' });
    }
    if (password.length < 8 || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
      return res.status(400).json({ error: 'Password needs 8+ characters, one uppercase letter, and one number.' });
    }
    if (confirm !== undefined && password !== confirm) {
      return res.status(400).json({ error: 'Passwords do not match.' });
    }
    const uname = username.trim().toLowerCase();
    if (store.users.some((u) => u.username && u.username.toLowerCase() === uname)) {
      return res.status(409).json({ error: 'That username is already taken.' });
    }
    const company = store.data.companies.find((c) => c.code === department || c.id === department);
    if (!company) return res.status(400).json({ error: 'Invalid department.' });

    const user = {
      id: randomId('u_', 5),
      name: name.trim(),
      role: 'RM',
      companyId: company.id,
      email: email.trim(),
      username: uname,
      jobTitle: (jobTitle || 'Relationship Manager').trim(),
      passHash: bcrypt.hashSync(password, 10),
    };
    store.users.push(user);
    save();

    setSessionCookie(res, newSession(user.id));
    res.json({ user: publicUser(user) });
  },
});
