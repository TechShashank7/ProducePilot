import AgentActivityLog from '../models/AgentActivityLog.js';

export function logAgentActivity({ agentType, action, batchId, productId, warehouseId, summary }) {
  // Fire-and-forget: do not return the promise to block the caller
  AgentActivityLog.create({
    agentType,
    action,
    relatedBatchRef: batchId || null,
    relatedProductRef: productId || null,
    relatedWarehouseRef: warehouseId || null,
    summary
  }).catch(err => {
    console.error('Failed to log agent activity:', err);
  });
}
