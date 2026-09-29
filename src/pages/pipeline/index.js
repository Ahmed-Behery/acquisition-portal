import { useMemo, useState } from 'react';
import PageMeta from '@/components/common/PageMeta';
import PageHead from '@/components/common/PageHead';
import FilterBar, { FilterSelect } from '@/components/common/FilterBar';
import PipelineTable from '@/components/pipeline/PipelineTable';
import DraftsModal from '@/components/pipeline/DraftsModal';
import ApproachSupportModal from '@/components/modals/ApproachSupportModal';
import { PIPELINE_FILTER_STATUSES } from '@/constants/pipeline';
import { ROLES } from '@/constants/roles';
import { rmScopedPipes } from '@/domain/pipelineRules';
import { useActions } from '@/hooks/useActions';
import { useAppState, useCurrentUser } from '@/hooks/useAppStore';
import { useDrafts } from '@/hooks/useDrafts';
import { useSessionFilters } from '@/hooks/useSessionFilters';
import { withProtectedPage } from '@/server/pageGuard';

const DEFAULT_FILTERS = { q: '', status: 'all', companyId: 'all', sort: 'created_desc' };

const SORT_OPTIONS = [
  { value: 'created_desc', label: 'Sort: Newest first' },
  { value: 'created_asc', label: 'Sort: Oldest first' },
  { value: 'value_desc', label: 'Sort: Value (high→low)' },
  { value: 'prospect', label: 'Sort: Prospect (A–Z)' },
];

const SORTERS = {
  created_desc: (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0),
  created_asc: (a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0),
  value_desc: (a, b) => (b.value || 0) - (a.value || 0),
  prospect: (a, b) => (a.prospect || '').localeCompare(b.prospect || ''),
};

const STATUS_OPTIONS = [
  { value: 'all', label: 'All statuses' },
  ...PIPELINE_FILTER_STATUSES.map((s) => ({ value: s, label: s })),
];

/** Active pipeline — scoped to the RM's own prospects, or group-wide for leadership. */
export default function PipelinePage() {
  const state = useAppState();
  const user = useCurrentUser();
  const actions = useActions();
  const drafts = useDrafts(user.id);
  const [filters, setFilters] = useSessionFilters('pipeline', DEFAULT_FILTERS);
  const [draftsOpen, setDraftsOpen] = useState(false);
  const [supportFor, setSupportFor] = useState(null);

  const ownScope = user.role === ROLES.RM;

  const { rows, total } = useMemo(() => {
    const base = rmScopedPipes(state, user);
    const q = filters.q.toLowerCase();
    const matched = base.filter((p) => {
      if (filters.status !== 'all' && p.status !== filters.status) return false;
      if (!ownScope && filters.companyId !== 'all' && p.companyId !== filters.companyId) return false;
      if (q && !(p.prospect || '').toLowerCase().includes(q) && !(p.code || '').toLowerCase().includes(q)) return false;
      return true;
    });
    return { rows: matched.sort(SORTERS[filters.sort] || SORTERS.created_desc), total: base.length };
  }, [state, user, filters, ownScope]);

  const companyOptions = [
    { value: 'all', label: 'All companies' },
    ...state.companies.map((c) => ({ value: c.id, label: c.code })),
  ];

  return (
    <>
      <PageMeta title="Pipeline" description="Active prospects and negotiations across the Contact Group companies." />
      <PageHead
        title="Pipeline"
        subtitle={`${
          ownScope ? 'Your prospects — the exposure you personally entered.' : 'Active negotiations across the group.'
        } New entries automatically alert leadership.`}
        actions={
          <>
            {drafts.count ? (
              <button type="button" className="btn" onClick={() => setDraftsOpen(true)}>
                📝 Drafts <span className="pill-count">{drafts.count}</span>
              </button>
            ) : null}
            <button type="button" className="btn btn-primary" onClick={() => actions.pipeline.startNewEntry()}>
              + New entry
            </button>
          </>
        }
      />

      <FilterBar count={`${rows.length} of ${total} entries`}>
        <input
          type="text"
          placeholder="Search prospect / reference…"
          aria-label="Search the pipeline"
          value={filters.q}
          onChange={(e) => setFilters({ q: e.target.value })}
        />
        <FilterSelect
          ariaLabel="Filter by status"
          value={filters.status}
          onChange={(status) => setFilters({ status })}
          options={STATUS_OPTIONS}
        />
        {ownScope ? null : (
          <FilterSelect
            ariaLabel="Filter by company"
            value={filters.companyId}
            onChange={(companyId) => setFilters({ companyId })}
            options={companyOptions}
          />
        )}
        <FilterSelect
          ariaLabel="Sort the pipeline"
          value={filters.sort}
          onChange={(sort) => setFilters({ sort })}
          options={SORT_OPTIONS}
        />
      </FilterBar>

      <PipelineTable state={state} rows={rows} currentUserId={user.id} onRequestSupport={setSupportFor} />

      <DraftsModal open={draftsOpen} onClose={() => setDraftsOpen(false)} drafts={drafts} />
      <ApproachSupportModal
        open={Boolean(supportFor)}
        onClose={() => setSupportFor(null)}
        kind="pipeline"
        recordId={supportFor}
      />
    </>
  );
}

export const getServerSideProps = withProtectedPage();
