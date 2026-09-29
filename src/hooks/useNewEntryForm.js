import { useCallback, useMemo, useState } from 'react';
import { ROLES } from '@/constants/roles';
import { screenProspectName } from '@/domain/pipelineRules';
import { isPastDate } from '@/utils/dates';

const EMPTY_LATE = { closure: '', reason: '', minutes: '', fileName: null };

/**
 * Form state for the New Entry screen.
 *
 * Holds the values, derives the screening result (AML + duplicates) and the late-entry
 * flag from them, and converts to/from the draft shape used by browser storage.
 */
export function useNewEntryForm({ state, user, reengage }) {
  const isOwner = user.role === ROLES.RM || user.role === ROLES.EMPLOYEE;
  const lockedCompanyId = reengage ? reengage.companyId : isOwner ? user.companyId : '';

  const [form, setForm] = useState(() => ({
    inList: reengage ? 'true' : '',
    name: reengage ? reengage.name : '',
    freeName: '',
    existingMatch: false,
    industry: '',
    companySize: '',
    governorate: '',
    commercialRegister: '',
    contactPerson: '',
    contactTitle: '',
    contactMobile: '',
    contactEmail: '',
    companyId: lockedCompanyId || state.companies[0]?.id || '',
    rmId: user.id,
    value: '',
    visitDate: '',
    expectedClose: '',
    summary: '',
    products: [],
    attendees: [user.id],
    late: { ...EMPTY_LATE },
  }));

  const update = useCallback((patch) => setForm((previous) => ({ ...previous, ...patch })), []);
  const updateLate = useCallback(
    (patch) => setForm((previous) => ({ ...previous, late: { ...previous.late, ...patch } })),
    []
  );

  const toggleProduct = useCallback(
    (productId) =>
      setForm((previous) => ({
        ...previous,
        products: previous.products.includes(productId)
          ? previous.products.filter((id) => id !== productId)
          : [...previous.products, productId],
      })),
    []
  );

  const addAttendee = useCallback(
    (userId) =>
      setForm((previous) =>
        previous.attendees.includes(userId)
          ? previous
          : { ...previous, attendees: [...previous.attendees, userId] }
      ),
    []
  );

  const removeAttendee = useCallback(
    (userId) =>
      setForm((previous) => ({ ...previous, attendees: previous.attendees.filter((id) => id !== userId) })),
    []
  );

  /** Directory pick, manual entry, or clearing the choice. */
  const pickProspect = useCallback(
    (company, options = {}) =>
      setForm((previous) => ({
        ...previous,
        inList: 'true',
        name: company.name,
        freeName: '',
        existingMatch: Boolean(options.existingMatch),
        // A directory record can pre-fill the commercial register, but never
        // overwrite something the RM already typed.
        commercialRegister: previous.commercialRegister || company.crn || '',
      })),
    []
  );

  const pickNotIncluded = useCallback(
    () => setForm((previous) => ({ ...previous, inList: 'false', name: '', existingMatch: false })),
    []
  );

  const clearProspect = useCallback(
    () => setForm((previous) => ({ ...previous, inList: '', name: '', freeName: '', existingMatch: false })),
    []
  );

  const effectiveName = form.inList === 'false' ? form.freeName.trim() : form.name.trim();

  const screening = useMemo(
    () => screenProspectName(state, effectiveName, { skipDuplicateCheck: Boolean(reengage) }),
    [state, effectiveName, reengage]
  );

  const isLate = isPastDate(form.visitDate, state.today);

  /** Applies a stored draft over the current values. */
  const applyDraft = useCallback((draft) => {
    setForm((previous) => ({
      ...previous,
      inList: draft.inList || previous.inList,
      name: draft.inList === 'false' ? previous.name : draft.name || previous.name,
      freeName: draft.inList === 'false' ? draft.name || '' : previous.freeName,
      industry: draft.industry || '',
      companySize: draft.companySize || '',
      governorate: draft.governorate || '',
      commercialRegister: draft.commercialRegister || '',
      contactPerson: draft.contactPerson || '',
      contactTitle: draft.contactTitle || '',
      contactMobile: draft.contactMobile || '',
      contactEmail: draft.contactEmail || '',
      companyId: draft.companyId || previous.companyId,
      rmId: draft.rmId || previous.rmId,
      value: draft.value || '',
      visitDate: draft.visitDate || '',
      expectedClose: draft.expectedClose || '',
      summary: draft.summary || '',
      products: draft.products?.length ? draft.products : previous.products,
      attendees: draft.attendees?.length ? draft.attendees : previous.attendees,
    }));
  }, []);

  return {
    form,
    update,
    updateLate,
    toggleProduct,
    addAttendee,
    removeAttendee,
    pickProspect,
    pickNotIncluded,
    clearProspect,
    applyDraft,
    effectiveName,
    screening,
    isLate,
    isOwner,
    lockedCompanyId,
  };
}

/** The shape stored in browser draft storage. */
export function toDraft(form, effectiveName, reengage) {
  return {
    inList: form.inList,
    name: effectiveName,
    industry: form.industry,
    companySize: form.companySize,
    governorate: form.governorate,
    commercialRegister: form.commercialRegister,
    contactPerson: form.contactPerson,
    contactTitle: form.contactTitle,
    contactMobile: form.contactMobile,
    contactEmail: form.contactEmail,
    companyId: form.companyId,
    rmId: form.rmId,
    value: form.value,
    visitDate: form.visitDate,
    expectedClose: form.expectedClose,
    summary: form.summary,
    products: [...form.products],
    attendees: [...form.attendees],
    reengage: reengage ? { ...reengage } : null,
  };
}
