/**
 * Activity Profile Chat Module
 *
 * Conversational system for extracting rich activity information
 * from students through natural dialogue.
 *
 * EXPORTS:
 * - Types: All conversation and extraction types
 * - Services: Chat service, question generator, response extractor, conversation manager
 *
 * USAGE:
 * ```typescript
 * import { activityProfileChatService, ConversationState } from './chat';
 *
 * // Start a conversation
 * const result = await activityProfileChatService.startConversation({
 *   activityId: 'act-123',
 *   activityTitle: 'Math Tutoring Club',
 *   trigger: 'user_initiated',
 * });
 *
 * // Process responses
 * const response = await activityProfileChatService.processUserResponse({
 *   state: result.state,
 *   response: 'I started the club in 10th grade...',
 * });
 * ```
 */

// Types
export * from './types';

// Services
export { ActivityProfileChatService, activityProfileChatService } from './activityProfileChatService';
export { QuestionGeneratorService, questionGeneratorService } from './questionGenerator';
export { ResponseExtractorService, responseExtractorService } from './responseExtractor';
export { ConversationManager, conversationManager } from './conversationManager';
export { ChatPersistenceService, chatPersistenceService } from './chatPersistenceService';
export type { ConversationListItem } from './chatPersistenceService';
