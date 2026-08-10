import express from 'express';
import multer from 'multer';
import VisualAssessment from '../models/VisualAssessment.js';
import Batch from '../models/Batch.js';
import { gradeProduceImage } from '../services/visionGradingService.js';
import { logAgentActivity } from '../services/activityLogger.js';

const router = express.Router();
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only images are allowed'));
    }
  }
});

// POST /api/vision/assess
router.post('/vision/assess', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image uploaded' });
    }

    const { productHint, batchId } = req.body;
    const base64Data = req.file.buffer.toString('base64');
    const mimeType = req.file.mimetype;

    // Call Gemini
    const result = await gradeProduceImage(base64Data, mimeType, productHint);

    // Save Assessment
    const assessment = new VisualAssessment({
      batchRef: batchId || undefined,
      imageBase64: `data:${mimeType};base64,${base64Data}`,
      productHint,
      ripenessStage: result.ripenessStage,
      defectsDetected: result.defectsDetected,
      visualConditionScore: result.visualConditionScore,
      confidencePct: result.confidencePct,
      modelRationale: result.modelRationale,
      mismatchFlagged: result.productMatchesHint === false
    });
    
    await assessment.save();

    if (result.productMatchesHint === false) {
      logAgentActivity({
        agentType: 'vision',
        action: 'Flagged produce mismatch',
        batchId: batchId || null,
        summary: `Vision graded image as ${result.identifiedProduceType}, conflicting with batch hint (${productHint})`
      });

      return res.status(200).json({
        mismatch: true,
        identifiedProduceType: result.identifiedProduceType,
        message: `This photo looks like ${result.identifiedProduceType}, but this batch is ${productHint}. Please upload a photo of the correct produce.`
      });
    }

    logAgentActivity({
      agentType: 'vision',
      action: 'Graded produce image',
      batchId: batchId || null,
      summary: `Graded image as ${result.ripenessStage} with ${result.visualConditionScore}/100 condition (Confidence: ${result.confidencePct}%)`
    });

    res.status(201).json(assessment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/vision/batches/:id/visual-assessments
// (Wait, the instructions say GET /api/batches/:id/visual-assessments. So this should ideally be in batchRoutes or api.js directly, but I will put it here and mount appropriately)
router.get('/batches/:id/visual-assessments', async (req, res) => {
  try {
    const { id } = req.params;
    const assessments = await VisualAssessment.find({ batchRef: id }).sort({ createdAt: -1 });
    res.json(assessments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
