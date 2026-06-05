import { Request, Response, NextFunction } from 'express';
import { CartServiceError } from './cartService';

export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly errorCode: string,
    public readonly message: string,
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
  }
}

// Custom error for Redis connection issues
export class RedisConnectionError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(503, 'SERVICE_UNAVAILABLE', message, details);
  }
}

export function createError(
  statusCode: number,
  errorCode: string,
  message: string,
  details?: Record<string, unknown>
): AppError {
  return new AppError(statusCode, errorCode, message, details);
}

export function handleError(err: Error, res: Response): void {
  let error: AppError;

  if (err instanceof AppError) {
    error = err;
  } else if (err instanceof CartServiceError) {
    error = new AppError(err.statusCode, err.errorCode, err.message, err.details);
  } else {
    error = new AppError(500, 'INTERNAL_ERROR', err.message || 'Internal server error');
  }

  console.error(`[${error.errorCode}] ${error.message}`, error.details);

  res.status(error.statusCode).json({
    error: {
      code: error.errorCode,
      message: error.message,
      details: error.details
    }
  });
}

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  handleError(err, res);
}
