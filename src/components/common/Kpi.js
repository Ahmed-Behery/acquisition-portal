/** A single KPI tile and the responsive grid they sit in. */

export function KpiGrid({ children, style }) {
  return (
    <div className="kpis" style={style}>
      {children}
    </div>
  );
}

export function Kpi({ label, value, unit, sub }) {
  return (
    <div className="kpi">
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">
        {value}
        {unit ? <span className="unit">{unit}</span> : null}
      </div>
      {sub ? <div className="kpi-sub">{sub}</div> : null}
    </div>
  );
}
