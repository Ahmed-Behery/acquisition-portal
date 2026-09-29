import { RELEASE_NOTIFY_IDS, ROLES } from '@/constants/roles';
import { dialogs } from '@/utils/dialogs';
import { legacyLink } from '@/utils/links';
import { notifyAdmin, pushNotification } from '../notifications';
import { selectClient, selectCompany, selectMe, selectPipelineEntry, selectUser } from '../selectors';

/** Merchant-side actions: cross-company alignment, approach support, Good to Go. */

const NO_NAV = {};

/** Asks the owning RM to align before approaching a client in their book. */
export function requestAlignment(store, clientId) {
  const state0 = store.getState();
  const client = selectClient(state0, clientId);
  const rm = selectUser(state0, client.rmId);
  if (
    !dialogs.confirm(
      `Send alignment request to ${rm.name} (${selectCompany(state0, rm.companyId).code}) regarding ${client.name}?\n\n${rm.name} will be notified that you intend to approach this client and will coordinate with you before any direct contact.`
    )
  ) {
    return NO_NAV;
  }

  return store.mutate((state) => {
    const target = selectClient(state, clientId);
    const user = selectMe(state);
    const owner = selectUser(state, target.rmId);
    const myCompany = user.companyId
      ? selectCompany(state, user.companyId).name
      : user.role === ROLES.ADMIN
        ? 'Group Admin'
        : user.role;
    const link = legacyLink('client-detail', clientId);

    pushNotification(state, {
      to: target.rmId,
      subject: `[Alignment Request] ${user.name} requests alignment on ${target.name}`,
      body: `${user.name} (${myCompany}) has requested alignment regarding ${target.name}.\n\nThis client is in your book. ${user.name} would like to coordinate before any approach to discuss potential cross-company opportunities.\n\nPlease reach out to ${user.name} at ${user.email}.`,
      link,
    });
    notifyAdmin(
      state,
      `Alignment request: ${target.name}`,
      `${user.name} requested alignment with ${owner.name} regarding existing client ${target.name}.`,
      link
    );

    dialogs.alert(
      `Alignment request sent to ${owner.name}. They have been notified to coordinate with you before any approach.`
    );
    return NO_NAV;
  });
}

/**
 * Asks the responsible RM to support approaching a client.
 * Works from All Merchants, the Pipeline list, and the new-entry screen.
 * `kind` is 'client' (merchant) or 'pipeline' (pipeline entry).
 */
export function sendApproachSupport(store, kind, recordId, message) {
  return store.mutate((state) => {
    const record = kind === 'client' ? selectClient(state, recordId) : selectPipelineEntry(state, recordId);
    if (!record) return NO_NAV;

    const user = selectMe(state);
    const name = kind === 'client' ? record.name : record.prospect;
    const rm = selectUser(state, record.rmId);
    const myCompanyCode = user.companyId
      ? selectCompany(state, user.companyId).code
      : user.role === ROLES.ADMIN
        ? 'Group'
        : user.role;
    const link = legacyLink(kind === 'client' ? 'client-detail' : 'pipeline-detail', recordId);
    const trimmed = (message || '').trim();

    pushNotification(state, {
      to: record.rmId,
      subject: `[Support Requested] ${user.name} wants to approach ${name}`,
      body: `${user.name} (${myCompanyCode}) is requesting your support to approach ${name}, which sits in your book.\n\n${trimmed ? 'Message: "' + trimmed + '"\n\n' : ''}Please coordinate with ${user.name} (${user.email}) before any direct contact.`,
      link,
    });
    // Records an email to the related RM (delivered for real once SMTP is configured;
    // logged otherwise).
    notifyAdmin(
      state,
      `Approach support requested: ${name}`,
      `To: ${rm.name} <${rm.email}>\n\n${user.name} requested support to approach ${name} (${kind === 'client' ? 'existing merchant' : 'pipeline entry'}).${trimmed ? '\n\nMessage: "' + trimmed + '"' : ''}\n\nPlease coordinate before any direct contact.`,
      link
    );

    dialogs.alert(
      `Request sent to ${rm.name}. They’ve been notified to coordinate with you before you approach ${name}.`
    );
    return NO_NAV;
  });
}

/** Releases a merchant to the Good to Go list. */
export function moveClientToGoodToGo(store, clientId) {
  const client0 = selectClient(store.getState(), clientId);
  if (!client0) return NO_NAV;
  if (!dialogs.confirm(`Move "${client0.name}" to the Good to Go list?`)) return NO_NAV;

  return store.mutate((state) => {
    const client = selectClient(state, clientId);
    const user = selectMe(state);
    const link = legacyLink('client-detail', clientId);

    client.status = 'Good to Go';

    RELEASE_NOTIFY_IDS.forEach((to) =>
      pushNotification(state, {
        to,
        subject: `[Good to Go] Merchant moved: ${client.name}`,
        body: `A merchant has been moved to the Good to Go list and is now available group-wide for re-engagement.\n\nMerchant: ${client.name}\nCode: ${client.code}\nIndustry: ${client.industry}\nOriginating RM: ${selectUser(state, client.rmId).name}\nCompany: ${selectCompany(state, client.companyId).name}`,
        link,
      })
    );
    // Also notify the originating RM if not the one doing the move.
    if (user.id !== client.rmId) {
      pushNotification(state, {
        to: client.rmId,
        subject: `[Good to Go] Your merchant was moved: ${client.name}`,
        body: `Your merchant ${client.name} (${client.code}) has been moved to the Good to Go list by ${user.name} (${user.role}).\n\nIt is now visible to all RMs group-wide for re-engagement.`,
        link,
      });
    }

    dialogs.alert('Moved to Good to Go. MD, CEO, HoP, and the originating RM have been notified.');
    return NO_NAV;
  });
}
