# Order Checkout Service Specification

**Version:** 1.0.0  
**Service:** order-service  
**Runtime:** Node.js 20 (TypeScript)  
**Storage:** DynamoDB (orders), Redis (locks), Event Bus (SQS/SNS)

---

## 1. Feature Overview

The Order Checkout Service orchestrates the entire checkout process, manages order state transitions, and ensures transactional consistency across services. It handles order creation, inventory reservation, payment processing, and order fulfillment.

### Key Requirements
- Atomic order creation with inventory reservation
- Idempotent order processing to prevent duplicates
- Event-driven communication with payment and inventory services
- Order state machine with valid transitions
- Order tracking with status updates

### Business Rules
- Order can only be created if inventory is available
- Payment must be received before order processing begins
- Orders can be cancelled before shipment
- Refunds processed through payment service
- Order history immutable once created

---

## 2. Technical Requirements

### 2.1 REST API Endpoints

| Method | Endpoint | Description | Auth | Request Body | Response |
|--------|----------|-------------|------|--------------|----------|
| POST | `/orders` | Create order | Yes | `{cartId, shippingAddress, billingAddress, paymentId}` | `201 Created` |
| GET | `/orders` | List user orders | Yes | N/A | `200 OK` |
| GET | `/orders/:orderId` | Get order details | Yes | N/A | `200 OK` |
| PUT | `/orders/:orderId/cancel` | Cancel order | Yes | `{reason}` | `200 OK` |
| POST | `/orders/:orderId/track` | Get tracking info | Yes | N/A | `200 OK` |
| POST | `/orders/:orderId/refund` | Request refund | Yes | `{items, reason}` | `200 OK` |

### 2.2 Order State Machine

```
pending_payment → payment_received → processing → shipped → delivered
     ↑                                              ↓
     └────────────────────── cancelled ←─────────────┘
                                    ↓
                               refunded
```

**State Transitions:**
- `pending_payment` → `payment_received` (on successful payment)
- `payment_received` → `processing` (on order preparation)
- `processing` → `shipped` (on shipping confirmation)
- `shipped` → `delivered` (on delivery confirmation)
- Any active state → `cancelled` (user request)
- `payment_received` → `refunded` (on refund completion)

### 2.3 DynamoDB Schema (Orders)

**Table:** `orders`

```json
{
  "orderId": "order_789",
  "userId": "user_123",
  "cartId": "cart_user_123_xyz",
  "status": "payment_received",
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
  "trackingNumber": "1Z999AA10123456784",
  "payment": {
    "provider": "stripe",
    "paymentId": "pi_123456789",
    "status": "succeeded",
    "amount": 6538,
    "paidAt": "2026-06-05T11:00:00.000Z"
  },
  "events": [
    {
      "eventType": "order.created",
      "timestamp": "2026-06-05T10:45:00.000Z",
      "by": "user_123"
    },
    {
      "eventType": "payment.received",
      "timestamp": "2026-06-05T11:00:00.000Z",
      "by": "payment-service"
    }
  ],
  "createdAt": "2026-06-05T10:45:00.000Z",
  "updatedAt": "2026-06-05T11:00:00.000Z",
  "completedAt": "2026-06-05T11:00:00.000Z"
}
```

### 2.4 Event Schema

**OrderPlaced Event:**
```typescript
interface OrderPlaced {
  eventType: "order.placed";
  payload: {
    orderId: string;
    userId: string;
    cartId: string;
    total: number;
    items: OrderItem[];
  };
  timestamp: string;
  correlationId: string;
}
```

**OrderCancelled Event:**
```typescript
interface OrderCancelled {
  eventType: "order.cancelled";
  payload: {
    orderId: string;
    userId: string;
    reason: string;
  };
  timestamp: string;
  correlationId: string;
}
```

### 2.5 Redis Lock Schema

**Key:** `order:lock:{orderId}`  
**TTL:** 30 seconds

```json
{
  "orderId": "order_789",
  "lockedBy": "order-service-instance-1",
  "createdAt": "2026-06-05T10:45:00.000Z",
  "expiresAt": "2026-06-05T10:45:30.000Z"
}
```

---

## 3. Implementation Tasks

### 3.1 Project Setup (Create)

- [ ] Initialize Node.js project with TypeScript
- [ ] Install dependencies: `express`, `redis`, `uuid`, `@aws-sdk/client-sqs`
- [ ] Configure DynamoDB and SQS clients
- [ ] Set up project structure (controllers, services, event handlers, routes)

### 3.2 Order Creation Logic (Create)

- [ ] Implement `createOrder()` - Validate cart, reserve inventory, create order
- [ ] Implement `validateCart()` - Check cart existence and items
- [ ] Implement `reserveInventory()` - Reserve items in inventory service
- [ ] Implement `createOrderRecord()` - Save order to DynamoDB
- [ ] Implement `dispatchOrderPlacedEvent()` - Publish to event bus

### 3.3 State Machine Implementation (Create)

