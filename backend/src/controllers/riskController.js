import Batch from '../models/Batch.js';
import QualityParam from '../models/QualityParam.js';
import AcceptedRescueAction from '../models/AcceptedRescueAction.js';
import Destination from '../models/Destination.js';
import { computeSpoilageRisk } from '../services/spoilageEngine.js';
import { getDeterministicCandidates } from '../services/rescueEngine.js';
import { getRecentAvgPrice } from '../services/pricingHelper.js';
import { forecastDemand } from '../services/demandForecastService.js';
import { logAgentActivity } from '../services/activityLogger.js';

export const getBatchRisk = async (req, res) => {
  try {
    const { id } = req.params;
    const batch = await Batch.findById(id).populate('productRef');
    if (!batch) {
      return res.status(404).json({ message: 'Batch not found' });
    }

    const qualityParam = await QualityParam.findOne({ productRef: batch.productRef._id });
    const riskData = computeSpoilageRisk({ batch, product: batch.productRef, qualityParam });

    logAgentActivity({
      agentType: 'inventory',
      action: 'Computed spoilage risk',
      batchId: batch._id,
      productId: batch.productRef._id,
      warehouseId: batch.warehouseRef,
      summary: `Flagged batch ${batch.batchCode} (${batch.productRef.name}) at ${riskData.riskPct}% risk (${riskData.riskCategory} tier)`
    });

    res.json(riskData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getRiskSummary = async (req, res) => {
  try {
    const { warehouseId, sortBy, limit } = req.query;
    const filter = {};
    if (warehouseId) filter.warehouseRef = warehouseId;
    
    const queryLimit = parseInt(limit) || 250;

    const rescuedActions = await AcceptedRescueAction.find(filter);
    const handledBatchIds = new Set(rescuedActions.map(action => action.batchRef.toString()));

    const batches = await Batch.find(filter)
      .populate('productRef')
      .populate('warehouseRef');

    const productIds = [...new Set(batches.map(b => b.productRef._id.toString()))];
    const qualityParams = await QualityParam.find({ productRef: { $in: productIds } });
    
    const qpMap = {};
    qualityParams.forEach(qp => {
      qpMap[qp.productRef.toString()] = qp;
    });

    const destCache = {};
    const getCachedDestinations = async (whId) => {
      const key = whId.toString();
      if (!destCache[key]) {
        destCache[key] = await Destination.find({ linkedWarehouseRef: whId });
      }
      return destCache[key];
    };

    const summary = [];
    
    for (const batch of batches) {
      if (handledBatchIds.has(batch._id.toString())) continue;

      const qp = qpMap[batch.productRef._id.toString()];
      const risk = computeSpoilageRisk({ batch, product: batch.productRef, qualityParam: qp });
      
      let hasViableCandidates = true;
      if (risk.riskCategory !== 'low') {
        // We only need destinations to check if all candidates would spoil in transit.
        // We can safely skip the heavy pricing and demand forecast queries here
        // because they only affect the sorted revenue, not the binary 'viable or unsalvageable' state.
        const destinations = await getCachedDestinations(batch.warehouseRef._id);

        const rescuePlan = getDeterministicCandidates({ 
          batch, 
          product: batch.productRef, 
          riskResult: risk, 
          destinations, 
          recentAvgPriceINR: 0,
          demandForecast: null
        });
        if (rescuePlan.unsalvageable) {
          hasViableCandidates = false;
        }
      }

      summary.push({
        batchId: batch._id,
        batchCode: batch.batchCode,
        productName: batch.productRef.name,
        warehouseName: batch.warehouseRef.name,
        quantityKg: batch.quantityKg,
        riskPct: risk.riskPct,
        riskCategory: risk.riskCategory,
        estimatedDaysRemaining: risk.estimatedDaysRemaining,
        hasViableCandidates
      });
    }

    if (sortBy === 'risk') {
      // Prioritize actionable batches first: batches that can still be rescued are 
      // more operationally urgent to surface than ones already unsalvageable, 
      // since those require a different action (write-off, not urgency).
      summary.sort((a, b) => {
        if (a.hasViableCandidates && !b.hasViableCandidates) return -1;
        if (!a.hasViableCandidates && b.hasViableCandidates) return 1;
        
        // If both are same viability, sort by risk ascending
        return b.riskPct - a.riskPct;
      });
    }

    res.json(summary.slice(0, queryLimit));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
