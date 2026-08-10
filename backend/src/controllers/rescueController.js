import Batch from '../models/Batch.js';
import QualityParam from '../models/QualityParam.js';
import Destination from '../models/Destination.js';
import { computeSpoilageRisk } from '../services/spoilageEngine.js';
import { getRecentAvgPrice } from '../services/pricingHelper.js';
import { getDeterministicCandidates } from '../services/rescueEngine.js';
import { getRecommendationNarrative } from '../services/rescueJustifier.js';
import { forecastDemand } from '../services/demandForecastService.js';
import { logAgentActivity } from '../services/activityLogger.js';
import AcceptedRescueAction from '../models/AcceptedRescueAction.js';

export const getRescueRecommendation = async (req, res) => {
  try {
    const { id } = req.params;
    
    const batch = await Batch.findById(id).populate('productRef').populate('warehouseRef');
    if (!batch) {
      return res.status(404).json({ message: 'Batch not found' });
    }

    const qualityParam = await QualityParam.findOne({ productRef: batch.productRef._id });
    const destinations = await Destination.find({ linkedWarehouseRef: batch.warehouseRef._id });
    
    const riskResult = computeSpoilageRisk({ batch, product: batch.productRef, qualityParam });
    const recentAvgPriceINR = await getRecentAvgPrice(batch.productRef._id, batch.warehouseRef._id);
    const demandForecast = await forecastDemand({ productId: batch.productRef._id, warehouseId: batch.warehouseRef._id });

    const rescuePlan = getDeterministicCandidates({ 
      batch, 
      product: batch.productRef, 
      riskResult, 
      destinations, 
      recentAvgPriceINR,
      demandForecast
    });

    const aiRecommendation = await getRecommendationNarrative({ 
      batch, 
      product: batch.productRef, 
      riskResult, 
      candidates: rescuePlan.candidates 
    });

    const recommendedDestName = rescuePlan.candidates.length > 0 && aiRecommendation.recommendedCandidateIndex >= 0 
      ? rescuePlan.candidates[aiRecommendation.recommendedCandidateIndex].destination.name 
      : 'No destination';

    const summaryText = rescuePlan.tier === 'monitor'
      ? `Batch ${batch.batchCode} (${batch.productRef.name}) confirmed healthy, no action needed`
      : `Recommended routing ${batch.batchCode} to ${recommendedDestName} (${rescuePlan.tier} tier)`;

    logAgentActivity({
      agentType: 'rescue',
      action: 'Generated rescue recommendation',
      batchId: batch._id,
      productId: batch.productRef._id,
      warehouseId: batch.warehouseRef._id,
      summary: summaryText
    });

    res.json({
      batchSummary: {
        batchCode: batch.batchCode,
        product: batch.productRef.name,
        warehouse: batch.warehouseRef.name,
        quantityKg: batch.quantityKg
      },
      riskResult,
      tier: rescuePlan.tier,
      candidates: rescuePlan.candidates,
      aiRecommendation
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const acceptRescueRecommendation = async (req, res) => {
  try {
    const { id } = req.params;
    const { candidateIndex, source } = req.body;

    const batch = await Batch.findById(id).populate('productRef').populate('warehouseRef');
    if (!batch) {
      return res.status(404).json({ message: 'Batch not found' });
    }

    if (typeof candidateIndex !== 'number' || candidateIndex < 0) {
       return res.status(400).json({ message: 'Invalid candidateIndex' });
    }

    // Refetch required data to compute fresh recommendation candidates
    const qualityParam = await QualityParam.findOne({ productRef: batch.productRef._id });
    const destinations = await Destination.find({ linkedWarehouseRef: batch.warehouseRef._id });
    
    const riskResult = computeSpoilageRisk({ batch, product: batch.productRef, qualityParam });
    const recentAvgPriceINR = await getRecentAvgPrice(batch.productRef._id, batch.warehouseRef._id);
    const demandForecast = await forecastDemand({ productId: batch.productRef._id, warehouseId: batch.warehouseRef._id });

    const rescuePlan = getDeterministicCandidates({ 
      batch, 
      product: batch.productRef, 
      riskResult, 
      destinations, 
      recentAvgPriceINR,
      demandForecast
    });

    if (!rescuePlan.candidates || candidateIndex >= rescuePlan.candidates.length) {
       return res.status(400).json({ message: 'Candidate index out of bounds based on fresh evaluation' });
    }

    const candidate = rescuePlan.candidates[candidateIndex];

    const action = new AcceptedRescueAction({
      batchRef: batch._id,
      warehouseRef: batch.warehouseRef._id,
      productRef: batch.productRef._id,
      destinationName: candidate.destination.name,
      discountPct: candidate.discountPct,
      recoveredValueINR: candidate.expectedRecoveredValueINR || 0,
      acceptedAt: new Date()
    });

    await action.save();

    let summaryText = `Batch ${batch.batchCode} dispatched to ${candidate.destination.name}, recovering ₹${candidate.expectedRecoveredValueINR}`;
    if (candidate.destination.type === 'NGO' || candidate.discountPct === 100) {
      summaryText = `Batch ${batch.batchCode} donated to ${candidate.destination.name}, diverting ${batch.quantityKg}kg from landfill`;
    }
    
    // Append AI Source distinction
    if (source === 'gemini') {
      summaryText += ' (AI-assisted)';
    } else if (source) {
      summaryText += ' (Automated fallback)';
    }

    logAgentActivity({
      agentType: 'rescue',
      action: 'Accepted rescue recommendation',
      batchId: batch._id,
      productId: batch.productRef._id,
      warehouseId: batch.warehouseRef._id,
      summary: summaryText
    });

    res.json(action);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const writeOffBatch = async (req, res) => {
  try {
    const { id } = req.params;

    const batch = await Batch.findById(id).populate('productRef').populate('warehouseRef');
    if (!batch) {
      return res.status(404).json({ message: 'Batch not found' });
    }

    const qualityParam = await QualityParam.findOne({ productRef: batch.productRef._id });
    const destinations = await Destination.find({ linkedWarehouseRef: batch.warehouseRef._id });
    
    const riskResult = computeSpoilageRisk({ batch, product: batch.productRef, qualityParam });
    const recentAvgPriceINR = await getRecentAvgPrice(batch.productRef._id, batch.warehouseRef._id);
    const demandForecast = await forecastDemand({ productId: batch.productRef._id, warehouseId: batch.warehouseRef._id });

    const rescuePlan = getDeterministicCandidates({ 
      batch, 
      product: batch.productRef, 
      riskResult, 
      destinations, 
      recentAvgPriceINR,
      demandForecast
    });

    if (rescuePlan.unsalvageable !== true) {
      return res.status(400).json({ message: 'Batch is not genuinely unsalvageable. Viable candidates exist.' });
    }

    const action = new AcceptedRescueAction({
      batchRef: batch._id,
      warehouseRef: batch.warehouseRef._id,
      productRef: batch.productRef._id,
      destinationName: 'Write-off / total loss',
      discountPct: 100,
      recoveredValueINR: 0,
      kgWrittenOff: batch.quantityKg,
      acceptedAt: new Date()
    });

    await action.save();

    logAgentActivity({
      agentType: 'rescue',
      action: 'Batch written off',
      batchId: batch._id,
      productId: batch.productRef._id,
      warehouseId: batch.warehouseRef._id,
      summary: `Batch ${batch.batchCode} (${batch.productRef.name}) written off as total loss, ${batch.quantityKg}kg discarded`
    });

    res.json(action);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
