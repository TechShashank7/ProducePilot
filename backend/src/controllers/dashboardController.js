import Batch from '../models/Batch.js';
import QualityParam from '../models/QualityParam.js';
import AcceptedRescueAction from '../models/AcceptedRescueAction.js';
import { computeSpoilageRisk } from '../services/spoilageEngine.js';
import { getRecentAvgPrice } from '../services/pricingHelper.js';

export const getDashboardSummary = async (req, res) => {
  try {
    const { warehouseId } = req.query;
    
    // Find already handled batches
    const rescueFilter = {};
    if (warehouseId) rescueFilter.warehouseRef = warehouseId;
    const rescuedActions = await AcceptedRescueAction.find(rescueFilter);
    
    // Set of batch IDs that have been handled (accepted or written-off)
    const handledBatchIds = new Set(rescuedActions.map(action => action.batchRef.toString()));

    // Total Inventory Kg (exclude handled)
    const filter = {};
    if (warehouseId) filter.warehouseRef = warehouseId;
    
    const batches = await Batch.find(filter).populate('productRef');
    
    let totalInventoryKg = 0;
    let atRiskKg = 0;
    let valueAtRiskINR = 0;
    
    // We need quality params for risk calculation
    const productIds = [...new Set(batches.map(b => b.productRef._id.toString()))];
    const qualityParams = await QualityParam.find({ productRef: { $in: productIds } });
    
    const qpMap = {};
    qualityParams.forEach(qp => {
      qpMap[qp.productRef.toString()] = qp;
    });

    // Cache prices by product-warehouse to avoid DB thrashing
    const priceCache = {};
    const getCachedPrice = async (productId, whId) => {
      const key = `${productId}-${whId}`;
      if (priceCache[key] !== undefined) return priceCache[key];
      const price = await getRecentAvgPrice(productId, whId);
      priceCache[key] = price;
      return price;
    };

    for (const batch of batches) {
      if (handledBatchIds.has(batch._id.toString())) continue; // Exclude handled batches

      totalInventoryKg += batch.quantityKg;
      
      const qp = qpMap[batch.productRef._id.toString()];
      const risk = computeSpoilageRisk({ batch, product: batch.productRef, qualityParam: qp });
      
      // Note: atRiskKg intentionally excludes "medium" tier as per definitional choice.
      if (risk.riskCategory === 'high' || risk.riskCategory === 'critical') {
        atRiskKg += batch.quantityKg;
        
        const price = await getCachedPrice(batch.productRef._id, batch.warehouseRef);
        valueAtRiskINR += (batch.quantityKg * price);
      }
    }
    
    // Value Rescued (we already fetched rescuedActions above)
    const valueRescuedINR = rescuedActions.reduce((sum, action) => sum + action.recoveredValueINR, 0);

    res.json({
      totalInventoryKg,
      atRiskKg,
      valueAtRiskINR,
      valueRescuedINR
    });
    
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
