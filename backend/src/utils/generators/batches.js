import mongoose from 'mongoose';
import { randomFloat, randomInt, pickRandom } from './random.js';

export function generateBatches(products, warehouses, count = 250, prng) {
  const batches = [];
  const now = new Date();
  
  const regions = ['Maharashtra Farms', 'Karnataka Orchards', 'UP Greenhouses', 'Nashik Local', 'Himachal Orchards'];

  for (let i = 0; i < count; i++) {
    // Biasing: pick index based on squared random to skew towards earlier products (e.g. Tomatoes)
    const r1 = randomFloat(0, 1, prng);
    const r2 = randomFloat(0, 1, prng);
    const pIdx = Math.floor(r1 * r2 * products.length);
    const product = products[pIdx];
    
    const wIdx = randomInt(0, warehouses.length - 1, prng);
    const warehouse = warehouses[wIdx];

    // Dates - simulate batches received recently
    let daysAgo;
    const probability = randomFloat(0, 1, prng);
    if (probability <= 0.6) {
      daysAgo = randomFloat(0, 5, prng);
    } else if (probability <= 0.9) {
      daysAgo = randomFloat(6, 12, prng);
    } else {
      daysAgo = randomFloat(13, 20, prng);
    }

    const receivedDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
    const transitGap = randomInt(1, 4, prng);
    const harvestDate = new Date(receivedDate.getTime() - transitGap * 24 * 60 * 60 * 1000);

    // Temp & Humidity (cluster near ideal, but with variance)
    // 80% of time it's within ideal range, 20% it's outside
    let temp, humidity;
    if (randomFloat(0, 1, prng) > 0.2) {
        temp = randomFloat(product.idealStorageTempC.min, product.idealStorageTempC.max, prng);
        humidity = randomFloat(product.idealHumidityPct.min, product.idealHumidityPct.max, prng);
    } else {
        // slightly outside ideal range
        const tempVariance = randomFloat(1, 5, prng);
        temp = randomFloat(0, 1, prng) > 0.5 ? product.idealStorageTempC.max + tempVariance : product.idealStorageTempC.min - tempVariance;
        const humVariance = randomFloat(2, 10, prng);
        humidity = randomFloat(0, 1, prng) > 0.5 ? product.idealHumidityPct.max + humVariance : product.idealHumidityPct.min - humVariance;
        // clamp humidity to 100
        if (humidity > 100) humidity = 100;
        if (humidity < 0) humidity = 0;
    }

    batches.push({
      _id: new mongoose.Types.ObjectId(),
      productRef: product._id,
      warehouseRef: warehouse._id,
      quantityKg: randomInt(50, 2000, prng),
      receivedDate,
      harvestDate,
      currentStorageTempC: parseFloat(temp.toFixed(1)),
      currentStorageHumidityPct: parseFloat(humidity.toFixed(1)),
      batchCode: `B-${receivedDate.getFullYear()}-${i.toString().padStart(4, '0')}`,
      sourceRegion: pickRandom(regions, prng)
    });
  }

  return batches;
}
