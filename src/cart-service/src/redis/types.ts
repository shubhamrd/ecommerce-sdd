import { RedisClientOptions } from 'redis';

export interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  retryStrategy?: (times: number) => number | null;
}

export interface CartItem {
  itemId: string;
  quantity: number;
  price: number;
  name: string;
  addedAt: string;
}

export interface Cart {
  userId: string;
  sessionId: string;
  version: number;
  createdAt: string;
  lastModified: string;
  items: CartItem[];
  meta: {
    currency: string;
    guest: boolean;
  };
}

export interface CartWithId extends Cart {
  id: string;
}

export interface CartItemInput {
  itemId: string;
  quantity: number;
  price: number;
  name: string;
}

export interface CartWithIdInput {
  id: string;
  userId: string;
  sessionId: string;
  version: number;
  items: CartItemInput[];
  meta: {
    currency: string;
    guest: boolean;
  };
}

export interface AppError {
  statusCode: number;
  errorCode: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface Logger {
  info: (message: string, data?: Record<string, unknown>) => void;
  warn: (message: string, data?: Record<string, unknown>) => void;
  error: (message: string, data?: Record<string, unknown>) => void;
  debug: (message: string, data?: Record<string, unknown>) => void;
}

export interface RequestWithUser extends Request {
  user?: {
    userId: string;
    email: string;
    scope: string[];
  };
}
