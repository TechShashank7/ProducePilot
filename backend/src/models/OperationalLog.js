import mongoose from 'mongoose';

const operationalLogSchema = new mongoose.Schema({
  fromWarehouseRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },
  toWarehouseRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse' },
  toRetailerRegion: { type: String }, // Either toWarehouseRef or toRetailerRegion is used
  avgTransitHours: { type: Number, required: true },
  avgColdChainTempC: { type: Number, required: true },
  vehicleType: { type: String, required: true }
}, { timestamps: true });

export default mongoose.model('OperationalLog', operationalLogSchema);
