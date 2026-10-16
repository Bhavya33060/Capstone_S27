import MapView from '../components/MapView.jsx';
import KPICard from '../components/KPICard.jsx';
import { SkeletonGrid, SkeletonCard, ErrorState } from '../components/Loading.jsx';
import { MapPinned, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useApiData } from '../services/useApiData.js';
import { liveApi } from '../services/api.js';

export default function GeospatialMap() {
  const { data: stations, loading, error } = useApiData((token) => liveApi.list(token, {}), [], 60000);

  const critical = stations?.filter((s) => s.station_condition === 'Critical Low' || s.station_condition === 'Critical High').length ?? 0;
  const balanced = stations?.filter((s) => s.station_condition === 'Balanced').length ?? 0;

  return (
    <div className="page-content fade-in">
      <div className="section-head">
        <h1>Geospatial Analysis</h1>
        <p>Every live Citi Bike station coloured by condition — search or filter. See the Heatmap page for density views.</p>
      </div>

      {error && <ErrorState message={error} />}

      {loading ? <SkeletonGrid count={3} /> : stations && (
        <div className="kpi-grid stagger" style={{ marginBottom: 20 }}>
          <KPICard icon={MapPinned} label="Mapped Stations" value={stations.length} accent="primary" />
          <KPICard icon={AlertTriangle} label="Critical Stations" value={critical} accent="accent" />
          <KPICard icon={CheckCircle2} label="Balanced Stations" value={balanced} accent="secondary" />
        </div>
      )}

      {loading ? <SkeletonCard height={540} /> : stations && <MapView stations={stations} height={540} />}
    </div>
  );
}
