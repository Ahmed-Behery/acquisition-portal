import Link from 'next/link';
import { initials } from '@/utils/format';

/** Small building blocks that appear across several screens. */

export function Avatar({ name, size }) {
  const style = size ? { width: size, height: size, fontSize: Math.round(size * 0.36) } : undefined;
  return (
    <div className="avatar" style={style}>
      {initials(name)}
    </div>
  );
}

/** An email link that never triggers the row click it sits inside. */
export function MailLink({ email, className }) {
  if (!email) return <>—</>;
  return (
    <a
      href={`mailto:${email}`}
      onClick={(e) => e.stopPropagation()}
      className={className}
      style={{ color: 'var(--primary)', textDecoration: 'none' }}
    >
      {email}
    </a>
  );
}

/** The recurring "View all →" style link in card headers. */
export function CardLink({ href, children }) {
  return (
    <Link href={href} style={{ color: 'var(--primary)', fontSize: 12, fontWeight: 500, textDecoration: 'none' }}>
      {children}
    </Link>
  );
}

/** A centred empty-state message inside a card. */
export function EmptyCard({ children, padding = 30 }) {
  return (
    <div className="card center muted" style={{ padding }}>
      {children}
    </div>
  );
}

/** A centred empty-state row inside an existing card / table. */
export function EmptyRow({ colSpan, children, padding = 36 }) {
  return (
    <tr>
      <td colSpan={colSpan} className="center muted" style={{ padding }}>
        {children}
      </td>
    </tr>
  );
}

export function Hr() {
  return <hr className="hr" />;
}