- [ ] Implement `transitionOrder()` - Validate and apply state transitions
- [ ] Implement `canTransitionTo()` - Check valid transitions
- [ ] Implement `updateOrderStatus()` - Update order status and emit event
- [ ] Implement `cancelOrder()` - Handle order cancellation

### 3.4 Inventory Integration (Create)

- [ ] Implement inventory reservation on order creation
- [ ] Implement inventory release on order cancellation
- [ ] Implement inventory decrement on order shipment
- [ ] Implement retry logic for inventory operations

### 3.5 Event Handling (Create)

- [ ] Implement `OrderPlaced` event handler
- [ ] Implement `OrderCancelled` event handler
- [ ] Implement `OrderRefunded` event handler
- [ ] Implement event replay for missed events

---

## 4. Testing Directives

### 4.1 Unit Tests (Test)

- [ ] **test('createOrder should validate cart existence')** - Validation
- [ ] **test('createOrder should reserve inventory')** - Inventory logic
- [ ] **test('createOrder should create order record in DynamoDB')** - Persistence
- [ ] **test('createOrder should dispatch OrderPlaced event')** - Event emission
- [ ] **test('transitionOrder should validate state transition')** - State machine
- [ ] **test('cancelOrder should update status and emit event')** - Cancellation
- [ ] **test('Idempotent order creation handles duplicates')** - Idempotency

### 4.2 Integration Tests (Test)

- [ ] **test('POST /orders creates order with valid cart')** - Full flow
- [ ] **test('POST /orders returns 400 if cart is empty')** - Error path
- [ ] **test('POST /orders returns 409 if inventory unavailable')** - Concurrency
- [ ] **test('PUT /orders/:orderId/cancel cancels pending order')** - Cancellation
- [ ] **test('Order state machine prevents invalid transitions')** - State validation
- [ ] **test('Event bus delivers OrderPlaced to downstream services')** - Event delivery

### 4.3 Concurrency Tests (Test)

- [ ] **test('Simultaneous orders for same product handle inventory')** - Race condition
- [ ] **test('Idempotent order creation prevents duplicates')** - Duplicate prevention
- [ ] **test('Order lock prevents concurrent modifications')** - Locking

---

## 5. Execution & Runtime

### 5.1 Environment Variables (Execute)

```bash
# .env
ORDER_PORT=3003
REDIS_HOST=localhost
REDIS_PORT=6379
DYNAMODB_TABLE_ORDERS=orders
SQS_QUEUE_URL=https://sqs.us-east-1.amazonaws.com/123456789012/order-events
AWS_REGION=us-east-1
PAYMENT_SERVICE_URL=http://payment-service:3004
INVENTORY_SERVICE_URL=http://inventory-service:3006
```

### 5.2 Dockerfile (Execute)

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
COPY --from=builder /app/.env ./dist/.env

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001
USER nodejs

EXPOSE 3003
CMD ["node", "dist/index.js"]
```

### 5.3 Kubernetes Deployment (Execute)

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: order-service
  namespace: ecommerce-prod
spec:
  replicas: 3
  selector:
    matchLabels:
      app: order-service
  template:
    metadata:
      labels:
        app: order-service
    spec:
      containers:
      - name: order-service
        image: order-service:latest
        ports:
        - containerPort: 3003
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
            port: 3003
          initialDelaySeconds: 10
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 3003
          initialDelaySeconds: 5
          periodSeconds: 5
        env:
        - name: REDIS_HOST
          valueFrom:
            secretKeyRef:
              name: redis-secrets
              key: host
        - name: SQS_QUEUE_URL
          valueFrom:
            secretKeyRef:
              name: sqs-secrets
              key: queue-url
```

### 5.4 Deployment Commands (Execute)

```bash
# Build and push image
docker build -t order-service:$(git rev-parse --short HEAD) .
docker tag order-service:latest aws-account.dkr.ecr.us-east-1.amazonaws.com/order-service:latest
docker push aws-account.dkr.ecr.us-east-1.amazonaws.com/order-service:latest

# Deploy to Kubernetes
kubectl apply -f k8s-manifests/services/order/

# Verify deployment
kubectl rollout status deployment/order-service -n ecommerce-prod
```

### 5.5 Testing Commands (Execute)

```bash
# Create order
curl -X POST "http://localhost:3003/orders" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "cartId": "cart_user_123_xyz",
    "shippingAddress": {...},
    "billingAddress": {...},
    "paymentId": "pi_123456789"
  }'

# List user orders
curl -X GET "http://localhost:3003/orders" \
  -H "Authorization: Bearer <token>"

# Get order details
curl -X GET "http://localhost:3003/orders/order_789" \
  -H "Authorization: Bearer <token>"
```

---

## 6. Compliance & Security

- Order data must be immutable once created
- All order transitions must be logged
- Payment processing must be idempotent
- Order cancellation must release reserved inventory
- PCI-DSS compliance requires no payment data in order logs

---

*Specification Version: 1.0.0 | Last Updated: 2026-06-05*
