import { publicUser } from '@/server/db';
import { withAuth, methods } from '@/server/auth';

export default methods({
  GET: withAuth((req, res) => res.json({ user: publicUser(req.user) })),
});
