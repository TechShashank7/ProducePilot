import mongoose from 'mongoose';
import dotenv from 'dotenv';
import AcceptedRescueAction from './src/models/AcceptedRescueAction.js';
import Batch from './src/models/Batch.js';
import Destination from './src/models/Destination.js';

dotenv.config();

async function check() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const rescues = await AcceptedRescueAction.countDocuments();
    const batches = await Batch.countDocuments();
    const destinations = await Destination.countDocuments();
    const destWithWarehouse = await Destination.findOne({}).populate('linkedWarehouseRef');
    
    console.log(`Rescues: ${rescues} (should be 0)`);
    console.log(`Batches: ${batches} (should be 250)`);
    console.log(`Destinations: ${destinations} (should be 30)`);
    console.log(`Dest linked to Warehouse: ${destWithWarehouse.linkedWarehouseRef ? destWithWarehouse.linkedWarehouseRef.name : 'broken'}`);
    
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}
check();
