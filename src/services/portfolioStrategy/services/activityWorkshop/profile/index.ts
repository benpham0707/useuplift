/**
 * Activity Profile Module
 *
 * Exports types and services for managing rich activity profiles
 * that capture the full depth of student experiences.
 *
 * COMPONENTS:
 * - Types: ActivityProfile structure with 5 major sections
 * - ActivityProfileService: Profile lifecycle and completeness management
 * - ProfileDescriptionGenerator: Generate optimized descriptions from profiles
 */

// Types
export * from './types';

// Profile Service
export { ActivityProfileService, activityProfileService } from './activityProfileService';

// Description Generator
export {
  ProfileDescriptionGenerator,
  profileDescriptionGenerator,
  type DescriptionGenerationInput,
  type GeneratedDescription,
  type DescriptionGenerationResult,
} from './profileDescriptionGenerator';
