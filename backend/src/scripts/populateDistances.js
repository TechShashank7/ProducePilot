import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Warehouse from '../models/Warehouse.js';
import Destination from '../models/Destination.js';
import { getRealDistances } from '../services/distanceService.js';

dotenv.config();

async function populateDistances() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB. Populating distances...');

    const warehouses = await Warehouse.find({});
    
    for (const warehouse of warehouses) {
      const destinations = await Destination.find({ linkedWarehouseRef: warehouse._id });
      if (destinations.length === 0) continue;

      console.log(`\nFetching distances for ${warehouse.name} -> ${destinations.length} destinations`);
      
      const results = await getRealDistances(warehouse.latitude, warehouse.longitude, destinations);
      
      if (!results) {
        console.log(`Skipping distance population for ${warehouse.name} due to API error/missing key.`);
        continue;
      }

      for (let i = 0; i < destinations.length; i++) {
        const dest = destinations[i];
        const res = results[i];

        if (res) {
          dest.distanceFromWarehouseKm = res.distanceKm;
          dest.durationFromWarehouseMinutes = res.durationMinutes;
          await dest.save();
          console.log(`  -> ${dest.name}: ${res.distanceKm} km, ${res.durationMinutes} mins`);
        } else {
          console.log(`  -> ${dest.name}: Failed to resolve.`);
        }
      }
    }

    console.log('\nDistance population complete.');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

populateDistances();
