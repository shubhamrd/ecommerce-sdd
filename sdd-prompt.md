# Spec-Driven Development (SDD) Prompt Runbook

This document contains the step-by-step prompt sequence to execute a Spec-Driven Development (SDD) workflow using an LLM (like Gemini) for planning, and GitHub Copilot for execution.

---

## Phase 1: Governance & Project Setup

### Step 1: Define AI Governance (`.github/copilot-instructions.md`)

**Description:** Generates the core rules and guardrails for the repository. This file ensures Copilot adheres to enterprise standards, specific tech stacks, and required testing practices.

**Prompt to Copy:**

```plaintext
Act as a Principal Cloud Architect. We are building a modern, scalable e-commerce application using Spec-Driven Development (SDD).
Your first task is to generate a .github/copilot-instructions.md file. This document will serve as the absolute baseline governance and context for GitHub Copilot across this entire repository.
The targeted technology stack is:
•   Backend: Node.js (TypeScript) for microservices
•   Orchestration: Docker and Kubernetes
•   Infrastructure as Code: Terraform targeting AWS
Draft the .github/copilot-instructions.md file using clean, professional Markdown. It must include the following sections:
1. Architectural Principles: Rules on stateless services, API-first design, and secure communication. 2. Coding Standards: Strict TypeScript configurations, standardized error handling paradigms, and logging formats. 3. Infrastructure & DevOps Guardrails: Mandatory Dockerfile practices (e.g., multi-stage builds, non-root users) and Terraform module constraints. 4. AI Assistant Directives: Explicit instructions for Copilot (e.g., "Do not introduce unapproved third-party NPM packages", "Always generate unit tests alongside business logic", "If a specification is ambiguous, output a clarification request instead of guessing").
Make the tone authoritative, concise, and strictly technical.
```
### Step 2: Scaffold the Specification Directory

**Description:** Generates a shell script to instantly create an industry-standard directory tree with blank markdown files for all required specifications.

**Prompt to Copy:**

```plaintext
Act as a Lead DevOps and Systems Architect. We are using Spec-Driven Development (SDD) to build a microservices-based e-commerce application.
I need to set up the industry-standard specification directory structure before we start writing the actual requirements. The specifications should be logically grouped into Architecture, Microservices, and Infrastructure.
Please generate a Bash script (or PowerShell, if on Windows) that will create a root specs/ directory and populate it with the necessary subdirectories and blank Markdown files required for a modern e-commerce platform.
The structure should look exactly like this:
specs/
├── architecture/
│   ├── 01-system-overview.md
│   ├── 02-data-models.md
│   └── 03-api-gateway-routing.md
├── services/
│   ├── auth-service-spec.md
│   ├── catalog-service-spec.md
│   ├── cart-service-spec.md
│   ├── order-checkout-service-spec.md
│   └── payment-service-spec.md
└── infrastructure/
    ├── aws-terraform-spec.md
    └── k8s-deployment-spec.md
Ensure the script uses mkdir -p to create the directories and touch to create the blank files.
```
## Phase 2: Generating Specifications

### Step 3: Write Application Logic Spec

**Description:** Fills out the blueprint for a specific microservice, complete with implementation, testing, and execution checklists.

**Prompt to Copy:**

```plaintext
Act as a Lead Systems Architect. We are building an e-commerce platform using SDD.
Write the comprehensive specification content for specs/services/cart-service-spec.md.

The core stack is Node.js (TypeScript) and Redis.

Generate the Markdown content with the following sections:
1. Feature Overview: A high-performance cart service with a 15-minute data TTL.
2. Technical Requirements: Define REST endpoints (POST /cart/add, GET /cart/:userId) and the Redis JSON schema.
3. Implementation Tasks (Create): Checklist for setting up the Express/Fastify server, Redis connection handling, and route controllers.
4. Testing Directives (Test): Require Jest unit tests for adding items, handling negative quantities, and Redis timeout simulations.
5. Execution (Execute): Provide the npm run scripts and a basic Dockerfile blueprint expectation.
```

### Step 4: Write Infrastructure Spec

**Description:** Creates the operational blueprint for deploying the application components to Kubernetes.

**Prompt to Copy:**

