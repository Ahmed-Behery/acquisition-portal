import { useMemo, useState } from 'react';
import PageMeta from '@/components/common/PageMeta';
import PageHead from '@/components/common/PageHead';
import PortalDisclaimer from '@/components/common/PortalDisclaimer';
import FilterBar, { FilterSelect } from '@/components/common/FilterBar';
import MerchantsTable from '@/components/merchants/MerchantsTable';
import ApproachSupportModal from '@/components/modals/ApproachSupportModal';
import { useAppState, useCurrentUser } from '@/hooks/useAppStore';
import { useSessionFilters } from '@/hooks/useSessionFilters';
import { withProtectedPage } from '@/server/pageGuard';

const DEFAULT_FILTERS = { q: '', status: 'all', companyId: 'all', sort: 'name' };

const STATUS_OPTIONS = [
  { value: 'all', label: 'All statuses' },
  { value: 'Active', label: 'Active' },
  { value: 'Good to Go', label: 'Good to Go' },
];

const SORT_OPTIONS = [
  { value: 'name', label: 'Sort: Name (A–Z)' },
  { value: 'exposure_desc', label: 'Sort: Exposure (high→low)' },
  { value: 'ytd_desc', label: 'Sort: YTD sales (high→low)' },
  { value: 'code', label: 'Sort: Code' },
];

const SORTERS = {
  name: (a, b) => a.name.localeCompare(b.name),
  exposure_desc: (a, b) => (b.exposure || 0) - (a.exposure || 0),
  ytd_desc: (a, b) => (b.ytdSales || 0) - (a.ytdSales || 0),
  code: (a, b) => (a.code || '').localeCompare(b.code || ''),
};

/** Master Client Ledger — every merchant across the group. */
export default function MerchantsPage() {
  const state = useAppState();
  const user = useCurrentUser();
  const [filters, setFilters] = useSessionFilters('ledger', DEFAULT_FILTERS);
  const [supportFor, setSupportFor] = useState(null);

  const rows = useMemo(() => {
    const q = filters.q.toLowerCase();
    const matched = state.clients.filter((c) => {
      if (filters.status !== 'all' && c.status !== filters.status) return false;
      if (filters.companyId !== 'all' && c.companyId !== filters.companyId) return false;
      if (q && !c.name.toLowerCase().includes(q) && !c.code.toLowerCase().includes(q)) return false;
      return true;
    });
    return matched.sort(SORTERS[filters.sort] || SORTERS.name);
  }, [state.clients, filters]);

  const companyOptions = [
    { value: 'all', label: 'All companies' },
    ...state.companies.map((c) => ({ value: c.id, label: c.code })),
  ];

  return (
    <>
      <PageMeta
        title="Master Client Ledger"
        description="Every merchant across the Contact Group companies, with owner, exposure and payment behaviour."
      />
      <PageHead
        title="Master Client Ledger"
        subtitle="All clients across all group companies. Search before approaching to avoid duplicate outreach."
      />

      <PortalDisclaimer />

      <FilterBar count={`${rows.length} of ${state.clients.length} merchants`}>
        <input
          type="text"
          placeholder="Search by client name…"
          aria-label="Search merchants"
          value={filters.q}
          onChange={(e) => setFilters({ q: e.target.value })}
        />
        <FilterSelect
          ariaLabel="Filter by status"
          value={filters.status}
          onChange={(status) => setFilters({ status })}
          options={STATUS_OPTIONS}
        />
        <FilterSelect
          ariaLabel="Filter by company"
          value={filters.companyId}
          onChange={(companyId) => setFilters({ companyId })}
          options={companyOptions}
        />
        <FilterSelect
          ariaLabel="Sort merchants"
          value={filters.sort}
          onChange={(sort) => setFilters({ sort })}
          options={SORT_OPTIONS}
        />
      </FilterBar>

      <MerchantsTable
        state={state}
        rows={rows}
        currentUserId={user.id}
        onRequestSupport={setSupportFor}
      />

      <ApproachSupportModal
        open={Boolean(supportFor)}
        onClose={() => setSupportFor(null)}
        kind="client"
        recordId={supportFor}
      />
    </>
  );
}

export const getServerSideProps = withProtectedPage();
