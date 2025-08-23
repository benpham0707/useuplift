// src/shared/errors/ProfileErrors.ts

export enum ErrorCode {
  // Profile Errors
  PROFILE_NOT_FOUND = 'PROFILE_NOT_FOUND',
  PROFILE_ALREADY_EXISTS = 'PROFILE_ALREADY_EXISTS',
  PROFILE_INVALID_STATE = 'PROFILE_INVALID_STATE',
  PROFILE_ARCHIVED = 'PROFILE_ARCHIVED',
  
  // Validation Errors
  VALIDATION_FAILED = 'VALIDATION_FAILED',
  INVALID_DATE_RANGE = 'INVALID_DATE_RANGE',
  DUPLICATE_ENTRY = 'DUPLICATE_ENTRY',
  BUSINESS_RULE_VIOLATION = 'BUSINESS_RULE_VIOLATION',
  
  // Data Errors
  INSUFFICIENT_DATA = 'INSUFFICIENT_DATA',
  DATA_INTEGRITY_ERROR = 'DATA_INTEGRITY_ERROR',
  INCOMPATIBLE_DATA_TYPE = 'INCOMPATIBLE_DATA_TYPE',
  
  // Permission Errors
  UNAUTHORIZED_ACCESS = 'UNAUTHORIZED_ACCESS',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  
  // Integration Errors
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  AI_SERVICE_ERROR = 'AI_SERVICE_ERROR',
  CACHE_ERROR = 'CACHE_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  
  // Business Logic Errors
  PROFILE_INCOMPLETE = 'PROFILE_INCOMPLETE',
  INVALID_STATE_TRANSITION = 'INVALID_STATE_TRANSITION',
  CONSTRAINT_VIOLATION = 'CONSTRAINT_VIOLATION',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED'
}

export abstract class BaseError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly context?: Record<string, any>;
  public readonly timestamp: Date;

  constructor(
    message: string,
    code: ErrorCode,
    statusCode: number,
    isOperational: boolean = true,
    context?: Record<string, any>
  ) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
    
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.context = context;
    this.timestamp = new Date();
    
    Error.captureStackTrace(this, this.constructor);
  }

  public toJSON(): Record<string, any> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      context: this.context,
      timestamp: this.timestamp,
      stack: this.stack
    };
  }
}

// Profile-specific Errors

export class ProfileNotFoundError extends BaseError {
  constructor(profileId: string, userId?: string) {
    super(
      `Profile not found: ${profileId}`,
      ErrorCode.PROFILE_NOT_FOUND,
      404,
      true,
      { profileId, userId }
    );
  }
}

export class ProfileAlreadyExistsError extends BaseError {
  constructor(userId: string) {
    super(
      `Profile already exists for user: ${userId}`,
      ErrorCode.PROFILE_ALREADY_EXISTS,
      409,
      true,
      { userId }
    );
  }
}

export class ProfileArchivedError extends BaseError {
  constructor(profileId: string, archivedAt: Date) {
    super(
      `Profile ${profileId} is archived and cannot be modified`,
      ErrorCode.PROFILE_ARCHIVED,
      403,
      true,
      { profileId, archivedAt }
    );
  }
}

// Validation Errors

export class ValidationError extends BaseError {
  public readonly validationErrors: Array<{
    field: string;
    message: string;
    value?: any;
  }>;

  constructor(errors: Array<{ field: string; message: string; value?: any }>) {
    const message = `Validation failed: ${errors.map(e => e.message).join(', ')}`;
    super(
      message,
      ErrorCode.VALIDATION_FAILED,
      400,
      true,
      { errors }
    );
    this.validationErrors = errors;
  }
}

export class DateRangeError extends BaseError {
  constructor(startDate: Date, endDate: Date, context: string) {
    super(
      `Invalid date range: end date (${endDate.toISOString()}) is before start date (${startDate.toISOString()}) for ${context}`,
      ErrorCode.INVALID_DATE_RANGE,
      400,
      true,
      { startDate, endDate, context }
    );
  }
}

export class DuplicateEntryError extends BaseError {
  constructor(entityType: string, duplicateField: string, value: string) {
    super(
      `Duplicate ${entityType} found: ${duplicateField} = ${value}`,
      ErrorCode.DUPLICATE_ENTRY,
      409,
      true,
      { entityType, duplicateField, value }
    );
  }
}

export class BusinessRuleViolationError extends BaseError {
  constructor(rule: string, violation: string, suggestion?: string) {
    super(
      `Business rule violation: ${violation}`,
      ErrorCode.BUSINESS_RULE_VIOLATION,
      422,
      true,
      { rule, violation, suggestion }
    );
  }
}

