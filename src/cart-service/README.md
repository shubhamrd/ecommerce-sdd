// Cart Service - README

## Overview
This is the Cart Service for the e-commerce platform. It manages user shopping carts in real-time with low-latency access using Redis as the data store.

## Tech Stack
- **Runtime:** Node.js 20 (TypeScript)
- **Framework:** Express.js
- **Database:** Redis (JSON data type)
- **Validation:** Zod
- **Logging:** Winston

## Project Structure
```
cart-service/
├── src/
│   ├── index.ts              # Entry point
│   ├── server.ts             # Express server setup
│   ├── redis/
│   │   ├── types.ts          # TypeScript interfaces
│   │   └── redisClient.ts    # Redis client configuration
│   ├── services/
│   │   └── cartService.ts    # Business logic
│   ├── routes/
│   │   └── cartRoutes.ts     # API routes
│   ├── middleware/
│   │   ├── errorHandler.ts   # Error handling
│   │   └── validator.ts      # Request validation
│   └── logger.ts             # Structured logging
├── __tests__/
│   ├── cartService.test.ts   # Unit tests
│   └── integration/
│       └── cartApi.test.ts   # Integration tests
├── Dockerfile
├── docker-compose.yml
├── package.json
├── tsconfig.json
├── jest.config.json
└── .eslintrc.json
```

## Setup

### Prerequisites
- Node.js 20+
- Redis 7+
- npm or yarn

### Installation
```bash
cd cart-service
npm install
```

### Environment Variables
Create a `.env` file in the root directory:
```env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
CART_SERVICE_PORT=3000
LOG_LEVEL=info
```

### Running Locally
1. Start Redis:
```bash
# Using docker-compose
docker-compose up -d

# Or start Redis directly
redis-server
```

2. Start the service:
```bash
npm run dev
```

The service will start on port 3000.

## API Endpoints

### Add Item to Cart
```http
POST /cart/add
Content-Type: application/json

{
  "userId": "user_123",
  "sessionId": "guest_abc123",
  "itemId": "prod_456",
  "quantity": 2,
  "price": 29.99,
  "name": "Wireless Headphones"
}

Response: 201 Created
{
  "message": "Item added to cart successfully",
  "cart": { ... }
}
```

### Update Item in Cart
```http
PUT /cart/update
Content-Type: application/json

{
  "userId": "user_123",
  "sessionId": "guest_abc123",
  "itemId": "prod_456",
  "quantity": 5,
  "price": 34.99,
  "name": "Updated Headphones"
}

Response: 200 OK
{
  "message": "Item updated in cart successfully",
  "cart": { ... }
}
```

### Remove Item from Cart
```http
DELETE /cart/remove
Content-Type: application/json

{
  "userId": "user_123",
  "sessionId": "guest_abc123",
  "itemId": "prod_456"
}

Response: 204 No Content
```

### Retrieve User Cart
```http
GET /cart/:userId?sessionId=guest_abc123

Response: 200 OK
{
  "cart": {
    "userId": "user_123",
    "sessionId": "guest_abc123",
    "version": 1,
    "items": [ ... ],
    "meta": { ... }
  }
}
```

### Clear User Cart
```http
DELETE /cart/:userId
Content-Type: application/json

{
  "sessionId": "guest_abc123"
}

Response: 204 No Content
```

## Testing

### Unit Tests
```bash
npm test
```

### Integration Tests
```bash
npm run test:integration
```

### Coverage Report
```bash
npm test -- --coverage
```

## Docker

### Build Image
```bash
docker build -t cart-service:latest .
```

### Run Container
```bash
docker run -p 3000:3000 \
  -e REDIS_HOST=host.docker.internal \
  -e REDIS_PORT=6379 \
  cart-service:latest
```

### With Docker Compose
```bash
docker-compose up -d
```

## Kubernetes Deployment

### Resource Requirements
```yaml
resources:
  requests:
    memory: "256Mi"
    cpu: "250m"
  limits:
    memory: "512Mi"
    cpu: "500m"
```

### Environment Variables
```yaml
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

## Development

### Linting
```bash
npm run lint
npm run lint:fix
```

### Build
```bash
npm run build
```

### Start Production
```bash
npm start
```

## Error Codes

| Code | Description |
|------|-------------|
| `CART_NOT_FOUND` | Cart doesn't exist for user |
| `INVALID_CART_ITEM` | Invalid item data (quantity, price) |
| `CART_FULL` | Cart exceeds 100 items limit |
| `SERVICE_UNAVAILABLE` | Redis connection failure |
| `VALIDATION_ERROR` | Request validation failed |

## Compliance

- All API endpoints validate JWT authentication for authenticated users
- Guest sessions use cryptographically secure UUIDs
- Cart data never includes payment information (PCI-DSS compliance)
- Audit logs record all cart modifications for compliance
- Rate limiting: Maximum 100 requests/minute per user IP
