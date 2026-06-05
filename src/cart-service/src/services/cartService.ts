import { redisClient } from './redisClient';
import { Cart, CartItemInput, CartWithId } from './types';

const CART_TTL_SECONDS = 900; // 15 minutes

function generateCartId(userId: string, sessionId: string): string {
  return `cart:${userId}:${sessionId}`;
}

async function getCartFromRedis(cartId: string): Promise<Cart | null> {
  const data = await redisClient.jsonGet(cartId);
  if (!data) {
    return null;
  }
  return data as Cart;
}

async function saveCartToRedis(cartId: string, cart: Cart): Promise<void> {
  await redisClient.jsonSet(cartId, '.', cart, CART_TTL_SECONDS);
}

async function updateCartTTL(cartId: string): Promise<boolean> {
  return await redisClient.expire(cartId, CART_TTL_SECONDS);
}

async function deleteCartFromRedis(cartId: string): Promise<number> {
  return await redisClient.jsonDel(cartId);
}

class CartServiceError extends Error {
  constructor(
    public statusCode: number,
    public errorCode: string,
    public message: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'CartServiceError';
  }
}

class CartService {
  async addItem(userId: string, sessionId: string, item: CartItemInput): Promise<Cart> {
    const cartId = generateCartId(userId, sessionId);
    let cart = await getCartFromRedis(cartId);

    if (!cart) {
      cart = {
        userId,
        sessionId,
        version: 1,
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        items: [],
        meta: {
          currency: 'USD',
          guest: !userId.startsWith('user_')
        }
      };
    } else {
      cart.version += 1;
      cart.lastModified = new Date().toISOString();
    }

    // Check cart capacity
    if (cart.items.length >= 100) {
      throw new CartServiceError(400, 'CART_FULL', 'Cart exceeds maximum capacity of 100 items');
    }

    // Validate quantity
    if (item.quantity < 1 || item.quantity > 999) {
      throw new CartServiceError(400, 'INVALID_CART_ITEM', 'Item quantity must be between 1 and 999', { quantity: item.quantity });
    }

    // Check if item already exists
    const existingItemIndex = cart.items.findIndex(i => i.itemId === item.itemId);
    
    if (existingItemIndex !== -1) {
      // Update existing item
      cart.items[existingItemIndex].quantity = item.quantity;
      cart.items[existingItemIndex].price = item.price;
      cart.items[existingItemIndex].name = item.name;
    } else {
      // Add new item
      cart.items.push({
        itemId: item.itemId,
        quantity: item.quantity,
        price: item.price,
        name: item.name,
        addedAt: new Date().toISOString()
      });
    }

    await saveCartToRedis(cartId, cart);
    return cart;
  }

  async updateItem(userId: string, sessionId: string, item: CartItemInput): Promise<Cart> {
    const cartId = generateCartId(userId, sessionId);
    const cart = await getCartFromRedis(cartId);

    if (!cart) {
      throw new CartServiceError(404, 'CART_NOT_FOUND', 'Cart not found for user', { userId, sessionId });
    }

    cart.version += 1;
    cart.lastModified = new Date().toISOString();

    // Validate quantity
    if (item.quantity < 1 || item.quantity > 999) {
      throw new CartServiceError(400, 'INVALID_CART_ITEM', 'Item quantity must be between 1 and 999', { quantity: item.quantity });
    }

    const existingItemIndex = cart.items.findIndex(i => i.itemId === item.itemId);
    
    if (existingItemIndex === -1) {
      throw new CartServiceError(404, 'CART_NOT_FOUND', 'Item not found in cart', { itemId: item.itemId });
    }

    cart.items[existingItemIndex].quantity = item.quantity;
    cart.items[existingItemIndex].price = item.price;
    cart.items[existingItemIndex].name = item.name;

    await saveCartToRedis(cartId, cart);
    await updateCartTTL(cartId);
    return cart;
  }

  async removeItem(userId: string, sessionId: string, itemId: string): Promise<Cart> {
    const cartId = generateCartId(userId, sessionId);
    const cart = await getCartFromRedis(cartId);

    if (!cart) {
      throw new CartServiceError(404, 'CART_NOT_FOUND', 'Cart not found for user', { userId, sessionId });
    }

    cart.version += 1;
    cart.lastModified = new Date().toISOString();

    const itemIndex = cart.items.findIndex(i => i.itemId === itemId);
    
    if (itemIndex === -1) {
      throw new CartServiceError(404, 'CART_NOT_FOUND', 'Item not found in cart', { itemId });
    }

    cart.items.splice(itemIndex, 1);
    await saveCartToRedis(cartId, cart);
    await updateCartTTL(cartId);
    return cart;
  }

  async getCart(userId: string, sessionId: string): Promise<Cart> {
    const cartId = generateCartId(userId, sessionId);
    let cart = await getCartFromRedis(cartId);

    if (!cart) {
      // Create new cart if doesn't exist
      cart = {
        userId,
        sessionId,
        version: 1,
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        items: [],
        meta: {
          currency: 'USD',
          guest: !userId.startsWith('user_')
        }
      };
      await saveCartToRedis(cartId, cart);
    } else {
      // Refresh TTL on access
      await updateCartTTL(cartId);
    }

    return cart;
  }

  async clearCart(userId: string, sessionId: string): Promise<void> {
    const cartId = generateCartId(userId, sessionId);
    await deleteCartFromRedis(cartId);
  }

  async mergeCarts(authUserId: string, guestSessionId: string, authSessionId: string): Promise<Cart> {
    const guestCartId = generateCartId(authUserId, guestSessionId);
    const authCartId = generateCartId(authUserId, authSessionId);

    const guestCart = await getCartFromRedis(guestCartId);
    const authCart = await getCartFromRedis(authCartId);

    if (!guestCart && !authCart) {
      throw new CartServiceError(404, 'CART_NOT_FOUND', 'No carts to merge', { guestSessionId, authSessionId });
    }

    const mergedCart: Cart = authCart || {
      userId: authUserId,
      sessionId: authSessionId,
      version: 1,
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      items: [],
      meta: {
        currency: 'USD',
        guest: false
      }
    };

    if (guestCart) {
      // Merge items from guest cart
      for (const guestItem of guestCart.items) {
        const existingItemIndex = mergedCart.items.findIndex(i => i.itemId === guestItem.itemId);
        
        if (existingItemIndex !== -1) {
          // If item exists, keep the higher quantity
          if (guestItem.quantity > mergedCart.items[existingItemIndex].quantity) {
            mergedCart.items[existingItemIndex].quantity = guestItem.quantity;
          }
        } else {
          // Add new item from guest cart
          mergedCart.items.push({
            itemId: guestItem.itemId,
            quantity: guestItem.quantity,
            price: guestItem.price,
            name: guestItem.name,
            addedAt: guestItem.addedAt
          });
        }
      }

      // Update version and timestamp
      mergedCart.version += 1;
      mergedCart.lastModified = new Date().toISOString();

      // Save merged cart
      await saveCartToRedis(authCartId, mergedCart);
      await updateCartTTL(authCartId);

      // Delete guest cart
      await deleteCartFromRedis(guestCartId);
    }

    return mergedCart;
  }
}

export const cartService = new CartService();
