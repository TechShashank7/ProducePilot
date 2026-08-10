import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Batch from '../models/Batch.js';
import Product from '../models/Product.js';
import Warehouse from '../models/Warehouse.js';
import QualityParam from '../models/QualityParam.js';
import { computeSpoilageRisk } from '../services/spoilageEngine.js';
import { getRecentAvgPrice } from '../services/pricingHelper.js';
import { getDeterministicCandidates } from '../services/rescueEngine.js';
import { getRecommendationNarrative } from '../services/rescueJustifier.js';

dotenv.config();

async function stressTestRescue() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Find a batch that is not fully healthy (to ensure we get an immediate or urgent tier)
    const batches = await Batch.find({}).populate('productRef').populate('warehouseRef').limit(20);
    
    let targetBatch = null;
    let targetRiskResult = null;
    let targetParam = null;

    for (const b of batches) {
      const qp = await QualityParam.findOne({ productRef: b.productRef._id });
      const risk = computeSpoilageRisk({ batch: b, product: b.productRef, qualityParam: qp });
      if (risk.riskCategory === 'critical' || risk.riskCategory === 'high' || risk.estimatedDaysRemaining <= 1) {
        targetBatch = b;
        targetRiskResult = risk;
        targetParam = qp;
        break;
      }
    }

    if (!targetBatch) {
      console.log("No urgent/immediate batch found for stress test.");
      process.exit(1);
    }

    console.log(`STRESS TEST - synthetic destinations, not from DB`);
    console.log(`Target Batch: ${targetBatch.batchCode} (${targetBatch.productRef.name}) - Tier: ${targetRiskResult.riskCategory}`);

    const recentAvgPriceINR = await getRecentAvgPrice(targetBatch.productRef._id, targetBatch.warehouseRef._id);

    // Calculate the duration needed to hit ~95% risk on arrival
    const currentEffectiveDays = targetRiskResult.breakdown.effectiveElapsedDays;
    const baselineShelfLifeDays = targetRiskResult.breakdown.baselineShelfLifeDays;
    const tempRateMult = targetRiskResult.breakdown.tempRateMultiplier;
    const humidityStressMult = targetRiskResult.breakdown.humidityStressMultiplier;

    const targetProjectedEffectiveDays = 0.95 * baselineShelfLifeDays;
    const transitEffectiveDays = targetProjectedEffectiveDays - currentEffectiveDays;
    const transitDaysNeeded = transitEffectiveDays / (tempRateMult * humidityStressMult);
    
    // Ensure we don't end up with negative minutes if already > 95% risk
    const durationMinutesA = Math.max(120, Math.round(transitDaysNeeded * 24 * 60)); 

    const demandForecast = await forecastDemand({ productId: targetBatch.productRef._id, warehouseId: targetBatch.warehouseRef._id });

    // Create synthetic destinations
    const syntheticDestinations = [
      {
        _id: new mongoose.Types.ObjectId(),
        name: "Candidate A (Far & High Capacity)",
        type: "wholesale_market",
        distanceFromWarehouseKm: Math.round((durationMinutesA / 60) * 40), // rough assumption of 40km/h
        durationFromWarehouseMinutes: durationMinutesA, 
        typicalCapacityKgPerWeek: 10000 // Very high capacity, absorbs whole batch easily
      },
      {
        _id: new mongoose.Types.ObjectId(),
        name: "Candidate B (Close & Low Capacity)",
        type: "retailer",
        distanceFromWarehouseKm: 5,
        durationFromWarehouseMinutes: 15,
        typicalCapacityKgPerWeek: 15 // Very low capacity
      }
    ];

    // Compute deterministic numbers using the real formula
    const rescuePlan = getDeterministicCandidates({
      batch: targetBatch,
      product: targetBatch.productRef,
      riskResult: targetRiskResult,
      destinations: syntheticDestinations,
      recentAvgPriceINR,
      demandForecast
    });

    console.log("\n--- Computed Candidates (Synthetic) ---");
    console.table(rescuePlan.candidates.map(c => ({
      Destination: c.destination.name,
      DistKm: c.destination.distanceKm,
      RiskOnArrival: c.projectedRiskPctOnArrival,
      Discount: `${c.discountPct}%`,
      QtyUsedKg: c.quantityKgUsed,
      CapacityKg: c.typicalCapacityKgPerWeek,
      AvgPriceINR: c.recentAvgPriceINR,
      RecoveredValue: c.expectedRecoveredValueINR
    })));

    // Run Justifier
    console.log("\n--- Calling Gemini AI Recommendation ---");
    const aiRecommendation = await getRecommendationNarrative({ 
      batch: targetBatch, 
      product: targetBatch.productRef, 
      riskResult: targetRiskResult, 
      candidates: rescuePlan.candidates 
    });

    console.log("\n--- Final Recommendation ---");
    console.log("Selected Index:", aiRecommendation.recommendedCandidateIndex);
    if (aiRecommendation.recommendedCandidateIndex !== -1) {
       console.log("Selected Name:", rescuePlan.candidates[aiRecommendation.recommendedCandidateIndex].destination.name);
    }
    console.log("Justification:", aiRecommendation.justification);
    console.log("Urgency:", aiRecommendation.urgencyStatement);

    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

stressTestRescue();
