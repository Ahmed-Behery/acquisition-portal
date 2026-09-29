import PageMeta from '@/components/common/PageMeta';
import PortalDisclaimer from '@/components/common/PortalDisclaimer';
import LeaderDashboard from '@/components/dashboard/LeaderDashboard';
import HopDashboard from '@/components/dashboard/HopDashboard';
import RmDashboard from '@/components/dashboard/RmDashboard';
import { LEADER_ROLES, ROLES } from '@/constants/roles';
import { useAppState, useCurrentUser } from '@/hooks/useAppStore';
import { withProtectedPage } from '@/server/pageGuard';

/** Role-aware dashboard — the landing screen after signing in. */
export default function DashboardPage() {
  const state = useAppState();
  const user = useCurrentUser();

  const dashboard = LEADER_ROLES.includes(user.role) ? (
    <LeaderDashboard state={state} user={user} today={state.today} />
  ) : user.role === ROLES.HEAD_OF_PRODUCTS ? (
    <HopDashboard state={state} user={user} today={state.today} />
  ) : (
    <RmDashboard state={state} user={user} />
  );

  return (
    <>
      <PageMeta
        title="Dashboard"
        description="Pipeline, exposure and approvals at a glance across the Contact Group companies."
      />
      <PortalDisclaimer />
      {dashboard}
    </>
  );
}

export const getServerSideProps = withProtectedPage();
