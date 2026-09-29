import { dialogs } from '@/utils/dialogs';
import { pushNotification } from '../notifications';
import { staleEntries } from '../pipelineRules';
import { daysSinceUpdate } from '@/utils/dates';
import { legacyLink } from '@/utils/links';
import { STALE_ENTRY_DAYS } from '@/constants/pipeline';

/** Reference-list maintenance and the weekly reminder sweep. */

export function addIndustry(store, name) {
  const value = (name || '').trim();
  if (!value) return { ok: false };
  if (store.getState().industries.some((i) => i.name.toLowerCase() === value.toLowerCase())) {
    dialogs.alert('That industry already exists.');
    return { ok: false };
  }
  return store.mutate((state) => {
    state.industries.push({ id: 'ind_' + Date.now(), name: value });
    return { ok: true };
  });
}

export function deleteIndustry(store, id) {
  if (!dialogs.confirm('Delete this industry?')) return { ok: false };
  return store.mutate((state) => {
    state.industries = state.industries.filter((i) => i.id !== id);
    return { ok: true };
  });
}

export function addProduct(store, { name, category }) {
  const value = (name || '').trim();
  if (!value) return { ok: false };
  return store.mutate((state) => {
    state.products.push({
      id: 'p_' + Date.now(),
      name: value,
      category: (category || '').trim() || 'General',
      offeredBy: [],
      contact: '',
      email: '',
      desc: '',
    });
    return { ok: true };
  });
}

export function deleteProduct(store, id) {
  if (!dialogs.confirm('Delete this product? It will also be removed from any entries that referenced it.')) {
    return { ok: false };
  }
  return store.mutate((state) => {
    state.products = state.products.filter((p) => p.id !== id);
    state.pipeline.forEach((p) => {
      if (p.productsOfInterest) p.productsOfInterest = p.productsOfInterest.filter((x) => x !== id);
    });
    state.clients.forEach((c) => {
      if (c.productsSold) c.productsSold = c.productsSold.filter((x) => x !== id);
    });
    return { ok: true };
  });
}

export function addEgyptCompany(store, name) {
  const value = (name || '').trim();
  if (!value) return { ok: false };
  if (store.getState().egyptCompanies.some((c) => c.name.toLowerCase() === value.toLowerCase())) {
    dialogs.alert('Already in the list.');
    return { ok: false };
  }
  return store.mutate((state) => {
    state.egyptCompanies.push({ id: 'eg_' + Date.now(), name: value, jurisdiction: 'eg' });
    return { ok: true };
  });
}

export function deleteEgyptCompany(store, id) {
  if (!dialogs.confirm('Remove from the fallback list?')) return { ok: false };
  return store.mutate((state) => {
    state.egyptCompanies = state.egyptCompanies.filter((c) => c.id !== id);
    return { ok: true };
  });
}

/**
 * Manual trigger for the weekly reminder run.
 * In production this would be a scheduled job; here it is a button on the CEO / MD /
 * HoP dashboards so the feature can be demonstrated.
 */
export function runWeeklyReminders(store, today) {
  const stale = staleEntries(store.getState(), today, STALE_ENTRY_DAYS);
  if (stale.length === 0) {
    dialogs.alert(`No stale pipeline entries found.\n\nAll entries have been updated within the last ${STALE_ENTRY_DAYS} days.`);
    return { ok: false };
  }
  if (
    !dialogs.confirm(
      `Send weekly reminder emails to entrants of ${stale.length} stale pipeline entries?\n\n(In production this runs automatically every Monday morning.)`
    )
  ) {
    return { ok: false };
  }

  return store.mutate((state) => {
    const entries = staleEntries(state, today, STALE_ENTRY_DAYS);
    entries.forEach((entry) => {
      const days = daysSinceUpdate(entry, today);
      pushNotification(state, {
        to: entry.enteredBy || entry.rmId,
        subject: `[Reminder] Update needed — ${entry.prospect}`,
        body: `Weekly reminder: your pipeline entry for ${entry.prospect} has not been updated in ${days} days.\n\nPlease open the entry and update its status — set the next stage, record meeting outcomes, or move it to Good to Go if no longer active.\n\nRegular updates keep MD, CEO, and the Head of Products informed and prevent entries from being auto-archived.`,
        link: legacyLink('pipeline-detail', entry.id),
      });
    });

    dialogs.alert(
      `Sent ${entries.length} reminder ${entries.length === 1 ? 'email' : 'emails'}.\n\nSwitch to the relevant RMs to see the reminders in their inbox.`
    );
    return { ok: true, sent: entries.length };
  });
}
