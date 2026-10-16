import { useState } from 'react';
import LiveBadge from '../components/LiveBadge.jsx';

const W = 150, H = 62;
const COLS = [20, 215, 410, 605, 800, 995];
const LAYERS = ['1 · Sources', '2 · Ingestion', '3 · Processing', '4 · Storage', '5 · API', '6 · Client'];
const N = [
  { id: 'info', c: 0, y: 130, t: 'station_information', s: 'GBFS · static', col: '#3A86A8', d: 'Name, lat/lon, capacity and region_id for every station. https://gbfs.citibikenyc.com/gbfs/en/station_information.json' },
  { id: 'status', c: 0, y: 290, t: 'station_status', s: 'GBFS · real-time', col: '#3A86A8', d: 'Bikes, e-bikes, free docks, renting/returning flags and last_reported. https://gbfs.citibikenyc.com/gbfs/en/station_status.json' },
  { id: 'poll', c: 1, y: 130, t: 'Poller', s: 'fetch every 60s', col: '#D08C60', d: 'Node 18 fetch() with timeout, retry-on-next-tick and failure counters. Both feeds are pulled in parallel.' },
  { id: 'join', c: 1, y: 290, t: 'Join on station_id', s: 'info ⨝ status', col: '#D08C60', d: 'Merges static and dynamic feeds into one row per station and maps region_id → city name.' },
  { id: 'valid', c: 2, y: 130, t: 'Validation', s: 'quality gates', col: '#588157', d: 'Missing values, duplicates, invalid bike/dock counts, stale reports (>1h) and IQR outliers.' },
  { id: 'feat', c: 2, y: 290, t: 'Feature Engineering', s: '30+ columns', col: '#588157', d: 'availability %, utilization, bike/dock ratio, condition tier, capacity category, peak-hour & weekend flags, lat/lon zones.' },
  { id: 'ring', c: 3, y: 130, t: 'Live Ring Buffer', s: 'in-memory · 6h', col: '#A3B18A', d: 'Latest snapshot plus a rolling history of aggregates powering the live trend chart.' },
  { id: 'users', c: 3, y: 290, t: 'users.json', s: 'bcrypt hashes', col: '#A3B18A', d: 'Demo user store. Swap for PostgreSQL / MongoDB in production.' },
  { id: 'api', c: 4, y: 130, t: 'Express REST API', s: '/live · /db · /auth', col: '#344E41', d: 'Analytics engine: summaries, regional aggregation, temporal, correlation, heat-grid, pagination and CSV export.' },
  { id: 'jwt', c: 4, y: 290, t: 'JWT Auth', s: 'Bearer token · 7d', col: '#344E41', d: 'Register / login with bcrypt; requireAuth middleware guards every data route.' },
  { id: 'ui', c: 5, y: 70, t: 'React Dashboard', s: 'Recharts charts', col: '#C8553D', d: 'Live KPIs, area / radial / scatter / treemap / stacked charts with 60s auto-refresh.' },
  { id: 'map', c: 5, y: 210, t: 'Maps & Heatmaps', s: 'Leaflet + canvas', col: '#C8553D', d: 'Condition map and a custom canvas heat layer, plus hour × city and capacity × condition matrices.' },
  { id: 'dq', c: 5, y: 350, t: 'DQ · Database', s: 'tables & checks', col: '#C8553D', d: 'Data-quality scorecards, correlation matrix, paginated table browser and CSV export.' },
];
const E = [['info', 'poll'], ['status', 'join'], ['poll', 'join'], ['poll', 'valid'], ['join', 'feat'], ['valid', 'feat'], ['feat', 'ring'], ['ring', 'api'], ['users', 'jwt'], ['api', 'jwt'], ['api', 'ui'], ['api', 'map'], ['api', 'dq']];
const pos = (n) => ({ x: COLS[n.c], y: n.y });
const byId = Object.fromEntries(N.map((n) => [n.id, n]));

