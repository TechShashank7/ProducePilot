import mongoose from 'mongoose';

const qualityParamSchema = new mongoose.Schema({
  productRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  brixRangeMin: { type: Number, required: true },
  brixRangeMax: { type: Number, required: true },
  firmnessIndexRange: {
    min: { type: Number, required: true },
    max: { type: Number, required: true }
  },
  acceptableDefectPct: { type: Number, required: true },
  colorGradeDescription: { type: String, required: true }
}, { timestamps: true });

export default mongoose.model('QualityParam', qualityParamSchema);
