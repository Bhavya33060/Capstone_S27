import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import ChartCard, { ChartTooltip } from '../components/ChartCard.jsx';
import KPICard from '../components/KPICard.jsx';
import { SkeletonGrid, SkeletonCard, ErrorState } from '../components/Loading.jsx';
import { CheckCircle2, XCircle, Copy, AlertTriangle } from 'lucide-react';
import { useApiData } from '../services/useApiData.js';
import { liveApi } from '../services/api.js';
import LiveBadge from '../components/LiveBadge.jsx';

function correlationColor(v) {
  const intensity = Math.abs(v);
  const base = v >= 0 ? [88, 129, 87] : [200, 85, 61];
  return `rgba(${base[0]},${base[1]},${base[2]},${0.15 + intensity * 0.75})`;
}

export default function DataQuality() {
  const source = 'live';
  const api = liveApi;
  const { data: quality, loading: qLoading, error: qError } = useApiData(api.quality, [source]);
  const { data: corr, loading: corrLoading } = useApiData(api.correlation, [source]);
  const { data: capStats, loading: capLoading } = useApiData(api.capacityStats, [source]);
  const score = quality ? Math.max(0, 100 - (quality.totalMissing + quality.duplicateRows + quality.invalidCapacity + quality.invalidBikes + quality.invalidDocks + quality.staleReports) / Math.max(1, quality.totalRows) * 100).toFixed(1) : null;

  const checks = quality ? [
    { name: 'No Missing Values', pass: quality.totalMissing === 0, detail: `${quality.totalMissing} missing fields found` },
    { name: 'No Full Duplicate Rows', pass: quality.duplicateRows === 0, detail: `${quality.duplicateRows} duplicate rows` },
    { name: 'No Station/Snapshot Duplicates', pass: quality.stationSnapshotDupes === 0, detail: `${quality.stationSnapshotDupes} duplicate keys` },
    { name: 'Valid Capacity Values', pass: quality.invalidCapacity === 0, detail: `${quality.invalidCapacity} invalid records` },
    { name: 'Valid Bike Counts', pass: quality.invalidBikes === 0, detail: `${quality.invalidBikes} out-of-range records` },
    { name: 'Fresh Reports (<1h old)', pass: quality.staleReports === 0, detail: `${quality.staleReports} stale stations` },
    { name: 'Stations Renting', pass: quality.notRenting === 0, detail: `${quality.notRenting} not renting / offline` },
    { name: 'Valid Dock Counts', pass: quality.invalidDocks === 0, detail: `${quality.invalidDocks} out-of-range records` },
  ] : [];

  return (
    <div className="page-content fade-in">
      <div className="section-head">
        <h1>Data Quality & Validation</h1>
        <p>Missing values, duplicates, invalid records, staleness and IQR outliers — mirrors the EDA/validation pipeline.</p>
      </div>

      <div className="filter-bar" style={{ alignItems: 'center' }}>
        <LiveBadge />
        {score && <span className="badge badge-success" style={{ marginLeft: 'auto' }}>Quality score {score}%</span>}
      </div>

      {qError && <ErrorState message={qError} />}

      {qLoading ? <SkeletonGrid count={3} /> : quality && (
        <div className="kpi-grid stagger" style={{ marginBottom: 20 }}>
          <KPICard icon={Copy} label="Duplicate Rows" value={quality.duplicateRows} accent="accent" />
          <KPICard icon={AlertTriangle} label="Invalid Records" value={quality.invalidCapacity + quality.invalidBikes + quality.invalidDocks} accent="secondary" />
          <KPICard icon={CheckCircle2} label="Flagged Outliers" value={quality.outlierCapacity + quality.outlierBikes + quality.outlierDocks} accent="primary" />
        </div>
      )}

      {!qLoading && quality && (
        <div className="card-grid stagger" style={{ marginBottom: 20 }}>
          {checks.map((c) => (
            <div key={c.name} className="glass-card check-card">
              <div className="check-top">
                {c.pass ? <CheckCircle2 size={18} color="var(--success)" /> : <XCircle size={18} color="var(--error)" />}
                <span className={`badge ${c.pass ? 'badge-success' : 'badge-error'}`}>{c.pass ? 'Passed' : 'Failed'}</span>
              </div>
              <h4>{c.name}</h4>
              <p>{c.detail}</p>
            </div>
          ))}
        </div>
      )}

      {corrLoading ? <SkeletonCard height={340} /> : corr && (
        <div className="glass-card slide-up" style={{ padding: 22, marginBottom: 20 }}>
          <h4 style={{ marginBottom: 16, fontSize: 15 }}>Correlation Matrix</h4>
          <div style={{ overflowX: 'auto' }}>
            <table className="corr-table">
              <thead>
                <tr><th></th>{corr.columns.map((c) => <th key={c}>{c.replace(/_/g, ' ')}</th>)}</tr>
              </thead>
              <tbody>
                {corr.matrix.map((row, i) => (
                  <tr key={i}>
                    <th>{corr.columns[i].replace(/_/g, ' ')}</th>
                    {row.map((v, j) => (
                      <td key={j} style={{ background: correlationColor(v) }}>{v.toFixed(2)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {capLoading ? <SkeletonCard height={300} /> : capStats && (
        <div className="two-col">
          <ChartCard title="Capacity Distribution" height={280}>
            <ResponsiveContainer>
              <BarChart data={capStats.capacity.histogram}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="bucket" stroke="var(--text-secondary)" fontSize={11} />
                <YAxis stroke="var(--text-secondary)" fontSize={11} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="count" fill="#588157" radius={[6, 6, 0, 0]} animationDuration={900} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
          <ChartCard title="Bikes Available Distribution" height={280}>
            <ResponsiveContainer>
              <BarChart data={capStats.bikes.histogram}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="bucket" stroke="var(--text-secondary)" fontSize={11} />
                <YAxis stroke="var(--text-secondary)" fontSize={11} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="count" fill="#D08C60" radius={[6, 6, 0, 0]} animationDuration={900} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      )}

      <style>{`
        .check-card { padding: 18px; }
        .check-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
        .check-card h4 { font-size: 14px; font-weight: 700; }
        .check-card p { font-size: 12.5px; color: var(--text-secondary); margin-top: 4px; }
        .corr-table { border-collapse: collapse; width: 100%; font-size: 12.5px; }
        .corr-table th, .corr-table td { padding: 8px 12px; text-align: center; border: 1px solid var(--border); white-space: nowrap; }
        .corr-table th { color: var(--text-secondary); font-weight: 600; background: var(--card-secondary); }
        .corr-table td { color: var(--text-main); font-weight: 600; }
      `}</style>
    </div>
  );
}
