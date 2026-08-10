import React, { useState, useRef } from 'react';
import { Upload, AlertTriangle, Image as ImageIcon, Camera } from 'lucide-react';
import { fetchApi } from '../services/api';
import { useToast } from '../components/ui/Toast';

const CheckFreshness = () => {
  const toast = useToast();
  const fileInputRef = useRef(null);
  
  const [uploading, setUploading] = useState(false);
  const [assessment, setAssessment] = useState(null);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.mimetype?.startsWith('image/') && !file.type.startsWith('image/')) {
      toast.error("Please upload a valid image file.");
      return;
    }

    setUploading(true);
    setAssessment(null);
    try {
      const formData = new FormData();
      formData.append('image', file);

      // We do not provide batchId or productHint for a general assessment
      const uploadResult = await fetchApi('/vision/assess', {
        method: 'POST',
        body: formData
      });

      // Assuming the backend returns the assessment object directly when no mismatch is flagged
      setAssessment(uploadResult);
      toast.success("Image analyzed successfully.");
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

  return (
    <div className="flex flex-col gap-6 pb-12 h-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-headline-page text-text-primary flex items-center gap-3">
            <Camera className="text-primary" size={32} />
            Check Freshness
          </h1>
          <p className="text-text-secondary font-medium tracking-wide">Upload an image to check the freshness of any produce</p>
        </div>
      </div>

      <div className="bg-surface rounded-[24px] shadow-sm p-6 border border-border-light/50 max-w-3xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-headline-section text-text-primary">General Visual Assessment</h2>
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 px-6 py-2.5 bg-primary hover:bg-primary-container text-sm font-bold text-white shadow-sm rounded-full transition-colors disabled:opacity-50"
          >
            <Upload size={18} />
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

        {uploading ? (
           <div className="py-24 flex flex-col items-center justify-center text-text-secondary">
             <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
             <p className="font-medium text-lg">Analyzing photo with AI...</p>
           </div>
        ) : !assessment ? (
          <div className="py-20 flex flex-col items-center justify-center text-center text-text-secondary border-2 border-dashed border-border-light rounded-2xl bg-surface-container-low/50 gap-4">
            <ImageIcon size={48} className="text-text-muted" />
            <div>
              <p className="font-bold text-text-primary mb-1">No photo uploaded</p>
              <p className="text-sm">Upload an image of any fruit or vegetable to instantly check its freshness.</p>
            </div>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="mt-2 px-6 py-2 bg-surface hover:bg-surface-dim text-sm font-bold text-text-primary border border-border-light shadow-sm rounded-full transition-colors"
            >
              Upload Now
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            <div className="aspect-video w-full rounded-2xl overflow-hidden bg-surface-dim border border-border-light shadow-inner">
              <img 
                src={assessment.imageBase64} 
                alt="Produce assessment" 
                className="w-full h-full object-contain bg-black/5"
              />
            </div>
            
            <div className="bg-gradient-to-r from-primary/10 to-transparent p-5 rounded-xl border border-primary/20 flex items-center justify-between">
              <div>
                <span className="text-[11px] uppercase tracking-widest text-primary font-bold block mb-1">Identified Produce</span>
                <span className="text-2xl font-bold text-text-primary capitalize">{assessment.productHint || assessment.identifiedProduceType || 'Unknown'}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-surface-container-low p-5 rounded-xl border border-border-light">
                <span className="text-[11px] uppercase tracking-widest text-text-secondary font-bold block mb-1">Condition Score</span>
                <span className="text-3xl font-bold text-text-primary">{assessment.visualConditionScore}/100</span>
              </div>
              <div className="bg-surface-container-low p-5 rounded-xl border border-border-light">
                <span className="text-[11px] uppercase tracking-widest text-text-secondary font-bold block mb-1">Ripeness Stage</span>
                <span className="text-3xl font-bold text-text-primary capitalize">{assessment.ripenessStage}</span>
              </div>
            </div>

            <div className="bg-surface-container-low p-5 rounded-xl border border-border-light text-sm">
              <span className="text-[11px] uppercase tracking-widest text-text-secondary font-bold block mb-2">Defects Detected</span>
              {assessment.defectsDetected && assessment.defectsDetected.length > 0 ? (
                <ul className="list-disc pl-5 text-text-primary font-medium space-y-1">
                  {assessment.defectsDetected.map((d, i) => (
                    <li key={i}>{d}</li>
                  ))}
                </ul>
              ) : (
                <span className="text-text-primary font-medium">None detected</span>
              )}
            </div>

            <div className="bg-gradient-to-br from-[#DCEBFB]/30 to-[#C7DFF8]/30 p-5 rounded-xl border border-info-blue/10 text-sm">
              <span className="text-[11px] uppercase tracking-widest text-info-blue font-bold block mb-2 flex items-center gap-1"><ImageIcon size={14}/> AI Rationale</span>
              <p className="text-text-primary italic font-medium leading-relaxed text-base">"{assessment.modelRationale}"</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CheckFreshness;
