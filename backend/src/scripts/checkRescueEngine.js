import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Batch from '../models/Batch.js';
import Product from '../models/Product.js';
import Warehouse from '../models/Warehouse.js';
import QualityParam from '../models/QualityParam.js';
import Destination from '../models/Destination.js';
import { computeSpoilageRisk } from '../services/spoilageEngine.js';
import { getRecentAvgPrice } from '../services/pricingHelper.js';
import { getDeterministicCandidates } from '../services/rescueEngine.js';
import { getRecommendationNarrative } from '../services/rescueJustifier.js';
import { forecastDemand } from '../services/demandForecastService.js';

dotenv.config();

async function checkRescueEngine() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const testTiers = [
      { name: 'IMMEDIATE', conditions: { 'riskCategory': 'critical' } },
      { name: 'URGENT', conditions: { 'riskCategory': 'high' } },
      { name: 'MONITOR_DISCOUNT', conditions: { 'riskCategory': 'medium' } },
      { name: 'MONITOR', conditions: { 'riskCategory': 'low' } }
    ];

    for (const tier of testTiers) {
      console.log(`\n======================================================`);
      
      const batches = await Batch.find({}).populate('productRef').populate('warehouseRef').limit(20);
      let targetBatch = null;
      let targetRiskResult = null;
      let targetParam = null;

      for (const b of batches) {
        const qp = await QualityParam.findOne({ productRef: b.productRef._id });
        const risk = computeSpoilageRisk({ batch: b, product: b.productRef, qualityParam: qp });
        if (risk.riskCategory === tier.conditions.riskCategory) {
          targetBatch = b;
          targetRiskResult = risk;
          targetParam = qp;
          break;
        }
      }

      if (!targetBatch) {
        console.log(`Testing Tier: ${tier.name} | No suitable batch found in top 20.`);
        continue;
      }

      console.log(`Testing Tier: ${tier.name} | Batch: ${targetBatch.batchCode} (${targetBatch.productRef.name})`);

      const destinations = await Destination.find({ linkedWarehouseRef: targetBatch.warehouseRef._id });
      const recentAvgPriceINR = await getRecentAvgPrice(targetBatch.productRef._id, targetBatch.warehouseRef._id);
      const demandForecast = await forecastDemand({ productId: targetBatch.productRef._id, warehouseId: targetBatch.warehouseRef._id });

      const rescuePlan = getDeterministicCandidates({ 
        batch: targetBatch, 
        product: targetBatch.productRef, 
        riskResult: targetRiskResult, 
        destinations, 
        recentAvgPriceINR,
        demandForecast
      });

      const rec = {
        candidates: rescuePlan.candidates,
        aiRecommendation: await getRecommendationNarrative({ 
          batch: targetBatch, 
          product: targetBatch.productRef,
          riskResult: targetRiskResult,
          candidates: rescuePlan.candidates
        })
      };
      
      // Asserts
      if (tier.name === 'MONITOR') {
        if (rec.candidates.length !== 0) throw new Error("Monitor tier should have 0 candidates");
        if (rec.aiRecommendation.recommendedCandidateIndex !== -1) throw new Error("Monitor tier should bypass Gemini");
        console.log("ASSERT PASSED: Monitor tier returned 0 candidates and bypassed Gemini.");
      } else {
        rec.candidates.forEach(c => {
          if (c.projectedRiskPctOnArrival >= 100) {
             throw new Error(`Candidate ${c.destination.name} has risk >= 100 on arrival!`);
          }
        });
        console.log("ASSERT PASSED: All candidates viable on arrival.");
      }
      
      console.log("\n--- Candidates ---");
      if (rec.candidates.length > 0) {
        console.table(rec.candidates.map(c => ({
          Destination: c.destination.name,
          Type: c.destination.type,
          DistKm: c.destination.distanceKm,
          RiskOnArrival: c.projectedRiskPctOnArrival,
          Discount: `${c.discountPct}%`,
          QtyUsedKg: c.quantityKgUsed,
          CapacityKg: c.typicalCapacityKgPerWeek,
          AdjCapacityKg: c.demandAdjustedCapacityKgPerWeek,
          Trend: demandForecast.trendDirection,
          AvgPriceINR: c.recentAvgPriceINR,
          RecoveredValue: c.expectedRecoveredValueINR
        })));
      } else {
        console.log("No candidates generated.");
      }
      
      console.log("\n--- Gemini AI Recommendation ---");
      console.log("Selected Index:", rec.aiRecommendation.recommendedCandidateIndex);
      console.log("Justification:", rec.aiRecommendation.justification);
      console.log("Urgency:", rec.aiRecommendation.urgencyStatement);

      const fallbackText = "System fallback";
      if (rec.aiRecommendation.justification.includes(fallbackText)) {
        console.log("Status: Gemini call FAILED or fell back.");
      } else if (tier.name !== 'MONITOR') {
        console.log("Status: Gemini call SUCCEEDED.");
      }
    }

    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

checkRescueEngine();
