# Cart Service Specification

**Version:** 1.0.0  
**Service:** cart-service  
**Runtime:** Node.js 20 (TypeScript)  
**Storage:** Redis (JSON data type)  
**TTL:** 15 minutes (non-expiring sessions excluded)

---

## 1. Feature Overview

The Cart Service manages user shopping carts in real-time with low-latency access. The service provides CRUD operations for cart items, supports concurrent updates, and ensures data persistence through Redis.

### Key Requirements
- Sub-millisecond read latency for cart retrieval
- Atomic operations for cart modifications
- Automatic cart cleanup after 15 minutes of inactivity
- Support for guest sessions (temporary UUID-based identifiers)
- Cart merging for authenticated users transitioning from guest sessions

### Business Rules
- Maximum 100 items per cart
- Quantity per item: 1-999
- Cart TTL resets on every modification (write-through refresh)
- Guest carts persist for 15 minutes; authenticated carts persist until explicit deletion

---

## 2. Technical Requirements

### 2.1 REST API Endpoints

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| POST | `/cart/add` | Add item to cart | `{ userId, itemId, quantity }` | `201 Created` |
| PUT | `/cart/update` | Update item quantity | `{ userId, itemId, quantity }` | `200 OK` |
| DELETE | `/cart/remove` | Remove item from cart | `{ userId, itemId }` | `204 No Content` |
| GET | `/cart/:userId` | Retrieve user cart | N/A | `200 OK` |
| DELETE | `/cart/:userId` | Clear user cart | N/A | `204 No Content` |

### 2.2 Redis JSON Schema

**Key Pattern:** `cart:{userId}:{sessionId}`

**Example Key:** `cart:user_123:guest_abc123`

**JSON Structure:**
```json
{
  "userId": "user_123",
  "sessionId": "guest_abc123",
  "version": 1,
  "createdAt": "2026-06-05T10:30:00.000Z",
  "lastModified": "2026-06-05T10:30:00.000Z",
  "items": [
    {
      "itemId": "prod_456",
      "quantity": 2,
      "price": 29.99,
      "name": "Wireless Headphones",
      "addedAt": "2026-06-05T10:30:00.000Z"
    }
  ],
  "meta": {
    "currency": "USD",
    "guest": true
  }
}
```

**Redis Commands:**
- `JSON.SET cart:{userId}:{sessionId} . <json>` - Create/update cart
- `JSON.GET cart:{userId}:{sessionId}` - Retrieve cart
- `JSON.DEL cart:{userId}:{sessionId}` - Delete cart
- `EXPIRE cart:{userId}:{sessionId} 900` - Set 15-minute TTL (900 seconds)

### 2.3 Error Responses

All endpoints return standardized errors:
```json
{
  "error": {
    "code": "INVALID_CART_ITEM",
    "message": "Item quantity must be between 1 and 999",
    "details": { "quantity": 0 }
  }
}
```

Error Codes:
- `CART_NOT_FOUND`: Cart doesn't exist for user
- `INVALID_CART_ITEM`: Invalid item data (quantity, price)
- `CART_FULL`: Cart exceeds 100 items limit
- `SERVICE_UNAVAILABLE`: Redis connection failure

---

## 3. Implementation Tasks

### 3.1 Project Setup (Create)

- [ ] Initialize Node.js project with TypeScript configuration (strict mode enabled)
- [ ] Install dependencies: `express`, `redis`, `@types/express`, `@types/redis`, `winston`
- [ ] Configure project structure:
  ```
  src/
  ├── index.ts              # Entry point
  ├── server.ts             # Express/Fastify server setup
  ├── redis/                # Redis client module
  │   ├── client.ts         # Client initialization
  │   └── types.ts          # TypeScript interfaces
  ├── services/             # Business logic
  │   └── cartService.ts
  ├── controllers/          # Route handlers
  │   └── cartController.ts
  ├── routes/               # Route definitions
  │   └── cartRoutes.ts
  └── middleware/           # Error handling, validation
      ├── errorHandler.ts
      └── validator.ts
  ```

### 3.2 Redis Connection (Create)

- [ ] Implement Redis client with connection pooling
- [ ] Add automatic reconnection logic with exponential backoff
- [ ] Configure Redis JSON module activation check on startup
- [ ] Implement circuit breaker pattern for Redis failures

