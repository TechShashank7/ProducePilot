import mongoose from 'mongoose';

const visualAssessmentSchema = new mongoose.Schema({
  batchRef: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Batch',
    required: false
  },
  imageBase64: {
    type: String,
    required: true
  },
  productHint: {
    type: String,
    required: false
  },
  ripenessStage: {
    type: String,
    required: true
  },
  defectsDetected: [{
    type: String
  }],
  visualConditionScore: {
    type: Number,
    min: 0,
    max: 100,
    required: true
  },
  confidencePct: {
    type: Number,
    min: 0,
    max: 100,
    required: true
  },
  modelRationale: {
    type: String,
    required: true
  },
  mismatchFlagged: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const VisualAssessment = mongoose.model('VisualAssessment', visualAssessmentSchema);

export default VisualAssessment;
