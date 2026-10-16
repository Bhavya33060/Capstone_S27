export function SkeletonCard({ height = 120 }) {
  return <div className="skeleton" style={{ height, width: '100%' }} />;
}

export function SkeletonGrid({ count = 4, height = 110 }) {
  return (
    <div className="kpi-grid">
      {Array.from({ length: count }).map((_, i) => <SkeletonCard key={i} height={height} />)}
    </div>
  );
}

export function EmptyState({ icon: Icon, title, subtitle }) {
  return (
    <div className="empty-state glass-card">
      {Icon && <Icon size={36} color="var(--text-secondary)" />}
      <h4>{title}</h4>
      {subtitle && <p>{subtitle}</p>}
      <style>{`
        .empty-state { padding: 50px 20px; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 8px; }
        .empty-state h4 { font-size: 15px; }
        .empty-state p { color: var(--text-secondary); font-size: 13px; }
      `}</style>
    </div>
  );
}

export function ErrorState({ message = 'Something went wrong loading this data.' }) {
  return (
    <div className="glass-card" style={{ padding: 24, textAlign: 'center', color: 'var(--error)', fontSize: 13.5 }}>
      ⚠ {message}
    </div>
  );
}
