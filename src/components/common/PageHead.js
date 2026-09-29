/** The standard page heading: title, sub-line and right-aligned actions. */
export default function PageHead({ eyebrow, title, subtitle, actions }) {
  return (
    <div className="page-head">
      <div>
        {eyebrow ? (
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-muted)', letterSpacing: '0.06em' }}>
            {eyebrow}
          </div>
        ) : null}
        <div className="page-title">{title}</div>
        {subtitle ? <div className="page-sub">{subtitle}</div> : null}
      </div>
      {actions ? <div className="page-actions">{actions}</div> : null}
    </div>
  );
}
