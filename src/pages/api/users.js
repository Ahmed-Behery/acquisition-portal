import { getStore, publicUser, save, bcrypt, DEFAULT_PASSWORD } from '@/server/db';
import { withRole, methods } from '@/server/auth';
import { randomId } from '@/server/sessions';

// Admin: create an employee login account (also becomes a notification recipient).
export default methods({
  POST: withRole('Admin', (req, res) => {
    const { name, email, group } = req.body || {};
    if (!name || !email) return res.status(400).json({ error: 'Name and email are required.' });

    const store = getStore();
    const base = email.split('@')[0].toLowerCase();
    let username = base;
    let n = 1;
    while (store.users.some((u) => u.username === username)) username = base + ++n;

    const user = {
      id: randomId('e_'),
      name: name.trim(),
      role: 'Employee',
      companyId: null,
      email: email.trim(),
      username,
      jobTitle: group || 'Employee',
      group: group || 'Branch Manager',
      passHash: bcrypt.hashSync(DEFAULT_PASSWORD, 10),
    };
    store.users.push(user);
    store.data.recipients = store.data.recipients || [];
    store.data.recipients.push({ id: user.id, name: user.name, email: user.email, group: user.group });
    save();

    res.json({ user: publicUser(user) });
  }),
});
