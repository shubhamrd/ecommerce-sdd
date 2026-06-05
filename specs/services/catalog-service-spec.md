# Catalog Service Specification

**Version:** 1.0.0  
**Service:** catalog-service  
**Runtime:** Node.js 20 (TypeScript)  
**Storage:** DynamoDB (products), Redis (cache), Elasticsearch (search)

---

## 1. Feature Overview

The Catalog Service manages product discovery, inventory tracking, and search functionality. It's optimized for read-heavy operations with aggressive caching strategies.

### Key Requirements
- Sub-50ms P99 latency for product lookups
- Cache hit rate > 95% for popular products
- Support for 10,000+ concurrent product searches
- Inventory tracking with real-time availability
- Multi-language and multi-currency support

### Business Rules
- Products can be active/inactive/discontinued
- Inventory reserved during active cart/checkout
- Product images stored in S3
- Search supports filtering, sorting, pagination
- Category hierarchy maintained

---

## 2. Technical Requirements

### 2.1 REST API Endpoints

| Method | Endpoint | Description | Auth | Query Params | Response |
|--------|----------|-------------|------|--------------|----------|
| GET | `/catalog/products` | List products | No | `page`, `limit`, `category`, `sort`, `minPrice`, `maxPrice`, `search` | `200 OK` |
| GET | `/catalog/products/:id` | Get product details | No | N/A | `200 OK` |
| POST | `/catalog/products` | Create product | Yes (admin) | N/A | `201 Created` |
| PUT | `/catalog/products/:id` | Update product | Yes (admin) | N/A | `200 OK` |
| DELETE | `/catalog/products/:id` | Delete product | Yes (admin) | N/A | `204 No Content` |
| GET | `/catalog/categories` | List categories | No | N/A | `200 OK` |
| GET | `/catalog/brands` | List brands | No | N/A | `200 OK` |

### 2.2 Product Query Parameters

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `page` | integer | Page number (default: 1) | `page=2` |
| `limit` | integer | Items per page (max: 100) | `limit=20` |
| `category` | string | Filter by category | `category=electronics` |
| `brand` | string | Filter by brand | `brand=sony` |
| `minPrice` | integer | Minimum price in cents | `minPrice=1000` |
| `maxPrice` | integer | Maximum price in cents | `maxPrice=50000` |
| `sort` | string | Sort field: `price_asc`, `price_desc`, `newest`, `rating` | `sort=price_asc` |
| `search` | string | Full-text search | `search=wireless+headphones` |

### 2.3 DynamoDB Schema (Products)

