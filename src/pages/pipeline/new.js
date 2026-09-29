import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import PageMeta from '@/components/common/PageMeta';
import PageHead from '@/components/common/PageHead';
import Banner from '@/components/common/Banner';
import Card from '@/components/common/Card';
import Field from '@/components/common/Field';
import ProspectLookup from '@/components/pipeline/new/ProspectLookup';
import ScreeningBanners, { DuplicateBlockNotice } from '@/components/pipeline/new/ScreeningBanners';
import NewEntryFields, { ProductPicker } from '@/components/pipeline/new/NewEntryFields';
import AttendeePicker from '@/components/pipeline/new/AttendeePicker';
import LateEntryBlock from '@/components/pipeline/new/LateEntryBlock';
import ReengageHistoryCard from '@/components/pipeline/new/ReengageHistoryCard';
import ApproachSupportModal from '@/components/modals/ApproachSupportModal';
import { ROLES } from '@/constants/roles';
import { useActions } from '@/hooks/useActions';
import { useAppState, useCurrentUser } from '@/hooks/useAppStore';
import { useDrafts } from '@/hooks/useDrafts';
import { toDraft, useNewEntryForm } from '@/hooks/useNewEntryForm';
import { draftHasContent } from '@/services/draftStorage';
import { dialogs } from '@/utils/dialogs';
import { linkToHref, routes } from '@/utils/links';
import { withProtectedPage } from '@/server/pageGuard';