```plaintext
Act as a Lead Cloud Infrastructure Architect. We are using SDD to deploy an e-commerce platform.
Write the comprehensive specification content for specs/infrastructure/k8s-deployment-spec.md.

Generate the Markdown content with the following sections:
1. Architecture Overview: The Kubernetes orchestration strategy for the microservices.
2. Technical Requirements: Define the need for Deployments, ClusterIP Services, and an Ingress controller for routing.
3. Implementation Tasks (Create): Checklist for writing the YAML manifests for the cart-service (including resource limits: 256Mi memory, 250m CPU).
4. Testing Directives (Test): Instructions on how to verify pod health and readiness/liveness probes.
5. Execution (Execute): The explicit kubectl apply commands required to deploy the manifests to the cluster.
```

### Step 5: Batch Generate Remaining Specs

**Description:** A master prompt to populate all remaining blank specification files in the directory simultaneously.

**Prompt to Copy:**

```plaintext
Act as a Principal Cloud & DevOps Architect. We are building a containerized, cloud-native e-commerce application using Spec-Driven Development (SDD).
Our directory structure has been created with blank Markdown files. Your task is to generate the complete, production-grade specification content for all remaining files listed below.
Each file's content must be generated in clean, professional Markdown inside individual code blocks so I can copy them directly into their respective paths. Every single file must follow our strict SDD structural standard:
1.  Overview & Business Objectives
2.  Technical Requirements & Data Models/Contracts
3.  Implementation Tasks (Create): Granular developer checklist.
4.  Testing Directives (Test): Explicit unit/integration test coverage targets.
5.  Execution & Runtime (Execute): Commands, configurations, or infrastructure boundaries.
The application stack is Node.js (TypeScript), Docker, Kubernetes, and AWS (via Terraform).
Please generate the comprehensive content for the following files sequentially:
1. Architecture Group
•   specs/architecture/01-system-overview.md (High-level microservices choreography, event-driven interactions, and global tech stack).
•   specs/architecture/02-data-models.md (Global entity schemas for User, Product, Cart, Order, and Payment).
•   specs/architecture/03-api-gateway-routing.md (Reverse proxy rules, path-based routing mappings to downstream services, and CORS policies).
2. Services Group
•   specs/services/auth-service-spec.md (JWT-based authentication, token expiration, password hashing, and user registration/login endpoints).
•   specs/services/catalog-service-spec.md (Product discovery, pagination, CRUD operations, and read-heavy caching strategies).
•   specs/services/order-checkout-service-spec.md (Transactional checkout orchestration, processing state transitions, and database atomic operations).
•   specs/services/payment-service-spec.md (Stripe integration mock specs, payment status webhooks, idempotent processing, and handling payment failures safely).
3. Infrastructure Group
•   specs/infrastructure/aws-terraform-spec.md (VPC networking, EKS cluster provisioning, IAM roles for service accounts, and managed RDS/Redis infrastructure declarations).
```
## Phase 3: Copilot Execution

### Step 6: Verify Context

**Description:** Ensures GitHub Copilot has ingested the repository rules before generating code.

**Prompt to Copy:**

```plaintext
Please review my workspace. Confirm that you have read the .github/copilot-instructions.md file and understand the technology stack and AI directives we are using for this project.
```

### Step 7: Implement Application Logic

**Description:** Instructs Copilot to build the microservice strictly based on the provided specification.

**Prompt to Copy:**

```plaintext
Based strictly on the @cart-service-spec.md file, generate the complete Node.js/TypeScript implementation for this microservice. Ensure all endpoints are created, the Redis connection is configured according to the spec, and all error handling rules are applied. Provide the code in modular files (e.g., server.ts, routes.ts, redisClient.ts).
```

### Step 8: Implement Tests

**Description:** Drives Test-Driven Development (TDD) by forcing Copilot to write tests matching the acceptance criteria in the spec.

**Prompt to Copy:**

```plaintext
Review the @cart-service-spec.md file again, specifically the 'Testing Directives' section. Generate the Jest unit test suite for the cart service. Ensure every acceptance criterion and edge case mentioned in the spec has a dedicated test.
```

### Step 9: Implement Infrastructure (Docker/K8s)

**Description:** Generates deployment manifests based on architectural limits and guardrails.

**Prompt to Copy:**

