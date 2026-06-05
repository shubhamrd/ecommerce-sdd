import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

const AddItemSchema = z.object({
  userId: z.string().min(1),
  sessionId: z.string().min(1),
  itemId: z.string().min(1),
  quantity: z.number().int().min(1).max(999),
  price: z.number().min(0),
  name: z.string().min(1)
});

const UpdateItemSchema = z.object({
  userId: z.string().min(1),
  sessionId: z.string().min(1),
  itemId: z.string().min(1),
  quantity: z.number().int().min(1).max(999),
  price: z.number().min(0),
  name: z.string().min(1)
});

const RemoveItemSchema = z.object({
  userId: z.string().min(1),
  sessionId: z.string().min(1),
  itemId: z.string().min(1)
});

const ClearCartSchema = z.object({
  userId: z.string().min(1),
  sessionId: z.string().min(1)
});

export function validateAddItem(req: Request, res: Response, next: NextFunction): void {
  try {
    AddItemSchema.parse(req.body);
    next();
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request body',
          details: err.errors
        }
      });
    } else {
      next(err);
    }
  }
}

export function validateUpdateItem(req: Request, res: Response, next: NextFunction): void {
  try {
    UpdateItemSchema.parse(req.body);
    next();
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request body',
          details: err.errors
        }
      });
    } else {
      next(err);
    }
  }
}

export function validateRemoveItem(req: Request, res: Response, next: NextFunction): void {
  try {
    RemoveItemSchema.parse(req.body);
    next();
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request body',
          details: err.errors
        }
      });
    } else {
      next(err);
    }
  }
}

export function validateClearCart(req: Request, res: Response, next: NextFunction): void {
  try {
    ClearCartSchema.parse(req.body);
    next();
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request body',
          details: err.errors
        }
      });
    } else {
      next(err);
    }
  }
}
