import { useEffect, useState } from 'react';
import { Database as Db, Download, ChevronLeft, ChevronRight, ArrowUpDown, Table2 } from 'lucide-react';
import { dbApi } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { SkeletonCard, ErrorState } from '../components/Loading.jsx';
import KPICard from '../components/KPICard.jsx';

const SHOW = ['station_id', 'name', 'region_name', 'capacity', 'num_bikes_available', 'num_ebikes_available', 'num_docks_available', 'bike_availability_pct', 'station_condition', 'snapshot_time'];

export default function Database() {
  const { token } = useAuth();
  const source = 'live';
  const [schema, setSchema] = useState(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('');
  const [dir, setDir] = useState('asc');
  const [res, setRes] = useState(null);
  const [allCols, setAllCols] = useState(false);
  const [error, setError] = useState(null);
  const pageSize = 15;

  useEffect(() => { dbApi.schema(token, source).then(setSchema).catch((e) => setError(e.message)); setPage(1); }, [token, source]);
  useEffect(() => {
    setError(null);
    dbApi.rows(token, { source, page, pageSize, search, sort, dir }).then(setRes).catch((e) => setError(e.message));
  }, [token, source, page, search, sort, dir]);

  const cols = res?.rows?.[0] ? (allCols ? Object.keys(res.rows[0]) : SHOW.filter((c) => c in res.rows[0])) : [];
  const toggleSort = (c) => { if (sort === c) setDir((d) => (d === 'asc' ? 'desc' : 'asc')); else { setSort(c); setDir('asc'); } };
  const pages = res ? Math.max(1, Math.ceil(res.total / pageSize)) : 1;

  return (
    <div className="page-content fade-in">
      <div className="section-head">
        <div><h1>Database</h1><p>The live GBFS snapshot behind every chart, with the engineered feature columns.</p></div>
        <button className="btn btn-outline" onClick={() => dbApi.exportCsv(token, source)}><Download size={15} /> Export CSV</button>
      </div>

      <div className="filter-bar">
        <input placeholder="Search station name or id…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
      </div>
      {error && <ErrorState message={error} />}

      {schema && (
        <div className="kpi-grid stagger" style={{ marginBottom: 20 }}>
          <KPICard icon={Db} label="Rows" value={schema.rowCount} accent="primary" />
          <KPICard icon={Table2} label="Columns" value={schema.columns.length} accent="accent" />
          <div className="glass-card" style={{ padding: 20 }}><p style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>Source</p><h3 style={{ fontSize: 17, marginTop: 6 }}>{schema.source}</h3></div>
        </div>
      )}

      <div className="glass-card" style={{ padding: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
          <h4 style={{ fontSize: 15 }}>Records {res && <span style={{ color: 'var(--text-secondary)', fontWeight: 400 }}>({res.total.toLocaleString()})</span>}</h4>
          <label style={{ fontSize: 13, display: 'flex', gap: 6, alignItems: 'center' }}><input type="checkbox" checked={allCols} onChange={(e) => setAllCols(e.target.checked)} /> Show all columns</label>
        </div>
        {!res ? <SkeletonCard height={300} /> : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead><tr>{cols.map((c) => <th key={c} style={{ cursor: 'pointer' }} onClick={() => toggleSort(c)}>{c.replace(/_/g, ' ')} <ArrowUpDown size={11} /></th>)}</tr></thead>
              <tbody>{res.rows.map((r, i) => <tr key={i}>{cols.map((c) => <td key={c}>{String(r[c])}</td>)}</tr>)}</tbody>
            </table>
          </div>
        )}
        <div className="pager">
          <button className="btn btn-outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}><ChevronLeft size={15} /></button>
          <span>Page {page} / {pages}</span>
          <button className="btn btn-outline" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}><ChevronRight size={15} /></button>
        </div>
      </div>

      {schema && (
        <div className="glass-card" style={{ padding: 20, marginTop: 20 }}>
          <h4 style={{ fontSize: 15, marginBottom: 12 }}>Schema</h4>
          <div style={{ overflowX: 'auto', maxHeight: 360 }}>
            <table className="data-table">
              <thead><tr><th>Column</th><th>Type</th><th>Nulls</th><th>Unique</th><th>Sample</th></tr></thead>
              <tbody>{schema.columns.map((c) => <tr key={c.column}><td><code>{c.column}</code></td><td><span className="badge badge-warning">{c.type}</span></td><td>{c.nulls}</td><td>{c.unique}</td><td>{String(c.sample).slice(0, 30)}</td></tr>)}</tbody>
            </table>
          </div>
        </div>
      )}
      <style>{`.pager { display: flex; align-items: center; justify-content: flex-end; gap: 12px; margin-top: 14px; font-size: 13px; color: var(--text-secondary); } .pager .btn { padding: 6px 12px; } .data-table td, .data-table th { white-space: nowrap; }`}</style>
    </div>
  );
}