export default function Architecture() {
  const [sel, setSel] = useState('feat');
  const [hot, setHot] = useState(null);
  const active = hot || sel;
  const touches = (e) => e[0] === active || e[1] === active;

  return (
    <div className="page-content fade-in">
      <div className="section-head"><div><h1>System Architecture</h1><p>Live data flows left → right. Hover or click any node to light up its connections.</p></div><LiveBadge /></div>

      <div className="glass-card arch-wrap">
        <div style={{ overflowX: 'auto' }}>
          <svg viewBox="0 0 1180 460" className="arch-svg">
            <defs><filter id="glow"><feGaussianBlur stdDeviation="3" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter></defs>
            {LAYERS.map((l, i) => (
              <g key={l}><rect x={COLS[i] - 10} y={8} width={W + 20} height={440} rx={16} fill="var(--card-secondary)" opacity=".55" />
                <text x={COLS[i] + W / 2} y={34} textAnchor="middle" fontSize="12" fontWeight="700" fill="var(--text-secondary)">{l}</text></g>
            ))}
            {E.map(([a, b], i) => {
              const A = pos(byId[a]), B = pos(byId[b]);
              const x1 = A.x + W, y1 = A.y + H / 2, x2 = B.x, y2 = B.y + H / 2, mx = (x1 + x2) / 2;
              const d = `M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`;
              const on = touches([a, b]);
              return (
                <g key={i} opacity={on ? 1 : 0.35}>
                  <path d={d} fill="none" stroke={on ? byId[a].col : 'var(--border)'} strokeWidth={on ? 2.6 : 1.6} strokeDasharray="5 6" style={{ animation: 'dashMove 5s linear infinite' }} />
                  {[0, 1, 2].map((k) => (
                    <circle key={k} r={on ? 4.5 : 3} fill={byId[a].col} filter={on ? 'url(#glow)' : undefined}>
                      <animateMotion dur={`${3 + (i % 3)}s`} begin={`${k * 1.1}s`} repeatCount="indefinite" path={d} />
                    </circle>
                  ))}
                </g>
              );
            })}
            {N.map((n) => {
              const p = pos(n); const on = n.id === active;
              return (
                <g key={n.id} transform={`translate(${p.x},${p.y})`} style={{ cursor: 'pointer' }} onClick={() => setSel(n.id)} onMouseEnter={() => setHot(n.id)} onMouseLeave={() => setHot(null)}>
                  <rect width={W} height={H} rx={14} fill="var(--card-bg)" stroke={n.col} strokeWidth={on ? 3 : 1.5} filter={on ? 'url(#glow)' : undefined} />
                  <rect width={6} height={H} rx={3} fill={n.col} />
                  <text x={18} y={26} fontSize="12.5" fontWeight="700" fill="var(--text-main)">{n.t}</text>
                  <text x={18} y={46} fontSize="10.5" fill="var(--text-secondary)">{n.s}</text>
                </g>
              );
            })}
          </svg>
        </div>
        <div className="arch-detail slide-up" key={sel}>
          <span className="badge" style={{ background: byId[sel].col + '22', color: byId[sel].col }}>{LAYERS[byId[sel].c]}</span>
          <h3>{byId[sel].t}</h3><p>{byId[sel].d}</p>
        </div>
      </div>

      <div className="card-grid stagger" style={{ marginTop: 20 }}>
        {[['⚡ Real-time', 'Poll → transform → serve in under a second; UI refreshes every 60s.'], ['🧱 Layered', 'Ingestion, analytics, API and UI are independent and swappable.'], ['🔐 Secured', 'JWT-protected routes, bcrypt password hashes.'], ['♻️ Resilient', 'Feed failures are counted and retried; last good snapshot keeps serving.']].map(([t, d]) => (
          <div key={t} className="glass-card" style={{ padding: 18 }}><h4 style={{ fontSize: 14.5, marginBottom: 6 }}>{t}</h4><p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{d}</p></div>
        ))}
      </div>
      <style>{`
        .arch-wrap { padding: 18px; } .arch-wrap:hover { transform: none; } .arch-svg { min-width: 980px; width: 100%; height: auto; }
        .arch-detail { margin-top: 12px; padding: 16px 18px; background: var(--card-secondary); border-radius: 14px; }
        .arch-detail h3 { font-size: 16px; margin: 8px 0 4px; } .arch-detail p { font-size: 13.5px; color: var(--text-secondary); line-height: 1.6; word-break: break-word; }
      `}</style>
    </div>
  );
}
