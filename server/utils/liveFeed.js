// Live Citi Bike GBFS ingestion: station_information + station_status -> feature-engineered rows
export const STATION_INFO_URL = process.env.STATION_INFO_URL || 'https://gbfs.citibikenyc.com/gbfs/en/station_information.json';
export const STATION_STATUS_URL = process.env.STATION_STATUS_URL || 'https://gbfs.citibikenyc.com/gbfs/en/station_status.json';
const REGIONS_URL = process.env.SYSTEM_REGIONS_URL || 'https://gbfs.citibikenyc.com/gbfs/en/system_regions.json';
const POLL_MS = Number(process.env.LIVE_POLL_MS || 60000);
const MAX_HISTORY = 360; // ~6h of 1-min polls

const FALLBACK_REGIONS = { 70: 'Jersey City', 71: 'New York City', 311: 'Hoboken' };
const state = { rows: [], history: [], regions: { ...FALLBACK_REGIONS }, lastOk: null, lastError: null, polls: 0, failures: 0, latencyMs: null, fetchedStations: 0 };

const condition = (p) => (p <= 10 ? 'Critical Low' : p <= 25 ? 'Low' : p <= 75 ? 'Balanced' : p <= 90 ? 'High' : 'Critical High');
const capCat = (c) => (c <= 10 ? 'Low' : c <= 30 ? 'Medium' : c <= 60 ? 'High' : 'Very High');
const q = (arr, p) => { const s = [...arr].sort((a, b) => a - b); return s[Math.floor((s.length - 1) * p)] ?? 0; };

async function getJson(url) {
  const res = await fetch(url, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error(`${url} -> HTTP ${res.status}`);
  return res.json();
}

function buildRows(info, status, snapshotTime) {
  const st = new Map(status.map((s) => [s.station_id, s]));
  const d = new Date(snapshotTime);
  const rows = [];
  for (const i of info) {
    const s = st.get(i.station_id);
    if (!s) continue;
    const capacity = Number(i.capacity) || 0;
    const bikes = Number(s.num_bikes_available) || 0;
    const docks = Number(s.num_docks_available) || 0;
    const ebikes = Number(s.num_ebikes_available) || 0;
    const bikePct = capacity > 0 ? Math.min(100, (bikes / capacity) * 100) : 0;
    const dockPct = capacity > 0 ? Math.min(100, (docks / capacity) * 100) : 0;
    const hour = d.getUTCHours();
    const dow = d.getUTCDay();
    rows.push({
      station_id: i.station_id, name: i.name, region_name: state.regions[i.region_id] || (i.region_id ? `Region ${i.region_id}` : 'Unassigned'),
      lat: i.lat, lon: i.lon, capacity, num_bikes_available: bikes, num_ebikes_available: ebikes,
      num_docks_available: docks, num_bikes_disabled: Number(s.num_bikes_disabled) || 0,
      is_renting: s.is_renting ? 1 : 0, is_returning: s.is_returning ? 1 : 0,
      snapshot_time: snapshotTime, last_reported: s.last_reported ? new Date(s.last_reported * 1000).toISOString() : '',
      hour, minute: d.getUTCMinutes(), day_of_week: dow, month: d.getUTCMonth() + 1,
      is_weekend: dow === 0 || dow === 6 ? 1 : 0, is_peak_hour: [7, 8, 9, 17, 18, 19].includes(hour) ? 1 : 0,
      bike_availability_pct: +bikePct.toFixed(2), dock_availability_pct: +dockPct.toFixed(2),
      station_condition: condition(bikePct), station_utilization: +(capacity ? 1 - Math.min(docks, capacity) / capacity : 0).toFixed(3),
      total_available: bikes + docks, bike_dock_ratio: docks > 0 ? +(bikes / docks).toFixed(3) : 0,
      capacity_category: capCat(capacity), lat_zone: +Number(i.lat).toFixed(2), lon_zone: +Number(i.lon).toFixed(2),
      low_bike_availability: bikePct < 20 ? 1 : 0, high_bike_availability: bikePct > 80 ? 1 : 0,
      empty_station: bikes === 0 ? 1 : 0, full_station: docks === 0 ? 1 : 0,
      is_outlier_capacity: 0, is_outlier_bikes: 0, is_outlier_docks: 0,
    });
  }
  // IQR outlier flags (same rule as the EDA notebook)
  for (const [col, flag] of [['capacity', 'is_outlier_capacity'], ['num_bikes_available', 'is_outlier_bikes'], ['num_docks_available', 'is_outlier_docks']]) {
    const v = rows.map((r) => r[col]); const q1 = q(v, 0.25), q3 = q(v, 0.75), iqr = q3 - q1;
    rows.forEach((r) => { r[flag] = r[col] < q1 - 1.5 * iqr || r[col] > q3 + 1.5 * iqr ? 1 : 0; });
  }
  return rows;
}

export async function pollLive() {
  const t0 = Date.now();
  state.polls++;
  try {
    const [infoJ, statusJ] = await Promise.all([getJson(STATION_INFO_URL), getJson(STATION_STATUS_URL)]);
    getJson(REGIONS_URL).then((j) => { for (const r of j.data.regions) state.regions[r.region_id] = r.name; }).catch(() => {});
    const snapshotTime = new Date().toISOString();
    const rows = buildRows(infoJ.data.stations, statusJ.data.stations, snapshotTime);
    state.rows = rows;
    state.fetchedStations = rows.length;
    state.latencyMs = Date.now() - t0;
    state.lastOk = snapshotTime; state.lastError = null;
    const n = rows.length || 1;
    state.history.push({
      time: snapshotTime, stations: rows.length,
      bikes: rows.reduce((a, r) => a + r.num_bikes_available, 0), ebikes: rows.reduce((a, r) => a + r.num_ebikes_available, 0),
      docks: rows.reduce((a, r) => a + r.num_docks_available, 0),
      avgAvailabilityPct: +(rows.reduce((a, r) => a + r.bike_availability_pct, 0) / n).toFixed(2),
      empty: rows.filter((r) => r.empty_station).length, full: rows.filter((r) => r.full_station).length,
    });
    if (state.history.length > MAX_HISTORY) state.history.shift();
  } catch (err) {
    state.failures++; state.lastError = err.message; state.latencyMs = Date.now() - t0;
    console.warn('[live] poll failed:', err.message);
  }
}

export function startLivePolling() { pollLive(); return setInterval(pollLive, POLL_MS); }
export const getLiveRows = () => state.rows;
export const getLiveHistory = () => state.history;
export function getLiveStatus() {
  return {
    ok: !!state.lastOk && !state.lastError, lastOk: state.lastOk, lastError: state.lastError, polls: state.polls, failures: state.failures,
    latencyMs: state.latencyMs, stations: state.fetchedStations, pollIntervalSec: POLL_MS / 1000, snapshotsHeld: state.history.length,
    sources: { stationInformation: STATION_INFO_URL, stationStatus: STATION_STATUS_URL },
  };
}
