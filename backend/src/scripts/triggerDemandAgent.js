import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Batch from '../models/Batch.js';

dotenv.config();

async function runDemandAgent() {
  const baseUrl = 'http://localhost:5000/api';
  
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Pick a couple of batches
    const batches = await Batch.find().limit(3);
    
    if (batches.length === 0) {
      console.log('No batches found');
      process.exit(1);
    }

    console.log('Triggering Demand Agent forecasts...');
    
    for (const batch of batches) {
      console.log(`Hitting GET /forecast for Product ${batch.productRef} and Warehouse ${batch.warehouseRef}`);
      const res = await fetch(`${baseUrl}/forecast?productId=${batch.productRef}&warehouseId=${batch.warehouseRef}&horizonDays=7`);
      const data = await res.json();
      console.log(`Result: ${data.trendDirection} trend, ${data.totalForecastedQtyKg} kg forecasted`);
    }

    console.log('Done! The dashboard should now show Demand Agent activity.');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

runDemandAgent();
