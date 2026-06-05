# E-commerce Platform - Spec-Driven Development (SDD)

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-20.x-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/typescript-5.x-blue.svg)](https://typescriptlang.org/)
[![Kubernetes](https://img.shields.io/badge/kubernetes-1.28+-blue.svg)](https://kubernetes.io/)
[![Terraform](https://img.shields.io/badge/terraform-1.5+-blue.svg)](https://terraform.io/)

A modern, scalable e-commerce platform built using **Spec-Driven Development (SDD)** with a microservices architecture on AWS.

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Development](#development)
- [Deployment](#deployment)
- [Testing](#testing)
- [Documentation](#documentation)
- [Compliance](#compliance)
- [Contributing](#contributing)

---

## Overview

This e-commerce platform is designed for high availability, scalability, and rapid iteration. It processes thousands of concurrent users, manages inventory in real-time, and processes payments securely.

### Key Features

- ✅ Real-time shopping cart with Redis caching
- ✅ Product catalog with Elasticsearch search
- ✅ User authentication with JWT tokens
- ✅ Order processing with transactional consistency
- ✅ Stripe payment integration
- ✅ Multi-region AWS infrastructure
- ✅ Kubernetes orchestration
- ✅ Infrastructure as Code with Terraform

---

## Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                    AWS ALB Ingress                                  │
│               api.ecommerce.example.com                            │
└─────────────────────────────────────────────────────────────────────┘
                                    │
        ┌───────────────────────────┼───────────────────────────┐
        ▼                           ▼                           ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Auth Service  │     │ Catalog Service │     │  Cart Service   │
│   (Port 3001)   │     │  (Port 3002)    │     │   (Port 3000)   │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                       │                       │
        ▼                       ▼                       ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Order Service │     │ Payment Service │     │   User Service  │
│   (Port 3003)   │     │  (Port 3004)    │     │   (Port 3005)   │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                       │
        ▼                       ▼
┌─────────────────┐     ┌─────────────────┐
│   Redis Cluster │     │   DynamoDB      │
│   (ElastiCache) │     │   (Tables)      │
└─────────────────┘     └─────────────────┘
```

### Service Boundaries

| Service | Port | Description |
|---------|------|-------------|
| **Cart Service** | 3000 | Shopping cart management with Redis |
| **Auth Service** | 3001 | User authentication with JWT tokens |
| **Catalog Service** | 3002 | Product discovery and search |
| **Order Service** | 3003 | Order processing and checkout |
| **Payment Service** | 3004 | Payment processing with Stripe |

---

## Tech Stack

### Backend
- **Runtime:** Node.js 20 (TypeScript)
- **Framework:** Express.js
- **Database:** DynamoDB, PostgreSQL (RDS)
- **Cache:** Redis (ElastiCache)
- **Search:** Elasticsearch
- **Storage:** S3 (product images)

### Infrastructure
- **Orchestration:** Kubernetes (AWS EKS)
- **IaC:** Terraform
- **CI/CD:** GitHub Actions
- **Monitoring:** Prometheus + Grafana
- **Logging:** CloudWatch Logs

### Security
- **Authentication:** JWT tokens with refresh tokens
- **Encryption:** TLS 1.3, KMS for data at rest
- **Compliance:** PCI-DSS, GDPR

---

## Project Structure

```
ecommerce-sdd/
├── .github/
│   ├── copilot-instructions.md     # AI assistant governance
│   └── workflows/                  # CI/CD pipelines
├── specs/                          # SDD specification documents
│   ├── architecture/
│   │   ├── 01-system-overview.md
│   │   ├── 02-data-models.md
│   │   └── 03-api-gateway-routing.md
│   ├── services/
│   │   ├── auth-service-spec.md
│   │   ├── catalog-service-spec.md
│   │   ├── cart-service-spec.md
│   │   ├── order-checkout-service-spec.md
│   │   └── payment-service-spec.md
│   └── infrastructure/
│       ├── aws-terraform-spec.md
│       └── k8s-deployment-spec.md
├── src/                            # Source code
│   └── cart-service/               # Cart microservice
│       ├── src/                    # TypeScript source
│       ├── __tests__/              # Unit and integration tests
│       ├── k8s/                    # Kubernetes manifests
│       ├── Dockerfile
│       ├── docker-compose.yml
│       ├── package.json
│       └── tsconfig.json
├── scripts/                        # Utility scripts
│   └── setup-specs.sh              # Specification directory setup
└── README.md                       # This file
```

---

## Getting Started

### Prerequisites

- Node.js 20+
- Docker and Docker Compose
- kubectl with Kubernetes cluster access
- Terraform 1.5+
- AWS CLI configured

### Local Development

1. **Clone the repository:**
```bash
git clone <repository-url>
cd ecommerce-sdd
```

2. **Set up specification directory:**
```bash
./scripts/setup-specs.sh
```

3. **Start cart service locally:**
```bash
cd src/cart-service
npm install
npm run dev
```

4. **Start Redis (if not running):**
```bash
docker-compose up -d redis
```

The cart service will start on `http://localhost:3000`.

---

## Development

### Running the Cart Service

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Build for production
npm run build

# Run tests
npm test

# Lint code
npm run lint
```

### Available npm Scripts

| Script | Description |
|--------|-------------|
| `build` | Compile TypeScript to JavaScript |
| `start` | Start production server |
| `dev` | Run in development mode with auto-reload |
| `test` | Run unit tests with coverage |
| `test:watch` | Run tests in watch mode |
| `lint` | Run ESLint |
| `lint:fix` | Auto-fix linting issues |

### Code Quality

- **TypeScript:** Strict mode enabled
- **Linting:** Airbnb ESLint configuration
- **Formatting:** Prettier with Airbnb config
- **Testing:** Jest with 80% minimum coverage

---

## Deployment

### Docker Deployment

```bash
# Build image
docker build -t cart-service:latest .

# Run container
docker run -p 3000:3000 \
  -e REDIS_HOST=host.docker.internal \
  -e REDIS_PORT=6379 \
  cart-service:latest
```

### Kubernetes Deployment

```bash
# Apply all manifests
kubectl apply -f src/cart-service/k8s/cart-manifests-bundle.yaml

# Verify deployment
kubectl rollout status deployment/cart-service -n ecommerce-prod

# Check service
kubectl get svc cart-service -n ecommerce-prod
```

### AWS Deployment

```bash
# Initialize Terraform
cd terraform
terraform init

# Plan infrastructure changes
terraform plan

# Apply infrastructure
terraform apply
```

---

## Testing

### Unit Tests

```bash
cd src/cart-service
npm test
```

### Integration Tests

```bash
npm run test:integration
```

### Load Testing

```bash
# Install k6
brew install k6

# Run load test
k6 run scripts/load-test.js
```

### Test Coverage

| Service | Unit Tests | Integration Tests | Coverage Target |
|---------|-----------|-------------------|-----------------|
| Cart | ✅ | ✅ | 80% |
| Auth | ✅ | ✅ | 80% |
| Catalog | ✅ | ✅ | 80% |
| Order | ✅ | ✅ | 80% |
| Payment | ✅ | ✅ | 80% |

---

## Documentation

### API Documentation

Once the services are running, visit:
- **Cart Service:** `http://localhost:3000/api/v1/cart`
- **Auth Service:** `http://localhost:3001/api/v1/auth`
- **Catalog Service:** `http://localhost:3002/api/v1/catalog`

### Specification Documents

All specifications are located in the `specs/` directory:

- **Architecture:** System overview, data models, API gateway routing
- **Services:** Detailed specifications for each microservice
- **Infrastructure:** Terraform and Kubernetes configurations

### Code Documentation

- TypeScript interfaces for all data models
- JSDoc comments for public functions
- README files for each service

---

## Compliance

### Security

- ✅ TLS 1.3 for all external traffic
- ✅ JWT tokens with short expiration (15 minutes)
- ✅ Password hashing with bcrypt (cost factor 12)
- ✅ Non-root containers
- ✅ Network policies for service-to-service communication
- ✅ Secrets managed via Kubernetes Secrets

### Privacy

- ✅ GDPR compliance (right to be forgotten)
- ✅ Data minimization principle
- ✅ Audit logging for data access

### PCI-DSS

- ✅ No raw card data stored
- ✅ Tokenization via Stripe
- ✅ Network segmentation
- ✅ Regular security scans

---

## Contributing

### Development Workflow

1. Create a feature branch from `main`
2. Implement changes following specifications
3. Add unit and integration tests
4. Ensure all tests pass (`npm test`)
5. Ensure linting passes (`npm run lint`)
6. Update documentation if needed
7. Open a pull request

### Pull Request Requirements

- ✅ All tests passing
- ✅ 80%+ test coverage
- ✅ Linting passes
- ✅ API documentation updated
- ✅ Kubernetes manifests updated
- ✅ Terraform plan reviewed

### Code Review Process

1. Self-review your changes
2. Request review from team members
3. Address all review comments
4. Merge to `main` after approval

---

## Resources

### Documentation

- [Node.js Documentation](https://nodejs.org/en/docs/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Terraform Documentation](https://www.terraform.io/docs/)

### Tools

- [ESLint Documentation](https://eslint.org/docs/)
- [Jest Documentation](https://jestjs.io/docs/)
- [Redis Documentation](https://redis.io/docs/)

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Support

For support, please:

1. Check the documentation
2. Review existing issues
3. Open a new issue with detailed information

---

## Acknowledgments

- Built with Spec-Driven Development methodology
- Inspired by industry best practices for microservices
- Designed for scalability and maintainability

---

*Last Updated: 2026-06-05*
