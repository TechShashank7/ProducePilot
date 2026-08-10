import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from '../config/db.js';

import Batch from '../models/Batch.js';
import Product from '../models/Product.js';
import QualityParam from '../models/QualityParam.js';
import Warehouse from '../models/Warehouse.js';
import Destination from '../models/Destination.js';
import AcceptedRescueAction from '../models/AcceptedRescueAction.js';

import { computeSpoilageRisk } from '../services/spoilageEngine.js';
import { getDeterministicCandidates } from '../services/rescueEngine.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function run() {
  await connectDB();
  console.log('Connected to DB');

  try {
    const warehouses = await Warehouse.find();
    const batches = await Batch.find().populate('productRef');
    const qualityParams = await QualityParam.find();
    
    // Create a map for QualityParams
    const qpMap = {};
    qualityParams.forEach(qp => {
      qpMap[qp.productRef.toString()] = qp;
    });

    // Create a map for Destinations
    const destMap = {}; // warehouseId -> [destinations]
    for (const wh of warehouses) {
      destMap[wh._id.toString()] = await Destination.find({ linkedWarehouseRef: wh._id });
    }

    // Handled batches
    const handledActions = await AcceptedRescueAction.find();
    const handledBatchIds = new Set(handledActions.map(a => a.batchRef.toString()));

    const stats = {};
    warehouses.forEach(wh => {
      stats[wh._id.toString()] = {
        name: wh.name,
        totalBatches: 0,
        highCritical: 0,
        unsalvageable: 0,
        viable: 0
      };
    });

    for (const batch of batches) {
      // Exclude handled batches just like the real dashboard
      if (handledBatchIds.has(batch._id.toString())) continue;

      const whId = batch.warehouseRef.toString();
      if (!stats[whId]) continue; // In case of orphaned batch

      stats[whId].totalBatches++;

      const qp = qpMap[batch.productRef._id.toString()];
      if (!qp) continue;

      const risk = computeSpoilageRisk({ batch, product: batch.productRef, qualityParam: qp });
      
      if (risk.riskCategory === 'high' || risk.riskCategory === 'critical') {
        stats[whId].highCritical++;
        
        const destinations = destMap[whId] || [];
        
        const rescuePlan = getDeterministicCandidates({ 
          batch, 
          product: batch.productRef, 
          riskResult: risk, 
          destinations, 
          recentAvgPriceINR: 0,
          demandForecast: null
        });

        if (rescuePlan.unsalvageable) {
          stats[whId].unsalvageable++;
        } else {
          stats[whId].viable++;
        }
      }
    }

    console.log('\n--- Viability Distribution Breakdown ---');
    for (const wh of warehouses) {
      const s = stats[wh._id.toString()];
      console.log(`\nWarehouse: ${s.name}`);
      console.log(`  Total Active Batches: ${s.totalBatches}`);
      console.log(`  High/Critical Risk:   ${s.highCritical}`);
      console.log(`    - Viable (Accept):      ${s.viable}`);
      console.log(`    - Unsalvageable (Write-off): ${s.unsalvageable}`);
    }

  } catch (err) {
    console.error(err);
  } finally {
    mongoose.connection.close();
    process.exit(0);
  }
}

run();
