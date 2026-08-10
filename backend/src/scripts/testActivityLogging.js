import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Batch from '../models/Batch.js';

dotenv.config();

async function testActivityLogging() {
  const baseUrl = 'http://localhost:5000/api';
  
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Pick a couple of batches
    // Fetch a monitor-tier batch
    console.log('Fetching a monitor tier batch...');
    const riskRes = await fetch(`${baseUrl}/risk-summary`);
    const summary = await riskRes.json();
    const monitorBatch = summary.find(s => s.riskCategory === 'low');
    
    if (!monitorBatch) {
      console.log('No monitor batch found');
      process.exit(1);
    }

    console.log(`Hitting GET /batches/${monitorBatch.batchId}/recommendation`);
    await fetch(`${baseUrl}/batches/${monitorBatch.batchId}/recommendation`);
    
    // Wait a brief moment to allow fire-and-forget logs to save
    await new Promise(r => setTimeout(r, 1000));

    console.log('\nFetching activity logs...');
    const logRes = await fetch(`${baseUrl}/activity-log?limit=5`);
    const logs = await logRes.json();
    
    console.log('\n--- Activity Logs ---');
    console.log(JSON.stringify(logs, null, 2));
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

testActivityLogging();
