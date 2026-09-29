import { clsx } from '@/utils/clsx';

/**
 * The `.banner` callout. `tone` is one of info | warn | success | danger.
 * `action` renders a control on the right of the banner body.
 */
export default function Banner({ tone = 'info', action, className, style, children }) {
  return (
    <div className={clsx('banner', `banner-${tone}`, className)} style={style}>
      <div style={action ? { flex: 1 } : undefined}>{children}</div>
      {action}
    </div>
  );
}
