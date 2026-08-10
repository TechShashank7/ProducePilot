import mongoose from 'mongoose';
import { randomFloat, randomInt, pickRandom } from './random.js';

export function generateOperationalLogs(warehouses, count = 15, prng) {
  const logs = [];
  const vehicleTypes = ['Refrigerated Truck (Large)', 'Refrigerated Truck (Small)', 'Standard LCV', 'Insulated Van'];

  for (let i = 0; i < count; i++) {
    const fromWarehouse = pickRandom(warehouses, prng);
    let toWarehouse = null;
    let toRetailerRegion = null;

    if (randomFloat(0, 1, prng) > 0.5) {
      // Inter-warehouse transfer
      let w2 = pickRandom(warehouses, prng);
      while(w2._id === fromWarehouse._id) {
        w2 = pickRandom(warehouses, prng);
      }
      toWarehouse = w2._id;
    } else {
      // To retailer
      const regions = ['North Zone Retailers', 'South Zone Supermarkets', 'West Coast Markets'];
      toRetailerRegion = pickRandom(regions, prng);
    }

    logs.push({
      _id: new mongoose.Types.ObjectId(),
      fromWarehouseRef: fromWarehouse._id,
      toWarehouseRef: toWarehouse,
      toRetailerRegion: toRetailerRegion,
      avgTransitHours: parseFloat(randomFloat(2, 48, prng).toFixed(1)),
      avgColdChainTempC: parseFloat(randomFloat(2, 16, prng).toFixed(1)),
      vehicleType: pickRandom(vehicleTypes, prng)
    });
  }

  return logs;
}
