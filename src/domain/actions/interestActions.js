import { HOP_USER_ID, ROLES } from '@/constants/roles';
import { INTEREST_CONTACT_SLA_DAYS } from '@/constants/pipeline';
import { dialogs } from '@/utils/dialogs';
import { addWorkingDays, isoDate, todayLabel } from '@/utils/dates';
import { legacyLink } from '@/utils/links';
import { pushNotification } from '../notifications';
import { pipeProductLines } from '../pipelineRules';
import { selectCompany, selectMe, selectPipelineEntry, selectProduct, selectUser } from '../selectors';

/** Leadership "I'm interested" flags, delegation, and the 2-working-day contact SLA. */

const NO_NAV = {};

/** The manager an overdue escalation goes to (demo: MD, then CEO). */
function managerOf(state) {
  return state.users.find((x) => x.role === ROLES.MD) || state.users.find((x) => x.role === ROLES.CEO) || null;
}

/**
 * Escalates any interest flag not contacted within its 2-working-day window.
 * Runs once after the state loads; idempotent thanks to the `escalated` marker.
 */
export function checkContactSLAs(store, today) {
  return store.mutate((state) => {
    let escalations = 0;
    state.pipeline.forEach((entry) => {
      (entry.interestedFlags || []).forEach((flag) => {
        if (flag.contacted || flag.escalated || !flag.dueDate || today <= flag.dueDate) return;
        flag.escalated = true;
        escalations += 1;

        const ownerId = entry.enteredBy || entry.rmId;
        const owner = selectUser(state, ownerId);
        const manager = managerOf(state);
        const link = legacyLink('pipeline-detail', entry.id);

        if (manager) {
          pushNotification(state, {
            to: manager.id,
            subject: `[Escalation] ${owner ? owner.name : 'An RM'} did not contact an interested colleague — ${entry.prospect}`,
            body: `${owner ? owner.name : 'The RM'} did not contact ${flag.name} (${flag.role}), who expressed interest in ${entry.prospect}, within the ${INTEREST_CONTACT_SLA_DAYS} working-day SLA (was due ${flag.dueDate}).\n\nPlease follow up.`,
            link,
          });
        }
        pushNotification(state, {
          to: ownerId,
          subject: `[Overdue] Contact ${flag.name} — escalated to your manager`,
          body: `You did not mark contact with ${flag.name} (${flag.role}) within ${INTEREST_CONTACT_SLA_DAYS} working days for ${entry.prospect}. This has now been escalated to your manager. Please contact them and click “Mark contacted”.`,
          link,
        });
      });
    });
    return { escalations };
  });
}

