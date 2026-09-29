import Card from '@/components/common/Card';
import { fmtMoney } from '@/utils/format';

/** Share-of-exposure bars, one row per group company. */
export default function ExposureByCompany({ companies, clients, totalExposure }) {
  return (
    <Card title="Exposure by company">
      {companies.map((company) => {
        const exposure = clients
          .filter((c) => c.companyId === company.id)
          .reduce((sum, c) => sum + c.exposure, 0);
        const pct = totalExposure ? ((exposure / totalExposure) * 100).toFixed(0) : 0;
        return (
          <div key={company.id} style={{ marginBottom: 14 }}>
            <div className="flex-between" style={{ marginBottom: 5 }}>
              <div style={{ fontWeight: 500, fontSize: 13 }}>{company.code}</div>
              <div style={{ fontSize: 12, color: 'var(--ink-muted)' }}>{fmtMoney(exposure)}</div>
            </div>
            <div style={{ height: 7, background: 'var(--surface-alt)', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${pct}%`, background: 'var(--primary)', borderRadius: 4 }} />
            </div>
          </div>
        );
      })}
    </Card>
  );
}
