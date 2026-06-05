import request from 'supertest';
import express from 'express';
import { cartService } from '../services/cartService';
import { handleError } from '../middleware/errorHandler';

// Mock Redis client
jest.mock('../redis/redisClient', () => ({
  redisClient: {
    connect: jest.fn(),
    disconnect: jest.fn(),
    jsonGet: jest.fn(),
    jsonSet: jest.fn(),
    jsonDel: jest.fn(),
    expire: jest.fn()
  }
}));

// Create test app
const app = express();
app.use(express.json());

// Import routes after mocking
import cartRoutes from '../routes/cartRoutes';
app.use('/cart', cartRoutes);

app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction): void => {
  handleError(err, res);
});

describe('Cart API', () => {
  const userId = 'user_123';
  const sessionId = 'guest_abc123';
  const itemId = 'prod_456';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /cart/add', () => {
    it('should add item to cart and return 201', async () => {
      const item = {
        userId,
        sessionId,
        itemId,
        quantity: 2,
        price: 29.99,
        name: 'Wireless Headphones'
      };

      (cartService.addItem as jest.Mock).mockResolvedValue({
        userId,
        sessionId,
        items: [item],
        version: 1
      });

      const response = await request(app).post('/cart/add').send(item);

      expect(response.status).toBe(201);
      expect(response.body.message).toBe('Item added to cart successfully');
      expect(response.body.cart.userId).toBe(userId);
    });

    it('should return 400 for invalid quantity', async () => {
      const item = {
        userId,
        sessionId,
        itemId,
        quantity: 0,
        price: 29.99,
        name: 'Wireless Headphones'
      };

      const response = await request(app).post('/cart/add').send(item);

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('PUT /cart/update', () => {
    it('should update item in cart and return 200', async () => {
      const item = {
        userId,
        sessionId,
        itemId,
        quantity: 5,
        price: 34.99,
        name: 'Updated Headphones'
      };

      (cartService.updateItem as jest.Mock).mockResolvedValue({
        userId,
        sessionId,
        items: [item],
        version: 2
      });

      const response = await request(app).put('/cart/update').send(item);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Item updated in cart successfully');
    });
  });

  describe('DELETE /cart/remove', () => {
    it('should remove item from cart and return 204', async () => {
      (cartService.removeItem as jest.Mock).mockResolvedValue({
        userId,
        sessionId,
        items: [],
        version: 3
      });

      const response = await request(app).delete('/cart/remove').send({
        userId,
        sessionId,
        itemId
      });

      expect(response.status).toBe(204);
    });
  });

  describe('GET /cart/:userId', () => {
    it('should retrieve user cart and return 200', async () => {
      (cartService.getCart as jest.Mock).mockResolvedValue({
        userId,
        sessionId,
        items: [],
        version: 1
      });

      const response = await request(app).get(`/cart/${userId}?sessionId=${sessionId}`);

      expect(response.status).toBe(200);
      expect(response.body.cart.userId).toBe(userId);
    });

    it('should create cart if not exists and return 200', async () => {
      (cartService.getCart as jest.Mock).mockResolvedValue({
        userId,
        sessionId: expect.any(String),
        items: [],
        version: 1
      });

      const response = await request(app).get(`/cart/${userId}`);

      expect(response.status).toBe(200);
      expect(response.body.cart.items).toEqual([]);
    });
  });

  describe('DELETE /cart/:userId', () => {
    it('should clear user cart and return 204', async () => {
      (cartService.clearCart as jest.Mock).mockResolvedValue(undefined);

      const response = await request(app).delete(`/cart/${userId}`).send({
        sessionId
      });

      expect(response.status).toBe(204);
    });
  });

  describe('Health checks', () => {
    it('GET /health should return healthy status', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('healthy');
    });
  });
});
