import mongoose from 'mongoose';

const destinationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, required: true, enum: ['retailer', 'restaurant', 'ngo', 'wholesale_market'] },
  city: { type: String, required: true },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  acceptsDiscountedProduce: { type: Boolean, required: true },
  typicalCapacityKgPerWeek: { type: Number, required: true },
  linkedWarehouseRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },
  distanceFromWarehouseKm: { type: Number },
  durationFromWarehouseMinutes: { type: Number },
  placeId: { type: String },
  address: { type: String }
}, { timestamps: true });

export default mongoose.model('Destination', destinationSchema);
