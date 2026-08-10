import React, { useState } from 'react';
import { fetchApi } from '../services/api';
import { useToast } from '../components/ui/Toast';

export const useRescueAction = ({ onSuccess } = {}) => {
  const toast = useToast();
  const [actionInProgressId, setActionInProgressId] = useState(null);
  const [pendingRecommendation, setPendingRecommendation] = useState(null);

  const handleAcceptClick = async (e, batchId) => {
    e.preventDefault(); 
    e.stopPropagation();
    
    setActionInProgressId(batchId);
    try {
      const recData = await fetchApi(`/batches/${batchId}/recommendation`);
      
      if (!recData.candidates || recData.candidates.length === 0) {
        throw new Error("No viable candidates found upon detailed check.");
      }

      setPendingRecommendation({ batchId, recData });
    } catch (error) {
      console.error("Failed to load recommendation", error);
      toast.error(error.message || "Failed to load recommendation.");
    } finally {
      setActionInProgressId(null);
    }
  };

  const confirmAccept = async () => {
    if (!pendingRecommendation) return;
    const { batchId, recData } = pendingRecommendation;
    
    let candidateIndex = 0;
    let source = "fallback_error";
    
    if (recData.aiRecommendation) {
      if (typeof recData.aiRecommendation.recommendedCandidateIndex === 'number' && recData.aiRecommendation.recommendedCandidateIndex >= 0) {
        candidateIndex = recData.aiRecommendation.recommendedCandidateIndex;
      }
      source = recData.aiRecommendation.source || source;
    }

    setPendingRecommendation(null);
    setActionInProgressId(batchId);
    
    try {
      await fetchApi(`/batches/${batchId}/recommendation/accept`, {
        method: 'POST',
        body: JSON.stringify({ candidateIndex, source })
      });
      
      toast.success("Recommendation accepted and action logged.");
      if (onSuccess) await onSuccess(batchId);
      
    } catch (error) {
      console.error("Failed to accept recommendation", error);
      toast.error(error.message || "Failed to accept recommendation.");
    } finally {
      setActionInProgressId(null);
    }
  };

  const handleWriteOff = async (e, batchId) => {
    e.preventDefault(); 
    e.stopPropagation();
    
    setActionInProgressId(batchId);
    try {
      await fetchApi(`/batches/${batchId}/recommendation/write-off`, {
        method: 'POST'
      });
      
      toast.success("Batch written off successfully.");
      if (onSuccess) await onSuccess(batchId);
      
    } catch (error) {
      console.error("Failed to write off batch", error);
      toast.error(error.message || "Failed to write off batch.");
    } finally {
      setActionInProgressId(null);
    }
  };

  const RescueActionModal = () => {
    if (!pendingRecommendation) return null;
    
    return (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4">
        <div className="bg-bg-surface border border-border rounded-lg shadow-xl max-w-lg w-full overflow-hidden">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h3 className="text-lg font-medium text-text-primary">Confirm Rescue Action</h3>
            <button 
              onClick={() => setPendingRecommendation(null)}
              className="text-text-muted hover:text-text-primary"
            >
              ✕
            </button>
          </div>
          
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              {pendingRecommendation.recData.aiRecommendation?.source === 'gemini' ? (
                <span className="px-2 py-1 bg-accent/20 text-accent border border-accent/30 text-xs font-semibold rounded-full tracking-wide">
                  ✨ AI-Assisted
                </span>
              ) : (
                <span className="px-2 py-1 bg-bg-elevated text-text-secondary border border-border text-xs font-semibold rounded-full tracking-wide">
                  ⚙️ Automated Pick
                </span>
              )}
              <span className="text-sm font-medium text-text-primary">
                {pendingRecommendation.recData.candidates[pendingRecommendation.recData.aiRecommendation?.recommendedCandidateIndex || 0]?.destination.name}
              </span>
            </div>
            
            <div className="bg-bg-elevated p-4 rounded-md border border-border/50 text-sm text-text-secondary mb-6 leading-relaxed">
              "{pendingRecommendation.recData.aiRecommendation?.justification}"
            </div>
            
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setPendingRecommendation(null)}
                className="px-4 py-2 bg-transparent text-text-primary hover:bg-bg-hover border border-border rounded transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmAccept}
                className="px-4 py-2 bg-accent hover:bg-accent-hover text-white font-medium rounded transition-colors"
              >
                Confirm & Dispatch
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return {
    actionInProgressId,
    handleAcceptClick,
    handleWriteOff,
    RescueActionModal
  };
};
