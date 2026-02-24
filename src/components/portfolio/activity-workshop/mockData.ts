// @ts-nocheck
/**
 * Mock data for the Activity Workshop frontend.
 *
 * Uses the REAL ActivityWorkshopPipelineResult type from the backend pipeline.
 * Replace with real API data when the pipeline endpoint is wired up.
 *
 * NOTE: The large MOCK_DATA payload has been moved to mockDataPayload.ts
 * for code-splitting / dynamic import.
 */

import type { ActivityWorkshopPipelineResult } from '../../../services/portfolioStrategy/services/activityWorkshop/types';

// Re-export the real type so other components can import from here
export type { ActivityWorkshopPipelineResult };

// Activity title lookup for display purposes
export const activityTitles: Record<string, string> = {
  'research': 'ML Healthcare Research',
  'cs-club': 'CS Club Founder & President',
};
