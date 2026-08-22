import Batch from '../models/Batch.js';
import QualityParam from '../models/QualityParam.js';
import Destination from '../models/Destination.js';
import VisualAssessment from '../models/VisualAssessment.js';
import Warehouse from '../models/Warehouse.js';
import Product from '../models/Product.js';
import { computeSpoilageRisk } from '../services/spoilageEngine.js';
import { getDeterministicCandidates } from '../services/rescueEngine.js';

export const getBatches = async (req, res) => {
  try {
    const { warehouseId, productId, riskCategory, batchCode, sortBy, order, page = 1, pageSize = 20 } = req.query;
    const filter = {};
    if (warehouseId && warehouseId !== 'all') filter.warehouseRef = warehouseId;
    if (productId && productId !== 'all') filter.productRef = productId;
    if (batchCode) filter.batchCode = { $regex: batchCode, $options: 'i' };

    // 1. Fetch batches
    let batches = await Batch.find(filter)
      .populate('productRef')
      .populate('warehouseRef', 'name city state');

    // 2. Fetch quality params & visual assessments for risk computation
    const productIds = [...new Set(batches.map(b => b.productRef._id.toString()))];
    const qualityParams = await QualityParam.find({ productRef: { $in: productIds } });
    const qpMap = {};
    qualityParams.forEach(qp => { qpMap[qp.productRef.toString()] = qp; });

    const batchIds = batches.map(b => b._id);
    const visualAssessments = await VisualAssessment.find({
      batchRef: { $in: batchIds },
      mismatchFlagged: { $ne: true }
    }).sort({ createdAt: -1 });

    const vaMap = {};
    visualAssessments.forEach(va => {
      const bId = va.batchRef.toString();
      if (!vaMap[bId]) vaMap[bId] = va; // keep the latest one
    });

    // 3. Compute dynamic risk and attach to batch
    let processedBatches = batches.map(batch => {
      const qp = qpMap[batch.productRef._id.toString()];
      const va = vaMap[batch._id.toString()];
      
      let riskResult = null;
      if (qp) {
        riskResult = computeSpoilageRisk({ batch, product: batch.productRef, qualityParam: qp, latestVisualAssessment: va });
      }

      return {
        ...batch.toObject(),
        riskPct: riskResult ? riskResult.riskPct : 0,
        riskCategory: riskResult ? riskResult.riskCategory : 'unknown',
        daysRemaining: riskResult ? riskResult.estimatedDaysRemaining : 0,
      };
    });

    // 4. In-memory Filter by Risk Category
    if (riskCategory && riskCategory !== 'all') {
      processedBatches = processedBatches.filter(b => b.riskCategory === riskCategory);
    }

    // 5. In-memory Sort
    if (sortBy) {
      const isDesc = order === 'desc';
      processedBatches.sort((a, b) => {
        let valA, valB;
        if (sortBy === 'risk') {
          valA = a.riskPct;
          valB = b.riskPct;
        } else if (sortBy === 'quantity') {
          valA = a.quantityKg;
          valB = b.quantityKg;
        } else if (sortBy === 'receivedDate') {
          valA = new Date(a.receivedDate).getTime();
          valB = new Date(b.receivedDate).getTime();
        }

        if (valA < valB) return isDesc ? 1 : -1;
        if (valA > valB) return isDesc ? -1 : 1;
        return 0;
      });
    } else {
      // Default sort by received date descending
      processedBatches.sort((a, b) => new Date(b.receivedDate).getTime() - new Date(a.receivedDate).getTime());
    }

    // 6. Pagination
    const totalCount = processedBatches.length;
    const skip = (parseInt(page, 10) - 1) * parseInt(pageSize, 10);
    const paginatedBatches = processedBatches.slice(skip, skip + parseInt(pageSize, 10));

    res.json({
      batches: paginatedBatches,
      totalCount,
      page: parseInt(page, 10),
      pageSize: parseInt(pageSize, 10)
    });
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

export const uploadBatch = async (req, res) => {
  try {
    const { warehouseId, batches: batchesData } = req.body;
    
    if (!warehouseId || !Array.isArray(batchesData)) {
      return res.status(400).json({ message: 'Payload must include warehouseId and an array of batches' });
    }

    const warehouse = await Warehouse.findById(warehouseId);
    if (!warehouse) {
      return res.status(404).json({ message: 'Selected warehouse not found' });
    }

    const createdBatches = [];

    for (const data of batchesData) {
      // 1. Find or create Product
      let product = await Product.findOne({ name: data.productName });
      if (!product) {
        product = await Product.create({
          name: data.productName,
          category: data.productCategory,
          typicalShelfLifeDays: {
            min: parseInt(data.typicalShelfLifeDaysMin, 10),
            max: parseInt(data.typicalShelfLifeDaysMax, 10)
          },
          idealStorageTempC: {
            min: parseFloat(data.idealStorageTempCMin),
            max: parseFloat(data.idealStorageTempCMax)
          },
          idealHumidityPct: {
            min: parseFloat(data.idealHumidityPctMin),
            max: parseFloat(data.idealHumidityPctMax)
          }
        });
      }

      // 2. Find or Create QualityParam for risk calc
      let qualityParam = await QualityParam.findOne({ productRef: product._id });
      if (!qualityParam) {
        await QualityParam.create({
          productRef: product._id,
          brixRangeMin: 10,
          brixRangeMax: 15,
          firmnessIndexRange: {
            min: 5,
            max: 10
          },
          acceptableDefectPct: 2.5,
          colorGradeDescription: "Standard Bright"
        });
      }

      // 3. Create Batch
      const uniqueBatchCode = `${data.batchCode}-${Date.now().toString().slice(-4)}${Math.floor(Math.random() * 100)}`;
      
      const batch = await Batch.create({
        productRef: product._id,
        warehouseRef: warehouse._id,
        quantityKg: parseFloat(data.quantityKg),
        receivedDate: new Date(data.receivedDate),
        harvestDate: new Date(data.harvestDate),
        currentStorageTempC: parseFloat(data.currentStorageTempC),
        currentStorageHumidityPct: parseFloat(data.currentStorageHumidityPct),
        batchCode: uniqueBatchCode,
        sourceRegion: data.sourceRegion
      });

      createdBatches.push(batch);
    }

    res.status(201).json({ message: 'Upload successful', count: createdBatches.length });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: error.message });
  }
};
