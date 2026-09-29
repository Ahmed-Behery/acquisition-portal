import { useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import Card from '@/components/common/Card';
import PageMeta from '@/components/common/PageMeta';
import PageHead from '@/components/common/PageHead';
import { StatusBadge } from '@/components/common/badges';
import PipelineBanners from '@/components/pipeline/PipelineBanners';
import NegotiationDetailsCard from '@/components/pipeline/NegotiationDetailsCard';
import LifecycleCard from '@/components/pipeline/LifecycleCard';
import ProductLinesCard from '@/components/pipeline/ProductLinesCard';
import AttachmentsCard from '@/components/pipeline/AttachmentsCard';
import CommentsCard from '@/components/pipeline/CommentsCard';
import ExtendNegotiationModal from '@/components/modals/ExtendNegotiationModal';
import DoneDealModal from '@/components/modals/DoneDealModal';
import MeetingOutcomeModal from '@/components/modals/MeetingOutcomeModal';
import EditEntryModal from '@/components/modals/EditEntryModal';
import InterestModal from '@/components/modals/InterestModal';
import { ROLES } from '@/constants/roles';
import { isClosed as isClosedEntry, isPendingHop } from '@/domain/pipelineRules';
import { selectCompany, selectPipelineEntry, selectUser } from '@/domain/selectors';
import { useActions } from '@/hooks/useActions';
import { useAppState, useCurrentUser } from '@/hooks/useAppStore';
import { isPastDate } from '@/utils/dates';
import { withProtectedPage } from '@/server/pageGuard';

/** Full pipeline entry: status, approvals, products, attachments and history. */
export default function PipelineDetailPage() {
  const router = useRouter();
  const state = useAppState();
  const user = useCurrentUser();
  const actions = useActions();

  const [modal, setModal] = useState(null); // 'extend' | 'done' | 'outcome' | 'edit' | 'interest' | 'delegate'
  const closeModal = () => setModal(null);

  const entry = selectPipelineEntry(state, router.query.id);

  const permissions = useMemo(() => {
    if (!entry) return null;
    const isOriginalEntrant = (entry.enteredBy || entry.rmId) === user.id;
    const isHop = user.role === ROLES.HEAD_OF_PRODUCTS;
    const pendingHop = isPendingHop(entry);
    const closed = isClosedEntry(entry);
    const goodToGo = entry.status === 'Good to Go';
    const unlocked = !pendingHop && !closed && !goodToGo;

    return {
      isOriginalEntrant,
      isHop,
      isPendingHop: pendingHop,
      isLocked: pendingHop,
      isClosed: closed,
      isGoodToGo: goodToGo,
      canChangeStatus: isOriginalEntrant && unlocked,
      canEdit: isOriginalEntrant && unlocked,
      canEditProducts: (user.id === entry.rmId || isOriginalEntrant) && unlocked,
      canUploadAttachment: (isOriginalEntrant || isHop) && !closed,
      canMarkContacted: isOriginalEntrant || user.id === entry.rmId,
    };
  }, [entry, user]);

  if (!entry) return <Card>Entry not found.</Card>;

  // Meeting outcome prompt — the visit date has passed but no outcome was recorded.
  const needsOutcome =
    isPastDate(entry.visitDate, state.today) &&
    !entry.meetingOutcome &&
    !entry.lateEntry &&
    !permissions.isGoodToGo &&
    !permissions.isClosed;
  const canRecordOutcome = needsOutcome && permissions.canMarkContacted;

  const rm = selectUser(state, entry.rmId);
  const entrant = selectUser(state, entry.enteredBy || entry.rmId);
  const company = selectCompany(state, entry.companyId);

  const requestStage = (stage) => setModal(stage === 'Done Deal' ? 'done' : 'extend');

  return (
    <>
      <PageMeta
        title={entry.prospect}
        description={`Pipeline entry ${entry.code || ''} · ${entry.industry} · ${entry.status}`}
      />
      <PageHead
        title={entry.prospect}
        subtitle={
          <>
            Ref <b>{entry.code || '—'}</b> · {entry.industry} · RM {rm?.name} · {company?.name} · Entered by{' '}
            {entrant?.name}
          </>
        }
        actions={<StatusBadge status={entry.status} />}
      />

      <PipelineBanners
        state={state}
        entry={entry}
        today={state.today}
        isHop={permissions.isHop}
        needsOutcome={needsOutcome}
        canRecordOutcome={canRecordOutcome}
        canMarkContacted={permissions.canMarkContacted}
        onMarkContacted={(flaggerId) => actions.interest.markContacted(entry.id, flaggerId)}
        onRecordOutcome={() => setModal('outcome')}
      />

      <div className="grid-2">
        <NegotiationDetailsCard state={state} entry={entry} today={state.today} />
        <LifecycleCard
          state={state}
          entry={entry}
          user={user}
          permissions={permissions}
          onRequestStage={requestStage}
          onEdit={() => setModal('edit')}
          onExpressInterest={(delegate) => setModal(delegate ? 'delegate' : 'interest')}
        />
      </div>

      <ProductLinesCard state={state} entry={entry} canEdit={permissions.canEditProducts} />

      <AttachmentsCard
        state={state}
        entry={entry}
        user={user}
        canUpload={permissions.canUploadAttachment}
        isHop={permissions.isHop}
        isClosed={permissions.isClosed}
      />

      <CommentsCard state={state} entry={entry} canComment={!permissions.isClosed} />

      {modal === 'extend' ? <ExtendNegotiationModal open onClose={closeModal} entryId={entry.id} /> : null}
      {modal === 'done' ? <DoneDealModal open onClose={closeModal} entryId={entry.id} /> : null}
      {modal === 'outcome' ? <MeetingOutcomeModal open onClose={closeModal} entry={entry} /> : null}
      {modal === 'edit' ? <EditEntryModal open onClose={closeModal} entry={entry} /> : null}
      {modal === 'interest' || modal === 'delegate' ? (
        <InterestModal open onClose={closeModal} entry={entry} delegateMode={modal === 'delegate'} />
      ) : null}
    </>
  );
}

export const getServerSideProps = withProtectedPage();
