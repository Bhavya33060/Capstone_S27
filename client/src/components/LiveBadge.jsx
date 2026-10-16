import { useApiData } from '../services/useApiData.js';
import { liveApi } from '../services/api.js';

export default function LiveBadge() {
  const { data } = useApiData(liveApi.status, [], 30000);
  const ok = data?.ok;
  const t = data?.lastOk ? new Date(data.lastOk).toLocaleTimeString() : '—';
  return (
    <span className={`badge ${ok ? 'badge-success' : data ? 'badge-error' : 'badge-warning'}`} title={data?.lastError || ''}>
      <span className="status-dot" style={{ background: ok ? '#6A994E' : '#C8553D' }} />
      {ok ? `LIVE · ${data.stations.toLocaleString()} stations · ${t}` : data ? 'Feed unreachable — retrying' : 'Connecting…'}
    </span>
  );
}
