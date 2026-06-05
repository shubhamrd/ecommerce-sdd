import { Router, Request, Response } from 'express';
import { cartService } from '../services/cartService';
import { validateAddItem, validateUpdateItem, validateRemoveItem, validateClearCart } from '../middleware/validator';
import { AppError } from '../middleware/errorHandler';

const router = Router();

// POST /cart/add - Add item to cart
router.post('/add', validateAddItem, async (req: Request, res: Response): Promise<void> => {
  const { userId, sessionId, itemId, quantity, price, name } = req.body;

  try {
    const cart = await cartService.addItem(userId, sessionId, { itemId, quantity, price, name });
    res.status(201).json({
      message: 'Item added to cart successfully',
      cart
    });
  } catch (err) {
    throw err;
  }
});

// PUT /cart/update - Update item in cart
router.put('/update', validateUpdateItem, async (req: Request, res: Response): Promise<void> => {
  const { userId, sessionId, itemId, quantity, price, name } = req.body;

  try {
    const cart = await cartService.updateItem(userId, sessionId, { itemId, quantity, price, name });
    res.status(200).json({
      message: 'Item updated in cart successfully',
      cart
    });
  } catch (err) {
    throw err;
  }
});

// DELETE /cart/remove - Remove item from cart
router.delete('/remove', validateRemoveItem, async (req: Request, res: Response): Promise<void> => {
  const { userId, sessionId, itemId } = req.body;

  try {
    const cart = await cartService.removeItem(userId, sessionId, itemId);
    res.status(204).json({
      message: 'Item removed from cart successfully',
      cart
    });
  } catch (err) {
    throw err;
  }
});

// GET /cart/:userId - Retrieve user cart
router.get('/:userId', async (req: Request, res: Response): Promise<void> => {
  const { userId } = req.params;
  const sessionId = req.query.sessionId as string || `guest_${Math.random().toString(36).substring(2, 15)}`;

  try {
    const cart = await cartService.getCart(userId, sessionId);
    res.status(200).json({
      cart
    });
  } catch (err) {
    throw err;
  }
});

// DELETE /cart/:userId - Clear user cart
router.delete('/:userId', validateClearCart, async (req: Request, res: Response): Promise<void> => {
  const { userId } = req.params;
  const { sessionId } = req.body;

  try {
    await cartService.clearCart(userId, sessionId);
    res.status(204).json({
      message: 'Cart cleared successfully'
    });
  } catch (err) {
    throw err;
  }
});

// Health check endpoint
router.get('/health', (req: Request, res: Response): void => {
  res.status(200).json({
    status: 'healthy',
    service: 'cart-service'
  });
});

// Readiness check endpoint
router.get('/ready', async (req: Request, res: Response): Promise<void> => {
  try {
    // Check Redis connection
    if (!res.app.get('redisConnected')) {
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

export default router;
