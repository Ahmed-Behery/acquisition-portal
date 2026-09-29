import { useMemo } from 'react';
import PageMeta from '@/components/common/PageMeta';
import PageHead from '@/components/common/PageHead';
import FilterBar, { FilterSelect } from '@/components/common/FilterBar';
import { GoodToGoMerchants, GoodToGoPipeline } from '@/components/goodToGo/GoodToGoLists';
import { ROLES } from '@/constants/roles';
import { useActions } from '@/hooks/useActions';
import { useAppState, useCurrentUser } from '@/hooks/useAppStore';
import { useSessionFilters } from '@/hooks/useSessionFilters';
import { withProtectedPage } from '@/server/pageGuard';

const DEFAULT_FILTERS = { q: '', companyId: 'all', sort: 'recent' };

const SORT_OPTIONS = [
  { value: 'recent', label: 'Sort: Most recent' },
  { value: 'name', label: 'Sort: Name (A–Z)' },
  { value: 'exposure_desc', label: 'Sort: Exposure (high→low)' },
];

const CLIENT_SORTERS = {
  recent: (a, b) => new Date(b.lastUpdate || 0) - new Date(a.lastUpdate || 0),
  name: (a, b) => a.name.localeCompare(b.name),
  exposure_desc: (a, b) => (b.exposure || 0) - (a.exposure || 0),
};

const PIPE_SORTERS = {
  recent: (a, b) => new Date(b.lastUpdate || 0) - new Date(a.lastUpdate || 0),
  name: (a, b) => (a.prospect || '').localeCompare(b.prospect || ''),
  exposure_desc: (a, b) => (b.value || 0) - (a.value || 0),
};

const REENGAGE_ROLES = [ROLES.RM, ROLES.EMPLOYEE, ROLES.HEAD_OF_PRODUCTS, ROLES.ADMIN];

/** Released merchants and lapsed pipeline entries, open to the whole group. */
export default function GoodToGoPage() {
  const state = useAppState();
  const user = useCurrentUser();
  const actions = useActions();
  const [filters, setFilters] = useSessionFilters('good-to-go', DEFAULT_FILTERS);

  const { clients, entries } = useMemo(() => {
    const q = filters.q.toLowerCase();
    const companyOk = (id) => filters.companyId === 'all' || id === filters.companyId;

    const matchedClients = state.clients
      .filter((c) => c.status === 'Good to Go' && companyOk(c.companyId) && (!q || c.name.toLowerCase().includes(q)))
      .sort(CLIENT_SORTERS[filters.sort] || CLIENT_SORTERS.recent);

    const matchedEntries = state.pipeline
      .filter(
        (p) =>
          p.status === 'Good to Go' && companyOk(p.companyId) && (!q || (p.prospect || '').toLowerCase().includes(q))
      )
      .sort(PIPE_SORTERS[filters.sort] || PIPE_SORTERS.recent);

    return { clients: matchedClients, entries: matchedEntries };
  }, [state.clients, state.pipeline, filters]);

  const canReengage = REENGAGE_ROLES.includes(user.role);
  const reengage = (id) => actions.pipeline.startReengagement(id);

  const companyOptions = [
    { value: 'all', label: 'All companies' },
    ...state.companies.map((c) => ({ value: c.id, label: c.code })),
  ];

  return (
    <>
      <PageMeta
        title="Good to Go List"
        description="Merchants and pipeline entries released for group-wide re-engagement."
      />
      <PageHead
        title="Good to Go List"
        subtitle="Released merchants and inactive pipeline entries available group-wide for re-engagement"
      />

      <FilterBar count={`${clients.length} merchants · ${entries.length} pipeline`}>
        <input
          type="text"
          placeholder="Search name / prospect…"
          aria-label="Search the Good to Go list"
          value={filters.q}
          onChange={(e) => setFilters({ q: e.target.value })}
        />
        <FilterSelect
          ariaLabel="Filter by company"
          value={filters.companyId}
          onChange={(companyId) => setFilters({ companyId })}
          options={companyOptions}
        />
        <FilterSelect
          ariaLabel="Sort the list"
          value={filters.sort}
          onChange={(sort) => setFilters({ sort })}
          options={SORT_OPTIONS}
        />
      </FilterBar>

      <h3 style={{ fontSize: 14, marginBottom: 12 }}>Existing merchants ({clients.length})</h3>
      <GoodToGoMerchants state={state} clients={clients} canReengage={canReengage} onReengage={reengage} />

      <h3 style={{ fontSize: 14, margin: '24px 0 12px' }}>Pipeline entries on Good to Go ({entries.length})</h3>
      <GoodToGoPipeline state={state} entries={entries} canReengage={canReengage} onReengage={reengage} />
    </>
  );
}

export const getServerSideProps = withProtectedPage();
