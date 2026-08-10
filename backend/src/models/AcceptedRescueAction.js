import mongoose from 'mongoose';

const acceptedRescueActionSchema = new mongoose.Schema({
  batchRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch', required: true },
  warehouseRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },
  productRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  destinationName: { type: String, required: true },
  discountPct: { type: Number, required: true },
  recoveredValueINR: { type: Number, required: true },
  kgWrittenOff: { type: Number, default: 0 },
  acceptedAt: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.model('AcceptedRescueAction', acceptedRescueActionSchema);
