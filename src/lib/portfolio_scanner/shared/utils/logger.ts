// src/shared/utils/logger.ts

import { injectable } from 'inversify';
import winston from 'winston';
import { ElasticsearchTransport } from 'winston-elasticsearch';

export interface LogContext {
  [key: string]: any;
}

@injectable()
export class Logger {
  private logger: winston.Logger;
  private readonly serviceName: string;
  private readonly environment: string;

  constructor() {
    this.serviceName = process.env.SERVICE_NAME || 'portfolio-scanner';
    this.environment = process.env.NODE_ENV || 'development';
    this.logger = this.createLogger();
  }

  // Logging Methods

  public debug(message: string, context?: LogContext): void {
    this.logger.debug(message, this.enrichContext(context));
  }

  public info(message: string, context?: LogContext): void {
    this.logger.info(message, this.enrichContext(context));
  }

  public warn(message: string, context?: LogContext): void {
    this.logger.warn(message, this.enrichContext(context));
  }

  public error(message: string, context?: LogContext): void {
    this.logger.error(message, this.enrichContext(context));
  }

  public fatal(message: string, context?: LogContext): void {
    this.logger.error(message, { ...this.enrichContext(context), level: 'fatal' });
  }

  // Specialized Logging

  public logPerformance(operation: string, duration: number, context?: LogContext): void {
    this.info('Performance metric', {
      ...context,
      operation,
      duration,
      durationUnit: 'ms',
      type: 'performance'
    });
  }

  public logApiCall(
    method: string,
    path: string,
    statusCode: number,
    duration: number,
    context?: LogContext
  ): void {
    const level = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';
    
    this.logger.log(level, 'API request', {
      ...this.enrichContext(context),
      method,
      path,
      statusCode,
      duration,
      type: 'api'
    });
  }

  public logDatabaseQuery(
    operation: string,
    collection: string,
    duration: number,
    context?: LogContext
  ): void {
    this.debug('Database query', {
      ...context,
      operation,
      collection,
      duration,
      type: 'database'
    });
  }

  public logSecurityEvent(
    event: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    context?: LogContext
  ): void {
    const level = severity === 'critical' || severity === 'high' ? 'error' : 'warn';
    
    this.logger.log(level, 'Security event', {
      ...this.enrichContext(context),
      securityEvent: event,
      severity,
      type: 'security'
    });
  }

  // Child Logger

  public child(context: LogContext): Logger {
    const childLogger = Object.create(this);
    childLogger.defaultContext = { ...this.defaultContext, ...context };
    return childLogger;
  }

  // Private Methods

  private createLogger(): winston.Logger {
    const transports: winston.transport[] = [];

    // Console transport
    if (this.environment !== 'test') {
      transports.push(new winston.transports.Console({
        format: this.environment === 'development' 
          ? winston.format.combine(
              winston.format.colorize(),
              winston.format.simple()
            )
          : winston.format.json()
      }));
    }

    // File transport for errors
    if (this.environment === 'production') {
      transports.push(new winston.transports.File({
        filename: 'logs/error.log',
        level: 'error',
        maxsize: 10485760, // 10MB
        maxFiles: 5
      }));
    }

    // Elasticsearch transport for production
    if (process.env.ELASTICSEARCH_URL) {
      transports.push(new ElasticsearchTransport({
        level: 'info',
        clientOpts: { node: process.env.ELASTICSEARCH_URL },
        index: `logs-${this.serviceName}`,
        dataStream: true
      }));
    }

    return winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      defaultMeta: {
        service: this.serviceName,
        environment: this.environment
      },
      transports
    });
  }

  private enrichContext(context?: LogContext): LogContext {
    return {
      timestamp: new Date().toISOString(),
      pid: process.pid,
      ...this.defaultContext,
      ...context
    };
  }

  private defaultContext: LogContext = {};
}

// src/shared/utils/performance.ts

import { injectable, inject } from 'inversify';
import { Logger } from './logger';

interface PerformanceMetric {
  operation: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  metadata?: Record<string, any>;
}

@injectable()
export class PerformanceMonitor {
  private readonly metrics: Map<string, PerformanceMetric> = new Map();
  private readonly thresholds: Map<string, number> = new Map();

  constructor(
    @inject(Logger) private logger: Logger
  ) {
    this.initializeThresholds();
  }

  public startTimer(operation: string, metadata?: Record<string, any>): PerformanceTimer {
    const metric: PerformanceMetric = {
      operation,
      startTime: Date.now(),
      metadata
    };

    const timerId = `${operation}_${Date.now()}_${Math.random()}`;
    this.metrics.set(timerId, metric);

    return new PerformanceTimer(timerId, this);
  }