**Table:** `products`

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
  "brand": "TechBrand",
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
    "color": "Black",
    "weight": "250g",
    "batteryLife": "30 hours"
  },
  "seo": {
    "title": "Wireless Headphones",
    "description": "Premium audio headphones",
    "keywords": ["headphones", "wireless"]
  },
  "rating": {
    "average": 4.5,
    "count": 123
  },
  "status": "active",
  "createdAt": "2026-06-01T00:00:00.000Z",
  "updatedAt": "2026-06-05T10:00:00.000Z"
}
```

**DynamoDB Indexes:**
- **PK:** `productId`
- **GSI1:** `category` (for category filtering)
- **GSI2:** `brand` (for brand filtering)
- **GSI3:** `status` + `createdAt` (for newest products)

### 2.4 Redis Cache Schema

**Keys:**
- `product:{productId}` - Individual product cache (TTL: 1 hour)
- `products:category:{categoryId}:page:{page}` - Category listing cache (TTL: 5 minutes)
- `products:search:{query}` - Search results cache (TTL: 5 minutes)
- `inventory:{productId}` - Inventory cache (TTL: 30 seconds)

**Example:**
```json
{
  "productId": "prod_456",
  "name": "Wireless Headphones",
  "price": 2999,
  "inventory": {
    "available": 95
  },
  "cachedAt": "2026-06-05T10:30:00.000Z"
}
```

### 2.5 Elasticsearch Index

**Index:** `products`

```json
{
  "productId": "prod_456",
  "name": "Wireless Headphones",
  "description": "Premium noise-canceling headphones",
  "category": "electronics",
  "brand": "TechBrand",
  "price": 2999,
  "rating": 4.5,
  "inventoryAvailable": 95,
  "status": "active",
  "createdAt": "2026-06-01T00:00:00.000Z"
}
```

---

## 3. Implementation Tasks

### 3.1 Project Setup (Create)

- [ ] Initialize Node.js project with TypeScript
- [ ] Install dependencies: `express`, `redis`, `@elastic/elasticsearch`, `uuid`
- [ ] Configure DynamoDB client with AWS SDK v3
- [ ] Set up project structure (controllers, services, repositories, routes)

### 3.2 Database Setup (Create)

- [ ] Create DynamoDB `products` table with productId as PK
- [ ] Create GSIs for category, brand, status filtering
- [ ] Create Elasticsearch cluster for search
- [ ] Implement product repository pattern

### 3.3 Cache Implementation (Create)

- [ ] Implement `cacheProduct()` - Cache individual product
- [ ] Implement `getCachedProduct()` - Get product from cache
- [ ] Implement `invalidateProductCache()` - Cache invalidation on update
- [ ] Implement `cacheProductList()` - Cache paginated listings
- [ ] Implement cache invalidation on inventory changes

### 3.4 Search Implementation (Create)

- [ ] Implement Elasticsearch indexing on product creation
- [ ] Implement search query with filtering and sorting
- [ ] Implement autocomplete suggestions
- [ ] Implement product suggestions based on purchase history

### 3.5 Inventory Management (Create)

- [ ] Implement `reserveInventory()` - Reserve during cart
- [ ] Implement `releaseInventory()` - Release on cart delete
- [ ] Implement `decrementInventory()` - Decrement on order
- [ ] Implement inventory synchronization from DynamoDB

---

## 4. Testing Directives

### 4.1 Unit Tests (Test)

- [ ] **test('getProduct should return product from Redis cache')** - Cache hit
- [ ] **test('getProduct should query DynamoDB on cache miss')** - Cache miss
- [ ] **test('listProducts should return paginated results')** - Pagination
- [ ] **test('listProducts should filter by category')** - Category filter
- [ ] **test('listProducts should sort by price')** - Sorting
- [ ] **test('searchProducts should query Elasticsearch')** - Search
- [ ] **test('updateProduct should invalidate cache')** - Cache invalidation
- [ ] **test('reserveInventory should decrement available quantity')** - Inventory logic

### 4.2 Integration Tests (Test)

- [ ] **test('GET /catalog/products returns paginated list')** - Full listing
- [ ] **test('GET /catalog/products filters by category and price')** - Filtering
- [ ] **test('GET /catalog/products sorts by price ascending')** - Sorting
- [ ] **test('GET /catalog/products/:id returns product details')** - Product details
- [ ] **test('Search returns results matching query')** - Full-text search
- [ ] **test('Inventory updates reflect in cache')** - Cache consistency

### 4.3 Performance Tests (Test)

- [ ] **test('P99 latency for product lookup < 50ms')** - Performance SLA
- [ ] **test('Cache hit rate > 95% for popular products')** - Cache efficiency
- [ ] **test('Search returns results in < 200ms')** - Search performance
- [ ] **test('Handles 1000 concurrent product searches')** - Load testing

---

## 5. Execution & Runtime

### 5.1 Environment Variables (Execute)

```bash
# .env
CATALOG_PORT=3002
REDIS_HOST=localhost
REDIS_PORT=6379
DYNAMODB_TABLE_PRODUCTS=products
ELASTICSEARCH_URL=http://localhost:9200
AWS_REGION=us-east-1
S3_BUCKET_IMAGES=ecommerce-images
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

EXPOSE 3002
CMD ["node", "dist/index.js"]
```

### 5.3 Kubernetes Deployment (Execute)

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: catalog-service
  namespace: ecommerce-prod
spec:
  replicas: 3
  selector:
    matchLabels:
      app: catalog-service
  template:
    metadata:
      labels:
        app: catalog-service
    spec:
      containers:
      - name: catalog-service
        image: catalog-service:latest
        ports:
        - containerPort: 3002
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
            port: 3002
          initialDelaySeconds: 10
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 3002
          initialDelaySeconds: 5
          periodSeconds: 5
        env:
        - name: REDIS_HOST
          valueFrom:
            secretKeyRef:
              name: redis-secrets
              key: host
        - name: ELASTICSEARCH_URL
          valueFrom:
            secretKeyRef:
              name: es-secrets
              key: url
```

### 5.4 Deployment Commands (Execute)

```bash
# Build and push image
docker build -t catalog-service:$(git rev-parse --short HEAD) .
docker tag catalog-service:latest aws-account.dkr.ecr.us-east-1.amazonaws.com/catalog-service:latest
docker push aws-account.dkr.ecr.us-east-1.amazonaws.com/catalog-service:latest

# Deploy to Kubernetes
kubectl apply -f k8s-manifests/services/catalog/

# Verify deployment
kubectl rollout status deployment/catalog-service -n ecommerce-prod
```

### 5.5 Testing Commands (Execute)

```bash
# Test product listing
curl -X GET "http://localhost:3002/catalog/products?page=1&limit=20&category=electronics&sort=price_asc"

# Test product search
curl -X GET "http://localhost:3002/catalog/products?search=wireless+headphones"

# Test product details
curl -X GET "http://localhost:3002/catalog/products/prod_456"

# Test cache hit/miss
curl -X GET "http://localhost:3002/catalog/products/prod_456" -H "X-Cache-Status: true"
```

---

## 6. Compliance & Security

- Product images must be scanned for malware before upload
- Search queries must be sanitized to prevent injection
- Inventory data must be consistent across all sources
- PII must never be stored in product data
- All catalog operations must be logged for audit

---

*Specification Version: 1.0.0 | Last Updated: 2026-06-05*
