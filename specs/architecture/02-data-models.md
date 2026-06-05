# Data Models Specification

**Version:** 1.0.0  
**Document Type:** Data Architecture  
**Last Updated:** 2026-06-05

---

## 1. Overview & Business Objectives

This document defines the global data models and entity schemas for the e-commerce platform. All services must adhere to these models to ensure data consistency, interoperability, and maintainability.

### 1.1 Data Modeling Principles

- **Single Source of Truth:** Each entity has one authoritative data store
- **Eventual Consistency:** Changes propagated via event bus
- **Idempotent Operations:** All operations must be safely retryable
- **Data Minimization:** Only store required fields for each service
- **GDPR Compliance:** User data must be deletable (right to be forgotten)

### 1.2 Data Ownership Matrix

| Entity | Primary Store | Secondary Stores | Ownership |
|--------|---------------|------------------|-----------|
| User | DynamoDB | Redis (sessions) | Auth Service |
| Product | DynamoDB | Elasticsearch (search) | Catalog Service |
| Cart | Redis | DynamoDB (persistent) | Cart Service |
| Order | DynamoDB | RDS (analytics) | Order Service |
| Payment | DynamoDB | External (Stripe) | Payment Service |

---

## 2. Technical Requirements & Data Models

### 2.1 User Model

**Primary Store:** DynamoDB  
**Table:** `users`

```typescript
interface User {
  userId: string;              // PK: user_123
  email: string;               // GSI: email-index
  passwordHash: string;        // bcrypt hash, never exposed
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  createdAt: string;           // ISO 8601
  updatedAt: string;
  lastLogin?: string;
  
  // Address book
  addresses: Address[];
  
  // Preferences
  preferences: {
    currency: string;          // USD, EUR, GBP
    language: string;          // en, es, fr
    notifications: {
      email: boolean;
      sms: boolean;
      push: boolean;
    };
  };
}

interface Address {
  addressId: string;
  label: string;               // "Home", "Work"
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;             // ISO 3166-1 alpha-2
  isDefault: boolean;
}
```

**DynamoDB Schema:**
```json
{
  "userId": "user_123",
  "email": "user@example.com",
  "passwordHash": "$2b$10$...",
  "firstName": "John",
  "lastName": "Doe",
  "createdAt": "2026-06-05T10:30:00.000Z",
  "updatedAt": "2026-06-05T10:30:00.000Z",
  "addresses": [
    {
      "addressId": "addr_456",
      "label": "Home",
      "street": "123 Main St",
      "city": "New York",
      "state": "NY",
      "postalCode": "10001",
      "country": "US",
      "isDefault": true
    }
  ],
  "preferences": {
    "currency": "USD",
    "language": "en",
    "notifications": {
      "email": true,
      "sms": false,
      "push": true
    }
  }
}
```

### 2.2 Product Model

**Primary Store:** DynamoDB  
**Table:** `products`

```typescript
interface Product {
  productId: string;           // PK: prod_123
  sku: string;                 // Unique stock keeping unit
  name: string;
  description: string;
  price: number;               // In cents: 2999 = $29.99
  currency: string;            // USD, EUR, GBP
  category: string;            // "electronics", "clothing"
  subcategory?: string;
  images: ProductImage[];
  inventory: {
    quantity: number;
    reserved: number;          // For active orders
    available: number;         // quantity - reserved
  };
  attributes: {
    [key: string]: string | number | boolean;
  };                         // Size, color, weight, etc.
  
  // SEO metadata
  seo: {
    title: string;
    description: string;
    keywords: string[];
  };
  
  // Status
  status: "active" | "inactive" | "discontinued";
  createdAt: string;
  updatedAt: string;
}

interface ProductImage {
  url: string;                 // S3 URL
  alt: string;
  isPrimary: boolean;
  sortOrder: number;
}
```

