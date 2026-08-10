import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Upload, CheckCircle, AlertTriangle, Image as ImageIcon } from 'lucide-react';
import Card from '../components/ui/Card';
import RiskBadge from '../components/ui/RiskBadge';
import { fetchApi } from '../services/api';
import { useToast } from '../components/ui/Toast';
import { useRescueAction } from '../hooks/useRescueAction';

const timeAgo = (dateInput) => {
  if (!dateInput) return '';
  const date = new Date(dateInput);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);
  
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} mins ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hours ago`;
  const days = Math.floor(hours / 24);
  return `${days} days ago`;
};

const BatchDetail = () => {
  const { id } = useParams();
  const toast = useToast();
  
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mismatchError, setMismatchError] = useState(null);
  
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const fetchDetail = async () => {
    try {
      setLoading(true);
      const res = await fetchApi(`/batches/${id}/detail`);
      setData(res);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Batch not found");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  const {
    actionInProgressId,
    handleAcceptClick,
    handleWriteOff,
    RescueActionModal
  } = useRescueAction({
    onSuccess: fetchDetail
  });

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.mimetype?.startsWith('image/') && !file.type.startsWith('image/')) {
      toast.error("Please upload a valid image file.");
      return;
    }

    setUploading(true);
    setMismatchError(null);
    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('batchId', id);
      formData.append('productHint', data.batch.productRef.name);

      const uploadResult = await fetchApi('/vision/assess', {
        method: 'POST',
        body: formData
      });

      if (uploadResult.mismatch) {
        setMismatchError(uploadResult.message);
      } else {
        toast.success("Image analyzed successfully.");
      }

      await fetchDetail(); // Refresh to show new assessment and re-calculated risk
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Failed to analyze image.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-text-muted">Loading batch details...</div>;
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center p-12">
        <AlertTriangle size={48} className="text-risk-critical mb-4" />
        <h2 className="text-xl font-medium text-text-primary">Batch Not Found</h2>
        <button onClick={fetchDetail} className="mt-4 px-6 py-2 bg-accent hover:bg-accent-hover text-white font-medium rounded transition-colors">Retry</button>
        <Link to="/" className="mt-4 text-accent hover:underline">Return to Dashboard</Link>
      </div>
    );
  }

  const { batch, riskResult, hasViableCandidates, visualAssessments } = data;
  const breakdown = riskResult.breakdown;

  return (
    <div className="flex flex-col gap-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/" className="p-2 -ml-2 rounded-full hover:bg-bg-hover text-text-muted transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-semibold text-text-primary">
              {batch.productRef.name}
            </h1>
            <p className="text-text-secondary">{batch.batchCode}</p>
          </div>
        </div>
        <RiskBadge riskPct={riskResult.riskPct} category={riskResult.riskCategory} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Details & Rescue */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          {/* Risk Breakdown */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-text-primary">Risk Breakdown</h2>
              {riskResult.visualFactored ? (
                <span className="px-2 py-1 bg-accent/20 text-accent text-xs font-semibold rounded-full flex items-center gap-1">
                  <ImageIcon size={12} />
                  AI-verified via photo
                </span>
              ) : (
                <span className="px-2 py-1 bg-bg-elevated text-text-muted border border-border text-xs font-semibold rounded-full flex items-center gap-1">
                  Estimated from storage data only
                </span>
              )}
            </div>
            
            {breakdown.chillingInjuryWarning && (
              <div className="mb-6 p-4 rounded-md bg-risk-criticalBg border border-risk-critical text-risk-critical">
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle size={18} />
                  <span className="font-semibold">Chilling Injury Warning</span>
                </div>
                <p className="text-sm">
                  The current temperature ({batch.currentStorageTempC}°C) is significantly below the ideal minimum for this product. 
                  This accelerates spoilage due to chilling injury.
                </p>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8 text-sm">
              <div className="flex justify-between border-b border-border pb-2">
                <span className="text-text-muted">Days Since Harvest</span>
                <span className="font-medium text-text-primary">{breakdown.daysSinceHarvest.toFixed(1)} days</span>
              </div>
              <div className="flex justify-between border-b border-border pb-2">
                <span className="text-text-muted">Estimated Days Remaining</span>
                <span className="font-medium text-text-primary">{riskResult.estimatedDaysRemaining.toFixed(1)} days</span>
              </div>
              <div className="flex justify-between border-b border-border pb-2">
                <span className="text-text-muted">Current Temp</span>
                <span className="font-medium text-text-primary">{batch.currentStorageTempC}°C <span className="text-text-muted font-normal">(Ideal: {batch.productRef.idealStorageTempC.min}-{batch.productRef.idealStorageTempC.max}°C)</span></span>
              </div>
              <div className="flex justify-between border-b border-border pb-2">
                <span className="text-text-muted">Current Humidity</span>
                <span className="font-medium text-text-primary">{batch.currentStorageHumidityPct}% <span className="text-text-muted font-normal">(Ideal: {batch.productRef.idealHumidityPct.min}-{batch.productRef.idealHumidityPct.max}%)</span></span>
              </div>
              <div className="flex justify-between border-b border-border pb-2">
                <span className="text-text-muted">Humidity Risk Multiplier</span>
                <span className="font-medium text-text-primary">{breakdown.humidityStressMultiplier.toFixed(2)}x</span>
              </div>
              <div className="flex justify-between border-b border-border pb-2">
                <span className="text-text-muted">Temp Risk Multiplier</span>
                <span className="font-medium text-text-primary">{breakdown.tempRateMultiplier.toFixed(2)}x</span>
              </div>
            </div>
          </Card>

          {/* Rescue Action Card */}
          <Card>
            <h2 className="text-lg font-medium text-text-primary mb-2">Rescue Action</h2>
            <p className="text-sm text-text-secondary mb-6">
              Evaluate available destinations or discard this batch based on its viability.
            </p>
            
            <div className="flex items-center">
              {hasViableCandidates ? (
                <button
                  onClick={(e) => handleAcceptClick(e, batch._id)}
                  disabled={actionInProgressId === batch._id}
                  className="px-6 py-2 bg-accent hover:bg-accent-hover text-white font-medium rounded transition-colors disabled:opacity-50"
                >
                  {actionInProgressId === batch._id ? 'Processing...' : 'Accept AI Rescue Plan'}
                </button>
              ) : (
                <button
                  onClick={(e) => handleWriteOff(e, batch._id)}
                  disabled={actionInProgressId === batch._id}
                  className="px-6 py-2 bg-risk-criticalBg text-risk-critical hover:bg-risk-critical hover:text-white border border-risk-critical font-medium rounded transition-colors disabled:opacity-50"
                >
                  {actionInProgressId === batch._id ? 'Processing...' : 'Write off as Total Loss'}
                </button>
              )}
            </div>
          </Card>
        </div>

        {/* Right Column: Visual Assessment */}
        <div className="flex flex-col gap-6">
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-text-primary">Visual Assessment</h2>
              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="flex items-center gap-2 px-3 py-1.5 bg-bg-elevated hover:bg-bg-hover text-sm font-medium text-text-primary border border-border rounded transition-colors disabled:opacity-50"
              >
                <Upload size={16} />
                {uploading ? 'Analyzing...' : 'Upload Photo'}
              </button>
              <input 
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept="image/*"
                className="hidden"
              />
            </div>

            {mismatchError && (
              <div className="mb-4 p-3 rounded-md bg-risk-highBg border border-risk-high text-risk-high text-sm flex items-start gap-2">
                <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                <p>{mismatchError}</p>
              </div>
            )}

            {uploading ? (
              <div className="py-12 flex flex-col items-center justify-center text-text-muted">
                <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin mb-4"></div>
                <p>Analyzing photo with Gemini...</p>
              </div>
            ) : visualAssessments.length === 0 ? (
              <div className="py-8 text-center text-text-muted text-sm border-2 border-dashed border-border rounded-md">
                No visual assessments performed yet.
              </div>
            ) : (
              <div className="flex flex-col gap-6">
                {/* Most recent assessment */}
                <div className="flex flex-col gap-3">
                  <div className="aspect-video w-full rounded-md overflow-hidden bg-bg-elevated border border-border">
                    <img 
                      src={visualAssessments[0].imageBase64} 
                      alt="Produce assessment" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-bg-elevated p-3 rounded border border-border">
                      <span className="text-xs text-text-muted block mb-1">Condition Score</span>
                      <span className="text-lg font-semibold text-text-primary">{visualAssessments[0].visualConditionScore}/100</span>
                    </div>
                    <div className="bg-bg-elevated p-3 rounded border border-border">
                      <span className="text-xs text-text-muted block mb-1">Ripeness</span>
                      <span className="text-lg font-semibold text-text-primary capitalize">{visualAssessments[0].ripenessStage}</span>
                    </div>
                  </div>

                  <div className="bg-bg-elevated p-3 rounded border border-border text-sm">
                    <span className="text-xs text-text-muted block mb-1">Defects</span>
                    {visualAssessments[0].defectsDetected.length > 0 ? (
                      <ul className="list-disc pl-4 text-text-primary">
                        {visualAssessments[0].defectsDetected.map((d, i) => (
                          <li key={i}>{d}</li>
                        ))}
                      </ul>
                    ) : (
                      <span className="text-text-primary">None detected</span>
                    )}
                  </div>

                  <div className="bg-bg-elevated p-3 rounded border border-border text-sm">
                    <span className="text-xs text-text-muted block mb-1">AI Rationale</span>
                    <p className="text-text-primary italic">"{visualAssessments[0].modelRationale}"</p>
                  </div>
                </div>

                {/* History */}
                {visualAssessments.length > 1 && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <h3 className="text-sm font-medium text-text-primary mb-3">Previous Assessments</h3>
                    <div className="flex flex-col gap-3">
                      {visualAssessments.slice(1).map((assessment) => (
                        <div key={assessment._id} className="flex gap-3 items-center p-2 rounded bg-bg-elevated border border-border">
                          <img 
                            src={assessment.imageBase64} 
                            alt="thumb" 
                            className="w-12 h-12 object-cover rounded"
                          />
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-text-primary">
                              Score: {assessment.visualConditionScore} ({assessment.ripenessStage})
                            </span>
                            <span className="text-xs text-text-muted">{timeAgo(assessment.createdAt)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>
      </div>
      <RescueActionModal />
    </div>
  );
};

export default BatchDetail;
