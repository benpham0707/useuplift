/**
 * Annotation Pipeline API Routes
 *
 * 4 endpoints for the unified annotation pipeline:
 * - POST /analyze — full annotation pipeline (Phases 1-4)
 * - POST /deep-dive — on-demand deep dive for one annotation
 * - POST /reanalyze — re-analysis after text edits
 * - POST /batch-activities — batch activity description analysis
 */

import { Router } from 'express';
import { requireAuth } from './middleware/auth';
import { annotationPipeline } from '../pipeline/annotationPipeline';
import { deepDiveService } from '../pipeline/deepDiveService';
import { reanalysisService } from '../pipeline/reanalysisService';
import { batchActivityPipeline } from '../pipeline/batchActivityPipeline';
import type {
  AnalyzeRequest,
  DeepDiveRequest,
  ReanalyzeRequest,
  BatchActivitiesRequest,
} from '../pipeline/types';

const annotationRouter = Router();

// POST /analyze — Run full annotation pipeline (Phases 1-4)
annotationRouter.post('/analyze', requireAuth, async (req, res) => {
  try {
    const { text, config } = req.body as AnalyzeRequest;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({ success: false, error: 'text is required and must be a string' });
    }
    if (!config?.essayType) {
      return res.status(400).json({ success: false, error: 'config.essayType is required' });
    }

    const result = await annotationPipeline.analyze(text, config);
    return res.json({ success: true, data: result });
  } catch (error) {
    console.error('[AnnotationRoutes] analyze error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// POST /deep-dive — On-demand deep dive for a specific annotation
annotationRouter.post('/deep-dive', requireAuth, async (req, res) => {
  try {
    const { annotation, essayText, essayType } = req.body as DeepDiveRequest;

    if (!annotation || !essayText || !essayType) {
      return res.status(400).json({
        success: false,
        error: 'annotation, essayText, and essayType are required',
      });
    }

    const result = await deepDiveService.deepDive(annotation, essayText, essayType);
    return res.json({ success: true, data: result });
  } catch (error) {
    console.error('[AnnotationRoutes] deep-dive error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// POST /reanalyze — Re-analysis after text edit
annotationRouter.post('/reanalyze', requireAuth, async (req, res) => {
  try {
    const { analysisId, newText, previousResult } = req.body as ReanalyzeRequest;

    if (!analysisId || !newText || !previousResult) {
      return res.status(400).json({
        success: false,
        error: 'analysisId, newText, and previousResult are required',
      });
    }

    const result = await reanalysisService.reanalyze({
      analysisId,
      newText,
      previousResult,
    });
    return res.json({ success: true, data: result });
  } catch (error) {
    console.error('[AnnotationRoutes] reanalyze error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// POST /batch-activities — Batch activity description analysis
annotationRouter.post('/batch-activities', requireAuth, async (req, res) => {
  try {
    const { config } = req.body as BatchActivitiesRequest;

    if (!config?.activities || !Array.isArray(config.activities) || config.activities.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'config.activities array is required and must not be empty',
      });
    }

    const result = await batchActivityPipeline.analyzeBatch(config);
    return res.json({ success: true, data: result });
  } catch (error) {
    console.error('[AnnotationRoutes] batch-activities error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default annotationRouter;
