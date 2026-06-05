import express, { Application, Request, Response, NextFunction } from 'express';
import { redisClient } from './redis/redisClient';
import cartRoutes from './routes/cartRoutes';
import { handleError } from './middleware/errorHandler';
import { logger } from './logger';

const app: Application = express();
const PORT = process.env.CART_SERVICE_PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Add Redis connection status to app locals
app.set('redisConnected', false);

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction): void => {
  logger.info('Incoming request', {
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.get('user-agent')
  });
  next();
});

// Health check route
app.get('/health', (req: Request, res: Response): void => {
  res.status(200).json({
    status: 'healthy',
    service: 'cart-service'
  });
});

// Readiness check route
app.get('/ready', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!app.get('redisConnected')) {
      res.status(503).json({
        status: 'unhealthy',
        reason: 'Redis not connected'
      });
      return;
    }
    res.status(200).json({
      status: 'ready',
      service: 'cart-service'
    });
  } catch (err) {
    res.status(503).json({
      status: 'unhealthy',
      reason: err instanceof Error ? err.message : 'Unknown error'
    });
  }
});

// API routes
app.use('/cart', cartRoutes);

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction): void => {
  handleError(err, res);
});

// 404 handler
app.use((req: Request, res: Response): void => {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`
    }
  });
});

async function startServer(): Promise<void> {
  try {
    // Connect to Redis
    await redisClient.connect();
    app.set('redisConnected', true);
    logger.info('Connected to Redis successfully');

    // Start server
    app.listen(PORT, () => {
      logger.info(`Cart service listening on port ${PORT}`);
    });

    // Handle graceful shutdown
    process.on('SIGTERM', async () => {
      logger.info('SIGTERM received, shutting down gracefully');
      await redisClient.disconnect();
      process.exit(0);
    });

    process.on('SIGINT', async () => {
      logger.info('SIGINT received, shutting down gracefully');
      await redisClient.disconnect();
      process.exit(0);
    });
  } catch (err) {
    logger.error('Failed to start server', {
      error: err instanceof Error ? err.message : String(err)
    });
    process.exit(1);
  }
}

startServer();
