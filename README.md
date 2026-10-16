# CitiBike Analytics — Full-Stack Platform

Real-time, multi-city bike-share station analytics: JWT-authenticated React dashboard on top of an
Express API that serves your actual `citi_bike_feature_engineered.csv` output (or a realistic
synthetic dataset with the same schema if you haven't dropped one in yet).

This directly reflects your EDA + feature-engineering script — station condition tiers, bike/dock
availability %, station utilization, peak-hour/weekend flags, capacity categories, IQR outlier flags,
missing-value/duplicate/invalid-record checks, and the region-wise comparison — served through a real
backend and rendered in a polished, animated dashboard (your color palette: warm cream background,
deep sage navbar, sage-green primary, terracotta accent).

## Project Structure
```
citibike-analytics/
├── server/     Express API + JWT auth + analytics (Node.js)
└── client/     React + Vite dashboard (JavaScript, no TypeScript)
```

## 1. Run the Backend

```bash
cd server
npm install
cp .env.example .env
npm run dev
```

Runs on `http://localhost:5000`. On first boot it looks for
`server/data/citi_bike_feature_engineered.csv` (the exact file your script outputs). If it's not
there, it auto-generates a synthetic multi-city dataset with the identical schema so the app is
fully demoable immediately.

**To use your real data:** just copy your `citi_bike_feature_engineered.csv` into `server/data/`
and restart the server — no code changes needed, since the API reads columns generically.

## 2. Run the Frontend

```bash
cd client
npm install
npm run dev
```

Opens on `http://localhost:5173`. In dev mode, Vite proxies all `/api/*` requests to the backend
on port 5000 (see `client/vite.config.js`) — no CORS setup needed locally.

## 3. Use It
1. Open `http://localhost:5173` → you'll land on `/login`.
2. Click **Create one** to register (name, email, password — stored with bcrypt-hashed passwords
   in `server/data/users.json`).
3. You're redirected into the dashboard, authenticated with a JWT stored in `localStorage`.

## API Reference (all except `/auth/*` require `Authorization: Bearer <token>`)

| Endpoint | Purpose |
|---|---|
| `POST /api/auth/register` | Create account, returns JWT |
| `POST /api/auth/login` | Login, returns JWT |
| `GET /api/auth/me` | Current user from token |
| `GET /api/stations` | Latest snapshot per station (filters: `region`, `condition`, `search`) |
| `GET /api/stations/:id` | Full history + stats for one station |
| `GET /api/stations/summary` | Dataset-wide KPIs |
| `GET /api/stations/quality` | Missing values, duplicates, invalid records, outlier counts |
| `GET /api/stations/regions/summary` | Per-city averages |
| `GET /api/stations/regions` | List of city/region names |
| `GET /api/stations/conditions` | Station condition tier counts |
| `GET /api/stations/temporal` | Hourly averages, weekday/weekend, peak/off-peak |
| `GET /api/stations/correlation` | Pearson correlation matrix of numeric columns |
| `GET /api/stations/capacity-stats` | Distribution stats + histograms |

## Frontend Pages
Dashboard · Station Explorer (filter + drill-down history) · Regional Comparison · Temporal Patterns
· Geospatial Map (Leaflet, colored by condition, search/filter/heatmap) · Data Quality & Validation
(correlation matrix, outlier/duplicate/invalid checks, histograms) · System Architecture · About

## Production Build
```bash
# Backend: just run `npm start` behind a process manager (pm2, systemd, etc.)
cd server && npm start

# Frontend: build static assets, then serve /dist behind any static host,
# pointing VITE_API_URL at your deployed backend URL
cd client && npm run build
```
Set `client/.env` → `VITE_API_URL=https://your-api-domain.com/api` before building for production
(the dev proxy only applies to `npm run dev`).

## Security Notes for a Real Deployment
- Change `JWT_SECRET` in `server/.env` to a long random value.
- `users.json` is a flat-file store for demo purposes — swap in a real database (Postgres/MongoDB)
  before deploying with real users.
- Add HTTPS + a rate limiter (e.g. `express-rate-limit`) on `/api/auth/*` in production.

## v2 — Live data, Heatmaps, Database (changes requested by faculty)
- **Live data:** the server polls the Citi Bike GBFS feeds every 60s (`server/utils/liveFeed.js`):
  `station_information.json` + `station_status.json` (+ `system_regions.json` for city names), joins them,
  and applies the same feature engineering + IQR outlier flags. Needs internet access from the server.
- **New endpoints:** `/api/live/*` (same shape as `/api/stations/*` but real-time, plus `/status`, `/trend`),
  `/api/db/schema`, `/api/db/rows`, `/api/db/export.csv`. All data routes now require the JWT.
- **Page order:** Project Overview → System Architecture → Data Quality → Database → Live Dashboard →
  Heatmaps → Geospatial Map → Station Explorer → Regional Comparison → Temporal Patterns.
- **Heatmaps:** canvas heat layer on the map (legend bottom-left), hour × city matrix, capacity × condition matrix.
- Env: `LIVE_POLL_MS`, `STATION_INFO_URL`, `STATION_STATUS_URL` (see `server/.env.example`).
