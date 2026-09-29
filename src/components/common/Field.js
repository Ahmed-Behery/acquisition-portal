import { clsx } from '@/utils/clsx';

/**
 * A labelled form control. Wraps the original `.field` markup so the label /
 * required marker / hint structure is written once instead of at every input.
 *
 * Controls stay plain `<input>` / `<select>` / `<textarea>` elements: the stylesheet
 * already gives them their exact look, and swapping in library inputs would change
 * the rendering for no functional gain.
 */
export default function Field({ label, required, optional, hint, className, style, htmlFor, children }) {
  return (
    <div className={clsx('field', className)} style={style}>
      {label ? (
        <label htmlFor={htmlFor}>
          {label}
          {required ? <span className="req"> *</span> : null}
          {optional ? <span className="small muted"> (optional)</span> : null}
        </label>
      ) : null}
      {children}
      {hint ? <div className="hint">{hint}</div> : null}
    </div>
  );
}
