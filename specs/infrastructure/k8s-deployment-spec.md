# Kubernetes Deployment Specification

**Version:** 1.0.0  
**Platform:** E-commerce Microservices  
**Orchestration:** Kubernetes (AWS EKS)  
**Namespace:** ecommerce-prod

---

## 1. Architecture Overview

This specification defines the Kubernetes deployment architecture for the e-commerce microservices platform. The architecture follows a service-mesh-ready design with explicit resource management and health monitoring.

### 1.1 Deployment Strategy

- **Namespace Isolation:** All services deployed to `ecommerce-prod` namespace
- **Service Mesh Readiness:** mTLS enabled via Istio for inter-service communication
- **Scaling Strategy:** Horizontal Pod Autoscaler (HPA) with CPU/memory targets
- **Availability:** Minimum 3 replicas per service for high availability

### 1.2 Network Architecture

```
Internet → AWS ALB Ingress → Kubernetes Services → Microservices Pods
                                    ↓
                                Redis Cluster (ElastiCache)
                                    ↓
                                DynamoDB Tables
```

### 1.3 Security Model

- **Network Policies:** Restrict inter-namespace communication
- **Pod Security Standards:** Enforce `restricted` profile
- **Secrets Management:** AWS Secrets Manager integration via External Secrets Operator
- **RBAC:** Least-privilege service account permissions

---

## 2. Technical Requirements

### 2.1 Core Kubernetes Resources

| Resource Type | Purpose | Required Fields |
|---------------|---------|-----------------|
| `Deployment` | Pod management, scaling, rolling updates | `replicas`, `selector`, `template`, `containers` |
| `Service (ClusterIP)` | Internal service discovery and load balancing | `selector`, `ports` |
| `Ingress` | External HTTP(S) routing to services | `rules`, `backend`, `tls` |
| `HPA` | Automatic scaling based on metrics | `scaleTargetRef`, `minReplicas`, `maxReplicas` |

### 2.2 Service Requirements

- **Cart Service:** `cart-service` - 3000/TCP
- **Authentication Service:** `auth-service` - 3001/TCP
- **Catalog Service:** `catalog-service` - 3002/TCP
- **Order Service:** `order-service` - 3003/TCP
- **Payment Service:** `payment-service` - 3004/TCP

### 2.3 Ingress Configuration

- **Domain:** `api.ecommerce.example.com`
- **TLS:** AWS ACM-managed certificate
- **Path Routing:**
  - `/api/v1/cart/*` → `cart-service:3000`
  - `/api/v1/auth/*` → `auth-service:3001`
  - `/api/v1/catalog/*` → `catalog-service:3002`
  - `/api/v1/orders/*` → `order-service:3003`
  - `/api/v1/payments/*` → `payment-service:3004`

---

## 3. Implementation Tasks

### 3.1 Namespace and Network Policies (Create)

- [ ] Create `ecommerce-prod` namespace with resource quotas
- [ ] Implement default deny network policy
- [ ] Allow ingress from ALB Ingress Controller
- [ ] Allow egress to Redis and DynamoDB

### 3.2 Cart Service Deployment (Create)

- [ ] Create `cart-deployment.yaml` with:
  - 3 replicas minimum
  - Resource requests: 256Mi memory, 250m CPU
  - Resource limits: 512Mi memory, 500m CPU
  - Non-root user (UID 1001)
  - Readiness and liveness probes
- [ ] Create `cart-service.yaml` ClusterIP service
- [ ] Create `cart-hpa.yaml` with HPA targeting 70% CPU utilization

### 3.3 Service Configuration (Create)

- [ ] Create `services/` directory for all service manifests
- [ ] Create `services/cart/` subdirectory with deployment, service, and HPA
- [ ] Create `services/auth/` subdirectory with deployment, service, and HPA
- [ ] Create `services/catalog/` subdirectory with deployment, service, and HPA
- [ ] Create `services/order/` subdirectory with deployment, service, and HPA
- [ ] Create `services/payment/` subdirectory with deployment, service, and HPA

### 3.4 Ingress Controller (Create)

- [ ] Configure AWS ALB Ingress Controller
- [ ] Create `ingress/ingress.yaml` with path-based routing
- [ ] Configure TLS termination with ACM certificate
- [ ] Set annotations for ALB health check and security groups

### 3.5 External Services (Create)

- [ ] Create `k8s/external-redis.yaml` for ElastiCache connection
- [ ] Create `k8s/external-dynamodb.yaml` for DynamoDB access
- [ ] Configure IAM roles for service accounts (IRSA)

---

## 4. Testing Directives

### 4.1 Deployment Verification (Test)

```bash
# Verify all pods are running
kubectl get pods -n ecommerce-prod

# Check deployment status
kubectl rollout status deployment/cart-service -n ecommerce-prod

# Verify replica counts
kubectl get deployment cart-service -n ecommerce-prod
```

### 4.2 Service Verification (Test)

```bash
# Verify ClusterIP services are created
kubectl get svc -n ecommerce-prod

# Test internal DNS resolution
kubectl run -it --rm debug --image=busybox --restart=Never -- nslookup cart-service.ecommerce-prod.svc.cluster.local

# Verify service endpoints
kubectl get endpoints cart-service -n ecommerce-prod
```