**DynamoDB Schema:**
```json
{
  "productId": "prod_456",
  "sku": "WH-001",
  "name": "Wireless Headphones",
  "description": "Premium noise-canceling headphones",
  "price": 2999,
  "currency": "USD",
  "category": "electronics",
  "subcategory": "audio",
  "images": [
    {
      "url": "https://s3.amazonaws.com/images/prod_456_main.jpg",
      "alt": "Wireless Headphones",
      "isPrimary": true,
      "sortOrder": 1
    }
  ],
  "inventory": {
    "quantity": 100,
    "reserved": 5,
    "available": 95
  },
  "attributes": {
    "brand": "TechBrand",
    "color": "Black",
    "weight": "250g",
    "batteryLife": "30 hours"
  },
  "seo": {
    "title": "Wireless Headphones - Premium Audio",
    "description": "High-fidelity wireless headphones with noise cancellation",
    "keywords": ["headphones", "wireless", "audio", "noise cancellation"]
  },
  "status": "active",
  "createdAt": "2026-06-01T00:00:00.000Z",
  "updatedAt": "2026-06-05T10:00:00.000Z"
}
```

### 2.3 Cart Model

**Primary Store:** Redis (JSON data type)  
**TTL:** 900 seconds (15 minutes) for guest carts, no TTL for authenticated

```typescript
interface Cart {
  cartId: string;              // Redis key: cart:{userId}:{sessionId}
  userId: string;
  sessionId: string;           // UUID for guest carts
  version: number;             // Optimistic concurrency
  items: CartItem[];
  subtotal: number;            // Sum of item prices
  tax: number;
  shipping: number;
  total: number;
  currency: string;
  createdAt: string;
  lastModified: string;
}

interface CartItem {
  itemId: string;              // Unique within cart
  productId: string;
  sku: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  addedAt: string;
}
```

**Redis JSON Schema:**
```json
{
  "userId": "user_123",
  "sessionId": "guest_abc123",
  "version": 1,
  "items": [
    {
      "itemId": "cart_item_789",
      "productId": "prod_456",
      "sku": "WH-001",
      "name": "Wireless Headphones",
      "price": 2999,
      "quantity": 2,
      "image": "https://s3.amazonaws.com/images/prod_456_main.jpg",
      "addedAt": "2026-06-05T10:30:00.000Z"
    }
  ],
  "subtotal": 5998,
  "tax": 540,
  "shipping": 0,
  "total": 6538,
  "currency": "USD",
  "createdAt": "2026-06-05T10:30:00.000Z",
  "lastModified": "2026-06-05T10:30:00.000Z"
}
```

### 2.4 Order Model

**Primary Store:** DynamoDB  
**Table:** `orders`

```typescript
interface Order {
  orderId: string;             // PK: order_123
  userId: string;
  cartId?: string;             // Reference to cart (if converted)
  items: OrderItem[];
  total: number;
  currency: string;
  status: OrderStatus;
  
  // Shipping
  shippingAddress: Address;
  billingAddress: Address;
  shippingMethod: string;
  trackingNumber?: string;
  
  // Payment
  payment: {
    provider: "stripe" | "paypal" | "apple_pay";
    paymentId: string;         // External provider ID
    status: PaymentStatus;
    amount: number;
    paidAt?: string;
  };
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  cancelledAt?: string;
}

type OrderStatus = 
  | "pending_payment"
  | "payment_received"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded";

type PaymentStatus = 
  | "pending"
  | "succeeded"
  | "failed"
  | "refunded";
```

**DynamoDB Schema:**
```json
{
  "orderId": "order_789",
  "userId": "user_123",
  "cartId": "cart_user_123_xyz",
  "items": [
    {
      "itemId": "order_item_001",
      "productId": "prod_456",
      "sku": "WH-001",
      "name": "Wireless Headphones",
      "price": 2999,
      "quantity": 2
    }
  ],
  "total": 6538,
  "currency": "USD",
  "status": "payment_received",
  "shippingAddress": {
    "street": "123 Main St",
    "city": "New York",
    "state": "NY",
    "postalCode": "10001",
    "country": "US"
  },
  "billingAddress": {
    "street": "123 Main St",
    "city": "New York",
    "state": "NY",
    "postalCode": "10001",
    "country": "US"
  },
  "shippingMethod": "express",
  "payment": {
    "provider": "stripe",
    "paymentId": "pi_123456789",
    "status": "succeeded",
    "amount": 6538,
    "paidAt": "2026-06-05T11:00:00.000Z"
  },
  "createdAt": "2026-06-05T10:45:00.000Z",
  "updatedAt": "2026-06-05T11:00:00.000Z",
  "completedAt": "2026-06-05T11:00:00.000Z"
}
```

