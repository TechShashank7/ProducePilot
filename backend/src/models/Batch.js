import mongoose from 'mongoose';

const batchSchema = new mongoose.Schema({
  productRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  warehouseRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },
  quantityKg: { type: Number, required: true },
  receivedDate: { type: Date, required: true },
  harvestDate: { type: Date, required: true }, // Must be earlier than receivedDate
  currentStorageTempC: { type: Number, required: true },
  currentStorageHumidityPct: { type: Number, required: true },
  batchCode: { type: String, required: true, unique: true },
  sourceRegion: { type: String, required: true }
}, { timestamps: true });

export default mongoose.model('Batch', batchSchema);
