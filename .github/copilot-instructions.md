# Copilot Instructions - E-commerce SDD Project

**Version:** 1.0.0  
**Effective Date:** 2026-06-05  
**Owner:** Platform Architecture Team

---

## 1. Architectural Principles

All code and infrastructure must adhere to these architectural imperatives:

### 1.1 Stateless Services
- All microservices MUST be stateless. Session state, user data, and business state MUST be persisted to external data stores (DynamoDB, RDS, or external cache).
- Services MUST NOT rely on in-memory state for request correlation or business logic.
- Any required service state MUST be managed via Kubernetes StatefulSets with persistent volume claims, explicitly justified in PR documentation.

### 1.2 API-First Design
- All service interfaces MUST be defined using OpenAPI 3.0 specifications BEFORE implementation.
- API contracts MUST be versioned (`/api/v1/`, `/api/v2/`). Breaking changes require new version paths.
- Internal service-to-service communication MUST use gRPC or well-defined REST APIs with JSON payloads.
- All APIs MUST document error codes, rate limits, and authentication requirements.

### 1.3 Secure Communication
- All external-facing APIs MUST enforce TLS 1.3.
- Internal service-to-service communication MUST use mutual TLS (mTLS) in Kubernetes.
- Secrets MUST never appear in environment variables, logs, or request/response bodies. Use AWS Secrets Manager or Kubernetes Secrets with encryption at rest.
- All AWS resources MUST enforce IAM least-privilege access policies.

---

## 2. Coding Standards

### 2.1 TypeScript Configuration
All TypeScript code MUST conform to the following:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noImplicitThis": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "skipLibCheck": true,
    "declaration": true,
    "outDir": "./dist",
    "rootDir": "./src"
  }
}
```

- `strict: true` is MANDATORY. No exceptions without CTO approval.
- All async functions MUST have explicit `Promise<T>` return types.
- Interface definitions MUST be used for all API contracts and data transfer objects (DTOs).

### 2.2 Error Handling
- Implement a standardized error hierarchy:
  ```typescript
  abstract class AppError extends Error {
    constructor(
      public readonly statusCode: number,
      public readonly errorCode: string,
      public readonly message: string,
      public readonly details?: Record<string, unknown>
    ) {
      super(message);
    }
  }
  ```
- All HTTP endpoints MUST catch errors and return standardized responses:
  ```json
  {
    "error": {
      "code": "SERVICE_UNAVAILABLE",
      "message": "External dependency failed",
      "details": { "reason": "database connection timeout" }
    }
  }
  ```
- Never return raw stack traces to clients. Log full details server-side.

### 2.3 Logging Standards
- Use structured JSON logging with the following mandatory fields:
  ```json
  {
    "timestamp": "2026-06-05T10:30:00.000Z",
    "level": "info|warn|error|debug",
    "service": "order-service",
    "traceId": "abc123",
    "spanId": "def456",
    "message": "Order created successfully",
    "data": { "orderId": "ORD-789" }
  }
  ```
- All log entries MUST include `traceId` and `spanId` for distributed tracing.
- Use `pino` or `winston` with JSON transport. No console.log statements without context.

---

## 3. Infrastructure & DevOps Guardrails

### 3.1 Dockerfile Requirements
All Dockerfiles MUST follow these rules:

- **Multi-stage builds are MANDATORY**:
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
  COPY --from=builder /app/package*.json ./
  
  # Non-root user is MANDATORY
  RUN addgroup -g 1001 -S nodejs && \
      adduser -S nodejs -u 1001
  USER nodejs
  
  EXPOSE 3000
  CMD ["node", "dist/main.js"]
  ```

- NEVER use `FROM node:latest` or `node:alpine` without explicit version pinning.
- All production images MUST run as non-root users.
- Image scanning (Trivy, Snyk) MUST pass before deployment.

### 3.2 Kubernetes Manifests
- All deployments MUST specify resource requests and limits:
  ```yaml
  resources:
    requests:
      memory: "256Mi"
      cpu: "250m"
    limits:
      memory: "512Mi"
      cpu: "500m"
  ```
- Liveness and readiness probes are MANDATORY for all services.
- Network policies MUST restrict inter-service communication to required endpoints only.

### 3.3 Terraform Module Constraints
- All Terraform code MUST follow the AWS Landing Zone pattern.
- Modules MUST be versioned (`module "vpc" { source = "git::https://...?ref=v1.2.0" }`).
- Sensitive values MUST use `sensitive = true` and never be logged.
- All resources MUST have tags: `Project`, `Environment`, `Owner`, `CostCenter`.
- `terraform plan` output MUST be reviewed in CI/CD before any apply operation.
- Remote state MUST be stored in S3 with DynamoDB locking.

---

## 4. AI Assistant Directives

### 4.1 Implementation Rules

**DO:**
- Generate unit tests (Jest/Mocha) for ALL business logic and API endpoints.
- Generate integration tests for critical user journeys using testcontainers or localstack.
- Suggest design patterns (Factory, Strategy, Repository) when they improve code clarity.
- Reference existing code patterns in the repository when generating similar functionality.
- Propose infrastructure improvements when security or scalability issues are detected.

**DO NOT:**
- Introduce third-party NPM packages without explicit approval from the Security Team.
- Generate code that handles secrets, API keys, or credentials directly.
- Use deprecated or alpha-stage libraries without justification.
- Generate database migration scripts without explicit migration framework (e.g., Prisma, TypeORM).
- Skip authentication/authorization checks in API implementations.
- Generate Terraform code that creates resources with public access by default.

### 4.2 Specification Ambiguity Protocol

When the specification is ambiguous or incomplete:

1. **DO NOT guess or assume behavior.**
2. Output a structured clarification request:
   ```
   [CLARIFICATION REQUEST]
   Spec ambiguity detected in [module/endpoint].
   Questions:
   1. [Specific question about behavior]
   2. [Specific question about constraints]
   Expected outcome: [What you need to proceed]
   ```

3. If ambiguity affects security or data integrity, escalate to the Architecture Review Board (ARB).

### 4.3 Code Review Expectations

- All Pull Requests MUST include:
  - Unit test coverage (minimum 80% for business logic)
  - API contract updates (OpenAPI spec if changed)
  - Infrastructure changes with `terraform plan` output
  - Security review checklist completed
- Copilot MUST flag any PR that:
  - Adds dependencies without `package-lock.json` update
  - Removes or disables security controls
  - Introduces hardcoded credentials or secrets

---

## 5. Compliance & Enforcement

- All generated code MUST pass ESLint (Airbnb config), Prettier, and TypeScript compiler checks.
- Infrastructure code MUST pass `tflint` and `tfsec` scans.
- Violations of these instructions MUST be flagged in CI/CD pipelines and block merges.
- This document is living. Updates require approval from Platform Architecture Team and Security Team.

---

*This document represents binding governance for all AI-assisted development in this repository.*
