import express from 'express';
import AgentActivityLog from '../models/AgentActivityLog.js';

const router = express.Router();

// GET /api/activity-log
router.get('/activity-log', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = parseInt(req.query.skip, 10) || 0;
    
    const filter = {};
    if (req.query.agentType && req.query.agentType !== 'all') {
      filter.agentType = req.query.agentType;
    }

    const logs = await AgentActivityLog.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('relatedBatchRef', 'batchCode')
      .populate('relatedProductRef', 'name')
      .populate('relatedWarehouseRef', 'name');

    // Transform populated refs to simpler object structure if desired, or just return as is.
    // The user asked to "populate batch/product/warehouse names where present".
    // We will map it to include those string names explicitly for ease of frontend consumption.
    const formattedLogs = logs.map(log => {
      const plainLog = log.toObject();
      return {
        _id: plainLog._id,
        agentType: plainLog.agentType,
        action: plainLog.action,
        summary: plainLog.summary,
        createdAt: plainLog.createdAt,
        batchCode: plainLog.relatedBatchRef ? plainLog.relatedBatchRef.batchCode : null,
        productName: plainLog.relatedProductRef ? plainLog.relatedProductRef.name : null,
        warehouseName: plainLog.relatedWarehouseRef ? plainLog.relatedWarehouseRef.name : null
      };
    });

    res.json(formattedLogs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
