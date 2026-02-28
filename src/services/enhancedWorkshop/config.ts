/**
 * Enhanced Workshop Configuration
 *
 * Feature flag management for the enhanced workshop system.
 * Kill switch: set ENABLE_ENHANCED_WORKSHOP=false (or unset) to disable all routes.
 */

export const enhancedWorkshopConfig = {
  /** Whether the enhanced workshop routes are enabled */
  isEnabled: (): boolean => process.env.ENABLE_ENHANCED_WORKSHOP === 'true',
};
