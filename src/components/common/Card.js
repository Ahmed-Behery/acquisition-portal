import { clsx } from '@/utils/clsx';

/**
 * The `.card` surface.
 *
 * `title` renders the standard card heading; `action` puts a control next to it
 * (the `.card-head` layout). Pass `padded={false}` for the tables that sit flush
 * inside a card.
 */
export default function Card({ title, titleNote, action, className, style, onClick, padded = true, children }) {
  const heading = title ? (
    action ? (
      <div className="card-head">
        <div className="card-title" style={{ margin: 0 }}>
          {title}
          {titleNote ? <span className="small muted"> {titleNote}</span> : null}
        </div>
        {action}
      </div>
    ) : (
      <div className="card-title">
        {title}
        {titleNote ? <span className="small muted"> {titleNote}</span> : null}
      </div>
    )
  ) : null;

  return (
    <div
      className={clsx('card', className)}
      style={padded ? style : { padding: 0, ...style }}
      onClick={onClick}
    >
      {heading}
      {children}
    </div>
  );
}