  public endTimer(timerId: string, metadata?: Record<string, any>): void {
    const metric = this.metrics.get(timerId);
    if (!metric) {
      this.logger.warn('Timer not found', { timerId });
      return;
    }

    metric.endTime = Date.now();
    metric.duration = metric.endTime - metric.startTime;
    metric.metadata = { ...metric.metadata, ...metadata };

    // Log the metric
    this.logger.logPerformance(metric.operation, metric.duration, metric.metadata);

    // Check threshold
    this.checkThreshold(metric);

    // Clean up
    this.metrics.delete(timerId);
  }

  public async measure<T>(
    operation: string,
    fn: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> {
    const timer = this.startTimer(operation, metadata);
    
    try {
      const result = await fn();
      timer.end({ success: true });
      return result;
    } catch (error) {
      timer.end({ success: false, error: error.message });
      throw error;
    }
  }

  public setThreshold(operation: string, thresholdMs: number): void {
    this.thresholds.set(operation, thresholdMs);
  }

  private checkThreshold(metric: PerformanceMetric): void {
    const threshold = this.thresholds.get(metric.operation);
    
    if (threshold && metric.duration! > threshold) {
      this.logger.warn('Performance threshold exceeded', {
        operation: metric.operation,
        duration: metric.duration,
        threshold,
        exceeded: metric.duration! - threshold
      });
    }
  }

  private initializeThresholds(): void {
    this.thresholds.set('createProfile', 1000);
    this.thresholds.set('getProfile', 100);
    this.thresholds.set('analyzeProfile', 5000);
    this.thresholds.set('extractSkills', 2000);
  }
}

export class PerformanceTimer {
  constructor(
    private timerId: string,
    private monitor: PerformanceMonitor
  ) {}

  public end(metadata?: Record<string, any>): void {
    this.monitor.endTimer(this.timerId, metadata);
  }
}

// src/shared/utils/transformers.ts

export class DataTransformers {
  // Date Transformers
  
  public static toISOString(date: Date | string | null): string | null {
    if (!date) return null;
    
    if (typeof date === 'string') {
      return new Date(date).toISOString();
    }
    
    return date.toISOString();
  }

  public static fromISOString(dateString: string | null): Date | null {
    if (!dateString) return null;
    return new Date(dateString);
  }

  // String Transformers

  public static sanitizeString(input: string): string {
    return input
      .trim()
      .replace(/[<>]/g, '') // Remove potential HTML
      .replace(/\s+/g, ' ') // Normalize whitespace
      .substring(0, 10000); // Prevent extremely long strings
  }

  public static toSlug(input: string): string {
    return input
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  public static truncate(input: string, maxLength: number, suffix: string = '...'): string {
    if (input.length <= maxLength) return input;
    return input.substring(0, maxLength - suffix.length) + suffix;
  }

  // Array Transformers

  public static unique<T>(array: T[]): T[] {
    return [...new Set(array)];
  }

  public static groupBy<T>(array: T[], key: keyof T): Map<any, T[]> {
    return array.reduce((map, item) => {
      const groupKey = item[key];
      if (!map.has(groupKey)) {
        map.set(groupKey, []);
      }
      map.get(groupKey)!.push(item);
      return map;
    }, new Map<any, T[]>());
  }

  public static chunk<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  // Object Transformers

  public static pick<T, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
    const result = {} as Pick<T, K>;
    keys.forEach(key => {
      if (key in obj) {
        result[key] = obj[key];
      }
    });
    return result;
  }

  public static omit<T, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> {
    const result = { ...obj };
    keys.forEach(key => {
      delete result[key];
    });
    return result as Omit<T, K>;
  }

  public static deepClone<T>(obj: T): T {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj.getTime()) as any;
    if (obj instanceof Array) return obj.map(item => this.deepClone(item)) as any;
    
    const clonedObj = {} as T;
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = this.deepClone(obj[key]);
      }
    }
    return clonedObj;
  }

  // Validation Helpers

  public static isEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  public static isURL(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  public static isUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }
}

// src/shared/utils/sanitizers.ts

export class DataSanitizers {
  // Input Sanitization

  public static sanitizeUserInput(input: any): any {
    if (typeof input === 'string') {
      return this.sanitizeString(input);
    }
    
    if (Array.isArray(input)) {
      return input.map(item => this.sanitizeUserInput(item));
    }
    
    if (input && typeof input === 'object') {
      const sanitized: any = {};
      for (const key in input) {
        if (input.hasOwnProperty(key)) {
          sanitized[key] = this.sanitizeUserInput(input[key]);
        }
      }
      return sanitized;
    }
    
    return input;
  }

