import { useMemo, useState } from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import ChartCard from '../components/ChartCard.jsx';
import HeatGrid from '../components/HeatGrid.jsx';
import LiveBadge from '../components/LiveBadge.jsx';
import { HeatLayer, MapLegend, TILES } from '../components/MapView.jsx';
import { SkeletonCard, ErrorState } from '../components/Loading.jsx';
import { useApiData } from '../services/useApiData.js';
import { liveApi } from '../services/api.js';

const METRICS = {
  empty: { label: 'Empty-risk (few bikes)', w: (s) => 1 - s.bike_availability_pct / 100 },
  bikes: { label: 'Bike supply', w: (s) => s.bike_availability_pct / 100 },
  ebikes: { label: 'E-bike hotspots', w: (s) => Math.min(1, (s.num_ebikes_available || 0) / 8) },
  density: { label: 'Station density', w: () => 0.6 },
};
const CONDS = ['Critical Low', 'Low', 'Balanced', 'High', 'Critical High'];
const CAPS = ['Low', 'Medium', 'High', 'Very High'];
const pctRow = (arr) => { const t = arr.reduce((a, b) => a + b, 0) || 1; return arr.map((v) => +((v / t) * 100).toFixed(1)); };

export default function Heatmap() {
  const [metric, setMetric] = useState('empty');
  const { data: stations, loading, error } = useApiData((t) => liveApi.list(t, {}), [], 60000);

  const points = useMemo(() => (stations || []).map((s) => [s.lat, s.lon, METRICS[metric].w(s)]), [stations, metric]);
  const cross = useMemo(() => {
    if (!stations) return null;
    const matrix = CAPS.map((cp) => CONDS.map((cd) => stations.filter((s) => s.capacity_category === cp && s.station_condition === cd).length));
    const regions = [...new Set(stations.map((s) => s.region_name))].sort();
    const cityRows = regions.map((rg) => CONDS.map((cd) => stations.filter((s) => s.region_name === rg && s.station_condition === cd).length));
    return { raw: matrix, regions, city: cityRows.map(pctRow) };
  }, [stations]);

  return (
    <div className="page-content fade-in">
      <div className="section-head">
        <div><h1>Heatmaps</h1><p>Where the network is starving or overflowing — right now, from live GBFS data.</p></div>
        <LiveBadge />
      </div>
      {error && <ErrorState message={error} />}

      <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="filter-bar" style={{ padding: '14px 18px', margin: 0, borderBottom: '1px solid var(--border)' }}>
          {Object.entries(METRICS).map(([k, v]) => (
            <button key={k} className={`btn ${metric === k ? 'btn-accent' : 'btn-outline'}`} style={{ padding: '7px 14px', fontSize: 13 }} onClick={() => setMetric(k)}>{v.label}</button>
          ))}
        </div>
        {loading ? <SkeletonCard height={520} /> : (
          <div style={{ position: 'relative' }}>
            <MapContainer center={[40.73, -73.98]} zoom={12} style={{ height: 540 }} scrollWheelZoom>
              <TileLayer attribution="&copy; OpenStreetMap contributors" url={TILES} />
              <HeatLayer points={points} />
            </MapContainer>
            <MapLegend title={METRICS[metric].label} gradient />
          </div>
        )}
      </div>

      <div style={{ marginTop: 20 }} />
      <ChartCard title="City × condition heatmap — share of stations %" subtitle="Live: how each city's stations split across Critical Low → Critical High" height="auto">
        {cross ? <HeatGrid rows={cross.regions} cols={CONDS} matrix={cross.city} cell={44} lowLabel="0%" highLabel="100%" /> : <SkeletonCard height={160} />}
      </ChartCard>

      <div style={{ marginTop: 20 }} />
      <ChartCard title="Capacity tier × condition — live station counts" subtitle="Which station sizes are running empty or full (darker = more stations)" height="auto">
        {cross ? <HeatGrid rows={CAPS} cols={CONDS} matrix={cross.raw.map((r) => r.map((v) => v))} max={Math.max(1, ...cross.raw.flat())} unit=" stations" cell={44} lowLabel="Few" highLabel="Many" /> : <SkeletonCard height={160} />}
      </ChartCard>
    </div>
  );
}
