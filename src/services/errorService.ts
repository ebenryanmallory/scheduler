/**
 * ErrorService - Centralized error handling and logging
 * 
 * Implements AC6: Console logging in development
 * Implements AC7: Error logging service for production
 * Implements AC9: Actionable error messages
 */

export type ErrorCode = 
  | 'NETWORK_ERROR'
  | 'TIMEOUT'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'SERVER_ERROR'
  | 'RATE_LIMITED'
  | 'VALIDATION_ERROR'
  | 'UNKNOWN';

export interface AppError {
  code: ErrorCode;
  message: string;
  userMessage: string;
  originalError?: unknown;
  context?: Record<string, unknown>;
  timestamp: Date;
  retryable: boolean;
}

// User-friendly error messages (AC9: Actionable error messages)
const ERROR_MESSAGES: Record<ErrorCode, string> = {
  NETWORK_ERROR: 'Unable to connect. Please check your internet connection.',
  TIMEOUT: 'Request timed out. Please try again.',
  UNAUTHORIZED: 'Your session has expired. Please refresh the page.',
  FORBIDDEN: "You don't have permission to perform this action.",
  NOT_FOUND: 'This item could not be found. It may have been deleted.',
  SERVER_ERROR: 'Server error. Please try again later.',
  RATE_LIMITED: 'Too many requests. Please wait a moment and try again.',
  VALIDATION_ERROR: 'Invalid data. Please check your input and try again.',
  UNKNOWN: 'Something went wrong. Please try again.',
};

// Determine if error is retryable
const RETRYABLE_ERRORS: ErrorCode[] = ['NETWORK_ERROR', 'TIMEOUT', 'SERVER_ERROR'];

const isDevelopment = import.meta.env.DEV;

/**
 * Maps HTTP status codes and error types to ErrorCode
 */
function getErrorCode(error: unknown): ErrorCode {
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return 'NETWORK_ERROR';
  }

  if (error instanceof DOMException && error.name === 'AbortError') {
    return 'TIMEOUT';
  }

  if (error instanceof Response || (error && typeof error === 'object' && 'status' in error)) {
    const status = (error as { status: number }).status;
    switch (status) {
      case 401: return 'UNAUTHORIZED';
      case 403: return 'FORBIDDEN';
      case 404: return 'NOT_FOUND';
      case 429: return 'RATE_LIMITED';
      case 400:
      case 422: return 'VALIDATION_ERROR';
      default:
        if (status >= 500) return 'SERVER_ERROR';
    }
  }

  return 'UNKNOWN';
}

/**
 * Creates a standardized AppError from any error
 */
export function createAppError(
  error: unknown,
  context?: Record<string, unknown>
): AppError {
  const code = getErrorCode(error);
  const originalMessage = error instanceof Error ? error.message : String(error);

  return {
    code,
    message: originalMessage,
    userMessage: ERROR_MESSAGES[code],
    originalError: error,
    context,
    timestamp: new Date(),
    retryable: RETRYABLE_ERRORS.includes(code),
  };
}

/**
 * Logs error to appropriate destination based on environment
 * AC6: Console logging in development
 * AC7: Production error tracking (prepared for external service)
 */
export function logError(appError: AppError): void {
  if (isDevelopment) {
    // AC6: Full details in development
    console.group(`🔴 Error: ${appError.code}`);
    console.error('User Message:', appError.userMessage);
    console.error('Technical Message:', appError.message);
    console.error('Context:', appError.context);
    console.error('Timestamp:', appError.timestamp.toISOString());
    console.error('Retryable:', appError.retryable);
    if (appError.originalError instanceof Error) {
      console.error('Stack:', appError.originalError.stack);
    }
    console.groupEnd();
  } else {
    // AC7: Production logging - prepared for external service integration
    // In production, we'd send to Sentry, LogRocket, etc.
    // For now, log minimal info without exposing internals
    const payload = {
      code: appError.code,
      message: appError.message,
      context: appError.context,
      timestamp: appError.timestamp.toISOString(),
    };
    
    // Future: Send to external error tracking service
    // Example: Sentry.captureException(appError.originalError, { extra: payload });
    
    // For now, silent in production (no console spam)
    // But store for potential batch upload
    if (typeof window !== 'undefined') {
      const errors = JSON.parse(sessionStorage.getItem('app_errors') || '[]');
      errors.push(payload);
      // Keep last 50 errors
      if (errors.length > 50) errors.shift();
      sessionStorage.setItem('app_errors', JSON.stringify(errors));
    }
  }
}

/**
 * Main error handling function - creates and logs error
 */
export function handleError(
  error: unknown,
  context?: Record<string, unknown>
): AppError {
  const appError = createAppError(error, context);
  logError(appError);
  return appError;
}

/**
 * Gets user-friendly message for display
 */
export function getUserMessage(error: unknown): string {
  if ((error as AppError)?.userMessage) {
    return (error as AppError).userMessage;
  }
  const appError = createAppError(error);
  return appError.userMessage;
}

/**
 * Check if error is retryable
 */
export function isRetryableError(error: unknown): boolean {
  if ((error as AppError)?.retryable !== undefined) {
    return (error as AppError).retryable;
  }
  const code = getErrorCode(error);
  return RETRYABLE_ERRORS.includes(code);
}

export const errorService = {
  handleError,
  createAppError,
  logError,
  getUserMessage,
  isRetryableError,
};