/** Create a pipeline entry — directory lookup, screening, and the late-entry path. */
export default function NewPipelineEntryPage() {
  const router = useRouter();
  const state = useAppState();
  const user = useCurrentUser();
  const actions = useActions();
  const drafts = useDrafts(user.id);

  const reengage = state.session.reengageCtx;
  const editingDraftId = state.session.editingDraftId;
  const [supportRequest, setSupportRequest] = useState(null);

  const entry = useNewEntryForm({ state, user, reengage });
  const { form, update, screening, effectiveName, isLate } = entry;

  // Keep the latest values reachable from the route-change listener below without
  // re-registering it on every keystroke.
  const snapshotRef = useRef();
  snapshotRef.current = toDraft(form, effectiveName, reengage);
  const submittedRef = useRef(false);

  // Resume a saved draft, once, as soon as the page mounts.
  useEffect(() => {
    const { draft } = actions.pipeline.consumeDraftResume();
    if (draft) entry.applyDraft(draft);
    // Runs once for the life of the screen.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Leaving an unfinished entry without submitting keeps it as a draft — the same
  // safety net the original had, now tied to the router instead of a global hook.
  useEffect(() => {
    const keepAsDraft = () => {
      if (submittedRef.current) return;
      const draft = snapshotRef.current;
      if (!draftHasContent(draft)) return;
      drafts.save(draft, { auto: true, editingId: editingDraftId });
    };
    router.events.on('routeChangeStart', keepAsDraft);
    return () => router.events.off('routeChangeStart', keepAsDraft);
  }, [router.events, drafts, editingDraftId]);

  const saveDraft = () => {
    const draft = snapshotRef.current;
    if (!draftHasContent(draft)) {
      dialogs.alert('Nothing to save yet — add at least the prospect name or some details first.');
      return;
    }
    drafts.save(draft, { auto: false, editingId: editingDraftId });
    submittedRef.current = true; // don't double-save via the auto-hook
    actions.pipeline.clearEditingDraft();
    dialogs.alert('Draft saved. You can resume it from the "Drafts" button on the Pipeline page.');
    router.push(routes.pipeline());
  };

  const openRecord = (duplicate) => router.push(linkToHref(`${duplicate.page}/${duplicate.id}`));

  const save = () => {
    const validationError = validate(form, effectiveName, screening, isLate);
    if (validationError) {
      dialogs.alert(validationError);
      return;
    }

    // An active pipeline entry or a Good-to-Go item cannot be entered twice.
    if (screening.blocked) {
      const { duplicate } = screening;
      dialogs.alert(
        `"${effectiveName}" already exists in ${duplicate.where} (${duplicate.code || '—'}, owner ${duplicate.owner}, status ${duplicate.status}).\n\nDuplicates are not allowed. Taking you to the existing record now.`
      );
      openRecord(duplicate);
      return;
    }

    submittedRef.current = true;
    if (editingDraftId) {
      drafts.remove(editingDraftId);
      actions.pipeline.clearEditingDraft();
    }

    const result = actions.pipeline.createPipelineEntry({
      name: effectiveName,
      notIncluded: form.inList === 'false',
      industry: form.industry.trim(),
      companyId: form.companyId,
      rmId: form.rmId,
      products: form.products,
      value: parseFloat(form.value),
      visitDate: form.visitDate,
      expectedClose: form.expectedClose,
      summary: form.summary.trim(),
      companySize: form.companySize,
      governorate: form.governorate,
      commercialRegister: form.commercialRegister.trim(),
      contactPerson: form.contactPerson.trim(),
      contactTitle: form.contactTitle.trim(),
      contactMobile: form.contactMobile.trim(),
      contactEmail: form.contactEmail.trim(),
      amlStatus: screening.aml.status,
      attendees: form.attendees,
      crossSell: screening.crossSell,
      isLate,
      late: form.late,
    });

    dialogs.alert(
      `Prospect "${effectiveName}" saved — ${result.statusLine}\n\n${result.audienceCount} leaders & recipients were notified (incl. CEO and MD).\n\nNext: the Product Catalogue.`
    );
  };

  const autoValidated = user.role === ROLES.HEAD_OF_PRODUCTS;

  return (
    <>
      <PageMeta
        title={reengage ? 'Re-engage a prospect' : 'New pipeline entry'}
        description="Capture a prospect, screen it for duplicates and AML matches, and notify group leadership."
      />
      <PageHead
        title={reengage ? 'Re-engage — New Pipeline Entry' : 'New Pipeline Entry'}
        subtitle={
          reengage
            ? `Creating a fresh opportunity for ${reengage.name} (from Good to Go). The company is fixed.`
            : 'Entries picked from the directory go straight to First Meeting; “Not included” names are sent to the Head of Products to validate. Leadership is notified on save.'
        }
      />

      {reengage ? <ReengageHistoryCard reengage={reengage} /> : null}

      <Card style={{ maxWidth: 820 }}>
        <ProspectLookup
          form={form}
          reengage={reengage}
          onPick={entry.pickProspect}
          onPickNotIncluded={entry.pickNotIncluded}
          onClear={entry.clearProspect}
          onFreeNameChange={(value) => update({ freeName: value })}
        />

        <ScreeningBanners
          screening={screening}
          onOpenRecord={openRecord}
          onRequestSupport={(kind, id) => setSupportRequest({ kind, id })}
        />

        <NewEntryFields
          form={form}
          update={update}
          isOwner={entry.isOwner}
          lockedCompanyId={entry.lockedCompanyId}
        />

        <ProductPicker products={state.products} selected={form.products} onToggle={entry.toggleProduct} />

        <AttendeePicker
          attendees={form.attendees}
          currentUserId={user.id}
          onAdd={entry.addAttendee}
          onRemove={entry.removeAttendee}
        />

        <Field className="mt-2" label="Negotiation summary" required>
          <textarea
            placeholder="Current status, key discussion points, next steps"
            value={form.summary}
            onChange={(e) => update({ summary: e.target.value })}
          />
        </Field>

        {isLate ? <LateEntryBlock late={form.late} onChange={entry.updateLate} /> : null}

        <Banner tone="info" className="mt-2">
          📧 <b>Note:</b> Saving notifies the full group leadership distribution list (
          <b>{state.recipients.length}</b> recipients — MD, C-level, and Branch managers) and{' '}
          {autoValidated ? (
            <>
              is <b>auto-validated</b> (you are the Head of Products) — it goes straight to <b>First Meeting</b>
            </>
          ) : (
            <>
              routes the entry to the <b>Head of Products</b> for validation
            </>
          )}
          . After saving, you&apos;ll be taken to the Product Catalogue to consider cross-sell opportunities.
        </Banner>

        <DuplicateBlockNotice
          screening={screening}
          onOpenRecord={openRecord}
          onRequestSupport={(kind, id) => setSupportRequest({ kind, id })}
        />

        <div className="flex mt-2" style={{ justifyContent: 'flex-end', gap: 8 }}>
          <button type="button" className="btn" onClick={() => router.push(routes.pipeline())}>
            Cancel
          </button>
          <button type="button" className="btn" onClick={saveDraft}>
            Save as draft
          </button>
          <button type="button" className="btn btn-primary" onClick={save} disabled={screening.blocked}>
            Save &amp; notify leadership
          </button>
        </div>
      </Card>

      <ApproachSupportModal
        open={Boolean(supportRequest)}
        onClose={() => setSupportRequest(null)}
        kind={supportRequest?.kind}
        recordId={supportRequest?.id}
      />
    </>
  );
}

/** Returns the first validation message, or null when the form is complete. */
function validate(form, name, screening, isLate) {
  if (form.inList === '') {
    return 'Please choose a prospect name from the directory, or select “Not included” and type it.';
  }
  if (!name) return 'Please enter the prospect name.';
  // Value / sales is optional; company size and governorate are mandatory.
  if (
    !form.industry ||
    !form.companyId ||
    !form.rmId ||
    !form.products.length ||
    !form.visitDate ||
    !form.expectedClose ||
    !form.summary.trim()
  ) {
    return 'Please complete all required fields (industry, company, responsible person, at least one product, dates, and summary).';
  }
  if (!form.companySize) return 'Please select the company size (SMEs / MVSEs / MIDCAP).';
  if (!form.governorate) return 'Please select the governorate of the client premises.';
  if (form.attendees.length === 0) return 'Please add at least one attendee.';

  if (screening.aml?.status === 'review') {
    return `AML watchlist match on "${name}" (${screening.aml.matches.join(', ')}).\n\nThis prospect must be cleared by compliance before it can be added.`;
  }

  if (isLate) {
    if (!form.late.closure || !form.late.reason.trim()) {
      return 'Late entry requires a closure date and a reason.';
    }
    if (!form.late.minutes.trim() && !form.late.fileName) {
      return 'Late entry requires either minutes of meeting or an uploaded call report.';
    }
  }
  return null;
}

export const getServerSideProps = withProtectedPage();
