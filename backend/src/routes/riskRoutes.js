import express from 'express';
import { getBatchRisk, getRiskSummary } from '../controllers/riskController.js';

const router = express.Router();

router.get('/batches/:id/risk', getBatchRisk);
router.get('/risk-summary', getRiskSummary);

export default router;
