import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { generateSampleDataset } from './generateSample.js';

const NUMERIC_FIELDS = new Set([
  'lat', 'lon', 'capacity', 'num_bikes_available', 'num_docks_available',
  'is_renting', 'is_returning', 'hour', 'minute', 'day_of_week', 'month',
  'is_weekend', 'is_peak_hour', 'bike_availability_pct', 'dock_availability_pct',
  'station_utilization', 'total_available', 'bike_dock_ratio', 'lat_zone', 'lon_zone',
  'low_bike_availability', 'high_bike_availability', 'empty_station', 'full_station',
  'is_outlier_capacity', 'is_outlier_bikes', 'is_outlier_docks',
]);

function coerceRow(row) {
  const out = { ...row };
  for (const key of Object.keys(out)) {
    if (NUMERIC_FIELDS.has(key) && out[key] !== '' && out[key] !== undefined) {
      const n = Number(out[key]);
      if (!Number.isNaN(n)) out[key] = n;
    }
  }
  return out;
}

let cache = null;

export function loadDataset() {
  if (cache) return cache;

  const dataFile = process.env.DATA_FILE || './data/citi_bike_feature_engineered.csv';
  const resolved = path.resolve(dataFile);
  let rows;
  let source;

  if (fs.existsSync(resolved)) {
    const raw = fs.readFileSync(resolved, 'utf-8');
    rows = parse(raw, { columns: true, skip_empty_lines: true }).map(coerceRow);
    source = 'uploaded-csv';
  } else {
    rows = generateSampleDataset();
    source = 'synthetic-sample';
  }

  cache = { rows, source, loadedAt: new Date().toISOString() };
  return cache;
}

