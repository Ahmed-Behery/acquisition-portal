import { useState } from 'react';
import PageMeta from '@/components/common/PageMeta';
import PageHead from '@/components/common/PageHead';
import { ReferralStatusBadge } from '@/components/common/badges';
import { EmptyCard } from '@/components/common/misc';
import { DelegateReferralModal, ReferralModal } from '@/components/modals/ReferralModals';
import { ROLES } from '@/constants/roles';
import { selectProduct, selectUser } from '@/domain/selectors';
import { useAppState, useCurrentUser } from '@/hooks/useAppStore';
import { withProtectedPage } from '@/server/pageGuard';

/** Opportunities sourced by other departments, directed to a C-level. */
export default function ReferralsPage() {
  const state = useAppState();
  const user = useCurrentUser();
  const [referModalOpen, setReferModalOpen] = useState(false);
  const [delegating, setDelegating] = useState(null);

  const referrals = [...(state.referrals || [])].sort((a, b) => (b.id || '').localeCompare(a.id || ''));

  return (
    <>
      <PageMeta
        title="Department Leads"
        description="Opportunities initiated by other departments and directed to the related C-level."
      />
      <PageHead
        title="Department Leads"
        subtitle="Opportunities initiated by other departments (e.g. IT), directed to the related C-level. The C-level can delegate them to their team."
        actions={
          <button type="button" className="btn btn-primary" onClick={() => setReferModalOpen(true)}>
            + Refer an opportunity
          </button>
        }
      />

      {referrals.length === 0 ? (
        <EmptyCard padding={36}>
          No department leads yet. Use “Refer an opportunity” to direct one to a C-level.
        </EmptyCard>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <table className="tbl">
            <thead>
              <tr>
                <th>Company / opportunity</th>
                <th>Product</th>
                <th>From</th>
                <th>Directed to (C-level)</th>
                <th>Delegated to</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {referrals.map((referral) => {
                const canAct =
                  (referral.toLeaderId === user.id || user.role === ROLES.ADMIN) && referral.status === 'Open';
                return (
                  <tr key={referral.id}>
                    <td className="name">
                      {referral.company}
                      <div className="small muted">{referral.description || ''}</div>
                    </td>
                    <td className="small">
                      {referral.productId ? selectProduct(state, referral.productId)?.name || '—' : '—'}
                    </td>
                    <td className="small">
                      {referral.fromName || '—'}
                      <div className="small muted">{referral.fromDept || ''}</div>
                    </td>
                    <td className="small">{selectUser(state, referral.toLeaderId)?.name || '—'}</td>
                    <td className="small">{referral.delegatedToName || '—'}</td>
                    <td>
                      <ReferralStatusBadge status={referral.status} />
                    </td>
                    <td>
                      {canAct ? (
                        <button
                          type="button"
                          className="btn btn-sm btn-primary"
                          onClick={() => setDelegating(referral)}
                        >
                          👥 Delegate
                        </button>
                      ) : referral.status === 'Delegated' ? (
                        <span className="small muted">delegated</span>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <ReferralModal open={referModalOpen} onClose={() => setReferModalOpen(false)} />
      {delegating ? (
        <DelegateReferralModal open onClose={() => setDelegating(null)} referral={delegating} />
      ) : null}
    </>
  );
}

export const getServerSideProps = withProtectedPage();
