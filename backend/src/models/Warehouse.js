import mongoose from 'mongoose';

const warehouseSchema = new mongoose.Schema({
  name: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  capacityKg: { type: Number, required: true }
}, { timestamps: true });

export default mongoose.model('Warehouse', warehouseSchema);