/** A leader flags interest, optionally delegating the lead to a team member. */
export function flagInterest(store, entryId, { productId, delegateId, message }) {
  return store.mutate((state) => {
    const entry = selectPipelineEntry(state, entryId);
    if (!entry) return { ok: false };
    const user = selectMe(state);

    if (!entry.interestedFlags) entry.interestedFlags = [];
    if (entry.interestedFlags.some((f) => f.userId === user.id)) {
      dialogs.alert('You have already flagged this entry.');
      return { ok: false, alreadyFlagged: true };
    }

    const delegate = delegateId ? selectUser(state, delegateId) : null;
    entry.interestedFlags.push({
      userId: user.id,
      name: user.name,
      role: user.role,
      message,
      productId,
      delegatedTo: delegate ? delegate.id : null,
      delegatedToName: delegate ? delegate.name : null,
      flaggedAt: todayLabel(),
      dueDate: isoDate(addWorkingDays(new Date(), INTEREST_CONTACT_SLA_DAYS)),
      contacted: false,
      escalated: false,
    });

    // Add the leader's related product to the entry's product lines.
    if (!Array.isArray(entry.productLines) || !entry.productLines.length) {
      entry.productLines = pipeProductLines(entry).map((line) => ({ ...line }));
    }
    if (productId && !entry.productLines.some((l) => l.productId === productId)) {
      entry.productLines.push({
        productId,
        addedBy: user.id,
        addedByRole: user.role,
        subStatus: 'Negotiation',
        main: false,
        viaInterest: true,
      });
    }
    entry.lastUpdate = todayLabel();

    const rm = selectUser(state, entry.rmId);
    const entrantId = entry.enteredBy || entry.rmId;
    const prName = selectProduct(state, productId)?.name || '';
    const msgLine = message ? `\n\nMessage: "${message}"` : '';
    const link = legacyLink('pipeline-detail', entryId);

    if (delegate) {
      pushNotification(state, {
        to: delegate.id,
        subject: `[Lead delegated to you] ${entry.prospect}`,
        body: `${user.name} (${user.role}) has delegated a lead to you: ${entry.prospect}.\nRelated product: ${prName}.${msgLine}\n\nPlease open the opportunity. The responsible RM (${rm.name}) will call you to coordinate.`,
        link,
      });
      [entrantId, entry.rmId]
        .filter((v, i, a) => v && a.indexOf(v) === i)
        .forEach((to) =>
          pushNotification(state, {
            to,
            subject: `[Interest forwarded] ${entry.prospect} — call ${delegate.name}`,
            body: `${user.name} (${user.role}) is interested in ${entry.prospect} and forwarded it to ${delegate.name} on their team.\nRelated product: ${prName}.${msgLine}\n\nPlease call ${delegate.name} (${delegate.email || '—'}) within ${INTEREST_CONTACT_SLA_DAYS} working days and mark contacted.`,
            link,
          })
        );
    } else {
      pushNotification(state, {
        to: entrantId,
        subject: `[I'm Interested] ${user.name} on ${entry.prospect}`,
        body: `${user.name} (${user.role}) is interested in ${entry.prospect}.\nRelated product: ${prName}.${msgLine}\n\nPlease coordinate with ${user.name} (${user.email}) before the visit on ${entry.visitDate || 'TBD'}.`,
        link,
      });
      if (entry.rmId !== entrantId) {
        pushNotification(state, {
          to: entry.rmId,
          subject: `[I'm Interested] ${user.name} on ${entry.prospect}`,
          body: `${user.name} (${user.role}) is interested in ${entry.prospect}.\nRelated product: ${prName}.${msgLine}\n\nCoordinate with ${user.name} (${user.email}).`,
          link,
        });
      }
    }

    pushNotification(state, {
      to: HOP_USER_ID,
      subject: `[Potential Client] ${entry.prospect} flagged by ${user.name}`,
      body: `${user.name} (${user.role}) is interested in ${entry.prospect}${delegate ? ' (delegated to ' + delegate.name + ')' : ''}.\nRelated product: ${prName}.${msgLine}\n\nResponsible RM: ${rm.name} · ${selectCompany(state, entry.companyId).name}`,
      link,
    });

    dialogs.alert(
      delegate
        ? `Lead delegated to ${delegate.name}. They and the RM have been notified; you'll see the updates.`
        : 'Interest sent to the initiator.'
    );
    return { ok: true };
  });
}

export function unflagInterest(store, entryId) {
  if (!dialogs.confirm('Remove your interest flag from this entry?')) return NO_NAV;

  return store.mutate((state) => {
    const entry = selectPipelineEntry(state, entryId);
    if (!entry?.interestedFlags) return NO_NAV;
    const user = selectMe(state);

    entry.interestedFlags = entry.interestedFlags.filter((f) => f.userId !== user.id);
    if (entry.interestedFlags.length === 0) delete entry.interestedFlags;
    entry.lastUpdate = todayLabel();

    dialogs.alert('Flag removed.');
    return NO_NAV;
  });
}

/** The initiator marks that they contacted an interested colleague. */
export function markContacted(store, entryId, flaggerId) {
  return store.mutate((state) => {
    const entry = selectPipelineEntry(state, entryId);
    if (!entry?.interestedFlags) return NO_NAV;
    const flag = entry.interestedFlags.find((x) => x.userId === flaggerId);
    if (!flag || flag.contacted) return NO_NAV;

    const user = selectMe(state);
    flag.contacted = true;
    flag.contactedAt = todayLabel();
    flag.contactedBy = user.id;
    entry.lastUpdate = todayLabel();

    // Who was actually called: the delegate where a lead was delegated, else the leader.
    const contactId = flag.delegatedTo || flag.userId;
    const link = legacyLink('pipeline-detail', entryId);

    pushNotification(state, {
      to: contactId,
      subject: `[Contacted] ${user.name} has reached out — ${entry.prospect}`,
      body: `${user.name} (${user.role}) has marked that they contacted you regarding ${entry.prospect}. They will coordinate with you.`,
      link,
    });
    // If delegated, keep the delegating C-level in the loop.
    if (flag.delegatedTo && flag.userId !== contactId) {
      pushNotification(state, {
        to: flag.userId,
        subject: `[Update] Your delegate ${flag.delegatedToName || ''} was contacted — ${entry.prospect}`,
        body: `${user.name} has contacted ${flag.delegatedToName || 'your delegate'} about ${entry.prospect}, which you delegated. The opportunity is moving forward.`,
        link,
      });
    }

    dialogs.alert(
      `Marked as contacted. ${selectUser(state, contactId)?.name || 'The contact'} has been notified${
        flag.delegatedTo ? `, and ${selectUser(state, flag.userId)?.name || 'the delegating leader'} can see the update` : ''
      }.`
    );
    return NO_NAV;
  });
}
