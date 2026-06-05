#!/bin/bash

# SDD Specification Directory Setup Script
# Creates the standard directory structure for e-commerce microservices specifications

set -e

echo "Creating SDD specification directory structure..."

# Root specs directory
SPEC_ROOT="specs"

# Create root directory
mkdir -p "$SPEC_ROOT"

# Architecture directory with core specification files
mkdir -p "$SPEC_ROOT/architecture"
touch "$SPEC_ROOT/architecture/01-system-overview.md"
touch "$SPEC_ROOT/architecture/02-data-models.md"
touch "$SPEC_ROOT/architecture/03-api-gateway-routing.md"

# Services directory with microservice specifications
mkdir -p "$SPEC_ROOT/services"
touch "$SPEC_ROOT/services/auth-service-spec.md"
touch "$SPEC_ROOT/services/catalog-service-spec.md"
touch "$SPEC_ROOT/services/cart-service-spec.md"
touch "$SPEC_ROOT/services/order-checkout-service-spec.md"
touch "$SPEC_ROOT/services/payment-service-spec.md"

# Infrastructure directory with deployment specifications
mkdir -p "$SPEC_ROOT/infrastructure"
touch "$SPEC_ROOT/infrastructure/aws-terraform-spec.md"
touch "$SPEC_ROOT/infrastructure/k8s-deployment-spec.md"

echo "✓ Specification directory structure created successfully!"
echo ""
echo "Directory structure:"
echo "$SPEC_ROOT/"
echo "├── architecture/"
echo "│   ├── 01-system-overview.md"
echo "│   ├── 02-data-models.md"
echo "│   └── 03-api-gateway-routing.md"
echo "├── services/"
echo "│   ├── auth-service-spec.md"
echo "│   ├── catalog-service-spec.md"
echo "│   ├── cart-service-spec.md"
echo "│   ├── order-checkout-service-spec.md"
echo "│   └── payment-service-spec.md"
echo "└── infrastructure/"
echo "    ├── aws-terraform-spec.md"
echo "    └── k8s-deployment-spec.md"
