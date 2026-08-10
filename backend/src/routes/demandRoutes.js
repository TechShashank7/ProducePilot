import express from 'express';
import { forecastDemand } from '../services/demandForecastService.js';
import { logAgentActivity } from '../services/activityLogger.js';

const router = express.Router();

// GET /api/forecast?productId=&warehouseId=&horizonDays=
router.get('/forecast', async (req, res) => {
  try {
    const { productId, warehouseId, horizonDays } = req.query;
    if (!productId || !warehouseId) {
      return res.status(400).json({ error: 'productId and warehouseId are required' });
    }
    
    const horizon = horizonDays ? parseInt(horizonDays, 10) : 7;
    const result = await forecastDemand({ productId, warehouseId, horizonDays: horizon });
    
    logAgentActivity({
      agentType: 'demand',
      action: 'Forecasted demand',
      productId: productId,
      warehouseId: warehouseId,
      summary: `Forecasted ${result.totalForecastedQtyKg} kg demand over ${horizon} days (${result.trendDirection} trend)`
    });

    res.json(result);
  } catch (error) {
    console.error('Forecast Error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
