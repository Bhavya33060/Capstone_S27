// import 'dotenv/config';
// import express from 'express';
// import cors from 'cors';
// import authRoutes from './routes/auth.routes.js';
// import { liveRouter } from './routes/stations.routes.js';
// import dbRoutes from './routes/db.routes.js';
// import { requireAuth } from './middleware/auth.js';
// import { startLivePolling, getLiveStatus } from './utils/liveFeed.js';

// const app = express();
// const PORT = process.env.PORT || 5000;

// app.use(cors());
// app.use(express.json());

// app.get('/api/health', (req, res) => {
//   res.json({ status: 'ok', dataSource: 'live-gbfs', ...getLiveStatus() });
// });

// app.use('/api/auth', authRoutes);
// app.get('/api/live-health', (req, res) => res.json(getLiveStatus()));
// app.use('/api/live', requireAuth, liveRouter);
// app.use('/api/db', requireAuth, dbRoutes);

// app.use((req, res) => res.status(404).json({ error: 'Not found' }));
// app.use((err, req, res, next) => {
//   console.error(err);
//   res.status(500).json({ error: 'Internal server error' });
// });

// app.listen(PORT, () => {
//   startLivePolling();
//   console.log(`\nCiti Bike Analytics API running on http://localhost:${PORT}`);
//   console.log('Data source: live Citi Bike GBFS feeds (polling...)\n');
// });
import 'dotenv/config';
import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import cors from 'cors';
import authRoutes from './routes/auth.routes.js';
import { liveRouter } from './routes/stations.routes.js';
import dbRoutes from './routes/db.routes.js';
import { requireAuth } from './middleware/auth.js';
import { startLivePolling, getLiveStatus } from './utils/liveFeed.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', dataSource: 'live-gbfs', ...getLiveStatus() });
});

app.use('/api/auth', authRoutes);
app.get('/api/live-health', (req, res) => res.json(getLiveStatus()));
app.use('/api/live', requireAuth, liveRouter);
app.use('/api/db', requireAuth, dbRoutes);

// Serve the built React app (client/dist) from the same server -> one public URL
const dist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../client/dist');
if (fs.existsSync(dist)) {
  app.use(express.static(dist));
  app.get(/^\/(?!api).*/, (req, res) => res.sendFile(path.join(dist, 'index.html')));
}

app.use((req, res) => res.status(404).json({ error: 'Not found' }));
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  startLivePolling();
  console.log(`\nCiti Bike Analytics API running on http://localhost:${PORT}`);
  console.log('Data source: live Citi Bike GBFS feeds (polling...)\n');
});