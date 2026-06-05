# AWS Terraform Specification

**Version:** 1.0.0  
**Infrastructure:** E-commerce Platform  
**Provider:** AWS Terraform  
**Last Updated:** 2026-06-05

---

## 1. Overview & Business Objectives

This document defines the AWS infrastructure provisioning using Terraform for the e-commerce platform. The infrastructure follows a multi-tier architecture with VPC networking, EKS cluster, managed databases, and security best practices.

### 1.1 Infrastructure Goals

- **High Availability:** Multi-AZ deployment across 3 availability zones
- **Scalability:** Auto-scaling for all compute resources
- **Security:** Network isolation, encryption at rest and in transit
- **Cost Optimization:** Reserved instances, S3 lifecycle policies
- **Compliance:** PCI-DSS, GDPR, SOC2 compliant infrastructure

### 1.2 Infrastructure Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                    AWS Account                                   │
├──────────────────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────────────────────┐  │
│  │                   VPC (10.0.0.0/16)                        │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │  │
│  │  │  AZ-US-E-1A  │  │  AZ-US-E-1B  │  │  AZ-US-E-1C  │     │  │
│  │  │ Public Subnet│  │ Public Subnet│  │ Public Subnet│     │  │
│  │  │  (10.0.0.0/24)│ │ (10.0.1.0/24)│ │ (10.0.2.0/24)│     │  │
│  │  └───────┬──────┘  └───────┬──────┘  └───────┬──────┘     │  │
│  │          │                 │                 │             │  │
│  │          ▼                 ▼                 ▼             │  │
│  │    ┌─────────┐    ┌─────────┐    ┌─────────┐              │  │
│  │    │  ALB    │    │  ALB    │    │  ALB    │              │  │
│  │    └────┬────┘    └────┬────┘    └────┬────┘              │  │
│  │         │              │              │                   │  │
│  │  ┌──────┴──────────────┴──────────────┴────────┐          │  │
│  │  │                   EKS Cluster               │          │  │
│  │  │  ┌───────────────────────────────────────┐  │          │  │
│  │  │  │  Private Subnet (10.0.10.0/24)       │  │          │  │
│  │  │  │  ┌────────┐  ┌────────┐  ┌────────┐  │  │          │  │
│  │  │  │  │ Worker │  │ Worker │  │ Worker │  │  │          │  │
│  │  │  │  │ Nodes  │  │ Nodes  │  │ Nodes  │  │  │          │  │
│  │  │  │  └───┬────┘  └───┬────┘  └───┬────┘  │  │          │  │
│  │  │  │      │           │           │       │  │          │  │
│  │  │  │      ▼           ▼           ▼       │  │          │  │
│  │  │  │  ┌────────┐  ┌────────┐  ┌────────┐  │  │          │  │
│  │  │  │  │ EKS    │  │ EKS    │  │ EKS    │  │  │          │  │
│  │  │  │  │ Pods   │  │ Pods   │  │ Pods   │  │  │          │  │
│  │  │  │  └────────┘  └────────┘  └────────┘  │  │          │  │
│  │  │  └───────────────────────────────────────┘  │          │  │
│  │  └──────────────────────────────────────────────┘          │  │
│  │                                                              │  │
│  │  ┌────────────────────────────────────────────────────────┐ │  │
│  │  │              Managed Services (Private)                │ │  │
│  │  │  ┌──────────┐  ┌──────────┐  ┌──────────┐             │ │  │
│  │  │  │ Elasti-  │  │  RDS     │  │  DynamoDB│             │ │  │
│  │  │  │ Cache    │  │  PostgreSQL│ │  Tables  │             │ │  │
│  │  │  └──────────┘  └──────────┘  └──────────┘             │ │  │
│  │  └────────────────────────────────────────────────────────┘ │  │
│  └────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

---

## 2. Technical Requirements & Data Models

### 2.1 Infrastructure Modules

| Module | Purpose | Version |
|--------|---------|---------|
| `vpc` | VPC, subnets, NAT gateways | `v5.0.0` |
| `eks` | EKS cluster, node groups | `v19.15.0` |
| `rds` | PostgreSQL database | `v3.0.0` |
| `elasticache` | Redis cluster | `v2.0.0` |
| `s3` | Static assets, images | `v3.0.0` |
| `iam` | Service accounts, roles | `v13.0.0` |
| `alb` | Application Load Balancer | `v4.0.0` |

### 2.2 AWS Resources

