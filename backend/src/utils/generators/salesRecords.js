import mongoose from 'mongoose';
import { randomFloat, randomInt } from './random.js';

export function generateSalesRecords(products, warehouses, prng) {
  const sales = [];
  const endDate = new Date();
  const startDate = new Date(endDate.getTime() - 270 * 24 * 60 * 60 * 1000); // ~9 months

  // Define base pricing and seasonality mapping (0-11 for Jan-Dec)
  const productMeta = {
    'Tomatoes': { basePrice: 40, peakMonths: [6, 7, 8, 9] },
    'Bananas': { basePrice: 50, peakMonths: [] }, // consistent
    'Mangoes': { basePrice: 120, peakMonths: [2, 3, 4, 5] }, // Mar-Jun
    'Spinach': { basePrice: 30, peakMonths: [10, 11, 0, 1] }, // Nov-Feb
    'Apples': { basePrice: 150, peakMonths: [8, 9, 10, 11] }, // Sept-Dec
    'Grapes': { basePrice: 100, peakMonths: [0, 1, 2, 3] }, // Jan-Apr
    'Onions': { basePrice: 25, peakMonths: [9, 10, 11] },
    'Potatoes': { basePrice: 20, peakMonths: [] }
  };

  for (const product of products) {
    const meta = productMeta[product.name] || { basePrice: 50, peakMonths: [] };
    
    for (const warehouse of warehouses) {
      let currentPrice = meta.basePrice;
      
      // Daily iteration
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const month = d.getMonth();
        const dayOfWeek = d.getDay(); // 0 is Sunday, 6 is Saturday
        
        // Seasonality multiplier
        let seasonalMult = 1.0;
        if (meta.peakMonths.includes(month)) {
          seasonalMult = randomFloat(1.2, 1.8, prng); // Higher demand
        } else if (meta.peakMonths.length > 0) {
          seasonalMult = randomFloat(0.4, 0.8, prng); // Lower demand off-season
        }

        // Weekend multiplier
        const isWeekend = (dayOfWeek === 0 || dayOfWeek === 6);
        const weekendMult = isWeekend ? randomFloat(1.1, 1.5, prng) : 1.0;

        // Price fluctuation (gentle random walk)
        const priceChange = randomFloat(-0.02, 0.02, prng); // +/- 2% max per day
        currentPrice = currentPrice * (1 + priceChange);
        // clamp price to reasonable bounds (e.g. +/- 40% of base)
        if (currentPrice > meta.basePrice * 1.4) currentPrice = meta.basePrice * 1.4;
        if (currentPrice < meta.basePrice * 0.6) currentPrice = meta.basePrice * 0.6;

        // Base daily quantity for this warehouse
        const baseQty = randomInt(50, 200, prng);
        const finalQty = Math.floor(baseQty * seasonalMult * weekendMult);

        sales.push({
          _id: new mongoose.Types.ObjectId(),
          productRef: product._id,
          warehouseRef: warehouse._id,
          date: new Date(d),
          quantitySoldKg: finalQty,
          unitPriceINR: parseFloat(currentPrice.toFixed(2))
        });
      }
    }
  }

  return sales;
}
