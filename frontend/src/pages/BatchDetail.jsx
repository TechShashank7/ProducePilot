import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Upload, AlertTriangle, Image as ImageIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
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
  
  const [demandData, setDemandData] = useState(null);
  const [demandLoading, setDemandLoading] = useState(false);
  const [demandError, setDemandError] = useState(null);
  
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const fetchDetail = async (force = false) => {
    setLoading(true);
    try {
      const res = await fetchApi(`/batches/${id}/detail`, {}, force);
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

  useEffect(() => {
    if (data && data.batch) {
      const fetchDemand = async () => {
        setDemandLoading(true);
        try {
          const pId = typeof data.batch.productRef === 'object' ? data.batch.productRef._id : data.batch.productRef;
          const wId = typeof data.batch.warehouseRef === 'object' ? data.batch.warehouseRef._id : data.batch.warehouseRef;
          
          const res = await fetchApi(`/forecast?productId=${pId}&warehouseId=${wId}&horizonDays=7`);
          setDemandData(res);
          setDemandError(null);
        } catch (err) {
          console.error("Demand forecast error", err);
          setDemandError(err.message || "Failed to load forecast");
        } finally {
          setDemandLoading(false);
        }
      };
      fetchDemand();
    }
  }, [data]);

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
      <div className="flex flex-col items-center justify-center p-12 bg-surface rounded-[24px] shadow-sm">
        <AlertTriangle size={48} className="text-error-red mb-4" />
        <h2 className="text-xl font-bold text-text-primary">Batch Not Found</h2>
        <button onClick={fetchDetail} className="mt-4 px-6 py-2.5 bg-primary hover:bg-primary-container text-white font-bold rounded-full transition-colors">Retry</button>
        <Link to="/app" className="mt-4 text-primary font-medium hover:underline">Return to Dashboard</Link>
      </div>
    );
  }

  const { batch, riskResult, hasViableCandidates, visualAssessments } = data;
  const breakdown = riskResult.breakdown;

  const renderDemandCard = () => {
    if (demandLoading) {
      return (
        <div className="bg-surface rounded-[24px] shadow-sm p-6 border border-border-light/50 flex flex-col items-center justify-center min-h-[300px]">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-text-secondary font-medium">Loading AI Demand Forecast...</p>
        </div>
      );
    }
  
    if (demandError || !demandData) {
      return (
        <div className="bg-surface rounded-[24px] shadow-sm p-6 border border-border-light/50 flex flex-col items-center justify-center min-h-[300px]">
          <AlertTriangle className="text-warning-orange mb-2" size={32} />
          <p className="text-text-secondary font-medium">Demand forecast unavailable</p>
        </div>
      );
    }
  
    const {
      dailyForecast,
      totalForecastedQtyKg,
      trendDirection,
      avgDailySalesLastWeek,
      avgDailySalesPriorWeek,
      confidenceNote
    } = demandData;
  
    const pctChange = avgDailySalesPriorWeek > 0 
      ? (((avgDailySalesLastWeek - avgDailySalesPriorWeek) / avgDailySalesPriorWeek) * 100).toFixed(1)
      : 0;
  
    const isRising = trendDirection === 'rising';
    const isFalling = trendDirection === 'falling';
    const TrendIcon = isRising ? TrendingUp : (isFalling ? TrendingDown : Minus);
    const trendColor = isRising ? 'text-success-green' : (isFalling ? 'text-error-red' : 'text-text-secondary');
    const trendBg = isRising ? 'bg-success-green/10 border-success-green/20' : (isFalling ? 'bg-error-red/10 border-error-red/20' : 'bg-surface-container-low border-border-light');
  
    let insight = "Demand is stable. Maintain current distribution strategy.";
    if (isRising) {
      insight = "Demand is rising rapidly. Prioritize distribution and hold off on markdowns.";
    } else if (isFalling) {
      insight = "Demand is falling. Consider routing this batch to rescue partners or applying discount strategies early.";
    }
  
    return (
      <div className="bg-surface rounded-[24px] shadow-sm p-6 border border-border-light/50">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-headline-section text-text-primary">Demand Forecast (7-Day)</h2>
          <span className={`px-3 py-1 text-xs font-bold rounded-full flex items-center gap-1 border ${trendBg} ${trendColor} capitalize`}>
            <TrendIcon size={14} />
            {trendDirection} Trend
          </span>
        </div>
  
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
           <div className="bg-surface-container-low p-4 rounded-xl border border-border-light">
              <span className="text-[11px] uppercase tracking-widest text-text-secondary font-bold block mb-1">Projected 7-Day</span>
              <span className="text-2xl font-bold text-text-primary">{totalForecastedQtyKg} <span className="text-sm font-normal text-text-muted">kg</span></span>
           </div>
           <div className="bg-surface-container-low p-4 rounded-xl border border-border-light">
              <span className="text-[11px] uppercase tracking-widest text-text-secondary font-bold block mb-1">Last Week Avg</span>
              <span className="text-2xl font-bold text-text-primary">{avgDailySalesLastWeek} <span className="text-sm font-normal text-text-muted">kg/day</span></span>
           </div>
           <div className="bg-surface-container-low p-4 rounded-xl border border-border-light">
              <span className="text-[11px] uppercase tracking-widest text-text-secondary font-bold block mb-1">Growth (WoW)</span>
              <span className={`text-2xl font-bold ${Number(pctChange) > 0 ? 'text-success-green' : (Number(pctChange) < 0 ? 'text-error-red' : 'text-text-primary')}`}>
                {Number(pctChange) > 0 ? '+' : ''}{pctChange}%
              </span>
           </div>
        </div>
  
        <div className="h-64 mb-6 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dailyForecast} margin={{ top: 5, right: 0, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
              <XAxis 
                dataKey="date" 
                stroke="#6b7280" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false}
                tickFormatter={(val) => {
                  const d = new Date(val);
                  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
                }}
              />
              <YAxis stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e5e7eb', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                itemStyle={{ color: '#111827', fontWeight: 'bold' }}
                labelStyle={{ color: '#6b7280', marginBottom: '4px' }}
              />
              <Line 
                type="monotone" 
                dataKey="projectedQtyKg" 
                name="Forecast (kg)"
                stroke="#8B5CF6" 
                strokeWidth={3}
                dot={{ r: 4, strokeWidth: 2, fill: '#ffffff', stroke: '#8B5CF6' }}
                activeDot={{ r: 6, fill: '#8B5CF6', stroke: '#ffffff' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
  
        <div className="bg-gradient-to-br from-[#F5F3FF] to-[#EDE9FE] p-4 rounded-xl border border-violet-200">
          <span className="text-[11px] uppercase tracking-widest text-violet-700 font-bold block mb-2 flex items-center gap-1">
             🤖 AI Insight
          </span>
          <p className="text-violet-900 font-medium text-sm leading-relaxed">{insight}</p>
        </div>
        
        <p className="text-xs text-text-muted mt-4 text-center">{confidenceNote}</p>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/app" className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-dim text-text-secondary transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-headline-page text-text-primary">
              {batch.productRef.name}
            </h1>
            <p className="text-text-secondary font-medium tracking-wide">{batch.batchCode}</p>
          </div>
        </div>
        <div className="mr-2">
          <RiskBadge riskPct={riskResult.riskPct} category={riskResult.riskCategory} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Details & Rescue */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          {/* Risk Breakdown */}
          <div className="bg-surface rounded-[24px] shadow-sm p-6 border border-border-light/50">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-headline-section text-text-primary">Risk Breakdown</h2>
              {riskResult.visualFactored ? (
                <span className="px-3 py-1 bg-gradient-to-r from-[#DCEBFB] to-[#C7DFF8] text-info-blue text-xs font-bold rounded-full flex items-center gap-1 border border-info-blue/10">
                  <ImageIcon size={14} />
                  AI-verified via photo
                </span>
              ) : (
                <span className="px-3 py-1 bg-surface-container-low text-text-secondary border border-border-light text-xs font-bold rounded-full flex items-center gap-1">
                  Estimated from storage data
                </span>
              )}
            </div>
            
            {breakdown.chillingInjuryWarning && (
              <div className="mb-6 p-4 rounded-xl bg-error-container border border-error-red/20 text-error-red">
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle size={18} />
                  <span className="font-bold">Chilling Injury Warning</span>
                </div>
                <p className="text-sm font-medium opacity-90">
                  The current temperature ({batch.currentStorageTempC}°C) is significantly below the ideal minimum for this product. 
                  This accelerates spoilage due to chilling injury.
                </p>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8 text-sm">
              <div className="flex justify-between border-b border-border-light pb-3">
                <span className="text-text-secondary font-medium">Days Since Harvest</span>
                <span className="font-bold text-text-primary">{breakdown.daysSinceHarvest.toFixed(1)} days</span>
              </div>
              <div className="flex justify-between border-b border-border-light pb-3">
                <span className="text-text-secondary font-medium">Estimated Days Remaining</span>
                <span className="font-bold text-text-primary">{riskResult.estimatedDaysRemaining.toFixed(1)} days</span>
              </div>
              <div className="flex justify-between border-b border-border-light pb-3">
                <span className="text-text-secondary font-medium">Current Temp</span>
                <span className="font-bold text-text-primary">{batch.currentStorageTempC}°C <span className="text-text-muted font-normal">(Ideal: {batch.productRef.idealStorageTempC.min}-{batch.productRef.idealStorageTempC.max}°C)</span></span>
              </div>
              <div className="flex justify-between border-b border-border-light pb-3">
                <span className="text-text-secondary font-medium">Current Humidity</span>
                <span className="font-bold text-text-primary">{batch.currentStorageHumidityPct}% <span className="text-text-muted font-normal">(Ideal: {batch.productRef.idealHumidityPct.min}-{batch.productRef.idealHumidityPct.max}%)</span></span>
              </div>
              <div className="flex justify-between border-b border-border-light pb-3">
                <span className="text-text-secondary font-medium">Humidity Risk Multiplier</span>
                <span className="font-bold text-text-primary">{breakdown.humidityStressMultiplier.toFixed(2)}x</span>
              </div>
              <div className="flex justify-between border-b border-border-light pb-3">
                <span className="text-text-secondary font-medium">Temp Risk Multiplier</span>
                <span className="font-bold text-text-primary">{breakdown.tempRateMultiplier.toFixed(2)}x</span>
              </div>
            </div>
          </div>

          {/* Rescue Action Card */}
          <div className="bg-surface rounded-[24px] shadow-sm p-6 border border-border-light/50">
            <h2 className="text-headline-section text-text-primary mb-2">Rescue Action</h2>
            <p className="text-sm font-medium text-text-secondary mb-6">
              Evaluate available destinations or discard this batch based on its viability.
            </p>
            
            <div className="flex items-center gap-4">
              {hasViableCandidates ? (
                <button
                  onClick={(e) => handleAcceptClick(e, batch._id)}
                  disabled={actionInProgressId === batch._id}
                  className="px-8 py-3 bg-primary hover:bg-primary-container text-white font-bold rounded-full transition-colors disabled:opacity-50 shadow-sm"
                >
                  {actionInProgressId === batch._id ? 'Processing...' : 'Accept AI Rescue Plan'}
                </button>
              ) : (
                <button
                  onClick={(e) => handleWriteOff(e, batch._id)}
                  disabled={actionInProgressId === batch._id}
                  className="px-8 py-3 bg-error-red/10 text-error-red hover:bg-error-red hover:text-white border border-error-red/20 font-bold rounded-full transition-colors disabled:opacity-50"
                >
                  {actionInProgressId === batch._id ? 'Processing...' : 'Write off as Total Loss'}
                </button>
              )}
            </div>
          </div>

          {/* Demand Forecast Card */}
          {renderDemandCard()}
        </div>

        {/* Right Column: Visual Assessment */}
        <div className="flex flex-col gap-6">
          <div className="bg-surface rounded-[24px] shadow-sm p-6 border border-border-light/50">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-headline-section text-text-primary">Visual Assessment</h2>
              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="flex items-center gap-2 px-4 py-2 bg-surface hover:bg-surface-dim text-sm font-bold text-text-primary border border-border-light shadow-sm rounded-full transition-colors disabled:opacity-50"
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
              <div className="mb-4 p-4 rounded-xl bg-warning-orange/10 border border-warning-orange/20 text-warning-orange text-sm flex items-start gap-2 font-medium">
                <AlertTriangle size={18} className="mt-0.5 shrink-0" />
                <p>{mismatchError}</p>
              </div>
            )}

            {uploading ? (
               <div className="py-16 flex flex-col items-center justify-center text-text-secondary">
                 <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
                 <p className="font-medium">Analyzing photo with Gemini...</p>
               </div>
            ) : visualAssessments.length === 0 ? (
              <div className="py-12 text-center text-text-secondary text-sm border-2 border-dashed border-border-light rounded-2xl font-medium bg-surface-container-low/50">
                No visual assessments performed yet.
              </div>
            ) : (
              <div className="flex flex-col gap-6">
                {/* Most recent assessment */}
                <div className="flex flex-col gap-4">
                  <div className="aspect-video w-full rounded-2xl overflow-hidden bg-surface-dim border border-border-light shadow-inner">
                    <img 
                      src={visualAssessments[0].imageBase64} 
                      alt="Produce assessment" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-surface-container-low p-4 rounded-xl border border-border-light">
                      <span className="text-[11px] uppercase tracking-widest text-text-secondary font-bold block mb-1">Condition</span>
                      <span className="text-2xl font-bold text-text-primary">{visualAssessments[0].visualConditionScore}/100</span>
                    </div>
                    <div className="bg-surface-container-low p-4 rounded-xl border border-border-light">
                      <span className="text-[11px] uppercase tracking-widest text-text-secondary font-bold block mb-1">Ripeness</span>
                      <span className="text-2xl font-bold text-text-primary capitalize">{visualAssessments[0].ripenessStage}</span>
                    </div>
                  </div>

                  <div className="bg-surface-container-low p-4 rounded-xl border border-border-light text-sm">
                    <span className="text-[11px] uppercase tracking-widest text-text-secondary font-bold block mb-2">Defects</span>
                    {visualAssessments[0].defectsDetected.length > 0 ? (
                      <ul className="list-disc pl-5 text-text-primary font-medium space-y-1">
                        {visualAssessments[0].defectsDetected.map((d, i) => (
                          <li key={i}>{d}</li>
                        ))}
                      </ul>
                    ) : (
                      <span className="text-text-primary font-medium">None detected</span>
                    )}
                  </div>

                  <div className="bg-gradient-to-br from-[#DCEBFB]/30 to-[#C7DFF8]/30 p-4 rounded-xl border border-info-blue/10 text-sm">
                    <span className="text-[11px] uppercase tracking-widest text-info-blue font-bold block mb-2 flex items-center gap-1"><ImageIcon size={12}/> AI Rationale</span>
                    <p className="text-text-primary italic font-medium leading-relaxed">"{visualAssessments[0].modelRationale}"</p>
                  </div>
                </div>

                {/* History */}
                {visualAssessments.length > 1 && (
                  <div className="mt-4 pt-6 border-t border-border-light">
                    <h3 className="text-sm font-bold tracking-wide text-text-primary mb-4 uppercase">Previous Assessments</h3>
                    <div className="flex flex-col gap-3">
                      {visualAssessments.slice(1).map((assessment) => (
                        <div key={assessment._id} className="flex gap-4 items-center p-3 rounded-xl bg-surface hover:bg-surface-dim border border-border-light transition-colors">
                          <img 
                            src={assessment.imageBase64} 
                            alt="thumb" 
                            className="w-14 h-14 object-cover rounded-lg shadow-sm"
                          />
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-text-primary">
                              Score: {assessment.visualConditionScore} ({assessment.ripenessStage})
                            </span>
                            <span className="text-xs font-medium text-text-muted mt-1 uppercase tracking-wider">{timeAgo(assessment.createdAt)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      <RescueActionModal />
    </div>
  );
};

export default BatchDetail;
