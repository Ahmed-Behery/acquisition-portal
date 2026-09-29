import { useRouter } from 'next/router';
import Card from '@/components/common/Card';
import Banner from '@/components/common/Banner';
import { OTHER_SLAS, PIPELINE_SLAS } from '@/constants/pipeline';
import { DEMO_PASSWORD } from '@/constants/roles';
import { useAppState } from '@/hooks/useAppStore';
import { routes } from '@/utils/links';

/** Reference badge used for a code prefix / segment / cycle. */
function CodeChip({ children, large }) {
  return (
    <span
      style={{
        display: 'inline-block',
        background: 'var(--primary-soft)',
        color: 'var(--primary)',
        padding: large ? '5px 12px' : '4px 10px',
        borderRadius: 5,
        fontWeight: 700,
        fontSize: large ? 14 : 12.5,
      }}
    >
      {children}
    </span>
  );
}

/** Codes, CBE segmentation and the lifecycle SLAs. */
export default function CodesTab() {
  const state = useAppState();
  const router = useRouter();

  return (
    <>
      <Banner tone="info" className="mb-2">
        <b>How merchant codes work.</b> Every merchant has a unique code; the prefix identifies the originating company
        and the number is sequential. Example: <b>FACT-003</b> = 3rd merchant onboarded by Contact Factoring.
      </Banner>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="tbl">
          <thead>
            <tr>
              <th>Code Prefix</th>
              <th>Company</th>
              <th>Business focus</th>
              <th className="num">Active merchants</th>
              <th>Example codes</th>
            </tr>
          </thead>
          <tbody>
            {state.companies.map((company) => {
              const merchants = state.clients.filter((c) => c.companyId === company.id);
              return (
                <tr key={company.id} onClick={() => router.push(routes.companyDetail(company.id))}>
                  <td>
                    <CodeChip large>{company.code}-</CodeChip>
                  </td>
                  <td className="name">{company.name}</td>
                  <td className="muted small">{company.focus}</td>
                  <td className="num">{merchants.length}</td>
                  <td className="small muted">
                    {merchants
                      .slice(0, 3)
                      .map((m) => m.code)
                      .join(', ') || '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Card
        className="mt-3"
        title="Company size segmentation"
        titleNote="· CBE definition (used in the mandatory “Company size” field)"
      >
        <Banner tone="info" className="mb-2">
          Working definitions aligned to the Central Bank of Egypt SME decree. Confirm the exact turnover thresholds
          against the current CBE circular before go-live.
        </Banner>
        <table className="tbl">
          <thead>
            <tr>
              <th>Code</th>
              <th>Segment</th>
              <th>CBE definition (annual turnover)</th>
            </tr>
          </thead>
          <tbody>
            {state.companySizeDefs.map((definition) => (
              <tr key={definition.code}>
                <td>
                  <CodeChip>{definition.code}</CodeChip>
                </td>
                <td className="name">{definition.title}</td>
                <td className="small muted">{definition.cbe}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Card
        className="mt-3"
        title="Lifecycle SLAs"
        titleNote="· service levels per negotiation cycle (Egypt working days, Sun–Thu)"
      >
        <Banner tone="info" className="mb-2">
          Each cycle has a target turnaround. Missing an SLA flags the entry for follow-up; the closing cycle needs Head
          of Products validation.
        </Banner>
        <table className="tbl">
          <thead>
            <tr>
              <th>Cycle</th>
              <th>Stage</th>
              <th className="num">SLA (working days)</th>
              <th>What must happen</th>
            </tr>
          </thead>
          <tbody>
            {PIPELINE_SLAS.map((sla) => (
              <tr key={sla.cycle}>
                <td>
                  <CodeChip>{sla.cycle}</CodeChip>
                </td>
                <td className="name">{sla.stage}</td>
                <td className="num">
                  <b>{sla.sla}</b>
                </td>
                <td className="small muted">{sla.note}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: 'var(--ink-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            margin: '16px 0 6px',
          }}
        >
          Cross-cutting SLAs
        </div>
        <table className="tbl">
          <thead>
            <tr>
              <th>SLA</th>
              <th className="num">Working days</th>
              <th>Rule</th>
            </tr>
          </thead>
          <tbody>
            {OTHER_SLAS.map((sla) => (
              <tr key={sla.name}>
                <td className="name">{sla.name}</td>
                <td className="num">
                  <b>{sla.sla}</b>
                </td>
                <td className="small muted">{sla.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Card className="mt-3" title="Access & login codes">
        <div className="small" style={{ lineHeight: 1.8 }}>
          <b>All employees</b> in the directory ({state.recipients.length} people) have login accounts and can insert
          pipeline entries.
          <br />
          <b>Username</b> = the part of the work email before <code>@</code> (e.g. <code>john.saad</code> for
          John.Saad@Contact.eg).
          <br />
          <b>Default password</b> = <code>{DEMO_PASSWORD}</code> for every seeded account.
          <br />
          <b>Admin</b> = <code>doaa.orfy</code> (full edit rights over every tab and list).
          <br />
          <b>Head of Products</b> = <code>d.elsayed</code> (validates entries; can edit lists).
        </div>
      </Card>
    </>
  );
}