| Resource | Type | AZs | Size |
|----------|------|-----|------|
| VPC | `aws_vpc` | 3 | 10.0.0.0/16 |
| Public Subnets | `aws_subnet` | 3 | 10.0.0.0/24 each |
| Private Subnets | `aws_subnet` | 3 | 10.0.10.0/24 each |
| EKS Cluster | `aws_eks_cluster` | 3 | Managed control plane |
| EKS Node Group | `aws_eks_node_group` | 3 | 3 nodes per AZ |
| ElastiCache | `aws_elasticache_cluster` | 3 | 3 nodes (cache.r5.large) |
| RDS PostgreSQL | `aws_db_instance` | 3 | db.r5.large (multi-AZ) |
| DynamoDB Tables | `aws_dynamodb_table` | Global | On-demand |
| S3 Buckets | `aws_s3_bucket` | Regional | Versioned, encrypted |

### 2.3 IAM Roles for Service Accounts (IRSA)

| Service | Role | Permissions |
|---------|------|-------------|
| Cart Service | `cart-service-role` | S3: read objects, DynamoDB: read/write cart table |
| Auth Service | `auth-service-role` | DynamoDB: read/write users table |
| Catalog Service | `catalog-service-role` | DynamoDB: read/write products, S3: read images |
| Order Service | `order-service-role` | DynamoDB: read/write orders, SQS: send messages |
| Payment Service | `payment-service-role` | DynamoDB: read/write payments |

---

## 3. Implementation Tasks

### 3.1 Terraform Setup (Create)

- [ ] Initialize Terraform workspace with remote state in S3
- [ ] Configure AWS provider with region and version constraints
- [ ] Set up backend configuration with DynamoDB locking
- [ ] Create module structure for each infrastructure component

### 3.2 VPC Networking (Create)

- [ ] Create VPC with 10.0.0.0/16 CIDR
- [ ] Create 3 public subnets (one per AZ)
- [ ] Create 3 private subnets (one per AZ)
- [ ] Configure NAT gateways for private subnet internet access
- [ ] Create internet gateway and route tables

### 3.3 EKS Cluster (Create)

- [ ] Create EKS cluster with managed control plane
- [ ] Configure EKS node groups with 3 nodes per AZ
- [ ] Configure Kubernetes version (1.28)
- [ ] Set up IAM OIDC provider for IRSA
- [ ] Configure worker node security group

### 3.4 Database Infrastructure (Create)

- [ ] Create RDS PostgreSQL instance (multi-AZ)
- [ ] Configure storage (100GB GP3)
- [ ] Set up security group for database access
- [ ] Create ElastiCache Redis cluster (3 nodes)
- [ ] Configure Redis security group

### 3.5 S3 Buckets (Create)

- [ ] Create S3 bucket for static assets (versioned, encrypted)
- [ ] Create S3 bucket for product images (public read, encrypted)
- [ ] Configure CloudFront distribution for images
- [ ] Set up S3 lifecycle policies for image cleanup

### 3.6 IAM Roles (Create)

- [ ] Create IRSA roles for each service
- [ ] Configure OIDC provider for EKS
- [ ] Attach least-privilege policies to each role
- [ ] Create S3 bucket policies for image access

---

## 4. Testing Directives

### 4.1 Terraform Validation (Test)

- [ ] **test('terraform validate passes')** - Syntax validation
- [ ] **test('terraform plan shows expected changes')** - Plan accuracy
- [ ] **test('terraform apply creates all resources')** - Resource creation
- [ ] **test('terraform destroy removes all resources')** - Cleanup

### 4.2 Infrastructure Tests (Test)

- [ ] **test('EKS cluster is accessible')** - Cluster connectivity
- [ ] **test('RDS instance is accessible from EKS')** - Internal networking
- [ ] **test('ElastiCache Redis is accessible from EKS')** - Cache connectivity
- [ ] **test('S3 buckets are accessible with correct permissions')** - IAM permissions

### 4.3 Security Tests (Test)

- [ ] **test('RDS instance is not publicly accessible')** - Security
- [ ] **test('ElastiCache Redis is in private subnet')** - Network isolation
- [ ] **test('IAM roles have least-privilege permissions')** - Security audit

---

## 5. Execution & Runtime

### 5.1 Terraform Configuration (Execute)

```hcl
# terraform.tf
terraform {
  required_version = ">= 1.5.0"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  
  backend "s3" {
    bucket  = "ecommerce-terraform-state"
    key     = "infrastructure/terraform.tfstate"
    region  = "us-east-1"
    encrypt = true
    dynamodb_table = "terraform-state-lock"
  }
}
```

### 5.2 VPC Module (Execute)

