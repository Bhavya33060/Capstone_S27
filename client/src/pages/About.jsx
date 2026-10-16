import { Database, Radio, MapPinned, BarChart3, Flame, ShieldCheck, Rocket, Target, Package, ExternalLink } from 'lucide-react';
import { useApiData } from '../services/useApiData.js';
import { liveApi } from '../services/api.js';
import LiveBadge from '../components/LiveBadge.jsx';

const Block = ({ icon: Icon, title, children, accent }) => (
  <div className="glass-card slide-up ab-card">
    <div className="ab-head"><span className={`ab-ico ${accent || ''}`}><Icon size={18} /></span><h3>{title}</h3></div>
    {children}
  </div>
);

export default function About() {
  const { data: st } = useApiData(liveApi.status, [], 30000);
  const { data: regions } = useApiData(liveApi.regionSummary, [], 60000);
  return (
    <div className="page-content fade-in">
      <div className="section-head"><div><h1>Project Overview</h1><p>CitiBike Analytics — a full-stack, real-time bike-share intelligence platform.</p></div><LiveBadge /></div>

      <div className="ab-grid">
        <Block icon={Target} title="About the project">
          <p>Bike-share networks constantly drift out of balance: commuters drain some docks while others overflow. This project ingests the live Citi Bike feed, cleans and validates it, engineers availability features and turns it into an authenticated analytics platform so operators can see <b>where bikes are missing right now</b> and <b>when it usually happens</b>.</p>
          <ul><li>Problem: station imbalance (empty / full docks)</li><li>Approach: EDA → feature engineering → live API → dashboard</li><li>Stack: Node.js · Express · JWT · React · Recharts · Leaflet</li></ul>
        </Block>

        <Block icon={Database} title="About the dataset" accent="acc">
          <p>100% live data from Citi Bike's public GBFS feeds, joined per station and feature-engineered on the server every {st?.pollIntervalSec || 60}s.</p>
          <p className="muted">~2,000 stations · 30+ columns: availability %, utilization, bike/dock ratio, condition tier, capacity category, peak-hour & weekend flags, lat/lon zones, IQR outlier flags.</p>
        </Block>

        <Block icon={Radio} title="Live APIs used">
          {[['station_information', 'Static: station_id, name, lat, lon, capacity, region_id', st?.sources?.stationInformation || 'https://gbfs.citibikenyc.com/gbfs/en/station_information.json'],
            ['station_status', 'Real-time: num_bikes_available, num_ebikes_available, num_docks_available, is_renting, is_returning, last_reported', st?.sources?.stationStatus || 'https://gbfs.citibikenyc.com/gbfs/en/station_status.json'],
            ['system_regions', 'Maps region_id → city name (optional)', 'https://gbfs.citibikenyc.com/gbfs/en/system_regions.json']].map(([n, d, u]) => (
            <div key={n} className="api-row"><span className="badge badge-success">GET</span><div><b>{n}</b><p>{d}</p><a className="src-link" href={u} target="_blank" rel="noreferrer"><ExternalLink size={12} /> {u}</a></div></div>
          ))}
          <p className="muted" style={{ marginTop: 10 }}>Our backend then exposes these as secured endpoints: <code>/api/live/*</code>, <code>/api/db/*</code>.</p>
        </Block>

        <Block icon={MapPinned} title="Area of focus" accent="acc">
          <p><b>New York City metro</b> — the Citi Bike service area covering Manhattan, Brooklyn, Queens, the Bronx, Jersey City and Hoboken. The focus problem is <b>station imbalance</b>: stations that run out of bikes (Critical Low) or out of free docks (Critical High) during commute hours.</p>
          {regions?.length > 0 && <ul>{regions.map((r) => <li key={r.region_name}>{r.region_name}: {r.stations.toLocaleString()} stations · {r.avgBikeAvailabilityPct}% avg availability</li>)}</ul>}
        </Block>

        <Block icon={BarChart3} title="What we show">
          <ul>
            <li>Live KPIs, trend, treemap, scatter, stacked & radial charts</li>
            <li>Heatmaps: geographic density + hour × city + capacity × condition</li>
            <li>Station explorer, regional comparison, temporal patterns</li>
            <li>Data-quality checks and a browsable database view</li>
            <li>System architecture with animated data flow</li>
          </ul>
        </Block>

        <Block icon={Package} title="Outputs" accent="acc">
          <ul>
            <li>Station condition tiers: Critical Low → Critical High</li>
            <li>Drained / overflowing station rankings</li>
            <li>Rebalancing hotspots (empty-risk heatmap)</li>
            <li>Validated, exportable dataset (CSV)</li>
            <li>Secured REST API (<code>/api/live</code>, <code>/api/stations</code>, <code>/api/db</code>)</li>
          </ul>
        </Block>

        <Block icon={ShieldCheck} title="Data quality">
          <p>Every dataset is checked for missing values, duplicate rows, duplicate station-snapshot keys, invalid capacity/bike/dock counts, stale reports and IQR outliers — on the live feed.</p>
        </Block>

        <Block icon={Rocket} title="Future scope" accent="acc">
          <ul>
            <li>ML demand forecasting (next-hour bikes per station)</li>
            <li>Persist snapshots in PostgreSQL / TimescaleDB to unlock hour-of-day history</li>
            <li>Rebalancing route optimisation for trucks</li>
            <li>Weather, events & trip-data enrichment</li>
            <li>Alerts (Slack/SMS) for critically empty stations</li>
            <li>WebSocket push, multi-city GBFS support, Docker/CI deploy</li>
          </ul>
        </Block>
      </div>
      <style>{`
        .ab-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(330px, 1fr)); gap: 20px; }
        .ab-card { padding: 22px; } .ab-card p { font-size: 13.5px; line-height: 1.65; margin-bottom: 10px; } .muted { color: var(--text-secondary); }
        .ab-card ul { padding-left: 18px; font-size: 13.5px; line-height: 1.8; } .ab-card code { background: var(--card-secondary); padding: 1px 6px; border-radius: 6px; font-size: 12px; }
        .ab-head { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; } .ab-head h3 { font-size: 16px; }
        .ab-ico { width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; background: rgba(88,129,87,.14); color: var(--primary); } .ab-ico.acc { background: rgba(208,140,96,.16); color: var(--accent); }
        .api-row { display: flex; gap: 10px; margin-bottom: 12px; align-items: flex-start; } .api-row p { margin: 2px 0 0; font-size: 12.5px; color: var(--text-secondary); } .api-row .src-link { word-break: break-all; }
        .src-link { display: block; font-size: 12px; color: var(--primary); margin-top: 6px; text-decoration: none; }
      `}</style>
    </div>
  );
}
