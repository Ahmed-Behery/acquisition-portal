import { DEMO_ACCOUNTS, DEMO_PASSWORD } from '@/constants/roles';

/** Quick-fill chips for the seeded demo accounts. */
export default function DemoAccounts({ onPick }) {
  return (
    <div className="auth-demo">
      <div className="auth-demo-title">
        Demo accounts · password <code>{DEMO_PASSWORD}</code>
      </div>
      <div className="auth-demo-grid">
        {DEMO_ACCOUNTS.map((account) => (
          <button
            type="button"
            key={account.username}
            className="demo-chip"
            onClick={() => onPick(account.username)}
          >
            {account.label}
          </button>
        ))}
      </div>
      <div className="auth-demo-hint">Click a chip to auto-fill, then press Sign In.</div>
    </div>
  );
}
