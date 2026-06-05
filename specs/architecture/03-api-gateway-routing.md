# API Gateway Routing Specification

**Version:** 1.0.0  
**Document Type:** Gateway Configuration  
**Last Updated:** 2026-06-05

---

## 1. Overview & Business Objectives

The API Gateway serves as the single entry point for all client requests to the e-commerce platform. It handles authentication, rate limiting, request routing, and response transformation to ensure consistent client experience and security.

### 1.1 Gateway Responsibilities

- **Authentication:** JWT validation for protected endpoints
- **Rate Limiting:** Per-user and per-IP rate limiting
- **Request Routing:** Path-based routing to microservices
- **CORS Handling:** Consistent CORS policy across all services
- **Request Validation:** Schema validation for incoming requests
- **Response Transformation:** Unified response format
- **Monitoring:** Request/response logging and metrics

### 1.2 Gateway Implementation Options

| Option | Provider | Pros | Cons |
|--------|----------|------|------|
| **AWS ALB + Target Groups** | AWS Native | Cost-effective, integrated | Limited features |
| **Kong Gateway** | Open Source | Rich plugins, enterprise features | Operational overhead |
| **NGINX Ingress** | Open Source | Lightweight, well-documented | Manual configuration |

**Recommended:** AWS ALB Ingress Controller for simplicity and AWS integration.

---

## 2. Technical Requirements & Data Models

### 2.1 Domain Structure

```
api.ecommerce.example.com    # Main API domain
www.ecommerce.example.com    # Public website (separate)
cdn.ecommerce.example.com    # Static assets (S3 CloudFront)
```

### 2.2 Path-Based Routing

| Path Prefix | Target Service | Port | Auth Required |
|-------------|----------------|------|---------------|
| `/api/v1/auth/*` | Auth Service | 3001 | No (except login/register) |
| `/api/v1/users/*` | Auth Service | 3001 | Yes |
| `/api/v1/catalog/*` | Catalog Service | 3002 | No |
| `/api/v1/cart/*` | Cart Service | 3000 | Yes |
| `/api/v1/orders/*` | Order Service | 3003 | Yes |
| `/api/v1/payments/*` | Payment Service | 3004 | Yes |
| `/api/v1/health` | Gateway Health Check | - | No |

### 2.3 Authentication Rules

| Endpoint Pattern | Auth Type | Token Scope |
|-----------------|-----------|-------------|
| `/api/v1/auth/login` | None | N/A |
| `/api/v1/auth/register` | None | N/A |
| `/api/v1/auth/refresh` | Refresh Token | `refresh` |
| `/api/v1/users/*` | Access Token | `read:profile`, `write:profile` |
| `/api/v1/cart/*` | Access Token | `read:cart`, `write:cart` |
| `/api/v1/orders/*` | Access Token | `read:orders`, `write:orders` |
| `/api/v1/payments/*` | Access Token | `read:payments`, `write:payments` |

### 2.4 Rate Limiting Configuration

| Endpoint | Requests/Minute | Burst | Scope |
|----------|-----------------|-------|-------|
| `/api/v1/auth/login` | 5 | 1 | Per IP |
| `/api/v1/auth/register` | 3 | 1 | Per IP |
| `/api/v1/catalog/*` | 100 | 20 | Per user |
| `/api/v1/cart/*` | 60 | 10 | Per user |
| `/api/v1/orders/*` | 30 | 5 | Per user |
| `/api/v1/payments/*` | 10 | 2 | Per user |

### 2.5 CORS Policy

```json
{
  "allowedOrigins": [
    "https://www.ecommerce.example.com",
    "https://staging.ecommerce.example.com"
  ],
  "allowedMethods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  "allowedHeaders": [
    "Content-Type",
    "Authorization",
    "X-Request-ID",
    "X-Client-Version"
  ],
  "exposeHeaders": ["X-RateLimit-Remaining", "X-Request-ID"],
  "maxAge": 86400,
  "allowCredentials": true
}
```

---

## 3. Implementation Tasks

### 3.1 AWS ALB Ingress Setup (Create)

- [ ] Create ALB with public subnets in 2 AZs
- [ ] Configure HTTPS listener with ACM certificate
- [ ] Create target groups for each microservice
- [ ] Configure health check endpoints for each service

### 3.2 Ingress Rules (Create)

- [ ] Create `ingress.yaml` with path-based routing rules
- [ ] Configure annotations for ALB features
- [ ] Set up SSL redirection

### 3.3 Authentication Middleware (Create)

- [ ] Implement JWT validation middleware
- [ ] Token refresh endpoint
- [ ] Session management

### 3.4 Rate Limiting (Create)

- [ ] Configure Redis-backed rate limiting
- [ ] Implement sliding window algorithm
- [ ] Add rate limit headers to responses

### 3.5 Logging & Monitoring (Create)

- [ ] Configure request logging to CloudWatch
- [ ] Add X-Ray tracing integration
- [ ] Set up metrics for each route

