import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Models
import Product from '../models/Product.js';
import Warehouse from '../models/Warehouse.js';
import Batch from '../models/Batch.js';
import SalesRecord from '../models/SalesRecord.js';
import QualityParam from '../models/QualityParam.js';
import OperationalLog from '../models/OperationalLog.js';

// Generators
import { createPRNG } from '../utils/generators/random.js';
import { generateProducts } from '../utils/generators/products.js';
import { generateWarehouses } from '../utils/generators/warehouses.js';
import { generateBatches } from '../utils/generators/batches.js';
import { generateQualityParams } from '../utils/generators/qualityParams.js';
import { generateSalesRecords } from '../utils/generators/salesRecords.js';
import { generateOperationalLogs } from '../utils/generators/operationalLogs.js';

dotenv.config();

const SEED = 42;

async function seedDatabase() {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI is not defined in .env");
    }

    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB.');

    // Clear collections
    console.log('Clearing existing collections...');
    await Product.deleteMany({});
    await Warehouse.deleteMany({});
    await Batch.deleteMany({});
    await SalesRecord.deleteMany({});
    await QualityParam.deleteMany({});
    await OperationalLog.deleteMany({});

    // Initialize PRNG
    const prng = createPRNG(SEED);

    // Generate Data
    console.log('Generating realistic seed data...');
    const products = generateProducts();
    const warehouses = generateWarehouses();
    const qualityParams = generateQualityParams(products, prng);
    const batches = generateBatches(products, warehouses, 250, prng);
    const salesRecords = generateSalesRecords(products, warehouses, prng);
    const operationalLogs = generateOperationalLogs(warehouses, 15, prng);

    // Insert Data
    console.log('Inserting into database...');
    await Product.insertMany(products);
    await Warehouse.insertMany(warehouses);
    await QualityParam.insertMany(qualityParams);
    await Batch.insertMany(batches);
    // Sales records can be large, insert in chunks
    const chunkSize = 2000;
    for (let i = 0; i < salesRecords.length; i += chunkSize) {
        await SalesRecord.insertMany(salesRecords.slice(i, i + chunkSize));
    }
    await OperationalLog.insertMany(operationalLogs);

    // Summary Logging
    console.log('--- SEEDING COMPLETE ---');
    console.log(`Products Inserted: ${products.length}`);
    console.log(`Warehouses Inserted: ${warehouses.length}`);
    console.log(`QualityParams Inserted: ${qualityParams.length}`);
    console.log(`Batches Inserted: ${batches.length}`);
    console.log(`SalesRecords Inserted: ${salesRecords.length}`);
    console.log(`OperationalLogs Inserted: ${operationalLogs.length}`);

    // Create JSON Snapshot
    console.log('Writing JSON snapshot...');
    const snapshot = {
      products,
      warehouses,
      qualityParams,
      batches,
      salesRecords,
      operationalLogs
    };
    
    // Path relative to backend root (assuming run via `npm run seed` in backend dir)
    const snapshotPath = path.resolve(process.cwd(), '../data/generated/snapshot.json');
    
    // Ensure dir exists
    const dir = path.dirname(snapshotPath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(snapshotPath, JSON.stringify(snapshot, null, 2));
    console.log(`Snapshot written to ${snapshotPath}`);

    process.exit(0);
  } catch (error) {
    console.error('Error during seeding:', error);
    process.exit(1);
  }
}

seedDatabase();