### 4.3 Health Check Verification (Test)

```bash
# Check pod readiness
kubectl describe pod <cart-pod-name> -n ecommerce-prod | grep -A 5 "Readiness"

# Test liveness probe directly
kubectl exec <cart-pod-name> -n ecommerce-prod -- curl -f http://localhost:3000/health

# View probe logs
kubectl logs <cart-pod-name> -n ecommerce-prod
```

### 4.4 Ingress Verification (Test)

```bash
# Verify ALB ingress is created
kubectl get ingress -n ecommerce-prod

# Check ingress controller logs
kubectl logs -n ingress-nginx ingress-nginx-controller

# Test external access
curl -H "Host: api.ecommerce.example.com" https://<alb-dns-name>/api/v1/cart/user_123
```

### 4.5 Load Testing (Test)

```bash
# Test horizontal scaling
kubectl top pods -n ecommerce-prod

# Trigger scaling by creating load
kubectl run -it --rm load-test --image=busybox --restart=Never -- sh -c "while true; do wget -q -O- http://cart-service.ecommerce-prod:3000/health; done"

# Verify HPA scaling
kubectl get hpa -n ecommerce-prod
```

---

## 5. Execution

### 5.1 Prerequisites (Execute)

```bash
# Install kubectl
brew install kubectl

# Configure AWS credentials
aws configure

# Get EKS cluster credentials
aws eks update-kubeconfig --name ecommerce-cluster --region us-east-1
```

### 5.2 Apply Commands (Execute)

```bash
# Navigate to manifests directory
cd k8s-manifests

# Apply namespace first
kubectl apply -f k8s/namespace.yaml

# Apply network policies
kubectl apply -f k8s/network-policies/

# Apply service deployments in dependency order
kubectl apply -f services/cart/
kubectl apply -f services/auth/
kubectl apply -f services/catalog/
kubectl apply -f services/order/
kubectl apply -f services/payment/

# Apply ingress controller configuration
kubectl apply -f ingress/

# Verify all resources
kubectl get all -n ecommerce-prod
```

### 5.3 Complete Deployment Script (Execute)

```bash
#!/bin/bash
set -e

NAMESPACE="ecommerce-prod"
MANIFESTS_DIR="k8s-manifests"

echo "Deploying to Kubernetes cluster..."

# Create namespace if not exists
kubectl create namespace $NAMESPACE --dry-run=client -o yaml | kubectl apply -f -

# Apply network policies
kubectl apply -f $MANIFESTS_DIR/k8s/network-policies/

# Apply external service connections
kubectl apply -f $MANIFESTS_DIR/k8s/external-services/

# Apply all service deployments
for dir in $MANIFESTS_DIR/services/*/; do
    echo "Applying $(basename $dir)..."
    kubectl apply -f $dir
done

# Apply ingress
kubectl apply -f $MANIFESTS_DIR/ingress/

# Wait for all deployments
kubectl rollout status deployment/cart-service -n $NAMESPACE --timeout=300s
kubectl rollout status deployment/auth-service -n $NAMESPACE --timeout=300s
kubectl rollout status deployment/catalog-service -n $NAMESPACE --timeout=300s
kubectl rollout status deployment/order-service -n $NAMESPACE --timeout=300s
kubectl rollout status deployment/payment-service -n $NAMESPACE --timeout=300s

echo "Deployment complete!"
kubectl get all -n $NAMESPACE
```

### 5.4 Rollback Command (Execute)

```bash
# Rollback to previous deployment
kubectl rollout undo deployment/cart-service -n ecommerce-prod

# View deployment history
kubectl rollout history deployment/cart-service -n ecommerce-prod

# Rollback to specific revision
kubectl rollout undo deployment/cart-service -n ecommerce-prod --to-revision=2
```

### 5.5 Scaling Commands (Execute)

```bash
# Manual scaling
kubectl scale deployment/cart-service -n ecommerce-prod --replicas=5

# Verify scaling
kubectl get hpa -n ecommerce-prod
kubectl get pods -n ecommerce-prod -l app=cart-service
```

---

## 6. Monitoring & Observability

### 6.1 Required Metrics

- **Pod CPU/Memory Usage:** Track against resource limits
- **Request Latency:** P50, P95, P99 for each endpoint
- **Error Rate:** HTTP 5xx responses per service
- **Redis Latency:** Connection and query times

### 6.2 Logging

- Structured JSON logs to CloudWatch
- Correlation ID propagation across services
- Error log alerting threshold: >5% error rate

### 6.3 Alerting

- Pod restarts >3 in 5 minutes
- CPU utilization >85% for 10 minutes
- HTTP 5xx rate >1% for 5 minutes
- Redis connection failures >10 in 1 minute

---

## 7. Compliance & Security

- All pods must run as non-root (UID != 0)
- Resource limits must be defined for all containers
- Readiness/liveness probes are mandatory
- Network policies must restrict inter-pod communication
- Secrets must be mounted from AWS Secrets Manager, never in images

---

*Specification Version: 1.0.0 | Last Updated: 2026-06-05*