function mean(arr) {
  if (!arr.length) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function stddev(arr) {
  if (arr.length < 2) return 0;
  const m = mean(arr);
  return Math.sqrt(mean(arr.map((x) => (x - m) ** 2)));
}

function pearson(x, y) {
  const n = Math.min(x.length, y.length);
  if (n === 0) return 0;
  const mx = mean(x), my = mean(y);
  let num = 0, dx = 0, dy = 0;
  for (let i = 0; i < n; i++) {
    num += (x[i] - mx) * (y[i] - my);
    dx += (x[i] - mx) ** 2;
    dy += (y[i] - my) ** 2;
  }
  const denom = Math.sqrt(dx * dy);
  return denom === 0 ? 0 : +(num / denom).toFixed(3);
}

// ---- Analytics (mirrors EDA 05-20 + feature engineering sections) ----

export function computeSummary(rowsArg) {
  const { rows, source, loadedAt } = rowsArg ? { rows: rowsArg, source: "live", loadedAt: new Date().toISOString() } : loadDataset();
  const stationIds = new Set(rows.map((r) => r.station_id));
  const snapshots = new Set(rows.map((r) => r.snapshot_time));
  const regions = new Set(rows.map((r) => r.region_name));

  return {
    source, loadedAt,
    totalRecords: rows.length,
    totalStations: stationIds.size,
    totalSnapshots: snapshots.size,
    totalRegions: regions.size,
    avgCapacity: +mean(rows.map((r) => r.capacity)).toFixed(2),
    avgBikesAvailable: +mean(rows.map((r) => r.num_bikes_available)).toFixed(2),
    avgDocksAvailable: +mean(rows.map((r) => r.num_docks_available)).toFixed(2),
    avgBikeAvailabilityPct: +mean(rows.map((r) => r.bike_availability_pct)).toFixed(2),
    criticalLow: rows.filter((r) => r.station_condition === 'Critical Low').length,
    criticalHigh: rows.filter((r) => r.station_condition === 'Critical High').length,
    emptyStations: rows.filter((r) => r.empty_station === 1).length,
    fullStations: rows.filter((r) => r.full_station === 1).length,
  };
}

export function computeDataQuality(rowsArg) {
  const { rows } = rowsArg ? { rows: rowsArg, source: "live", loadedAt: new Date().toISOString() } : loadDataset();
  const fields = rows.length ? Object.keys(rows[0]) : [];
  const missing = fields.map((f) => ({
    field: f,
    missingCount: rows.filter((r) => r[f] === '' || r[f] === undefined || r[f] === null).length,
  })).filter((m) => m.missingCount > 0);

  const seen = new Set();
  let duplicateRows = 0;
  rows.forEach((r) => {
    const key = JSON.stringify(r);
    if (seen.has(key)) duplicateRows++; else seen.add(key);
  });

  const stKey = new Set();
  let stationSnapshotDupes = 0;
  rows.forEach((r) => {
    const key = `${r.station_id}__${r.snapshot_time}`;
    if (stKey.has(key)) stationSnapshotDupes++; else stKey.add(key);
  });

  const invalidCapacity = rows.filter((r) => r.capacity < 0).length;
  const invalidBikes = rows.filter((r) => r.num_bikes_available < 0 || r.num_bikes_available > r.capacity).length;
  const invalidDocks = rows.filter((r) => r.num_docks_available < 0 || r.num_docks_available > r.capacity).length;

  return {
    missingByField: missing,
    totalMissing: missing.reduce((a, b) => a + b.missingCount, 0),
    duplicateRows,
    stationSnapshotDupes,
    invalidCapacity,
    invalidBikes,
    invalidDocks,
    staleReports: rows.filter((r) => r.last_reported && r.snapshot_time && (new Date(r.snapshot_time) - new Date(r.last_reported)) > 3600e3).length,
    notRenting: rows.filter((r) => r.is_renting === 0).length,
    totalRows: rows.length,
    outlierCapacity: rows.filter((r) => r.is_outlier_capacity === 1).length,
    outlierBikes: rows.filter((r) => r.is_outlier_bikes === 1).length,
    outlierDocks: rows.filter((r) => r.is_outlier_docks === 1).length,
  };
}

export function computeRegionSummary(rowsArg) {
  const { rows } = rowsArg ? { rows: rowsArg, source: "live", loadedAt: new Date().toISOString() } : loadDataset();
  const byRegion = {};
  rows.forEach((r) => {
    if (!byRegion[r.region_name]) byRegion[r.region_name] = [];
    byRegion[r.region_name].push(r);
  });

  return Object.entries(byRegion).map(([region_name, rs]) => ({
    region_name,
    stations: new Set(rs.map((r) => r.station_id)).size,
    avgCapacity: +mean(rs.map((r) => r.capacity)).toFixed(2),
    avgBikesAvailable: +mean(rs.map((r) => r.num_bikes_available)).toFixed(2),
    avgDocksAvailable: +mean(rs.map((r) => r.num_docks_available)).toFixed(2),
    avgBikeAvailabilityPct: +mean(rs.map((r) => r.bike_availability_pct)).toFixed(2),
    avgDockAvailabilityPct: +mean(rs.map((r) => r.dock_availability_pct)).toFixed(2),
  })).sort((a, b) => b.avgBikeAvailabilityPct - a.avgBikeAvailabilityPct);
}

export function computeConditionBreakdown(rowsArg) {
  const { rows } = rowsArg ? { rows: rowsArg, source: "live", loadedAt: new Date().toISOString() } : loadDataset();
  const counts = {};
  rows.forEach((r) => { counts[r.station_condition] = (counts[r.station_condition] || 0) + 1; });
  return Object.entries(counts).map(([condition, count]) => ({ condition, count }));
}

export function computeTemporal(rowsArg) {
  const { rows } = rowsArg ? { rows: rowsArg, source: "live", loadedAt: new Date().toISOString() } : loadDataset();
  const byHour = {};
  rows.forEach((r) => {
    if (!byHour[r.hour]) byHour[r.hour] = [];
    byHour[r.hour].push(r.num_bikes_available);
  });
  const hourly = Object.entries(byHour)
    .map(([hour, vals]) => ({ hour: Number(hour), avgBikes: +mean(vals).toFixed(2) }))
    .sort((a, b) => a.hour - b.hour);

  const weekend = rows.filter((r) => r.is_weekend === 1).map((r) => r.num_bikes_available);
  const weekday = rows.filter((r) => r.is_weekend === 0).map((r) => r.num_bikes_available);
  const peak = rows.filter((r) => r.is_peak_hour === 1).map((r) => r.bike_availability_pct);
  const offPeak = rows.filter((r) => r.is_peak_hour === 0).map((r) => r.bike_availability_pct);

  return {
    hourly,
    weekdayAvgBikes: +mean(weekday).toFixed(2),
    weekendAvgBikes: +mean(weekend).toFixed(2),
    peakAvgAvailabilityPct: +mean(peak).toFixed(2),
    offPeakAvgAvailabilityPct: +mean(offPeak).toFixed(2),
  };
}

export function computeCorrelation(rowsArg) {
  const { rows } = rowsArg ? { rows: rowsArg, source: "live", loadedAt: new Date().toISOString() } : loadDataset();
  const cols = ['capacity', 'num_bikes_available', 'num_docks_available', 'bike_availability_pct', 'dock_availability_pct'];
  const series = Object.fromEntries(cols.map((c) => [c, rows.map((r) => r[c])]));
  const matrix = cols.map((c1) => cols.map((c2) => pearson(series[c1], series[c2])));
  return { columns: cols, matrix };
}

export function computeCapacityStats(rowsArg) {
  const { rows } = rowsArg ? { rows: rowsArg, source: "live", loadedAt: new Date().toISOString() } : loadDataset();
  const capacities = rows.map((r) => r.capacity);
  const bikes = rows.map((r) => r.num_bikes_available);
  const docks = rows.map((r) => r.num_docks_available);
  const bucket = (arr, size) => {
    const buckets = {};
    arr.forEach((v) => {
      const b = Math.floor(v / size) * size;
      buckets[b] = (buckets[b] || 0) + 1;
    });
    return Object.entries(buckets).map(([k, v]) => ({ bucket: Number(k), count: v })).sort((a, b) => a.bucket - b.bucket);
  };
  return {
    capacity: { min: Math.min(...capacities), max: Math.max(...capacities), mean: +mean(capacities).toFixed(2), std: +stddev(capacities).toFixed(2), histogram: bucket(capacities, 10) },
    bikes: { min: Math.min(...bikes), max: Math.max(...bikes), mean: +mean(bikes).toFixed(2), std: +stddev(bikes).toFixed(2), histogram: bucket(bikes, 5) },
    docks: { min: Math.min(...docks), max: Math.max(...docks), mean: +mean(docks).toFixed(2), std: +stddev(docks).toFixed(2), histogram: bucket(docks, 5) },
  };
}

export function getStations({ region, condition, search } = {}, rowsArg) {
  const { rows } = rowsArg ? { rows: rowsArg, source: "live", loadedAt: new Date().toISOString() } : loadDataset();
  // Latest snapshot per station
  const latestByStation = {};
  rows.forEach((r) => {
    const key = r.station_id;
    if (!latestByStation[key] || new Date(r.snapshot_time) > new Date(latestByStation[key].snapshot_time)) {
      latestByStation[key] = r;
    }
  });
  let list = Object.values(latestByStation);
  if (region) list = list.filter((r) => r.region_name === region);
  if (condition) list = list.filter((r) => r.station_condition === condition);
  if (search) list = list.filter((r) => r.name.toLowerCase().includes(search.toLowerCase()));
  return list.sort((a, b) => b.bike_availability_pct - a.bike_availability_pct);
}

export function getStationDetail(stationId, rowsArg) {
  const { rows } = rowsArg ? { rows: rowsArg } : loadDataset();
  const history = rows.filter((r) => r.station_id === stationId).sort((a, b) => new Date(a.snapshot_time) - new Date(b.snapshot_time));
  if (!history.length) return null;
  const latest = history[history.length - 1];
  return {
    station: latest,
    history: history.map((h) => ({
      snapshot_time: h.snapshot_time,
      hour: h.hour,
      num_bikes_available: h.num_bikes_available,
      num_docks_available: h.num_docks_available,
      bike_availability_pct: h.bike_availability_pct,
    })),
    minBikes: Math.min(...history.map((h) => h.num_bikes_available)),
    maxBikes: Math.max(...history.map((h) => h.num_bikes_available)),
    avgBikePct: +mean(history.map((h) => h.bike_availability_pct)).toFixed(2),
  };
}

export function getRegions(rowsArg) {
  const { rows } = rowsArg ? { rows: rowsArg, source: "live", loadedAt: new Date().toISOString() } : loadDataset();
  return [...new Set(rows.map((r) => r.region_name))].sort();
}

export function computeHeatGrid(rowsArg) {
  const { rows } = rowsArg ? { rows: rowsArg } : loadDataset();
  const regions = [...new Set(rows.map((r) => r.region_name))].sort();
  const acc = {};
  rows.forEach((r) => { const k = `${r.region_name}|${r.hour}`; (acc[k] ||= []).push(r.bike_availability_pct); });
  return {
    regions, hours: Array.from({ length: 24 }, (_, h) => h),
    matrix: regions.map((rg) => Array.from({ length: 24 }, (_, h) => (acc[`${rg}|${h}`] ? +mean(acc[`${rg}|${h}`]).toFixed(1) : null))),
  };
}

export function getRowsPage(rows, { page = 1, pageSize = 25, search = '', sort = '', dir = 'asc', region = '' } = {}) {
  let list = rows;
  if (region) list = list.filter((r) => r.region_name === region);
  if (search) { const q = search.toLowerCase(); list = list.filter((r) => String(r.name).toLowerCase().includes(q) || String(r.station_id).toLowerCase().includes(q)); }
  if (sort) list = [...list].sort((a, b) => (a[sort] > b[sort] ? 1 : a[sort] < b[sort] ? -1 : 0) * (dir === 'desc' ? -1 : 1));
  const total = list.length;
  const start = (Math.max(1, +page) - 1) * +pageSize;
  return { total, page: +page, pageSize: +pageSize, rows: list.slice(start, start + +pageSize) };
}

export function describeSchema(rows) {
  if (!rows.length) return [];
  return Object.keys(rows[0]).map((col) => {
    const vals = rows.map((r) => r[col]);
    const nulls = vals.filter((v) => v === '' || v === null || v === undefined).length;
    const type = vals.every((v) => typeof v === 'number') ? 'number' : 'text';
    return { column: col, type, nulls, unique: new Set(vals).size, sample: rows[0][col] };
  });
}