  private static sanitizeString(input: string): string {
    return input
      .replace(/[<>\"']/g, '') // Remove potential XSS characters
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+\s*=/gi, '') // Remove event handlers
      .trim();
  }

  // SQL Injection Prevention

  public static sanitizeForSQL(input: string): string {
    return input
      .replace(/['";\\]/g, '') // Remove SQL special characters
      .replace(/--/g, '') // Remove SQL comments
      .replace(/\/\*/g, '') // Remove SQL block comments
      .replace(/\*\//g, '');
  }

  // File Name Sanitization

  public static sanitizeFileName(fileName: string): string {
    return fileName
      .replace(/[^a-zA-Z0-9.-]/g, '_') // Replace invalid characters
      .replace(/\.{2,}/g, '.') // Remove multiple dots
      .substring(0, 255); // Limit length
  }

  // Privacy Sanitization

  public static redactSensitiveData(data: any, fieldsToRedact: string[]): any {
    const redacted = DataTransformers.deepClone(data);
    
    const redactField = (obj: any, field: string) => {
      if (obj && typeof obj === 'object') {
        for (const key in obj) {
          if (key === field) {
            obj[key] = '[REDACTED]';
          } else if (typeof obj[key] === 'object') {
            redactField(obj[key], field);
          }
        }
      }
    };
    
    fieldsToRedact.forEach(field => redactField(redacted, field));
    
    return redacted;
  }
}

// src/infrastructure/config/ConfigService.ts

import { injectable } from 'inversify';
import dotenv from 'dotenv';
import { z } from 'zod';

// Configuration Schema
const configSchema = z.object({
  // Application
  NODE_ENV: z.enum(['development', 'test', 'staging', 'production']),
  PORT: z.string().transform(Number).default('3000'),
  SERVICE_NAME: z.string().default('portfolio-scanner'),
  
  // Database
  DATABASE_URL: z.string(),
  DATABASE_POOL_SIZE: z.string().transform(Number).default('10'),
  
  // Redis
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.string().transform(Number).default('6379'),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_DB: z.string().transform(Number).default('0'),
  
  // Security
  JWT_SECRET: z.string(),
  ENCRYPTION_KEY: z.string(),
  
  // External Services
  AI_API_KEY: z.string(),
  AI_API_URL: z.string(),
  
  // Feature Flags
  ENABLE_BIAS_DETECTION: z.string().transform(v => v === 'true').default('true'),
  ENABLE_SIDE_HUSTLE_ANALYSIS: z.string().transform(v => v === 'true').default('true'),
  
  // Performance
  CACHE_TTL_SECONDS: z.string().transform(Number).default('3600'),
  MAX_CONCURRENT_REQUESTS: z.string().transform(Number).default('100'),
});

type Config = z.infer<typeof configSchema>;

@injectable()
export class ConfigService {
  private config: Config;

  constructor() {
    // Load environment variables
    dotenv.config();
    
    // Validate and parse configuration
    try {
      this.config = configSchema.parse(process.env);
    } catch (error) {
      console.error('Configuration validation failed:', error);
      throw new Error('Invalid configuration');
    }
  }

  public get<K extends keyof Config>(key: K): Config[K];
  public get<T = string>(key: string, defaultValue?: T): T;
  public get(key: string, defaultValue?: any): any {
    const value = this.config[key as keyof Config] ?? process.env[key] ?? defaultValue;
    
    if (value === undefined) {
      throw new Error(`Configuration key "${key}" not found`);
    }
    
    return value;
  }

  public getAll(): Readonly<Config> {
    return Object.freeze({ ...this.config });
  }

  public isProduction(): boolean {
    return this.config.NODE_ENV === 'production';
  }

  public isDevelopment(): boolean {
    return this.config.NODE_ENV === 'development';
  }

  public isTest(): boolean {
    return this.config.NODE_ENV === 'test';
  }

  // Feature Flags

  public isFeatureEnabled(feature: string): boolean {
    const key = `ENABLE_${feature.toUpperCase().replace(/-/g, '_')}`;
    const value = process.env[key];
    return value === 'true';
  }

  // Secrets Management

  public getSecret(key: string): string {
    const value = process.env[key];
    
    if (!value) {
      throw new Error(`Secret "${key}" not found`);
    }
    
    return value;
  }
}

// Export all utilities
export { DataTransformers, DataSanitizers };