```hcl
# modules/vpc/main.tf
module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "v5.0.0"
  
  name = "ecommerce-vpc"
  cidr = "10.0.0.0/16"
  
  azs             = ["us-east-1a", "us-east-1b", "us-east-1c"]
  private_subnets = ["10.0.10.0/24", "10.0.11.0/24", "10.0.12.0/24"]
  public_subnets  = ["10.0.0.0/24", "10.0.1.0/24", "10.0.2.0/24"]
  
  enable_nat_gateway   = true
  single_nat_gateway   = false
  enable_dns_hostnames = true
  
  public_subnet_tags = {
    "kubernetes.io/role/elb" = "1"
  }
  
  private_subnet_tags = {
    "kubernetes.io/role/internal-elb" = "1"
  }
}
```

### 5.3 EKS Module (Execute)

```hcl
# modules/eks/main.tf
module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "v19.15.0"
  
  cluster_name    = "ecommerce-cluster"
  cluster_version = "1.28"
  
  vpc_id     = module.vpc.vpc_id
  subnet_ids = module.vpc.private_subnets
  
  eks_managed_node_group_defaults = {
    instance_types = ["t3.medium", "t3a.medium"]
  }
  
  eks_managed_node_groups = {
    general = {
      min_size     = 3
      max_size     = 10
      desired_size = 3
      
      instance_types = ["t3.medium"]
      capacity_type  = "SPOT"
    }
  }
  
  enable_irsa = true
}
```

### 5.4 RDS Module (Execute)

```hcl
# modules/rds/main.tf
resource "aws_db_instance" "postgres" {
  identifier           = "ecommerce-postgres"
  allocated_storage    = 100
  storage_type         = "gp3"
  engine               = "postgres"
  engine_version       = "15.4"
  instance_class       = "db.r5.large"
  db_name              = "ecommerce"
  
  username             = var.db_username
  password             = var.db_password
  
  multi_az             = true
  publicly_accessible  = false
  
  vpc_security_group_ids = [module.vpc.vpc_default_security_group_id]
  db_subnet_group_name   = aws_db_subnet_group.postgres.name
  
  backup_retention_period = 7
  backup_window           = "03:00-04:00"
  maintenance_window      = "Mon:04:00-Mon:05:00"
  
  skip_final_snapshot = false
  final_snapshot_identifier = "ecommerce-postgres-final-snapshot"
  
  storage_encrypted = true
  kms_key_id        = aws_kms_key.db.arn
}
```

### 5.5 DynamoDB Tables (Execute)

```hcl
# modules/dynamodb/main.tf
resource "aws_dynamodb_table" "users" {
  name         = "users"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "userId"
  
  attribute {
    name = "userId"
    type = "S"
  }
  
  global_secondary_index {
    name            = "email-index"
    hash_key        = "email"
    projection_type = "ALL"
  }
  
  tags = {
    Project = "ecommerce"
    Environment = var.environment
  }
}
```

### 5.6 Deployment Commands (Execute)

```bash
# Initialize Terraform
terraform init \
  -backend-config=region=us-east-1 \
  -backend-config=bucket=ecommerce-terraform-state \
  -backend-config=key=infrastructure/terraform.tfstate \
  -backend-config=dynamodb_table=terraform-state-lock

# Validate configuration
terraform validate

# Plan infrastructure changes
terraform plan \
  -var="environment=production" \
  -var="region=us-east-1"

# Apply infrastructure
terraform apply \
  -var="environment=production" \
  -var="region=us-east-1"

# Destroy infrastructure (if needed)
terraform destroy \
  -var="environment=production" \
  -var="region=us-east-1"
```

### 5.7 CI/CD Integration (Execute)

```yaml
# .github/workflows/terraform.yml
name: Terraform Deploy
on:
  push:
    branches: [main]
    paths: ['infrastructure/**']
    
jobs:
  terraform:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1
      
      - name: Terraform Init
        run: terraform init -reconfigure
        working-directory: infrastructure
        
      - name: Terraform Plan
        run: terraform plan -input=false
        working-directory: infrastructure
        
      - name: Terraform Apply
        run: terraform apply -auto-approve -input=false
        working-directory: infrastructure
```

---

## 6. Compliance & Security

- All resources must be encrypted at rest using AWS KMS
- Database must not be publicly accessible
- NAT gateways required for private subnet internet access
- IAM roles must follow least-privilege principle
- S3 buckets must have versioning and encryption enabled
- Security groups must restrict access to required ports only
- Terraform state must be encrypted and locked

---

*Specification Version: 1.0.0 | Last Updated: 2026-06-05*
