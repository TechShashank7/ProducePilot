import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Batch from './src/models/Batch.js';
import SalesRecord from './src/models/SalesRecord.js';

dotenv.config();

async function checkDates() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const minBatch = await Batch.findOne().sort({ receivedDate: 1 });
    const maxBatch = await Batch.findOne().sort({ receivedDate: -1 });
    const maxSale = await SalesRecord.findOne().sort({ date: -1 });
    
    console.log("Min Batch Date:", minBatch ? minBatch.receivedDate : 'None');
    console.log("Max Batch Date:", maxBatch ? maxBatch.receivedDate : 'None');
    console.log("Max Sale Date:", maxSale ? maxSale.date : 'None');
    console.log("Current Date:", new Date());
    
    process.exit(0);
  } catch(e) {
    console.error(e);
    process.exit(1);
  }
}
checkDates();
