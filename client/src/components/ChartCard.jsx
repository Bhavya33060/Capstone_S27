export default function ChartCard({ title, subtitle, children, height = 300 }) {
  return (
    <div className="glass-card chart-card slide-up">
      <div className="chart-card-head">
        <div>
          <h4>{title}</h4>
          {subtitle && <p>{subtitle}</p>}
        </div>
      </div>
      <div style={{ width: '100%', height }}>{children}</div>

      <style>{`
        .chart-card { padding: 20px 20px 12px; }
        .chart-card-head { margin-bottom: 12px; }
        .chart-card-head h4 { font-size: 15px; font-weight: 700; }
        .chart-card-head p { font-size: 12.5px; color: var(--text-secondary); margin-top: 2px; }
      `}</style>
    </div>
  );
}

export function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <strong>{label}</strong>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color || p.fill }}>{p.name}: {typeof p.value === 'number' ? p.value.toLocaleString() : p.value}</div>
      ))}
    </div>
  );
}
