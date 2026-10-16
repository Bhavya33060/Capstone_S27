import { Router } from 'express';
import {
  computeSummary, computeDataQuality, computeRegionSummary, computeConditionBreakdown,
  computeTemporal, computeCorrelation, computeCapacityStats, computeHeatGrid,
  getStations, getStationDetail, getRegions, loadDataset,
} from '../utils/dataLoader.js';
import { getLiveRows, getLiveHistory, getLiveStatus } from '../utils/liveFeed.js';

// One router factory, two mounts: /api/stations (CSV/historical) and /api/live (real-time GBFS)
export function buildRouter(rowsFn, { live = false } = {}) {
  const router = Router();
  const R = () => rowsFn();
  router.get('/summary', (req, res) => res.json(computeSummary(live ? R() : undefined)));
  router.get('/quality', (req, res) => res.json(computeDataQuality(live ? R() : undefined)));
  router.get('/regions/summary', (req, res) => res.json(computeRegionSummary(live ? R() : undefined)));
  router.get('/regions', (req, res) => res.json(getRegions(live ? R() : undefined)));
  router.get('/conditions', (req, res) => res.json(computeConditionBreakdown(live ? R() : undefined)));
  router.get('/temporal', (req, res) => res.json(computeTemporal(live ? R() : undefined)));
  router.get('/correlation', (req, res) => res.json(computeCorrelation(live ? R() : undefined)));
  router.get('/capacity-stats', (req, res) => res.json(computeCapacityStats(live ? R() : undefined)));
  router.get('/heat-grid', (req, res) => res.json(computeHeatGrid(live ? R() : undefined)));

  if (live) {
    router.get('/status', (req, res) => res.json(getLiveStatus()));
    router.get('/trend', (req, res) => res.json(getLiveHistory()));
  }

  router.get('/', (req, res) => {
    const { region, condition, search } = req.query;
    res.json(getStations({ region, condition, search }, live ? R() : undefined));
  });
  router.get('/:id', (req, res) => {
    const detail = getStationDetail(req.params.id, live ? R() : undefined);
    if (!detail) return res.status(404).json({ error: 'Station not found' });
    res.json(detail);
  });
  return router;
}

export const liveRouter = buildRouter(getLiveRows, { live: true });
