import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import ChartCard, { ChartTooltip } from '../components/ChartCard.jsx';
import KPICard from '../components/KPICard.jsx';
import { SkeletonGrid, SkeletonCard, ErrorState } from '../components/Loading.jsx';
import { Building2, TrendingUp, TrendingDown } from 'lucide-react';
import { useApiData } from '../services/useApiData.js';
import { liveApi as stationsApi } from '../services/api.js';

export default function RegionalComparison() {
  const { data, loading, error } = useApiData(stationsApi.regionSummary, [], 60000);

  const best = data && [...data].sort((a, b) => b.avgBikeAvailabilityPct - a.avgBikeAvailabilityPct)[0];
  const worst = data && [...data].sort((a, b) => a.avgBikeAvailabilityPct - b.avgBikeAvailabilityPct)[0];

  return (
    <div className="page-content fade-in">
      <div className="section-head">
        <h1>Regional Comparison</h1>
        <p>Compare bike/dock availability and station counts across every city in the network.</p>
      </div>

      {error && <ErrorState message={error} />}

      {loading ? <SkeletonGrid count={3} /> : data && (
        <div className="kpi-grid stagger" style={{ marginBottom: 20 }}>
          <KPICard icon={Building2} label="Cities Tracked" value={data.length} accent="primary" />
          <KPICard icon={TrendingUp} label="Best Availability" value={best.avgBikeAvailabilityPct} decimals={1} suffix="%" trend={best.region_name} accent="accent" />
          <KPICard icon={TrendingDown} label="Lowest Availability" value={worst.avgBikeAvailabilityPct} decimals={1} suffix="%" trend={worst.region_name} accent="secondary" />
        </div>
      )}

      {loading ? <SkeletonCard height={320} /> : data && (
        <ChartCard title="Bike vs Dock Availability by City" height={340}>
          <ResponsiveContainer>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="region_name" stroke="var(--text-secondary)" fontSize={10.5} angle={-15} textAnchor="end" height={60} />
              <YAxis stroke="var(--text-secondary)" fontSize={11} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="avgBikeAvailabilityPct" name="Bike Availability %" fill="#588157" radius={[6, 6, 0, 0]} animationDuration={1000} />
              <Bar dataKey="avgDockAvailabilityPct" name="Dock Availability %" fill="#D08C60" radius={[6, 6, 0, 0]} animationDuration={1000} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      {data && data.length > 1 && (() => {
        const axes = [['Stations', 'stations'], ['Avg capacity', 'avgCapacity'], ['Avg bikes', 'avgBikesAvailable'], ['Bike %', 'avgBikeAvailabilityPct'], ['Dock %', 'avgDockAvailabilityPct']];
        const rd = axes.map(([label, k]) => { const mx = Math.max(...data.map((d) => d[k])) || 1; const row = { metric: label }; data.forEach((d) => { row[d.region_name] = +((d[k] / mx) * 100).toFixed(1); }); return row; });
        const pal = ['#588157', '#D08C60', '#3A86A8', '#C8553D', '#E9C46A', '#344E41'];
        return (
          <div style={{ marginTop: 20 }}>
            <ChartCard title="Region fingerprint (radar)" subtitle="Each axis scaled to the best region = 100" height={360}>
              <ResponsiveContainer><RadarChart data={rd}><PolarGrid stroke="var(--border)" /><PolarAngleAxis dataKey="metric" fontSize={12} /><PolarRadiusAxis domain={[0, 100]} fontSize={10} />
                {data.slice(0, 6).map((d, i) => <Radar key={d.region_name} name={d.region_name} dataKey={d.region_name} stroke={pal[i]} fill={pal[i]} fillOpacity={0.25} animationDuration={1000} />)}
                <Legend /><Tooltip content={<ChartTooltip />} /></RadarChart></ResponsiveContainer>
            </ChartCard>
          </div>
        );
      })()}

      {!loading && data && (
        <div className="glass-card" style={{ marginTop: 20, padding: 20 }}>
          <h4 style={{ marginBottom: 14, fontSize: 15 }}>City-Level Detail</h4>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead><tr><th>City</th><th>Stations</th><th>Avg Capacity</th><th>Avg Bikes</th><th>Avg Docks</th><th>Bike Availability</th></tr></thead>
              <tbody>
                {data.map((r) => (
                  <tr key={r.region_name}>
                    <td>{r.region_name}</td><td>{r.stations}</td><td>{r.avgCapacity}</td>
                    <td>{r.avgBikesAvailable}</td><td>{r.avgDocksAvailable}</td>
                    <td>{r.avgBikeAvailabilityPct}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