```plaintext
Generate a multi-stage Dockerfile for this Node.js cart service according to the rules in our .github/copilot-instructions.md. Then, generate the Kubernetes deployment and service YAML manifests for it, ensuring the memory and CPU limits specified in our architecture docs are applied.
```
## Phase 4: Iterative Refinement (The Clarification Loop)

### Step 10: Update the Specification First

**Description:** Modifies the Markdown blueprint when a new business requirement is introduced, keeping documentation as the source of truth.

**Prompt to Copy:**

```plaintext
A new business requirement has been added: If a user tries to add an item to their cart, but the Catalog Service is unreachable, we must gracefully degrade. The cart should accept the item with a 'price_pending' flag instead of throwing a 500 error. Please update the @cart-service-spec.md file to reflect this new requirement in the Functional Requirements, API Architecture, and Testing Directives sections.
```

### Step 11: Impact Analysis

**Description:** Asks Copilot to assess the "blast radius" of the spec change before writing any code.

**Prompt to Copy:**

```plaintext
I have updated the @cart-service-spec.md with the new 'price_pending' fallback logic. Before we write any code, please perform an impact analysis. Compare the new spec against the current codebase and provide a checklist of: 1. Which specific files need to be modified. 2. Any new dependencies or types we need to add. 3. Potential architectural side effects (e.g., how this affects the Redis schema or downstream checkout logic)
```

### Step 12: Execute Changes

**Description:** Applies the required changes to the application logic and tests based on the updated spec and impact analysis.

**Prompt to Copy:**

```plaintext
I have updated the @cart-service-spec.md. Please review the new requirements regarding the Catalog Service failure fallback ('price_pending' flag). Compare it against the current implementation in @routes.ts and generate the necessary code changes to fulfill this new specification. Ensure you also output the new unit test required for this edge case.
```

## Phase 5: Alternative "All-in-One" Execution

### Step 13: The Master Execution Prompt

**Description:** An advanced prompt used to ingest the entire specs/ directory and output all core logic, tests, orchestration manifests, and IaC in one massive block.

**Prompt to Copy:**

```plaintext
Act as a Principal Cloud Engineer and Senior Full-Stack Developer. We have fully completed the planning phase for our microservices e-commerce application. All system blueprints are located in the specs/ directory.

Your task is to ingest all files in the specs/ folder—specifically tracking the architecture guidelines, the individual microservice definitions, and the infrastructure requirements—and execute the implementation phase.

Please generate the complete directory tree structure and the production-ready source code for the following artifacts based strictly on our specs. Group your output using clean Markdown code blocks labeled with their intended file paths:

1. Core Application Logic (TypeScript/Node.js)
Generate the modular files for the Shopping Cart Microservice as defined in specs/services/cart-service-spec.md (integrating with Redis as specified, including data models, input validation, and the error handling matrix):

src/cart-service/src/config/redis.ts (Redis connection client with connection handling and health checks)

src/cart-service/src/controllers/cartController.ts (Controller logic implementing CRUD operations and business boundaries)

src/cart-service/src/routes/cartRoutes.ts (Express or Fastify route mappings)

src/cart-service/src/app.ts (Application entry point)

2. Automated Test Suite (Jest)
Generate the unit and integration testing files as dictated by the "Testing Directives" section of the specifications:

src/cart-service/tests/cart.test.ts (Comprehensive Jest test suite covering happy paths, negative quantities, and Redis timeouts)

3. Containerization & Orchestration Manifests
Generate the DevOps deployment assets according to the specs/infrastructure/k8s-deployment-spec.md and the .github/copilot-instructions.md guardrails:

src/cart-service/Dockerfile (Multi-stage, secure, non-root user production build)

k8s/cart-service-deployment.yaml (Kubernetes Deployment with standard liveness/readiness probes and specified CPU/Memory resource limits)

k8s/cart-service-service.yaml (Kubernetes ClusterIP Service manifest)

4. Infrastructure as Code (Terraform)
Generate the foundational infrastructure templates matching specs/infrastructure/aws-terraform-spec.md:

terraform/vpc.tf (Basic AWS VPC layout for isolating the microservices)

terraform/eks.tf (EKS cluster skeleton setup)

terraform/redis.tf (ElastiCache Redis configuration for hosting the cart state)

Ensure all code is modular, fully written (no // TODO: implement later placeholders), strictly typesafe, and perfectly adheres to the global .github/copilot-instructions.md rules.
```