### 3.3 Route Controllers (Create)

- [ ] Implement `POST /cart/add` with quantity validation
- [ ] Implement `PUT /cart/update` with optimistic concurrency (version field)
- [ ] Implement `DELETE /cart/remove` with atomic item removal
- [ ] Implement `GET /cart/:userId` with cart creation on missing
- [ ] Implement `DELETE /cart/:userId` with full cart purge

### 3.4 Cart Service Logic (Create)

- [ ] Implement `addItem()` - Check quantity limits, merge if item exists
- [ ] Implement `updateItem()` - Validate new quantity, update timestamp
- [ ] Implement `removeItem()` - Remove by itemId, recalculate totals
- [ ] Implement `getCart()` - Fetch cart, validate TTL, return items array
- [ ] Implement `clearCart()` - Delete entire cart key from Redis
- [ ] Implement `mergeCarts()` - Merge guest cart into authenticated cart

---

## 4. Testing Directives

### 4.1 Unit Tests (Test)

Create Jest test suite in `__tests__/cartService.test.ts`:

- [ ] **test('addItem should add new item to empty cart')** - Verify cart creation
- [ ] **test('addItem should increase quantity if item exists')** - Merge logic
- [ ] **test('addItem should throw error for quantity > 999')** - Validation
- [ ] **test('addItem should throw error for quantity < 1')** - Negative rejection
- [ ] **test('addItem should throw error if cart exceeds 100 items')** - Capacity check
- [ ] **test('updateItem should update quantity and timestamp')** - Modification
- [ ] **test('removeItem should delete item from cart')** - Deletion
- [ ] **test('getCart should return cart with TTL validation')** - TTL check
- [ ] **test('clearCart should delete Redis key')** - Purge operation
- [ ] **test('mergeCarts should combine guest and authenticated carts')** - Migration

### 4.2 Integration Tests (Test)

Create `__tests__/integration/cartApi.test.ts`:

- [ ] **test('POST /cart/add returns 201 with cart data')** - Full flow
- [ ] **test('GET /cart/:userId returns 404 for non-existent cart')** - Error path
- [ ] **test('POST /cart/add handles concurrent requests')** - Race condition
- [ ] **test('Redis connection failure returns 503')** - Circuit breaker
- [ ] **test('Cart TTL refreshes on modification')** - Time management

### 4.3 Load Testing (Test)

- [ ] Simulate 1000 concurrent cart additions using k6 or Artillery
- [ ] Verify Redis connection pool handles load without exhaustion
- [ ] Measure p99 latency for `GET /cart/:userId` under load

---

## 5. Execution

### 5.1 npm Scripts (Execute)

Add to `package.json`:
```json
{
  "scripts": {
    "build": "tsc --build",
    "start": "node dist/index.js",
    "dev": "ts-node src/index.ts",
    "test": "jest --coverage",
    "test:watch": "jest --watch",
    "lint": "eslint src/**/*.ts",
    "lint:fix": "eslint src/**/*.ts --fix"
  }
}
```

### 5.2 Dockerfile Blueprint (Execute)

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

FROM node:20-alpine AS runtime
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules

# Non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001
USER nodejs

EXPOSE 3000
CMD ["node", "dist/index.js"]
```

### 5.3 Kubernetes Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: cart-service
spec:
  replicas: 3
  selector:
    matchLabels:
      app: cart-service
  template:
    metadata:
      labels:
        app: cart-service
    spec:
      containers:
      - name: cart-service
        image: cart-service:latest
        ports:
        - containerPort: 3000
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 10
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
        env:
        - name: REDIS_HOST
          valueFrom:
            secretKeyRef:
              name: redis-secrets
              key: host
        - name: REDIS_PORT
          valueFrom:
            secretKeyRef:
              name: redis-secrets
              key: port
```

---

## 6. Compliance & Security

- All API endpoints must validate JWT authentication for authenticated users
- Guest sessions must use cryptographically secure UUIDs
- Cart data must never include payment information (PCI-DSS compliance)
- Audit logs must record all cart modifications for compliance
- Rate limiting: Maximum 100 requests/minute per user IP

---

*Specification Version: 1.0.0 | Last Updated: 2026-06-05*
