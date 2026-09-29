/** The `.filter-bar` row: controls on the left, a result count on the right. */
export default function FilterBar({ children, count }) {
  return (
    <div className="filter-bar">
      {children}
      {count ? (
        <div className="small muted" style={{ marginLeft: 'auto' }}>
          {count}
        </div>
      ) : null}
    </div>
  );
}

/** A labelled `<select>` sized for the filter bar. */
export function FilterSelect({ value, onChange, options, ariaLabel }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} aria-label={ariaLabel}>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
