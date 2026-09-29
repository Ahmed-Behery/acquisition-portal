import { ROLES } from '@/constants/roles';
import { adminService } from '@/services/platformService';
import { todayLabel } from '@/utils/dates';
import { legacyLink } from '@/utils/links';
import { selectCompany, selectMe } from './selectors';

/**
 * Notification fan-out.
 *
 * Every function here mutates `state.notifications` and is called from inside a
 * `store.mutate(...)` recipe, matching the original's behaviour exactly.
 */

// The original built ids from `Date.now()`, which collides when a single action
// fans out to several recipients in the same millisecond — duplicate ids meant
// duplicate React keys and a notification that could not be selected. A counter
// makes them unique without changing the shape.
let sequence = 0;
export function notificationId(suffix = '') {
  sequence += 1;
  return `n_${Date.now()}_${sequence}${suffix ? '_' + suffix : ''}`;
}

export function pushNotification(state, { to, subject, body, link = '' }) {
  if (!to) return;
  state.notifications.unshift({
    id: notificationId(),
    to,
    subject,
    body,
    time: 'just now',
    read: false,
    link,
  });
}

/** Notifies the person who entered an entry, and the responsible RM if different. */
export function notifyEntrant(state, entry, subject, body) {
  const link = legacyLink('pipeline-detail', entry.id);
  const entrantId = entry.enteredBy || entry.rmId;
  pushNotification(state, { to: entrantId, subject, body, link });
  if (entry.rmId && entry.rmId !== entrantId) {
    pushNotification(state, { to: entry.rmId, subject, body, link });
  }
}

/**
 * Everyone who should be alerted to new prospects AND may express interest:
 * the CEO + MD leadership PLUS every directory recipient (MD / C-Level / Branch
 * Manager groups). `recipients` holds only directory employees, so the CEO/MD core
 * users must be added explicitly or they'd never be notified.
 */
export function leadershipAudienceIds(state, excludeId) {
  const ids = new Set();
  state.users.forEach((u) => {
    if (u.role === ROLES.CEO || u.role === ROLES.MD || ['MD', 'C-Level', 'Branch Manager'].includes(u.group)) {
      ids.add(u.id);
    }
  });
  state.recipients.forEach((r) => ids.add(r.id));
  if (excludeId) ids.delete(excludeId);
  return [...ids];
}

/** CEO, MD, and every directory level (MD / C-Level / Branch Manager) may flag interest. */
export function canExpressInterest(user) {
  return Boolean(
    user && (user.role === ROLES.MD || user.role === ROLES.CEO || ['MD', 'C-Level', 'Branch Manager'].includes(user.group))
  );
}

/** Broadcast to the full leadership distribution list. */
export function notifyRecipients(state, entry, subject, body) {
  const link = legacyLink('pipeline-detail', entry.id);
  leadershipAudienceIds(state).forEach((to) => pushNotification(state, { to, subject, body, link }));
}

/**
 * Alerts the Admin on every submitted request: in-app notification + real email
 * (if SMTP is configured) + server-side log.
 */
export function notifyAdmin(state, subject, body, link = '') {
  const admin = state.users.find((u) => u.role === ROLES.ADMIN);
  const actor = selectMe(state);
  const companyPart = actor?.companyId ? ' · ' + (selectCompany(state, actor.companyId)?.code || '') : '';
  const fullBody = `${body}\n\nSubmitted by: ${actor?.name} (${actor?.role}${companyPart})`;

  if (admin) {
    pushNotification(state, { to: admin.id, subject: '[Admin Alert] ' + subject, body: fullBody, link });
  }
  // Fire-and-forget: the in-app alert above is the authoritative one.
  adminService.notifyAdmin('[Contact Group] ' + subject, fullBody);
}

/** Appends a comment / validation-history line to a pipeline entry. */
export function addCommentToEntry(state, entry, text, type = 'note') {
  const user = selectMe(state);
  if (!entry.comments) entry.comments = [];
  entry.comments.push({ by: user.id, role: user.role, text, type, at: todayLabel() });
}
