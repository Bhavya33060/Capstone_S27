import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Search } from 'lucide-react';

export const conditionColor = { 'Critical Low': '#C8553D', Low: '#E9C46A', Balanced: '#588157', High: '#A3B18A', 'Critical High': '#344E41' };

function FitOnce({ stations }) {
  const map = useMap(); const done = useRef(false);
  useEffect(() => {
    if (done.current || !stations.length) return;
    map.fitBounds(L.latLngBounds(stations.map((s) => [s.lat, s.lon])), { padding: [30, 30], maxZoom: 13 });
    done.current = true;
  }, [stations, map]);
  return null;
}

function FlyToSearch({ stations, query }) {
  const map = useMap();
  useEffect(() => {
    if (query.length < 3) return;
    const m = stations.find((s) => s.name.toLowerCase().includes(query.toLowerCase()));
    if (m) map.flyTo([m.lat, m.lon], 15, { duration: 0.8 });
  }, [query]); // eslint-disable-line
  return null;
}

// Canvas heat layer (no plugin): draws soft alpha blobs, then colourises by an alpha->palette lookup
export function HeatLayer({ points, radius = 20 }) {
  const map = useMap();
  useEffect(() => {
    const canvas = L.DomUtil.create('canvas', 'leaflet-zoom-hide');
    canvas.style.cssText = 'position:absolute;pointer-events:none;z-index:450';
    map.getPanes().overlayPane.appendChild(canvas);
    const pal = (() => {
      const c = document.createElement('canvas'); c.width = 256; c.height = 1; const x = c.getContext('2d');
      const g = x.createLinearGradient(0, 0, 256, 0);
      [[0.15, '#3A86A8'], [0.4, '#6A994E'], [0.65, '#E9C46A'], [0.85, '#D08C60'], [1, '#C8553D']].forEach(([o, col]) => g.addColorStop(o, col));
      x.fillStyle = g; x.fillRect(0, 0, 256, 1); return x.getImageData(0, 0, 256, 1).data;
    })();
    const draw = () => {
      const { x: w, y: h } = map.getSize(); canvas.width = w; canvas.height = h;
      L.DomUtil.setPosition(canvas, map.containerPointToLayerPoint([0, 0]));
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      const r = Math.max(10, radius * Math.pow(1.35, map.getZoom() - 12));
      points.forEach(([lat, lon, wt]) => {
        const p = map.latLngToContainerPoint([lat, lon]);
        if (p.x < -r || p.y < -r || p.x > w + r || p.y > h + r) return;
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r);
        g.addColorStop(0, `rgba(0,0,0,${0.04 + 0.12 * wt * wt})`); g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g; ctx.fillRect(p.x - r, p.y - r, r * 2, r * 2);
      });
      const img = ctx.getImageData(0, 0, w, h), d = img.data;
      let mx = 1; for (let i = 3; i < d.length; i += 4) if (d[i] > mx) mx = d[i];
      for (let i = 3; i < d.length; i += 4) {
        const a = d[i]; if (a < 4) { d[i] = 0; continue; }
        const t = Math.min(1, a / (mx * 0.85)), j = (t * 255) | 0;   // normalised to the densest spot
        d[i - 3] = pal[j * 4]; d[i - 2] = pal[j * 4 + 1]; d[i - 1] = pal[j * 4 + 2]; d[i] = Math.min(210, 40 + t * 230);
      }
      ctx.putImageData(img, 0, 0);
    };
    map.on('moveend zoomend resize', draw); draw();
    return () => { map.off('moveend zoomend resize', draw); canvas.remove(); };
  }, [map, points, radius]);
  return null;
}

export function MapLegend({ title, items, gradient }) {
  return (
    <div className="map-legend">
      <strong>{title}</strong>
      {gradient ? (
        <div><div className="legend-grad" /><div className="legend-ends"><span>Low</span><span>High</span></div></div>
      ) : items.map(([label, color]) => <div key={label} className="legend-row"><i style={{ background: color }} />{label}</div>)}
      <style>{`
        .map-legend { position: absolute; left: 12px; bottom: 24px; z-index: 1000; background: var(--card-bg); border: 1px solid var(--border); border-radius: 12px; padding: 10px 14px; font-size: 12px; box-shadow: var(--shadow-soft); min-width: 140px; }
        .map-legend strong { display: block; margin-bottom: 6px; font-size: 12px; }
        .legend-row { display: flex; align-items: center; gap: 8px; margin: 3px 0; color: var(--text-secondary); }
        .legend-row i { width: 11px; height: 11px; border-radius: 50%; display: inline-block; }
        .legend-grad { height: 10px; border-radius: 99px; background: linear-gradient(90deg,#3A86A8,#6A994E,#E9C46A,#D08C60,#C8553D); }
        .legend-ends { display: flex; justify-content: space-between; color: var(--text-secondary); margin-top: 3px; }
      `}</style>
    </div>
  );
}

export const TILES = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

export default function MapView({ stations, height = 520 }) {
  const [query, setQuery] = useState('');
  const [conditionFilter, setConditionFilter] = useState('All');
  const filtered = stations.filter((s) => conditionFilter === 'All' || s.station_condition === conditionFilter);

  return (
    <div className="map-wrap glass-card">
      <div className="map-controls">
        <div className="map-search"><Search size={14} /><input placeholder="Search station..." value={query} onChange={(e) => setQuery(e.target.value)} /></div>
        <select value={conditionFilter} onChange={(e) => setConditionFilter(e.target.value)}>
          <option value="All">All Conditions</option>
          {Object.keys(conditionColor).map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <span className="map-count">{filtered.length.toLocaleString()} stations</span>
      </div>
      <div style={{ position: 'relative' }}>
        <MapContainer center={[40.73, -73.99]} zoom={12} preferCanvas style={{ height, width: '100%' }} scrollWheelZoom>
          <TileLayer attribution="&copy; OpenStreetMap contributors" url={TILES} />
          <FitOnce stations={stations} />
          <FlyToSearch stations={stations} query={query} />
          {filtered.map((s) => (
            <CircleMarker key={s.station_id} center={[s.lat, s.lon]} radius={5 + Math.min(6, s.capacity / 10)}
              pathOptions={{ color: '#fff', weight: 1, fillColor: conditionColor[s.station_condition] || '#588157', fillOpacity: 0.85 }}>
              <Popup>
                <strong>{s.name}</strong><br />{s.region_name}<br />
                Bikes: {s.num_bikes_available} / {s.capacity}{s.num_ebikes_available != null && <> (⚡ {s.num_ebikes_available} e-bikes)</>}<br />
                Docks free: {s.num_docks_available}<br />Availability: {Number(s.bike_availability_pct).toFixed(1)}% · {s.station_condition}
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
        <MapLegend title="Station condition" items={Object.entries(conditionColor)} />
      </div>
      <style>{`
        .map-wrap { padding: 0; overflow: hidden; } .map-wrap:hover { transform: none; }
        .map-controls { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; padding: 16px 18px; border-bottom: 1px solid var(--border); }
        .map-search { display: flex; align-items: center; gap: 8px; background: var(--card-secondary); border: 1px solid var(--border); border-radius: 10px; padding: 8px 12px; }
        .map-search input { border: none; background: transparent; outline: none; font-size: 13px; color: var(--text-main); }
        .map-controls select { background: var(--card-secondary); border: 1px solid var(--border); border-radius: 10px; padding: 8px 12px; font-size: 13px; color: var(--text-main); }
        .map-count { margin-left: auto; font-size: 12.5px; color: var(--text-secondary); font-weight: 600; }
      `}</style>
    </div>
  );
}
