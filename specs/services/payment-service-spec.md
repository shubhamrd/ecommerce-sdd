# Payment Service Specification

**Version:** 1.0.0  
**Service:** payment-service  
**Runtime:** Node.js 20 (TypeScript)  
**Storage:** DynamoDB (payments), Redis (locks), External (Stripe)

---

## 1. Feature Overview

The Payment Service handles all payment-related operations including processing, refunds, and webhook handling. It integrates with external payment providers (Stripe) and ensures idempotent payment processing for reliability.

### Key Requirements
- Idempotent payment processing to prevent duplicate charges
- Webhook handling for payment status updates
- Refund processing with partial refund support
- Payment fraud detection and prevention
- PCI-DSS compliance (no raw card data stored)

### Business Rules
- Payments must be idempotent (same request ID = same result)
- Refunds can be partial or full
- Payment status webhooks must be processed exactly once
- Fraud detection must block suspicious transactions
- Payment data never stored in application databases

---

## 2. Technical Requirements

### 2.1 REST API Endpoints

| Method | Endpoint | Description | Auth | Request Body | Response |
|--------|----------|-------------|------|--------------|----------|
| POST | `/payments/process` | Process payment | Yes | `{orderId, amount, currency, paymentMethodId}` | `200 OK` |
| POST | `/payments/refund` | Refund payment | Yes | `{paymentId, amount, reason}` | `200 OK` |
| GET | `/payments/:paymentId` | Get payment status | Yes | N/A | `200 OK` |
| POST | `/payments/webhooks/stripe` | Stripe webhook | No | Stripe payload | `200 OK` |
| POST | `/payments/verify` | Verify payment method | Yes | `{paymentMethodId}` | `200 OK` |

### 2.2 Payment Processing Flow

```
User Request → Payment Service → External Provider (Stripe) → Webhook → Update Payment → Event Bus
     ↑                                                      ↓
     └───────────────── Idempotency Key ────────────────────┘
```

### 2.3 DynamoDB Schema (Payments)

**Table:** `payments`

```json
{
  "paymentId": "payment_123",
  "orderId": "order_789",
  "userId": "user_123",
  "amount": 6538,
  "currency": "USD",
  "provider": "stripe",
  "providerPaymentId": "pi_123456789",
  "status": "succeeded",
  "method": {
    "type": "card",
    "last4": "4242",
    "brand": "Visa",
    "expMonth": 12,
    "expYear": 2027
  },
  "metadata": {
    "orderId": "order_789",
    "userId": "user_123"
  },
  "refunds": [
    {
      "refundId": "refund_456",
      "amount": 1000,
      "reason": "Item not as described",
      "refundedAt": "2026-06-05T12:00:00.000Z"
    }
  ],
  "fraudScore": 15,
  "fraudStatus": "safe",
  "createdAt": "2026-06-05T11:00:00.000Z",
  "updatedAt": "2026-06-05T12:00:00.000Z",
  "completedAt": "2026-06-05T11:00:00.000Z"
}
```

### 2.4 Idempotency Key

**Header:** `X-Idempotency-Key: uuid`

**Redis Key:** `payment:idempotency:{idempotencyKey}`  
**TTL:** 24 hours

```json
{
  "paymentId": "payment_123",
  "orderId": "order_789",
  "requestHash": "sha256_hash_of_request_body",
  "createdAt": "2026-06-05T11:00:00.000Z",
  "expiresAt": "2026-06-06T11:00:00.000Z"
}
```

### 2.5 Stripe Webhook Payload

```json
{
  "id": "evt_123456789",
  "object": "event",
  "type": "payment_intent.succeeded",
  "data": {
    "object": {
      "id": "pi_123456789",
      "object": "payment_intent",
      "amount": 6538,
      "currency": "usd",
      "status": "succeeded"
    }
  },
  "created": 1685965200
}
```

---

## 3. Implementation Tasks

### 3.1 Project Setup (Create)

- [ ] Initialize Node.js project with TypeScript
- [ ] Install dependencies: `express`, `stripe`, `redis`, `uuid`
- [ ] Configure Stripe SDK with API keys
- [ ] Set up project structure (controllers, services, webhook handlers, routes)

### 3.2 Payment Processing Logic (Create)

- [ ] Implement `processPayment()` - Create payment intent with Stripe
- [ ] Implement `handleIdempotency()` - Check for duplicate requests
- [ ] Implement `refundPayment()` - Process refund with Stripe
- [ ] Implement `verifyPaymentMethod()` - Verify card with Stripe
- [ ] Implement `updatePaymentStatus()` - Update payment record

### 3.3 Webhook Handling (Create)

- [ ] Implement Stripe webhook endpoint
- [ ] Implement webhook signature verification
- [ ] Implement webhook event processing (payment_intent.succeeded, payment_intent.failed, etc.)
- [ ] Implement webhook retry logic

