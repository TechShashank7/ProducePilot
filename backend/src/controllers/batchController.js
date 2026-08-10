import Batch from '../models/Batch.js';
import QualityParam from '../models/QualityParam.js';
import Destination from '../models/Destination.js';
import VisualAssessment from '../models/VisualAssessment.js';
import { computeSpoilageRisk } from '../services/spoilageEngine.js';
import { getDeterministicCandidates } from '../services/rescueEngine.js';

export const getBatches = async (req, res) => {
  try {
    const { warehouseId, productId } = req.query;
    const filter = {};
    if (warehouseId) filter.warehouseRef = warehouseId;
    if (productId) filter.productRef = productId;

    const batches = await Batch.find(filter)
      .populate('productRef', 'name category')
      .populate('warehouseRef', 'name city state');
    res.json(batches);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getBatchDetail = async (req, res) => {
  try {
    const { id } = req.params;
    
    // 1. Fetch batch
    const batch = await Batch.findById(id)
      .populate('productRef')
      .populate('warehouseRef');
      
    if (!batch) {
      return res.status(404).json({ message: 'Batch not found' });
    }

    // 2. Fetch quality param
    const qualityParam = await QualityParam.findOne({ productRef: batch.productRef._id });

    // 5. Fetch visual assessments history (excluding flagged mismatches)
    const visualAssessments = await VisualAssessment.find({ 
      batchRef: batch._id, 
      mismatchFlagged: { $ne: true } 
    }).sort({ createdAt: -1 });

    // Ensure computeSpoilageRisk has the latest valid visual assessment for dynamic recomputation
    const latestValidAssessment = visualAssessments.length > 0 ? visualAssessments[0] : null;
    const riskResult = computeSpoilageRisk({ batch, product: batch.productRef, qualityParam, latestVisualAssessment: latestValidAssessment });

    // We also need to recalculate hasViableCandidates based on the newly computed riskResult
    const destinations = await Destination.find({ linkedWarehouseRef: batch.warehouseRef._id });
    const rescuePlan = getDeterministicCandidates({ 
      batch, 
      product: batch.productRef, 
      riskResult, 
      destinations, 
      recentAvgPriceINR: 0,
      demandForecast: null
    });
    const hasViableCandidates = !rescuePlan.unsalvageable;

    res.json({
      batch,
      riskResult,
      hasViableCandidates,
      visualAssessments
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
