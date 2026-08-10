import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Batch from '../models/Batch.js';
import QualityParam from '../models/QualityParam.js';
import Product from '../models/Product.js';
import Warehouse from '../models/Warehouse.js';
import { computeSpoilageRisk } from '../services/spoilageEngine.js';

dotenv.config();

async function runCheck() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const batches = await Batch.find({}).populate('productRef').populate('warehouseRef');
    const qualityParams = await QualityParam.find({});
    const qpMap = {};
    qualityParams.forEach(qp => { qpMap[qp.productRef.toString()] = qp; });

    const batchRisks = batches.map(batch => {
      const qp = qpMap[batch.productRef._id.toString()];
      const risk = computeSpoilageRisk({ batch, product: batch.productRef, qualityParam: qp });
      return { batch, risk };
    });

    // Sort by daysSinceHarvest
    batchRisks.sort((a, b) => a.risk.breakdown.daysSinceHarvest - b.risk.breakdown.daysSinceHarvest);

    const lowest5 = batchRisks.slice(0, 5);
    const highest5 = batchRisks.slice(-5);
    const combined = [...lowest5, ...highest5];

    console.log("--- Risk Engine Spot Check ---");
    console.table(combined.map(item => ({
      batchCode: item.batch.batchCode,
      product: item.batch.productRef.name,
      daysSinceHarvest: item.risk.breakdown.daysSinceHarvest,
      storageTempC: item.batch.currentStorageTempC,
      idealTempMidC: item.risk.breakdown.idealTempMidC,
      riskPct: item.risk.riskPct,
      riskCategory: item.risk.riskCategory,
      estimatedDaysRemaining: item.risk.estimatedDaysRemaining
    })));

    console.log("\n--- Chilling Injury Warnings ---");
    const chillingWarnings = batchRisks.filter(item => item.risk.breakdown.chillingInjuryWarning);
    if (chillingWarnings.length > 0) {
      console.table(chillingWarnings.map(item => ({
        batchCode: item.batch.batchCode,
        product: item.batch.productRef.name,
        storageTempC: item.batch.currentStorageTempC,
        idealTempMidC: item.risk.breakdown.idealTempMidC
      })));
    } else {
      console.log("No batches with chilling injury warning.");
    }

    console.log("\n--- Checking Monotonicity ---");
    // For two batches of the same product, if one has higher daysSinceHarvest AND worse temp deviation, it must have strictly higher riskPct
    let violated = false;
    
    // Group by product
    const grouped = {};
    batchRisks.forEach(item => {
      const pName = item.batch.productRef.name;
      if (!grouped[pName]) grouped[pName] = [];
      grouped[pName].push(item);
    });

    for (const pName in grouped) {
      const items = grouped[pName];
      for (let i = 0; i < items.length; i++) {
        for (let j = 0; j < items.length; j++) {
          if (i === j) continue;
          const a = items[i];
          const b = items[j];

          // "worse temp deviation" meaning tempRateMultiplier is higher
          const aWorse = a.risk.breakdown.daysSinceHarvest > b.risk.breakdown.daysSinceHarvest &&
                         a.risk.breakdown.tempRateMultiplier > b.risk.breakdown.tempRateMultiplier &&
                         a.risk.breakdown.humidityStressMultiplier >= b.risk.breakdown.humidityStressMultiplier;

          if (aWorse) {
            // Note: Risk caps at 100%, so if both are 100%, strictly higher fails.
            // We should only assert if b.risk.riskPct < 100.
            if (b.risk.riskPct < 100 && a.risk.riskPct <= b.risk.riskPct) {
              console.error(`Monotonicity Violation for ${pName}!`);
              console.error(`Batch A (${a.batch.batchCode}): Days=${a.risk.breakdown.daysSinceHarvest}, TempMult=${a.risk.breakdown.tempRateMultiplier}, Risk=${a.risk.riskPct}`);
              console.error(`Batch B (${b.batch.batchCode}): Days=${b.risk.breakdown.daysSinceHarvest}, TempMult=${b.risk.breakdown.tempRateMultiplier}, Risk=${b.risk.riskPct}`);
              violated = true;
            }
          }
        }
      }
    }

    if (violated) {
      throw new Error("Monotonicity assertion failed!");
    } else {
      console.log("Monotonicity assertion PASSED.");
    }

    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

runCheck();
