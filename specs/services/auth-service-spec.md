# Auth Service Specification

**Version:** 1.0.0  
**Service:** auth-service  
**Runtime:** Node.js 20 (TypeScript)  
**Storage:** DynamoDB (users), Redis (sessions)  
**Token:** JWT (access + refresh)

---

## 1. Feature Overview

The Auth Service handles user authentication, authorization, and session management. It implements JWT-based authentication with short-lived access tokens and long-lived refresh tokens.

### Key Requirements
- JWT access tokens: 15 minutes expiration
- JWT refresh tokens: 7 days expiration
- Password hashing: bcrypt with cost factor 12
- Session management: Redis for active sessions
- Account lockout: 5 failed attempts → 15 minute lockout
- Multi-factor authentication: Optional (TOTP)

### Business Rules
- Password must be 8-128 characters
- Email must be unique and validated
- Users must verify email before full access
- Password reset tokens expire in 1 hour
- Active sessions tracked for security audit

---

## 2. Technical Requirements

### 2.1 REST API Endpoints

| Method | Endpoint | Description | Auth | Request Body | Response |
|--------|----------|-------------|------|--------------|----------|
| POST | `/auth/register` | Register new user | No | `{email, password, firstName, lastName}` | `201 Created` |
| POST | `/auth/login` | Login user | No | `{email, password}` | `200 OK` |
| POST | `/auth/logout` | Logout user | Yes | `{refreshToken}` | `204 No Content` |
| POST | `/auth/refresh` | Refresh tokens | Yes | `{refreshToken}` | `200 OK` |
| POST | `/auth/forgot-password` | Request password reset | No | `{email}` | `200 OK` |
| POST | `/auth/reset-password` | Reset password | No | `{token, password}` | `200 OK` |
| GET | `/auth/me` | Get current user | Yes | N/A | `200 OK` |
| PUT | `/auth/profile` | Update profile | Yes | `{firstName, lastName, preferences}` | `200 OK` |
| POST | `/auth/mfa/enable` | Enable MFA | Yes | `{secret, code}` | `200 OK` |
| POST | `/auth/mfa/verify` | Verify MFA code | Yes | `{code}` | `200 OK` |

### 2.2 JWT Payload Structure

**Access Token (15 min):**
```json
{
  "sub": "user_123",
  "email": "user@example.com",
  "scope": ["read:profile", "write:profile", "read:cart"],
  "iat": 1685962200,
  "exp": 1685963100,
  "type": "access"
}
```

**Refresh Token (7 days):**
```json
{
  "sub": "user_123",
  "sessionId": "sess_abc123",
  "iat": 1685962200,
  "exp": 1686567000,
  "type": "refresh"
}
```

### 2.3 DynamoDB Schema (Users)

**Table:** `users`

```json
{
  "userId": "user_123",
  "email": "user@example.com",
  "passwordHash": "$2b$12$...",
  "firstName": "John",
  "lastName": "Doe",
  "emailVerified": false,
  "verificationToken": "token_xyz",
  "verificationTokenExpiry": "2026-06-06T12:00:00.000Z",
  "passwordResetToken": null,
  "passwordResetTokenExpiry": null,
  "mfaEnabled": false,
  "mfaSecret": null,
  "createdAt": "2026-06-05T10:30:00.000Z",
  "updatedAt": "2026-06-05T10:30:00.000Z",
  "lastLogin": null,
  "failedLoginAttempts": 0,
  "accountLockedUntil": null
}
```

### 2.4 Redis Schema (Sessions)

**Key:** `session:{userId}:{sessionId}`  
**TTL:** 7 days (matches refresh token)

```json
{
  "userId": "user_123",
  "sessionId": "sess_abc123",
  "refreshTokenHash": "sha256_hash_of_refresh_token",
  "createdAt": "2026-06-05T10:30:00.000Z",
  "lastUsed": "2026-06-05T10:30:00.000Z",
  "userAgent": "Mozilla/5.0...",
  "ipAddress": "203.0.113.1"
}
```

### 2.5 Error Responses

```json
{
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Invalid email or password",
    "details": null
  }
}
```

Error Codes:
- `USER_EXISTS`: Email already registered
- `INVALID_CREDENTIALS`: Wrong password
- `ACCOUNT_LOCKED`: Too many failed attempts
- `TOKEN_EXPIRED`: Token has expired
- `TOKEN_INVALID`: Token is invalid
- `MFA_REQUIRED`: MFA code required
- `MFA_INVALID`: Invalid MFA code

---

## 3. Implementation Tasks

### 3.1 Project Setup (Create)

- [ ] Initialize Node.js project with TypeScript
- [ ] Install dependencies: `express`, `jsonwebtoken`, `bcrypt`, `redis`, `uuid`
- [ ] Configure `tsconfig.json` with strict mode
- [ ] Set up project structure (controllers, services, routes, middleware)

### 3.2 Database Setup (Create)

- [ ] Create DynamoDB `users` table with userId as PK
- [ ] Create GSI for email lookup
- [ ] Implement user repository pattern
- [ ] Add encryption for sensitive fields (AWS KMS)

