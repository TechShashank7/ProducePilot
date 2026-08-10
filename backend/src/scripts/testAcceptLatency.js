import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from '../config/db.js';
import Batch from '../models/Batch.js';
import Product from '../models/Product.js';
import Warehouse from '../models/Warehouse.js';
import QualityParam from '../models/QualityParam.js';
import Destination from '../models/Destination.js';
import { computeSpoilageRisk } from '../services/spoilageEngine.js';
import { getDeterministicCandidates } from '../services/rescueEngine.js';
import { getRecommendationNarrative } from '../services/rescueJustifier.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function run() {
  await connectDB();
  console.log('Connected to DB. Finding 5 viable batches...');

  try {
    const batches = await Batch.find().populate('productRef').populate('warehouseRef');
    
    const viableBatches = [];
    
    for (const batch of batches) {
      if (viableBatches.length >= 5) break;
      
      const qualityParam = await QualityParam.findOne({ productRef: batch.productRef._id });
      if (!qualityParam) continue;

      const risk = computeSpoilageRisk({ batch, product: batch.productRef, qualityParam });
      if (risk.riskCategory === 'low') continue;

      const destinations = await Destination.find({ linkedWarehouseRef: batch.warehouseRef._id });
      
      const rescuePlan = getDeterministicCandidates({ 
        batch, 
        product: batch.productRef, 
        riskResult: risk, 
        destinations, 
        recentAvgPriceINR: 0,
        demandForecast: null
      });

      if (!rescuePlan.unsalvageable && rescuePlan.candidates.length > 0) {
        viableBatches.push({ batch, riskResult: risk, candidates: rescuePlan.candidates });
      }
    }

    if (viableBatches.length === 0) {
      console.log('No viable batches found to test.');
      return;
    }

    console.log(`Found ${viableBatches.length} viable batches. Running Accept flow latency test...`);

    let totalLatency = 0;
    for (let i = 0; i < viableBatches.length; i++) {
      const { batch, riskResult, candidates } = viableBatches[i];
      console.log(`\nTest ${i + 1}: Batch ${batch.batchCode} (${batch.productRef.name})`);
      
      const start = Date.now();
      
      // Call the LLM justification service (this is what takes the time during the Accept flow)
      const narrative = await getRecommendationNarrative({ 
        batch, 
        product: batch.productRef, 
        riskResult, 
        candidates 
      });
      
      const end = Date.now();
      const latency = end - start;
      totalLatency += latency;
      
      console.log(`- Response Time: ${latency}ms`);
      console.log(`- Recommended Candidate Index: ${narrative.recommendedCandidateIndex}`);
      console.log(`- Urgency Statement: ${narrative.urgencyStatement}`);
    }

    console.log(`\nAverage Latency: ${(totalLatency / viableBatches.length).toFixed(2)}ms`);

  } catch (err) {
    console.error(err);
  } finally {
    mongoose.connection.close();
    process.exit(0);
  }
}

run();