### 2.5 Payment Model

**Primary Store:** DynamoDB  
**Table:** `payments`

```typescript
interface Payment {
  paymentId: string;           // PK: payment_123
  orderId: string;
  userId: string;
  amount: number;
  currency: string;
  provider: "stripe" | "paypal" | "apple_pay";
  providerPaymentId: string;   // External ID
  status: PaymentStatus;
  method: PaymentMethod;
  customerIp?: string;
  metadata: {
    [key: string]: string;
  };
  
  // Refunds
  refunds: PaymentRefund[];
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

interface PaymentRefund {
  refundId: string;
  amount: number;
  reason?: string;
  refundedAt: string;
}
```

---

## 3. Implementation Tasks

### 3.1 DynamoDB Setup (Create)

- [ ] Create `users`, `products`, `orders`, `payments` tables
- [ ] Set up GSI for email lookup on users table
- [ ] Set up GSI for userId lookup on orders table
- [ ] Configure DynamoDB Streams for event propagation
- [ ] Implement TTL for guest cart data (900 seconds)

### 3.2 Data Access Layer (Create)

- [ ] Implement repository pattern for all entities
- [ ] Add optimistic concurrency control (version field)
- [ ] Implement caching layer with Redis
- [ ] Add data validation middleware

### 3.3 Event Schema (Create)

```typescript
// UserCreated event
interface UserCreated {
  eventType: "user.created";
  payload: {
    userId: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  timestamp: string;
}

// ProductUpdated event
interface ProductUpdated {
  eventType: "product.updated";
  payload: {
    productId: string;
    changes: Partial<Product>;
  };
  timestamp: string;
}

// OrderPlaced event
interface OrderPlaced {
  eventType: "order.placed";
  payload: {
    orderId: string;
    userId: string;
    total: number;
    items: OrderItem[];
  };
  timestamp: string;
}
```

---

## 4. Testing Directives

### 4.1 Data Validation Tests (Test)

- [ ] **test('User email must be unique')** - GSI uniqueness
- [ ] **test('Product price must be positive integer (cents)')** - Validation
- [ ] **test('Cart items cannot exceed 100')** - Business rule
- [ ] **test('Order status transitions are valid')** - State machine
- [ ] **test('Payment amount matches order total')** - Consistency

### 4.2 Data Migration Tests (Test)

- [ ] **test('Data migration preserves all fields')** - Backward compatibility
- [ ] **test('Old data format is converted to new schema')** - Migration

### 4.3 Concurrency Tests (Test)

- [ ] **test('Simultaneous cart updates use version field')** - Optimistic locking
- [ ] **test('Race condition handling in inventory')** - Atomic operations

---

## 5. Execution & Runtime

### 5.1 DynamoDB Commands (Execute)

```bash
# Create users table
aws dynamodb create-table \
  --table-name users \
  --attribute-definitions \
    AttributeName=userId,AttributeType=S \
    AttributeName=email,AttributeType=S \
  --key-schema \
    AttributeName=userId,KeyType=HASH \
  --global-secondary-indexes \
    '[
      {
        "IndexName": "email-index",
        "KeySchema": [{"AttributeName": "email", "KeyType": "HASH"}],
        "Projection": {"ProjectionType": "ALL"}
      }
    ]' \
  --billing-mode PAY_PER_REQUEST \
  --region us-east-1

# Enable TTL
aws dynamodb update-time-to-live \
  --table-name users \
  --time-to-live-specification \
    AttributeName=ttl,Enabled=true \
  --region us-east-1
```

### 5.2 Redis Commands (Execute)

```bash
# Set cart with TTL
redis-cli JSON.SET cart:user_123:guest_abc123 . '{"userId":"user_123","items":[]}'
redis-cli EXPIRE cart:user_123:guest_abc123 900

# Get cart
redis-cli JSON.GET cart:user_123:guest_abc123

# Update cart atomically
redis-cli JSON.SET cart:user_123:guest_abc123 .items '[{"itemId":"item_1","quantity":2}]'
```

---

## 6. Compliance & Security

- All PII must be encrypted at rest
- User data must be deletable per GDPR right to be forgotten
- Payment data must never be stored in application databases
- Audit logs must record all data access for compliance

---

*Specification Version: 1.0.0 | Last Updated: 2026-06-05*
