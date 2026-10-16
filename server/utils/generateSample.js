// Generates a realistic multi-city, multi-snapshot dataset that matches the
// exact schema produced by the user's Citi Bike EDA + feature engineering script.
// Used only when no real CSV is found at DATA_FILE, so the app runs out of the box.

const CITIES = [
  { region_name: 'New York City', latBase: 40.75, lonBase: -73.98, stations: 14 },
  { region_name: 'Jersey City', latBase: 40.72, lonBase: -74.05, stations: 8 },
  { region_name: 'Boston', latBase: 42.36, lonBase: -71.06, stations: 9 },
  { region_name: 'Chicago', latBase: 41.88, lonBase: -87.63, stations: 10 },
  { region_name: 'San Francisco', latBase: 37.77, lonBase: -122.42, stations: 8 },
];

const STREET_NAMES = [
  '5th Ave & E 15 St', 'Broadway & W 32 St', 'Market St & 4th St', 'State St & Lake St',
  'Newark Ave & Grove St', 'Boylston St & Berkeley St', 'Michigan Ave & Wacker Dr',
  'Mission St & 7th St', 'Grand St & Havemeyer St', 'Columbus Ave & W 72 St',
  'Clark St & Adams St', 'Pier 39 & Beach St', 'Journal Sq Plaza', 'Harvard Sq Station',
  'Union Sq & 14 St', 'Wells St & Monroe St', 'Embarcadero & Folsom St', 'Exchange Pl',
  'Copley Sq', 'W 42 St & 8 Ave',
];

function seededRandom(seed) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function classifyStation(pct) {
  if (pct <= 10) return 'Critical Low';
  if (pct <= 25) return 'Low';
  if (pct <= 75) return 'Balanced';
  if (pct <= 90) return 'High';
  return 'Critical High';
}

function capacityCategory(capacity) {
  if (capacity <= 10) return 'Low';
  if (capacity <= 30) return 'Medium';
  if (capacity <= 60) return 'High';
  return 'Very High';
}

export function generateSampleDataset() {
  const rng = seededRandom(42);
  const rows = [];
  let stationCounter = 1;
  const stationMeta = [];

  CITIES.forEach((city) => {
    for (let i = 0; i < city.stations; i++) {
      stationMeta.push({
        station_id: `ST-${String(stationCounter).padStart(4, '0')}`,
        name: STREET_NAMES[(stationCounter - 1) % STREET_NAMES.length] + ` (${city.region_name})`,
        region_name: city.region_name,
        lat: +(city.latBase + (rng() - 0.5) * 0.08).toFixed(5),
        lon: +(city.lonBase + (rng() - 0.5) * 0.08).toFixed(5),
        capacity: [12, 19, 23, 27, 31, 39, 45, 52, 64][Math.floor(rng() * 9)],
      });
      stationCounter++;
    }
  });

  // Simulate 24 hourly snapshots across a single day (2026-09-20)
  const snapshotHours = Array.from({ length: 24 }, (_, h) => h);
  const baseDate = new Date('2026-09-20T00:00:00Z');

  stationMeta.forEach((st) => {
    snapshotHours.forEach((hour) => {
      const snapshotTime = new Date(baseDate);
      snapshotTime.setUTCHours(hour);

      const isPeak = [7, 8, 9, 17, 18, 19].includes(hour);
      const isNight = hour >= 0 && hour <= 5;
      // Peak hours drain bikes (commute out) or fill docks depending on station role
      let bikeRatio = 0.5 + Math.sin((hour / 24) * Math.PI * 2) * 0.28 + (rng() - 0.5) * 0.18;
      if (isPeak) bikeRatio -= 0.15;
      if (isNight) bikeRatio += 0.2;
      bikeRatio = Math.min(0.98, Math.max(0.02, bikeRatio));

      const numBikes = Math.round(st.capacity * bikeRatio);
      const numDocks = Math.max(0, st.capacity - numBikes);
      const bikePct = st.capacity > 0 ? (numBikes / st.capacity) * 100 : 0;
      const dockPct = st.capacity > 0 ? (numDocks / st.capacity) * 100 : 0;
      const dayOfWeek = snapshotTime.getUTCDay();

      rows.push({
        station_id: st.station_id,
        name: st.name,
        region_name: st.region_name,
        lat: st.lat,
        lon: st.lon,
        capacity: st.capacity,
        num_bikes_available: numBikes,
        num_docks_available: numDocks,
        is_renting: rng() > 0.03 ? 1 : 0,
        is_returning: rng() > 0.03 ? 1 : 0,
        snapshot_time: snapshotTime.toISOString(),
        last_reported: snapshotTime.toISOString(),
        hour,
        minute: 0,
        day_of_week: dayOfWeek,
        month: snapshotTime.getUTCMonth() + 1,
        is_weekend: dayOfWeek === 0 || dayOfWeek === 6 ? 1 : 0,
        is_peak_hour: isPeak ? 1 : 0,
        bike_availability_pct: +bikePct.toFixed(2),
        dock_availability_pct: +dockPct.toFixed(2),
        station_condition: classifyStation(bikePct),
        station_utilization: +(1 - numDocks / (st.capacity || 1)).toFixed(3),
        total_available: numBikes + numDocks,
        bike_dock_ratio: numDocks > 0 ? +(numBikes / numDocks).toFixed(3) : 0,
        capacity_category: capacityCategory(st.capacity),
        lat_zone: +st.lat.toFixed(2),
        lon_zone: +st.lon.toFixed(2),
        low_bike_availability: bikePct < 20 ? 1 : 0,
        high_bike_availability: bikePct > 80 ? 1 : 0,
        empty_station: numBikes === 0 ? 1 : 0,
        full_station: numDocks === 0 ? 1 : 0,
        is_outlier_capacity: 0,
        is_outlier_bikes: 0,
        is_outlier_docks: 0,
      });
    });
  });

  return rows;
}
