// Horizontal bar chart. rows = [{ label, value }]
export default function Bars({ rows }) {
  const biggest = Math.max(1, ...rows.map((r) => r.value));
  return (
    <div>
      {rows.map((r) => (
        <div className="bar-row" key={r.label}>
          <span>{r.label}</span>
          <div className="bar"><div style={{ width: `${(r.value / biggest) * 100}%` }} /></div>
          <b>{r.value}</b>
        </div>
      ))}
    </div>
  );
}
