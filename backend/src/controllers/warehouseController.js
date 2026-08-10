import Warehouse from '../models/Warehouse.js';
import Destination from '../models/Destination.js';
import Batch from '../models/Batch.js';
import QualityParam from '../models/QualityParam.js';
import AcceptedRescueAction from '../models/AcceptedRescueAction.js';
import { computeSpoilageRisk } from '../services/spoilageEngine.js';

export const getWarehouses = async (req, res) => {
  try {
    const warehouses = await Warehouse.find({});
    res.json(warehouses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getWarehouseDestinations = async (req, res) => {
  try {
    const { id } = req.params;
    const destinations = await Destination.find({ linkedWarehouseRef: id })
      .sort({ distanceFromWarehouseKm: 1 });
    res.json(destinations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getMapOverview = async (req, res) => {
  try {
    const warehouses = await Warehouse.find({});
    const rescuedActions = await AcceptedRescueAction.find({});
    const handledBatchIds = new Set(rescuedActions.map(action => action.batchRef.toString()));

    const batches = await Batch.find({}).populate('productRef');
    const qualityParams = await QualityParam.find({});
    const qpMap = {};
    qualityParams.forEach(qp => {
      qpMap[qp.productRef.toString()] = qp;
    });

    const result = [];

    for (const warehouse of warehouses) {
      let totalBatches = 0;
      let totalInventoryKg = 0;
      let atRiskKg = 0;

      for (const batch of batches) {
        if (batch.warehouseRef.toString() !== warehouse._id.toString()) continue;
        if (handledBatchIds.has(batch._id.toString())) continue;

        totalBatches++;
        totalInventoryKg += batch.quantityKg;

        const qp = qpMap[batch.productRef._id.toString()];
        const risk = computeSpoilageRisk({ batch, product: batch.productRef, qualityParam: qp });
        
        if (risk.riskCategory === 'high' || risk.riskCategory === 'critical') {
          atRiskKg += batch.quantityKg;
        }
      }

      let riskLevel = 'low';
      if (totalInventoryKg > 0) {
        const atRiskPct = (atRiskKg / totalInventoryKg) * 100;
        if (atRiskPct > 85) riskLevel = 'critical';
        else if (atRiskPct >= 60) riskLevel = 'high';
        else if (atRiskPct >= 30) riskLevel = 'medium';
      }

      result.push({
        _id: warehouse._id,
        name: warehouse.name,
        city: warehouse.city,
        state: warehouse.state,
        latitude: warehouse.latitude,
        longitude: warehouse.longitude,
        capacityKg: warehouse.capacityKg,
        totalBatches,
        totalInventoryKg,
        atRiskKg,
        riskLevel
      });
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
