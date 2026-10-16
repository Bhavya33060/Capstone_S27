import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { X } from 'lucide-react';
import ChartCard, { ChartTooltip } from '../components/ChartCard.jsx';
import { SkeletonCard, EmptyState, ErrorState } from '../components/Loading.jsx';
import { liveApi as stationsApi } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { MapPinOff } from 'lucide-react';

const conditionBadge = {
  'Critical Low': 'badge-error', Low: 'badge-warning', Balanced: 'badge-success',
  High: 'badge-success', 'Critical High': 'badge-error',
};

export default function StationExplorer() {
  const { token } = useAuth();
  const [stations, setStations] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [regionFilter, setRegionFilter] = useState('');
  const [conditionFilter, setConditionFilter] = useState('');
  const [search, setSearch] = useState('');
  const [regions, setRegions] = useState([]);
  const [selected, setSelected] = useState(null);
  const [page, setPage] = useState(0);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => { stationsApi.regions(token).then(setRegions).catch(() => {}); }, [token]);

  useEffect(() => {
    setLoading(true);
    setError(null);
    stationsApi.list(token, { region: regionFilter, condition: conditionFilter, search })
      .then(setStations)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
    setPage(0);
  }, [token, regionFilter, conditionFilter, search]);

  const openDetail = (id) => { setSelected(id); setDetail(stations.find((x) => x.station_id === id)); };

  return (
    <div className="page-content fade-in">
      <div className="section-head">
        <div>
          <h1>Station Explorer</h1>
          <p>Live status of every station, filterable by city and condition.</p>
        </div>
      </div>

      <div className="filter-bar">
        <select value={regionFilter} onChange={(e) => setRegionFilter(e.target.value)}>
          <option value="">All Cities</option>
          {regions.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
        <select value={conditionFilter} onChange={(e) => setConditionFilter(e.target.value)}>
          <option value="">All Conditions</option>
          {['Critical Low', 'Low', 'Balanced', 'High', 'Critical High'].map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <input placeholder="Search station name..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {loading && <SkeletonCard height={400} />}
      {error && <ErrorState message={error} />}
      {!loading && !error && stations?.length === 0 && (
        <EmptyState icon={MapPinOff} title="No stations match these filters" subtitle="Try clearing a filter." />
      )}

      {!loading && !error && stations?.length > 0 && (
        <div className="glass-card slide-up" style={{ padding: 20 }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr><th>Station</th><th>City</th><th>Bikes</th><th>Docks</th><th>Availability</th><th>Condition</th></tr>
              </thead>
              <tbody>
                {stations.slice(page * 40, page * 40 + 40).map((s) => (
                  <tr key={s.station_id} className="clickable" onClick={() => openDetail(s.station_id)}>
                    <td>{s.name}</td>
                    <td>{s.region_name}</td>
                    <td>{s.num_bikes_available} / {s.capacity}</td>
                    <td>{s.num_docks_available}</td>
                    <td>
                      <div className="progress-track" style={{ maxWidth: 120 }}>
                        <div className="progress-fill" style={{ width: `${s.bike_availability_pct}%` }} />
                      </div>
                      <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{s.bike_availability_pct?.toFixed?.(1)}%</span>
                    </td>
                    <td><span className={`badge ${conditionBadge[s.station_condition] || 'badge-success'}`}>{s.station_condition}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 12, marginTop: 14, fontSize: 13 }}>
            <button className="btn btn-outline" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>Prev</button>
            <span>{page * 40 + 1}–{Math.min(stations.length, page * 40 + 40)} of {stations.length.toLocaleString()}</span>
            <button className="btn btn-outline" disabled={(page + 1) * 40 >= stations.length} onClick={() => setPage((p) => p + 1)}>Next</button>
          </div>
        </div>
      )}

      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal-box" style={{ maxWidth: 560 }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div>
                <h3 style={{ fontSize: 17 }}>{detail?.name}</h3>
                {detail && <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{detail.region_name} · {detail.station_condition}</p>}
              </div>
              <button className="icon-btn-close" onClick={() => setSelected(null)}><X size={18} /></button>
            </div>

            {detail && (
              <>
                <div className="detail-stats">
                  <div><span>Bikes</span><strong>{detail.num_bikes_available}</strong></div>
                  <div><span>⚡ E-bikes</span><strong>{detail.num_ebikes_available ?? 0}</strong></div>
                  <div><span>Free docks</span><strong>{detail.num_docks_available}</strong></div>
                </div>
                <div className="detail-stats" style={{ marginTop: 10 }}>
                  <div><span>Capacity</span><strong>{detail.capacity}</strong></div>
                  <div><span>Availability</span><strong>{detail.bike_availability_pct}%</strong></div>
                  <div><span>Last report</span><strong style={{ fontSize: 12 }}>{detail.last_reported ? new Date(detail.last_reported).toLocaleTimeString() : '—'}</strong></div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <style>{`
        .icon-btn-close { background: var(--card-secondary); border: none; width: 32px; height: 32px; border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: center; color: var(--text-main); }
        .detail-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
        .detail-stats div { background: var(--card-secondary); border-radius: 10px; padding: 10px 12px; text-align: center; }
        .detail-stats span { font-size: 11px; color: var(--text-secondary); display: block; }
        .detail-stats strong { font-size: 16px; }
      `}</style>
    </div>
  );
}
