import express from 'express';
import AgentActivityLog from '../models/AgentActivityLog.js';
import AcceptedRescueAction from '../models/AcceptedRescueAction.js';
import VisualAssessment from '../models/VisualAssessment.js';
import Batch from '../models/Batch.js';
import QualityParam from '../models/QualityParam.js';
import { computeSpoilageRisk } from '../services/spoilageEngine.js';

const router = express.Router();

// GET /api/agents/stats
router.get('/stats', async (req, res) => {
  try {
    const agentTypes = ['inventory', 'rescue', 'vision', 'demand'];
    const now = new Date();
    const minus24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const minus30m = new Date(now.getTime() - 30 * 60 * 1000);

    const stats = {};

    for (const type of agentTypes) {
      // Base stats from AgentActivityLog
      const totalActions = await AgentActivityLog.countDocuments({ agentType: type });
      const actionsLast24h = await AgentActivityLog.countDocuments({
        agentType: type,
        createdAt: { $gte: minus24h }
      });
      const lastAction = await AgentActivityLog.findOne({ agentType: type }).sort({ createdAt: -1 });
      
      const lastActionAt = lastAction ? lastAction.createdAt : null;
      
      // Explicit design choice: Status is "active" if lastActionAt is within the last 30 minutes.
      const status = lastActionAt && lastActionAt >= minus30m ? 'active' : 'idle';

      stats[type] = {
        totalActions,
        actionsLast24h,
        lastActionAt,
        status,
        specificStats: {}
      };

      // Specific Stats
      if (type === 'rescue') {
        const totalAccepted = await AcceptedRescueAction.countDocuments({
          $or: [
            { discountPct: { $ne: 100 } },
            { recoveredValueINR: { $gt: 0 } }
          ]
        }); // Normal rescues
        
        const totalWriteOffs = await AcceptedRescueAction.countDocuments({
          discountPct: 100,
          recoveredValueINR: 0
        }); // Explicitly using real schema fields
        
        // Sum total recovered value (including everything)
        const aggregation = await AcceptedRescueAction.aggregate([
          { $group: { _id: null, totalRecovered: { $sum: "$recoveredValueINR" } } }
        ]);
        const sumRecovered = aggregation.length > 0 ? aggregation[0].totalRecovered : 0;
        
        stats[type].specificStats = {
          totalAccepted, 
          totalWriteOffs,
          sumRecovered
        };
      } else if (type === 'vision') {
        const validAssessments = await VisualAssessment.countDocuments({
          mismatchFlagged: { $ne: true }
        });
        stats[type].specificStats = {
          validAssessments
        };
      } else if (type === 'demand') {
        // distinct product/warehouse pairs forecasted
        const distinctPairs = await AgentActivityLog.aggregate([
          { $match: { agentType: 'demand', relatedProductRef: { $exists: true }, relatedWarehouseRef: { $exists: true } } },
          { $group: { _id: { product: "$relatedProductRef", warehouse: "$relatedWarehouseRef" } } }
        ]);
        stats[type].specificStats = {
          uniqueForecasts: distinctPairs.length
        };
      } else if (type === 'inventory') {
        // live query of batches at high/critical risk
        const batches = await Batch.find({}).populate('productRef');
        
        // Filter out handled batches (written off or rescued)
        const handledActions = await AcceptedRescueAction.find({});
        const handledBatchIds = new Set(handledActions.map(a => a.batchRef.toString()));
        
        const unhandledBatches = batches.filter(b => !handledBatchIds.has(b._id.toString()));

        const productIds = [...new Set(unhandledBatches.map(b => b.productRef._id.toString()))];
        const qualityParams = await QualityParam.find({ productRef: { $in: productIds } });
        
        const qpMap = {};
        qualityParams.forEach(qp => { qpMap[qp.productRef.toString()] = qp; });
        
        let atRiskCount = 0;
        for (const batch of unhandledBatches) {
          const qp = qpMap[batch.productRef._id.toString()];
          if (!qp) continue;
          const risk = computeSpoilageRisk({ batch, product: batch.productRef, qualityParam: qp });
          if (risk.riskCategory === 'high' || risk.riskCategory === 'critical') {
            atRiskCount++;
          }
        }
        stats[type].specificStats = {
          atRiskBatches: atRiskCount
        };
      }
    }

    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/agents/activity-timeline?hours=24
router.get('/activity-timeline', async (req, res) => {
  try {
    const hours = parseInt(req.query.hours, 10) || 24;
    const now = new Date();
    
    // Normalize to the start of the current hour
    const endHour = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours() + 1, 0, 0, 0);
    const startHour = new Date(endHour.getTime() - hours * 60 * 60 * 1000);
    
    const logs = await AgentActivityLog.find({
      createdAt: { $gte: startHour }
    });

    // Create an empty bucket for each hour
    const buckets = {};
    for (let i = 0; i < hours; i++) {
      const bucketTime = new Date(startHour.getTime() + i * 60 * 60 * 1000);
      buckets[bucketTime.toISOString()] = {
        hour: bucketTime.toISOString(),
        inventory: 0,
        rescue: 0,
        vision: 0,
        demand: 0
      };
    }

    // Populate buckets
    logs.forEach(log => {
      const logHour = new Date(log.createdAt.getFullYear(), log.createdAt.getMonth(), log.createdAt.getDate(), log.createdAt.getHours(), 0, 0, 0);
      const iso = logHour.toISOString();
      if (buckets[iso] && buckets[iso][log.agentType] !== undefined) {
        buckets[iso][log.agentType]++;
      }
    });

    // Convert to array and sort chronologically
    const timeline = Object.values(buckets).sort((a, b) => new Date(a.hour) - new Date(b.hour));
    
    res.json(timeline);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