### 3.3 Authentication Logic (Create)

- [ ] Implement `registerUser()` - Hash password, create user, send verification email
- [ ] Implement `loginUser()` - Validate credentials, generate tokens, track session
- [ ] Implement `refreshTokens()` - Validate refresh token, issue new tokens
- [ ] Implement `logoutUser()` - Delete session from Redis
- [ ] Implement `verifyEmail()` - Mark user as verified
- [ ] Implement `forgotPassword()` - Generate reset token, send email
- [ ] Implement `resetPassword()` - Validate token, update password

### 3.4 JWT Handling (Create)

- [ ] Implement JWT signing with HS256 algorithm
- [ ] Implement JWT verification middleware
- [ ] Implement token refresh logic
- [ ] Store refresh tokens in Redis with hash

### 3.5 Security Middleware (Create)

- [ ] Implement rate limiting for login/register
- [ ] Implement account lockout logic
- [ ] Implement password complexity validation
- [ ] Implement input sanitization

---

## 4. Testing Directives

### 4.1 Unit Tests (Test)

- [ ] **test('registerUser should hash password with bcrypt')** - Password security
- [ ] **test('registerUser should create user and send verification email')** - Flow
- [ ] **test('loginUser should return 401 for invalid password')** - Validation
- [ ] **test('loginUser should return tokens on success')** - Success flow
- [ ] **test('loginUser should lock account after 5 failed attempts')** - Security
- [ ] **test('refreshTokens should return new tokens')** - Token refresh
- [ ] **test('refreshTokens should reject expired refresh token')** - Expiry
- [ ] **test('logoutUser should delete session from Redis')** - Cleanup

### 4.2 Integration Tests (Test)

- [ ] **test('POST /auth/register returns 201 with user data')** - Full flow
- [ ] **test('POST /auth/login returns 401 for invalid credentials')** - Error path
- [ ] **test('POST /auth/refresh returns 403 for tampered token')** - Security
- [ ] **test('GET /auth/me returns current user data')** - Protected route
- [ ] **test('Account lockout after 5 failed login attempts')** - Security
- [ ] **test('Password reset flow with valid token')** - Reset flow

### 4.3 Security Tests (Test)

- [ ] **test('Password stored as bcrypt hash, never plaintext')** - Security
- [ ] **test('Invalid JWT returns 401')** - Token validation
- [ ] **test('Token with modified payload returns 401')** - Tamper detection

---

## 5. Execution & Runtime

### 5.1 Environment Variables (Execute)

```bash
# .env
AUTH_PORT=3001
JWT_ACCESS_SECRET=your-super-secret-access-key
JWT_REFRESH_SECRET=your-super-secret-refresh-key
JWT_ACCESS_EXPIRES_IN=900
JWT_REFRESH_EXPIRES_IN=604800
REDIS_HOST=localhost
REDIS_PORT=6379
DYNAMODB_TABLE_USERS=users
AWS_REGION=us-east-1
EMAIL_SERVICE=sendgrid
EMAIL_FROM=noreply@ecommerce.example.com
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

EXPOSE 3001
CMD ["node", "dist/index.js"]
```

### 5.3 Kubernetes Deployment (Execute)

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: auth-service
  namespace: ecommerce-prod
spec:
  replicas: 3
  selector:
    matchLabels:
      app: auth-service
  template:
    metadata:
      labels:
        app: auth-service
    spec:
      containers:
      - name: auth-service
        image: auth-service:latest
        ports:
        - containerPort: 3001
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
            port: 3001
          initialDelaySeconds: 10
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 3001
          initialDelaySeconds: 5
          periodSeconds: 5
        env:
        - name: JWT_ACCESS_SECRET
          valueFrom:
            secretKeyRef:
              name: auth-secrets
              key: jwt-access-secret
        - name: JWT_REFRESH_SECRET
          valueFrom:
            secretKeyRef:
              name: auth-secrets
              key: jwt-refresh-secret
        - name: REDIS_HOST
          valueFrom:
            secretKeyRef:
              name: redis-secrets
              key: host
```

### 5.4 Deployment Commands (Execute)

```bash
# Build and push image
docker build -t auth-service:$(git rev-parse --short HEAD) .
docker tag auth-service:latest aws-account.dkr.ecr.us-east-1.amazonaws.com/auth-service:latest
docker push aws-account.dkr.ecr.us-east-1.amazonaws.com/auth-service:latest

# Deploy to Kubernetes
kubectl apply -f k8s-manifests/services/auth/

# Verify deployment
kubectl rollout status deployment/auth-service -n ecommerce-prod
kubectl get pods -n ecommerce-prod -l app=auth-service
```

---

## 6. Compliance & Security

- Passwords must use bcrypt with cost factor ≥ 12
- JWT secrets must be stored in AWS Secrets Manager
- All tokens must have short expiration times
- Failed login attempts must be logged for security audit
- Account lockout must prevent brute force attacks
- Session tokens must be invalidated on logout

---

*Specification Version: 1.0.0 | Last Updated: 2026-06-05*
