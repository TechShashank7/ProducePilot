import mongoose from 'mongoose';

const agentActivityLogSchema = new mongoose.Schema({
  agentType: { 
    type: String, 
    enum: ['inventory', 'rescue', 'vision', 'demand'], 
    required: true 
  },
  action: { 
    type: String, 
    required: true 
  },
  relatedBatchRef: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Batch' 
  },
  relatedProductRef: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Product' 
  },
  relatedWarehouseRef: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Warehouse' 
  },
  summary: { 
    type: String, 
    required: true 
  }
}, { timestamps: true });

export default mongoose.model('AgentActivityLog', agentActivityLogSchema);
