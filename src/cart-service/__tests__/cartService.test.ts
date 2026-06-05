# Cart Service - Unit Tests

import { cartService } from '../services/cartService';
import { CartServiceError } from '../services/cartService';

describe('CartService', () => {
  const userId = 'user_123';
  const sessionId = 'guest_abc123';
  const itemId = 'prod_456';

  beforeEach(() => {
    // Clear Redis before each test
    jest.clearAllMocks();
  });

  describe('addItem', () => {
    it('should add new item to empty cart', async () => {
      const item = {
        itemId,
        quantity: 2,
        price: 29.99,
        name: 'Wireless Headphones'
      };

      const cart = await cartService.addItem(userId, sessionId, item);

      expect(cart.userId).toBe(userId);
      expect(cart.sessionId).toBe(sessionId);
      expect(cart.items.length).toBe(1);
      expect(cart.items[0].itemId).toBe(itemId);
      expect(cart.items[0].quantity).toBe(2);
      expect(cart.items[0].price).toBe(29.99);
      expect(cart.version).toBe(1);
    });

    it('should increase quantity if item exists', async () => {
      // Add item first
      const item1 = {
        itemId,
        quantity: 2,
        price: 29.99,
        name: 'Wireless Headphones'
      };
      await cartService.addItem(userId, sessionId, item1);

      // Update quantity
      const item2 = {
        itemId,
        quantity: 5,
        price: 29.99,
        name: 'Wireless Headphones'
      };
      const cart = await cartService.addItem(userId, sessionId, item2);

      expect(cart.items.length).toBe(1);
      expect(cart.items[0].quantity).toBe(5);
      expect(cart.version).toBe(2);
    });

    it('should throw error for quantity > 999', async () => {
      const item = {
        itemId,
        quantity: 1000,
        price: 29.99,
        name: 'Wireless Headphones'
      };

      await expect(cartService.addItem(userId, sessionId, item)).rejects.toThrow(CartServiceError);
      await expect(cartService.addItem(userId, sessionId, item)).rejects.toThrow('Item quantity must be between 1 and 999');
    });

    it('should throw error for quantity < 1', async () => {
      const item = {
        itemId,
        quantity: 0,
        price: 29.99,
        name: 'Wireless Headphones'
      };

      await expect(cartService.addItem(userId, sessionId, item)).rejects.toThrow(CartServiceError);
      await expect(cartService.addItem(userId, sessionId, item)).rejects.toThrow('Item quantity must be between 1 and 999');
    });

    it('should throw error if cart exceeds 100 items', async () => {
      // Add 100 items first
      for (let i = 0; i < 100; i++) {
        await cartService.addItem(userId, sessionId, {
          itemId: `item_${i}`,
          quantity: 1,
          price: 10,
          name: `Item ${i}`
        });
      }

      // Try to add 101st item
      const item = {
        itemId: 'item_101',
        quantity: 1,
        price: 10,
        name: 'Item 101'
      };

      await expect(cartService.addItem(userId, sessionId, item)).rejects.toThrow(CartServiceError);
      await expect(cartService.addItem(userId, sessionId, item)).rejects.toThrow('Cart exceeds maximum capacity');
    });
  });

  describe('updateItem', () => {
    it('should update quantity and timestamp', async () => {
      // Add item first
      const item1 = {
        itemId,
        quantity: 2,
        price: 29.99,
        name: 'Wireless Headphones'
      };
      await cartService.addItem(userId, sessionId, item1);

      // Update quantity
      const item2 = {
        itemId,
        quantity: 5,
        price: 34.99,
        name: 'Updated Headphones'
      };
      const cart = await cartService.updateItem(userId, sessionId, item2);

      expect(cart.items[0].quantity).toBe(5);
      expect(cart.items[0].price).toBe(34.99);
      expect(cart.version).toBe(2);
    });

    it('should throw error if cart not found', async () => {
      const item = {
        itemId: 'non_existent',
        quantity: 1,
        price: 10,
        name: 'Non-existent Item'
      };

      await expect(cartService.updateItem(userId, sessionId, item)).rejects.toThrow(CartServiceError);
      await expect(cartService.updateItem(userId, sessionId, item)).rejects.toThrow('Cart not found');
    });
  });

  describe('removeItem', () => {
    it('should delete item from cart', async () => {
      // Add items
      await cartService.addItem(userId, sessionId, {
        itemId: 'item_1',
        quantity: 2,
        price: 29.99,
        name: 'Item 1'
      });
      await cartService.addItem(userId, sessionId, {
        itemId: 'item_2',
        quantity: 1,
        price: 19.99,
        name: 'Item 2'
      });

      // Remove item
      const cart = await cartService.removeItem(userId, sessionId, 'item_1');

      expect(cart.items.length).toBe(1);
      expect(cart.items[0].itemId).toBe('item_2');
      expect(cart.version).toBe(3);
    });

    it('should throw error if item not found', async () => {
      // Add item
      await cartService.addItem(userId, sessionId, {
        itemId: 'item_1',
        quantity: 2,
        price: 29.99,
        name: 'Item 1'
      });

      // Try to remove non-existent item
      await expect(cartService.removeItem(userId, sessionId, 'non_existent')).rejects.toThrow(CartServiceError);
      await expect(cartService.removeItem(userId, sessionId, 'non_existent')).rejects.toThrow('Item not found in cart');
    });
  });

  describe('getCart', () => {
    it('should return cart with TTL validation', async () => {
      // Add item
      await cartService.addItem(userId, sessionId, {
        itemId,
        quantity: 2,
        price: 29.99,
        name: 'Wireless Headphones'
      });

      // Get cart
      const cart = await cartService.getCart(userId, sessionId);

      expect(cart.userId).toBe(userId);
      expect(cart.items.length).toBe(1);
    });

    it('should create cart if not exists', async () => {
      const cart = await cartService.getCart(userId, sessionId);

      expect(cart.userId).toBe(userId);
      expect(cart.items.length).toBe(0);
      expect(cart.version).toBe(1);
    });
  });

  describe('clearCart', () => {
    it('should delete Redis key', async () => {
      // Add item
      await cartService.addItem(userId, sessionId, {
        itemId,
        quantity: 2,
        price: 29.99,
        name: 'Wireless Headphones'
      });

      // Clear cart
      await cartService.clearCart(userId, sessionId);

      // Verify cart is deleted
      const cart = await cartService.getCart(userId, sessionId);
      expect(cart.items.length).toBe(0);
    });
  });

  describe('mergeCarts', () => {
    it('should combine guest and authenticated carts', async () => {
      const authSessionId = 'auth_abc123';

      // Add items to guest cart
      await cartService.addItem(userId, sessionId, {
        itemId: 'guest_item_1',
        quantity: 2,
        price: 29.99,
        name: 'Guest Item 1'
      });

      // Add items to auth cart
      await cartService.addItem(userId, authSessionId, {
        itemId: 'auth_item_1',
        quantity: 1,
        price: 19.99,
        name: 'Auth Item 1'
      });

      // Merge carts
      const cart = await cartService.mergeCarts(userId, sessionId, authSessionId);

      expect(cart.items.length).toBe(2);
      expect(cart.meta.guest).toBe(false);
    });
  });
});
