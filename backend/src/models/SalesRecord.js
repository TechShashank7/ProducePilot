import mongoose from 'mongoose';

const salesRecordSchema = new mongoose.Schema({
  productRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  warehouseRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },
  date: { type: Date, required: true },
  quantitySoldKg: { type: Number, required: true },
  unitPriceINR: { type: Number, required: true }
}, { timestamps: true });

export default mongoose.model('SalesRecord', salesRecordSchema);
