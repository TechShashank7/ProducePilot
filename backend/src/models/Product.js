import mongoose from 'mongoose';

/**
 * Horticultural reference ranges for ideal storage (UC Davis Postharvest):
 * - Tomatoes (Ripe): 7-10 days at 13-15°C, 90-95% humidity
 * - Bananas (Green to Ripe): 5-7 days at 13-15°C, 90-95% humidity
 * - Mangoes: 7-14 days at 10-13°C, 90-95% humidity
 * - Spinach (Leafy greens): 3-5 days at 0-4°C, 95-100% humidity
 * - Apples: 30-90+ days at 0-4°C, 90-95% humidity
 * - Grapes: 14-30 days at -1 to 0°C, 90-95% humidity
 * - Onions: 30-180 days at 0-4°C, 65-70% humidity
 * - Potatoes: 30-90 days at 4-10°C, 90-95% humidity
 */
const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, required: true, enum: ['Fruit', 'Vegetable'] },
  typicalShelfLifeDays: {
    min: { type: Number, required: true },
    max: { type: Number, required: true }
  },
  idealStorageTempC: {
    min: { type: Number, required: true },
    max: { type: Number, required: true }
  },
  idealHumidityPct: {
    min: { type: Number, required: true },
    max: { type: Number, required: true }
  },
  unit: { type: String, default: 'kg' }
}, { timestamps: true });

export default mongoose.model('Product', productSchema);
