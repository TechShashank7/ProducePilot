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
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
        <div className="bg-surface border border-border-light rounded-[24px] shadow-xl max-w-lg w-full overflow-hidden">
          <div className="p-6 border-b border-border-light flex items-center justify-between">
            <h3 className="text-xl font-bold text-text-primary">Confirm Rescue Action</h3>
            <button 
              onClick={() => setPendingRecommendation(null)}
              className="text-text-muted hover:text-text-primary bg-surface-container-low rounded-full w-8 h-8 flex items-center justify-center transition-colors"
            >
              ✕
            </button>
          </div>
          
          <div className="p-6">
            <div className="flex items-center gap-3 mb-6">
              {pendingRecommendation.recData.aiRecommendation?.source === 'gemini' ? (
                <span className="px-3 py-1 bg-gradient-to-r from-[#DCEBFB] to-[#C7DFF8] text-info-blue border border-info-blue/10 text-xs font-bold rounded-full tracking-wide">
                  ✨ AI-Assisted
                </span>
              ) : (
                <span className="px-3 py-1 bg-surface-container-low text-text-secondary border border-border-light text-xs font-bold rounded-full tracking-wide">
                  ⚙️ Automated Pick
                </span>
              )}
              <span className="text-sm font-bold text-text-primary">
                {pendingRecommendation.recData.candidates[pendingRecommendation.recData.aiRecommendation?.recommendedCandidateIndex || 0]?.destination.name}
              </span>
            </div>
            
            <div className="bg-surface-dim p-5 rounded-2xl border border-border-light text-sm text-text-secondary mb-8 leading-relaxed font-medium">
              "{pendingRecommendation.recData.aiRecommendation?.justification}"
            </div>
            
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setPendingRecommendation(null)}
                className="px-6 py-2.5 bg-transparent text-text-primary font-bold hover:bg-surface-dim border border-border-light rounded-full transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmAccept}
                className="px-6 py-2.5 bg-primary hover:bg-primary-container text-white font-bold rounded-full transition-colors shadow-sm"
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