// Data Errors

export class InsufficientDataError extends BaseError {
  constructor(requiredData: string[], missingData: string[]) {
    super(
      `Insufficient data: missing ${missingData.join(', ')}`,
      ErrorCode.INSUFFICIENT_DATA,
      422,
      true,
      { requiredData, missingData }
    );
  }
}

export class DataIntegrityError extends BaseError {
  constructor(entity: string, issue: string, data?: any) {
    super(
      `Data integrity error in ${entity}: ${issue}`,
      ErrorCode.DATA_INTEGRITY_ERROR,
      500,
      false,
      { entity, issue, data }
    );
  }
}

// Permission Errors

export class UnauthorizedAccessError extends BaseError {
  constructor(resource: string, userId: string, action: string) {
    super(
      `Unauthorized access: User ${userId} cannot ${action} ${resource}`,
      ErrorCode.UNAUTHORIZED_ACCESS,
      403,
      true,
      { resource, userId, action }
    );
  }
}

export class RateLimitExceededError extends BaseError {
  constructor(limit: number, window: string, retryAfter: Date) {
    super(
      `Rate limit exceeded: ${limit} requests per ${window}`,
      ErrorCode.RATE_LIMIT_EXCEEDED,
      429,
      true,
      { limit, window, retryAfter }
    );
  }
}

// Integration Errors

export class ExternalServiceError extends BaseError {
  constructor(service: string, originalError: Error, retryable: boolean = true) {
    super(
      `External service error: ${service} - ${originalError.message}`,
      ErrorCode.EXTERNAL_SERVICE_ERROR,
      503,
      true,
      { service, originalError: originalError.message, retryable }
    );
  }
}

export class AIServiceError extends BaseError {
  constructor(operation: string, model: string, error: string) {
    super(
      `AI service error during ${operation}: ${error}`,
      ErrorCode.AI_SERVICE_ERROR,
      503,
      true,
      { operation, model, error }
    );
  }
}

export class CacheError extends BaseError {
  constructor(operation: string, key: string, error: Error) {
    super(
      `Cache ${operation} failed for key ${key}: ${error.message}`,
      ErrorCode.CACHE_ERROR,
      503,
      true,
      { operation, key, originalError: error.message }
    );
  }
}

export class DatabaseError extends BaseError {
  constructor(operation: string, entity: string, error: Error) {
    super(
      `Database ${operation} failed for ${entity}: ${error.message}`,
      ErrorCode.DATABASE_ERROR,
      503,
      false,
      { operation, entity, originalError: error.message }
    );
  }
}

// Business Logic Errors

export class ProfileIncompleteError extends BaseError {
  constructor(profileId: string, missingComponents: string[], requiredFor: string) {
    super(
      `Profile incomplete for ${requiredFor}: missing ${missingComponents.join(', ')}`,
      ErrorCode.PROFILE_INCOMPLETE,
      422,
      true,
      { profileId, missingComponents, requiredFor }
    );
  }
}

export class InvalidStateTransitionError extends BaseError {
  constructor(entity: string, currentState: string, attemptedState: string, allowedStates: string[]) {
    super(
      `Invalid state transition for ${entity}: cannot transition from ${currentState} to ${attemptedState}`,
      ErrorCode.INVALID_STATE_TRANSITION,
      422,
      true,
      { entity, currentState, attemptedState, allowedStates }
    );
  }
}

// Error Handler Utility

export class ErrorHandler {
  public static handle(error: Error): BaseError {
    // If it's already our error, return it
    if (error instanceof BaseError) {
      return error;
    }

    // Handle known error patterns
    if (error.message.includes('ECONNREFUSED')) {
      return new ExternalServiceError('Database', error);
    }

    if (error.message.includes('duplicate key')) {
      return new DuplicateEntryError('Unknown', 'Unknown', error.message);
    }

    // Default to generic error
    return new BaseError(
      error.message,
      ErrorCode.DATABASE_ERROR,
      500,
      false,
      { originalError: error.message }
    );
  }

  public static isOperational(error: Error): boolean {
    if (error instanceof BaseError) {
      return error.isOperational;
    }
    return false;
  }

  public static logError(error: BaseError, logger: any): void {
    const logData = {
      code: error.code,
      message: error.message,
      context: error.context,
      stack: error.stack,
      timestamp: error.timestamp
    };

    if (error.isOperational) {
      logger.warn('Operational error occurred', logData);
    } else {
      logger.error('System error occurred', logData);
    }
  }
}