---

## 4. Testing Directives

### 4.1 Routing Tests (Test)

- [ ] **test('GET /api/v1/catalog/products routes to catalog-service')** - Path routing
- [ ] **test('POST /api/v1/auth/login routes to auth-service')** - Auth routing
- [ ] **test('GET /api/v1/cart routes to cart-service')** - Protected route
- [ ] **test('404 returned for undefined routes')** - Default handler

### 4.2 Authentication Tests (Test)

- [ ] **test('Unauthorized access returns 401')** - Auth check
- [ ] **test('Valid JWT grants access')** - Token validation
- [ ] **test('Expired JWT returns 401')** - Token expiry
- [ ] **test('Invalid token scope returns 403')** - Scope check

### 4.3 Rate Limiting Tests (Test)

- [ ] **test('Exceeding rate limit returns 429')** - Limit enforcement
- [ ] **test('Rate limit headers present in response')** - Header inclusion
- [ ] **test('Different users have separate rate limits')** - Per-user limit

### 4.4 CORS Tests (Test)

- [ ] **test('OPTIONS preflight returns 204')** - Preflight handling
- [ ] **test('Allowed origins in Access-Control-Allow-Origin')** - Origin validation
- [ ] **test('Invalid origin returns 403')** - Origin rejection

---

## 5. Execution & Runtime

### 5.1 Ingress Configuration (Execute)

```yaml
# k8s-manifests/ingress/ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: ecommerce-ingress
  namespace: ecommerce-prod
  annotations:
    kubernetes.io/ingress.class: alb
    alb.ingress.kubernetes.io/scheme: internet-facing
    alb.ingress.kubernetes.io/target-type: ip
    alb.ingress.kubernetes.io/listen-ports: '[{"HTTPS":443}]'
    alb.ingress.kubernetes.io/certificate-arn: arn:aws:acm:us-east-1:123456789:certificate/xxx
    alb.ingress.kubernetes.io/ssl-policy: ELBSecurityPolicy-TLS-1-2-2017-01
spec:
  rules:
    - host: api.ecommerce.example.com
      http:
        paths:
          - path: /api/v1/auth
            pathType: Prefix
            backend:
              service:
                name: auth-service
                port:
                  number: 3001
          - path: /api/v1/users
            pathType: Prefix
            backend:
              service:
                name: auth-service
                port:
                  number: 3001
          - path: /api/v1/catalog
            pathType: Prefix
            backend:
              service:
                name: catalog-service
                port:
                  number: 3002
          - path: /api/v1/cart
            pathType: Prefix
            backend:
              service:
                name: cart-service
                port:
                  number: 3000
          - path: /api/v1/orders
            pathType: Prefix
            backend:
              service:
                name: order-service
                port:
                  number: 3003
          - path: /api/v1/payments
            pathType: Prefix
            backend:
              service:
                name: payment-service
                port:
                  number: 3004
```

### 5.2 Apply Ingress (Execute)

```bash
# Apply ingress configuration
kubectl apply -f k8s-manifests/ingress/ingress.yaml

# Verify ingress is created
kubectl get ingress -n ecommerce-prod

# Get ALB DNS name
kubectl get ingress ecommerce-ingress -n ecommerce-prod -o jsonpath='{.status.loadBalancer.ingress[0].hostname}'
```

### 5.3 Test Endpoints (Execute)

```bash
# Test catalog endpoint
curl -X GET https://api.ecommerce.example.com/api/v1/catalog/products

# Test protected cart endpoint (should return 401)
curl -X GET https://api.ecommerce.example.com/api/v1/cart/user_123

# Test with valid token
curl -X GET https://api.ecommerce.example.com/api/v1/cart/user_123 \
  -H "Authorization: Bearer <valid-jwt-token>"

# Test rate limiting
for i in {1..100}; do curl -s -o /dev/null -w "%{http_code}\n" https://api.ecommerce.example.com/api/v1/catalog/products; done | sort | uniq -c
```

### 5.4 Monitor Ingress (Execute)

```bash
# View ALB access logs
aws logs tail /aws/alb/ecommerce-ingress --follow

# View CloudWatch metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/ApplicationELB \
  --metric-name RequestCount \
  --dimensions Name=LoadBalancer,Value=app/ecommerce-ingress/xxx \
  --start-time $(date -u -d '5 minutes ago' +%Y-%m-%dT%H:%M:%SZ) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%SZ) \
  --period 60 \
  --statistics Sum \
  --region us-east-1
```

---

## 6. Security & Compliance

- All traffic must use HTTPS (TLS 1.3 preferred)
- Invalid tokens must return 401, never expose stack traces
- Rate limits must be enforced before authentication to prevent brute force
- CORS must not allow wildcard origins for production
- All requests must include X-Request-ID for tracing

---

*Specification Version: 1.0.0 | Last Updated: 2026-06-05*
