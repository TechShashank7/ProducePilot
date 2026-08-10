import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Warehouse from '../models/Warehouse.js';
import Destination from '../models/Destination.js';
import { createPRNG, randomInt } from '../utils/generators/random.js';

dotenv.config();

const API_KEY = process.env.VITE_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY;

if (!API_KEY) {
  console.error('No Google Maps API Key found. Ensure VITE_GOOGLE_MAPS_API_KEY is set in .env');
  process.exit(1);
}

const prng = createPRNG(99);

async function searchPlaces(query, lat, lng) {
  const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&location=${lat},${lng}&radius=15000&key=${API_KEY}`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    return data.results || [];
  } catch (e) {
    console.error(`Error searching for ${query}:`, e);
    return [];
  }
}

async function seedDestinations() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB. Wiping existing destinations...');
    await Destination.deleteMany({});

    const warehouses = await Warehouse.find({});
    if (warehouses.length === 0) {
      console.error('No warehouses found. Please run main seed script first.');
      process.exit(1);
    }

    const targets = [
      { type: 'retailer', query: 'supermarket', count: 3 },
      { type: 'restaurant', query: 'restaurant', count: 1 },
      { type: 'wholesale_market', query: 'wholesale fruit vegetable market OR mandi', count: 1 },
      { type: 'ngo', query: 'food bank NGO charity', count: 1 }
    ];

    const destinationsToInsert = [];

    for (const warehouse of warehouses) {
      console.log(`\nFetching real destinations for warehouse: ${warehouse.name} (${warehouse.city})...`);
      
      for (const t of targets) {
        const results = await searchPlaces(t.query, warehouse.latitude, warehouse.longitude);
        
        if (results.length < t.count) {
          console.warn(`WARNING: Found only ${results.length} real results for category '${t.type}' near ${warehouse.name} (target: ${t.count})`);
        }
        
        const take = Math.min(results.length, t.count);
        for (let i = 0; i < take; i++) {
          const place = results[i];
          
          let capacity = 0;
          if (t.type === 'ngo') capacity = randomInt(50, 150, prng);
          else if (t.type === 'wholesale_market') capacity = randomInt(1000, 5000, prng);
          else if (t.type === 'restaurant') capacity = randomInt(100, 300, prng);
          else capacity = randomInt(200, 500, prng);
          
          // Try to extract city from formatted address, otherwise fallback to warehouse city
          const addressParts = place.formatted_address ? place.formatted_address.split(',') : [];
          const cityFallback = addressParts.length >= 3 ? addressParts[addressParts.length - 3].trim() : warehouse.city;

          destinationsToInsert.push({
            name: place.name,
            type: t.type,
            city: cityFallback,
            address: place.formatted_address || '',
            placeId: place.place_id || '',
            latitude: place.geometry.location.lat,
            longitude: place.geometry.location.lng,
            acceptsDiscountedProduce: true,
            typicalCapacityKgPerWeek: capacity,
            linkedWarehouseRef: warehouse._id
          });
        }
      }
    }

    await Destination.insertMany(destinationsToInsert);
    console.log(`\nInserted ${destinationsToInsert.length} real-world destinations.`);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

seedDestinations();
