import Banner from './Banner';

/** Portal-wide compliance disclaimer, shown on the dashboard and the ledger. */
export default function PortalDisclaimer() {
  return (
    <Banner tone="warn" style={{ borderLeft: '4px solid var(--red)' }}>
      <b>⚠ Disclaimer:</b> Investigation requests for any merchant will <b>not be processed</b> unless the entry has
      been created on this portal. No portal entry — no investigation.
    </Banner>
  );
}
