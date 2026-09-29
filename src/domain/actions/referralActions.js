import { dialogs } from '@/utils/dialogs';
import { todayLabel } from '@/utils/dates';
import { notifyAdmin, pushNotification } from '../notifications';
import { selectMe, selectProduct, selectUser } from '../selectors';

/**
 * Department leads — opportunities initiated by another department (e.g. IT),
 * directed to a C-level, who can then delegate them onward.
 */

const REFERRALS_LINK = 'referrals';

export function submitReferral(store, { company, department, toLeaderId, productId, description }) {
  return store.mutate((state) => {
    const user = selectMe(state);
    const leader = selectUser(state, toLeaderId);

    const referral = {
      id: 'ref_' + Date.now(),
      company,
      description,
      productId,
      fromDept: department,
      fromUserId: user.id,
      fromName: user.name,
      toLeaderId,
      status: 'Open',
      delegatedTo: null,
      delegatedToName: null,
      createdAt: todayLabel(),
    };
    state.referrals.unshift(referral);

    pushNotification(state, {
      to: toLeaderId,
      subject: `[Department Lead] ${company} — directed to you`,
      body: `${user.name} (${department}) has directed an opportunity to you: ${company}.${productId ? '\nProduct: ' + (selectProduct(state, productId)?.name || '') : ''}${description ? '\n\n' + description : ''}\n\nOpen "Department Leads" to review and delegate it to your team.`,
      link: REFERRALS_LINK,
    });
    notifyAdmin(
      state,
      `Department lead: ${company}`,
      `${user.name} (${department}) directed a lead "${company}" to ${leader ? leader.name : '—'}.`,
      REFERRALS_LINK
    );

    dialogs.alert(`Referral sent to ${leader ? leader.name : 'the C-level'}.`);
    return {};
  });
}

export function delegateReferral(store, referralId, { delegateId, message }) {
  return store.mutate((state) => {
    const referral = state.referrals.find((r) => r.id === referralId);
    if (!referral) return {};
    const user = selectMe(state);
    const delegate = selectUser(state, delegateId);

    referral.status = 'Delegated';
    referral.delegatedTo = delegateId;
    referral.delegatedToName = delegate ? delegate.name : null;
    referral.delegatedAt = todayLabel();

    pushNotification(state, {
      to: delegateId,
      subject: `[Lead delegated to you] ${referral.company}`,
      body: `${user.name} has delegated a department lead to you: ${referral.company}.${referral.productId ? '\nProduct: ' + (selectProduct(state, referral.productId)?.name || '') : ''}${message ? '\n\nMessage: "' + message + '"' : ''}\n\nPlease open the opportunity and create a pipeline entry.`,
      link: REFERRALS_LINK,
    });
    notifyAdmin(
      state,
      `Lead delegated: ${referral.company}`,
      `${user.name} delegated department lead "${referral.company}" to ${delegate ? delegate.name : '—'}.`,
      REFERRALS_LINK
    );

    dialogs.alert(`Delegated to ${delegate ? delegate.name : 'the team member'}. They have been notified.`);
    return {};
  });
}
