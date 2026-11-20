// items = [{ label, value, color }]
export default function StatCards({ items }) {
  return (
    <div className="stats">
      {items.map((s) => (
        <div className="card stat" key={s.label}>
          <div className="muted">{s.label}</div>
          <div className="value" style={{ color: s.color || 'inherit' }}>{s.value}</div>
        </div>
      ))}
    </div>
  );
}