### 3.4 Fraud Detection (Create)

- [ ] Implement fraud score calculation
- [ ] Implement fraud rules engine
- [ ] Implement manual review queue for high-risk payments

### 3.5 Event Dispatching (Create)

- [ ] Implement `PaymentSucceeded` event
- [ ] Implement `PaymentFailed` event
- [ ] Implement `PaymentRefunded` event
- [ ] Implement event retry logic

---

## 4. Testing Directives

### 4.1 Unit Tests (Test)

- [ ] **test('processPayment should create Stripe payment intent')** - Stripe integration
- [ ] **test('processPayment should handle idempotency key')** - Idempotency
- [ ] **test('processPayment should return existing payment for duplicate request')** - Duplicate handling
- [ ] **test('refundPayment should create Stripe refund')** - Refund processing
- [ ] **test('webhookHandler should verify Stripe signature')** - Security
- [ ] **test('webhookHandler should process payment_intent.succeeded')** - Webhook processing
- [ ] **test('fraudDetection should calculate fraud score')** - Fraud detection

### 4.2 Integration Tests (Test)

- [ ] **test('POST /payments/process processes payment with Stripe')** - Full flow
- [ ] **test('POST /payments/process returns 400 for invalid card')** - Validation
- [ ] **test('POST /payments/refund refunds payment')** - Refund flow
- [ ] **test('Webhook updates payment status on Stripe event')** - Webhook integration
- [ ] **test('Duplicate payment request returns same payment ID')** - Idempotency
- [ ] **test('Payment failure triggers event to order service')** - Event delivery

### 4.3 Security Tests (Test)

- [ ] **test('Webhook signature validation rejects tampered requests')** - Security
- [ ] **test('Payment method data never stored in database')** - PCI compliance
- [ ] **test('Fraud detection blocks high-risk payments')** - Fraud prevention

---

## 5. Execution & Runtime

### 5.1 Environment Variables (Execute)

```bash
# .env
PAYMENT_PORT=3004
STRIPE_API_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
REDIS_HOST=localhost
REDIS_PORT=6379
DYNAMODB_TABLE_PAYMENTS=payments
AWS_REGION=us-east-1
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

EXPOSE 3004
CMD ["node", "dist/index.js"]
```

### 5.3 Kubernetes Deployment (Execute)

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: payment-service
  namespace: ecommerce-prod
spec:
  replicas: 3
  selector:
    matchLabels:
      app: payment-service
  template:
    metadata:
      labels:
        app: payment-service
    spec:
      containers:
      - name: payment-service
        image: payment-service:latest
        ports:
        - containerPort: 3004
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
            port: 3004
          initialDelaySeconds: 10
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 3004
          initialDelaySeconds: 5
          periodSeconds: 5
        env:
        - name: STRIPE_API_KEY
          valueFrom:
            secretKeyRef:
              name: stripe-secrets
              key: api-key
        - name: STRIPE_WEBHOOK_SECRET
          valueFrom:
            secretKeyRef:
              name: stripe-secrets
              key: webhook-secret
```

### 5.4 Stripe Webhook Configuration (Execute)

```bash
# Configure Stripe webhook endpoint
stripe listen --forward-to https://api.ecommerce.example.com/api/v1/payments/webhooks/stripe

# Get webhook signing secret
stripe api-keys
```

### 5.5 Deployment Commands (Execute)

```bash
# Build and push image
docker build -t payment-service:$(git rev-parse --short HEAD) .
docker tag payment-service:latest aws-account.dkr.ecr.us-east-1.amazonaws.com/payment-service:latest
docker push aws-account.dkr.ecr.us-east-1.amazonaws.com/payment-service:latest

# Deploy to Kubernetes
kubectl apply -f k8s-manifests/services/payment/

# Verify deployment
kubectl rollout status deployment/payment-service -n ecommerce-prod
```

### 5.6 Testing Commands (Execute)

```bash
# Process payment
curl -X POST "http://localhost:3004/payments/process" \
  -H "Authorization: Bearer <token>" \
  -H "X-Idempotency-Key: $(uuidgen)" \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "order_789",
    "amount": 6538,
    "currency": "USD",
    "paymentMethodId": "pm_123456789"
  }'

# Get payment status
curl -X GET "http://localhost:3004/payments/payment_123" \
  -H "Authorization: Bearer <token>"
```

---

## 6. Compliance & Security

- **PCI-DSS Compliance:** Never store raw card data, use Stripe tokens
- **Webhook Security:** Always verify Stripe webhook signatures
- **Idempotency:** All payment requests must use idempotency keys
- **Fraud Detection:** Implement fraud scoring and review queue
- **Audit Logs:** Log all payment operations for compliance
- **Data Minimization:** Store only payment metadata, never full card details

---

*Specification Version: 1.0.0 | Last Updated: 2026-06-05*
