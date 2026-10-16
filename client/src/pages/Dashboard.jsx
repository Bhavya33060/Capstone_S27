import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area, ScatterChart, Scatter, Treemap, RadialBarChart, RadialBar, ZAxis } from 'recharts';
import { Bike as BikeIcon, MapPin, Zap, Layers, AlertTriangle, Gauge, ArrowRight, Network } from 'lucide-react';
import KPICard from '../components/KPICard.jsx';
import ChartCard, { ChartTooltip } from '../components/ChartCard.jsx';
import LiveBadge from '../components/LiveBadge.jsx';
import { SkeletonGrid, ErrorState } from '../components/Loading.jsx';
import { useApiData } from '../services/useApiData.js';
import { liveApi } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';

const C = { 'Critical Low': '#C8553D', Low: '#E9C46A', Balanced: '#588157', High: '#A3B18A', 'Critical High': '#344E41' };
const PAL = ['#588157', '#D08C60', '#3A86A8', '#E9C46A', '#C8553D', '#A3B18A', '#344E41'];
const REFRESH = 60000;

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: stations, loading, error } = useApiData((t) => liveApi.list(t, {}), [], REFRESH);
  const { data: conditions } = useApiData(liveApi.conditions, [], REFRESH);
  const { data: trend } = useApiData(liveApi.trend, [], REFRESH);

  const m = useMemo(() => {
    if (!stations?.length) return null;
    const sum = (k) => stations.reduce((a, s) => a + (s[k] || 0), 0);
    const bikes = sum('num_bikes_available'), eb = sum('num_ebikes_available'), cap = sum('capacity');
    const regions = {};
    stations.forEach((s) => { const r = (regions[s.region_name] ||= { region: s.region_name, classic: 0, ebike: 0, docks: 0 }); r.classic += s.num_bikes_available - (s.num_ebikes_available || 0); r.ebike += s.num_ebikes_available || 0; r.docks += s.num_docks_available; });
    const big = stations.filter((s) => s.capacity >= 20);
    return {
      bikes, eb, cap, docks: sum('num_docks_available'),
      avg: stations.reduce((a, s) => a + s.bike_availability_pct, 0) / stations.length,
      empty: stations.filter((s) => s.empty_station).length,
      regions: Object.values(regions),
      emptiest: [...big].sort((a, b) => a.bike_availability_pct - b.bike_availability_pct).slice(0, 8).map((s) => ({ name: s.name.slice(0, 26), pct: s.bike_availability_pct })),
      fullest: [...big].sort((a, b) => b.bike_availability_pct - a.bike_availability_pct).slice(0, 8).map((s) => ({ name: s.name.slice(0, 26), pct: s.bike_availability_pct })),
      scatter: stations.filter((_, i) => i % Math.ceil(stations.length / 700) === 0).map((s) => ({ capacity: s.capacity, bikes: s.num_bikes_available, cond: s.station_condition, name: s.name })),
      tree: [...stations].sort((a, b) => b.num_bikes_available - a.num_bikes_available).slice(0, 40).map((s, i) => ({ name: s.name, size: s.num_bikes_available, fill: PAL[i % PAL.length] })),
    };
  }, [stations]);

  const trendData = (trend || []).map((t) => ({ ...t, time: new Date(t.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }));

  return (
    <div className="page-content fade-in">
      <section className="hero glass-card">
        <div className="hero-bg">
          <svg viewBox="0 0 800 200" preserveAspectRatio="none" className="route-lines">
            <path d="M0,150 C150,50 250,180 400,90 S650,20 800,100" stroke="#A3B18A" strokeWidth="2" fill="none" strokeDasharray="8 10" className="dash-anim" />
            <path d="M0,60 C180,140 320,20 480,110 S700,160 800,60" stroke="#D08C60" strokeWidth="2" fill="none" strokeDasharray="6 12" className="dash-anim slow" />
          </svg>
        </div>
        <div className="hero-content">
          <LiveBadge />
          <h1>Hi {user?.name?.split(' ')[0] || 'there'} — the network right now</h1>
          <p>Real Citi Bike stations from the GBFS feeds, refreshed every minute.</p>
          <div className="hero-actions">
            <button className="btn btn-accent" onClick={() => navigate('/heatmap')}>Open Heatmap <ArrowRight size={15} /></button>
            <button className="btn btn-outline" style={{ color: '#fff', borderColor: 'rgba(255,255,255,.4)' }} onClick={() => navigate('/architecture')}><Network size={15} /> Architecture</button>
          </div>
        </div>
        <BikeIcon size={140} className="hero-bike float" color="rgba(255,255,255,0.14)" />
      </section>

      {error && <div style={{ marginTop: 20 }}><ErrorState message={`${error} — is the backend running and can it reach gbfs.citibikenyc.com?`} /></div>}
      {loading && <div style={{ marginTop: 24 }}><SkeletonGrid count={6} /></div>}

      {m && (
        <>
          <div className="kpi-grid stagger" style={{ marginTop: 24 }}>
            <KPICard icon={MapPin} label="Live Stations" value={stations.length} accent="primary" />
            <KPICard icon={BikeIcon} label="Bikes Available" value={m.bikes} accent="accent" />
            <KPICard icon={Zap} label="E-bikes Available" value={m.eb} accent="secondary" />
            <KPICard icon={Layers} label="Free Docks" value={m.docks} accent="primary" />
            <KPICard icon={Gauge} label="Avg Availability" value={m.avg} decimals={1} suffix="%" accent="accent" />
            <KPICard icon={AlertTriangle} label="Empty Stations" value={m.empty} accent="secondary" />
          </div>

          <div className="two-col" style={{ marginTop: 20 }}>
            <ChartCard title="Bikes in the system — live trend" subtitle="One point per poll since the server started (grows every minute)">
              <ResponsiveContainer>
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="gb" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#588157" stopOpacity=".7" /><stop offset="1" stopColor="#588157" stopOpacity=".05" /></linearGradient>
                    <linearGradient id="ge" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#D08C60" stopOpacity=".8" /><stop offset="1" stopColor="#D08C60" stopOpacity=".05" /></linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="time" stroke="var(--text-secondary)" fontSize={11} /><YAxis stroke="var(--text-secondary)" fontSize={11} domain={['auto', 'auto']} />
                  <Tooltip content={<ChartTooltip />} /><Legend />
                  <Area type="monotone" dataKey="bikes" name="All bikes" stroke="#588157" fill="url(#gb)" strokeWidth={2.5} />
                  <Area type="monotone" dataKey="ebikes" name="E-bikes" stroke="#D08C60" fill="url(#ge)" strokeWidth={2.5} />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>
            <ChartCard title="Network fill level" subtitle="Bikes ÷ total dock capacity">
              <ResponsiveContainer>
                <RadialBarChart innerRadius="60%" outerRadius="100%" data={[{ name: 'Fill', value: +((m.bikes / m.cap) * 100).toFixed(1), fill: '#588157' }]} startAngle={210} endAngle={-30}>
                  <RadialBar dataKey="value" background cornerRadius={20} animationDuration={1200} />
                  <text x="50%" y="48%" textAnchor="middle" style={{ fontSize: 34, fontWeight: 800, fill: 'var(--text-main)' }}>{((m.bikes / m.cap) * 100).toFixed(1)}%</text>
                  <text x="50%" y="60%" textAnchor="middle" style={{ fontSize: 12, fill: 'var(--text-secondary)' }}>{m.bikes.toLocaleString()} of {m.cap.toLocaleString()} docks</text>
                </RadialBarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          <div className="two-col" style={{ marginTop: 20 }}>
            <ChartCard title="Condition breakdown" subtitle="Feature-engineered station tiers">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={conditions || []} dataKey="count" nameKey="condition" innerRadius={60} outerRadius={100} paddingAngle={3} animationDuration={1000}>
                    {(conditions || []).map((c, i) => <Cell key={i} fill={C[c.condition]} />)}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} /><Legend />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>
            <ChartCard title="Classic vs e-bikes by region" subtitle="Plus free docks">
              <ResponsiveContainer>
                <BarChart data={m.regions}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" /><XAxis dataKey="region" stroke="var(--text-secondary)" fontSize={11} /><YAxis stroke="var(--text-secondary)" fontSize={11} />
                  <Tooltip content={<ChartTooltip />} /><Legend />
                  <Bar dataKey="classic" name="Classic" stackId="a" fill="#588157" /><Bar dataKey="ebike" name="E-bike" stackId="a" fill="#D08C60" /><Bar dataKey="docks" name="Free docks" stackId="b" fill="#A3B18A" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          <div className="two-col" style={{ marginTop: 20 }}>
            <ChartCard title="Capacity vs bikes (each dot = a station)" subtitle="Dots far below the diagonal are drained stations" height={340}>
              <ResponsiveContainer>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis type="number" dataKey="capacity" name="Capacity" stroke="var(--text-secondary)" fontSize={11} /><YAxis type="number" dataKey="bikes" name="Bikes" stroke="var(--text-secondary)" fontSize={11} /><ZAxis range={[30, 30]} />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} content={<ChartTooltip />} />
                  {Object.keys(C).map((k) => <Scatter key={k} name={k} data={m.scatter.filter((d) => d.cond === k)} fill={C[k]} fillOpacity={0.7} />)}
                  <Legend />
                </ScatterChart>
              </ResponsiveContainer>
            </ChartCard>
            <ChartCard title="Bike treemap — top 40 stations" subtitle="Bigger block = more bikes right now" height={340}>
              <ResponsiveContainer>
                <Treemap data={m.tree} dataKey="size" stroke="#fff" isAnimationActive animationDuration={900}
                  content={({ x, y, width, height, name, fill, size }) => (
                    <g><rect x={x} y={y} width={width} height={height} fill={fill} stroke="#fff" rx={4} />
                      {width > 70 && height > 28 && <text x={x + 6} y={y + 16} fill="#fff" fontSize={10.5} fontWeight={600}>{String(name).slice(0, Math.floor(width / 6.5))}</text>}
                      {width > 40 && height > 40 && <text x={x + 6} y={y + 32} fill="#fff" fontSize={13} fontWeight={800}>{size}</text>}</g>
                  )} />
              </ResponsiveContainer>
            </ChartCard>
          </div>

          <div className="two-col" style={{ marginTop: 20 }}>
            <ChartCard title="🚨 Most drained stations (capacity ≥ 20)" subtitle="Lowest bike availability %" height={300}>
              <ResponsiveContainer><BarChart data={m.emptiest} layout="vertical" margin={{ left: 40 }}><CartesianGrid strokeDasharray="3 3" stroke="var(--border)" /><XAxis type="number" domain={[0, 100]} fontSize={11} stroke="var(--text-secondary)" /><YAxis type="category" dataKey="name" width={150} fontSize={10.5} stroke="var(--text-secondary)" /><Tooltip content={<ChartTooltip />} /><Bar dataKey="pct" name="Availability %" fill="#C8553D" radius={[0, 6, 6, 0]} /></BarChart></ResponsiveContainer>
            </ChartCard>
            <ChartCard title="🅿️ Fullest stations (capacity ≥ 20)" subtitle="Highest bike availability % — hard to return a bike" height={300}>
              <ResponsiveContainer><BarChart data={m.fullest} layout="vertical" margin={{ left: 40 }}><CartesianGrid strokeDasharray="3 3" stroke="var(--border)" /><XAxis type="number" domain={[0, 100]} fontSize={11} stroke="var(--text-secondary)" /><YAxis type="category" dataKey="name" width={150} fontSize={10.5} stroke="var(--text-secondary)" /><Tooltip content={<ChartTooltip />} /><Bar dataKey="pct" name="Availability %" fill="#344E41" radius={[0, 6, 6, 0]} /></BarChart></ResponsiveContainer>
            </ChartCard>
          </div>
        </>
      )}

      <style>{`
        .hero { position: relative; overflow: hidden; padding: 44px clamp(20px,4vw,56px); background: linear-gradient(135deg, var(--navbar), #4A6A4B); color: #fff; } .hero:hover { transform: none; }
        .hero-bg { position: absolute; inset: 0; opacity: .6; } .route-lines { width: 100%; height: 100%; }
        .dash-anim { animation: dashMove 6s linear infinite; } .dash-anim.slow { animation-duration: 9s; }
        .hero-content { position: relative; z-index: 2; max-width: 600px; }
        .hero h1 { color: #fff; font-size: clamp(24px, 4vw, 34px); margin: 12px 0 8px; }
        .hero p { color: rgba(255,255,255,.85); font-size: 15px; margin-bottom: 20px; }
        .hero-actions { display: flex; gap: 12px; flex-wrap: wrap; } .hero-bike { position: absolute; right: 30px; top: 20px; z-index: 1; }
      `}</style>
    </div>
  );
}
