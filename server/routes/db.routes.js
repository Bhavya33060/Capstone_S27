import { Router } from 'express';
import { getRowsPage, describeSchema } from '../utils/dataLoader.js';
import { getLiveRows } from '../utils/liveFeed.js';

const router = Router();
const pick = () => getLiveRows();

router.get('/schema', (req, res) => {
  const rows = pick(req.query.source);
  res.json({ source: 'live-gbfs', rowCount: rows.length, columns: describeSchema(rows) });
});

router.get('/rows', (req, res) => res.json(getRowsPage(pick(req.query.source), req.query)));

router.get('/export.csv', (req, res) => {
  const rows = pick(req.query.source);
  if (!rows.length) return res.status(404).json({ error: 'No data yet' });
  const cols = Object.keys(rows[0]);
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="citibike_live.csv"`);
  res.send([cols.join(','), ...rows.map((r) => cols.map((c) => esc(r[c])).join(','))].join('\n'));
});

export default router;
