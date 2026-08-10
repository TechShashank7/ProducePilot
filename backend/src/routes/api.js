import express from 'express';

import { getProducts } from '../controllers/productController.js';
import { getWarehouses, getWarehouseDestinations, getMapOverview } from '../controllers/warehouseController.js';
import { getBatches, getBatchDetail } from '../controllers/batchController.js';
import { getRescueRecommendation, acceptRescueRecommendation, writeOffBatch } from '../controllers/rescueController.js';
import { getSales } from '../controllers/salesController.js';
import { getQualityParams } from '../controllers/qualityController.js';
import { getOperations } from '../controllers/operationController.js';
import { getDashboardSummary } from '../controllers/dashboardController.js';
import riskRoutes from './riskRoutes.js';
import visionRoutes from './visionRoutes.js';
import agentRoutes from './agentRoutes.js';

const router = express.Router();

router.get('/products', getProducts);
router.get('/warehouses', getWarehouses);
router.get('/warehouses/:id/destinations', getWarehouseDestinations);
router.get('/batches', getBatches);
router.get('/batches/:id/detail', getBatchDetail);
router.get('/batches/:id/recommendation', getRescueRecommendation);
router.post('/batches/:id/recommendation/accept', acceptRescueRecommendation);
router.post('/batches/:id/recommendation/write-off', writeOffBatch);
router.get('/sales', getSales);
router.get('/quality-params', getQualityParams); // Get all
router.get('/quality-params/:productId', getQualityParams); // Get by product
router.get('/operations', getOperations);
router.get('/dashboard/summary', getDashboardSummary);
router.get('/map/overview', getMapOverview);

// Mount routes
import activityRoutes from './activityRoutes.js';
import demandRoutes from './demandRoutes.js';

router.use('/', activityRoutes);
router.use('/', demandRoutes);
router.use('/', riskRoutes);
router.use('/', visionRoutes);
router.use('/agents', agentRoutes);

export default router;
