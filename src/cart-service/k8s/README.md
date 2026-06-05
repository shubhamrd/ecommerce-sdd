# Cart Service Kubernetes Deployment Guide

## Overview
This document provides the complete Kubernetes deployment instructions for the cart-service.

## Prerequisites
- Kubernetes cluster (AWS EKS)
- kubectl configured with cluster access
- Docker registry access for cart-service image
- Redis cluster deployed in the cluster

## Directory Structure
```
k8s/
├── cart-deployment.yaml      # Deployment with resource limits
├── cart-service.yaml         # ClusterIP service
├── cart-hpa.yaml             # Horizontal Pod Autoscaler
├── cart-service-account.yaml # IAM roles for service accounts
├── cart-network-policy.yaml  # Network policies
├── cart-secrets.yaml         # Kubernetes secrets
└── cart-manifests-bundle.yaml # All manifests combined
```

## Resource Configuration

### Resource Requests and Limits
```yaml
resources:
  requests:
    memory: "256Mi"
    cpu: "250m"
  limits:
    memory: "512Mi"
    cpu: "500m"
```

### Replica Configuration
- **Minimum Replicas:** 3 (high availability)
- **Maximum Replicas:** 20 (auto-scaling)
- **CPU Target:** 70% utilization
- **Memory Target:** 80% utilization

## Deployment Commands

### Step 1: Build and Push Docker Image
```bash
# Build the image
docker build -t cart-service:latest .

# Tag for ECR (or your registry)
docker tag cart-service:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/cart-service:latest

# Push to registry
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/cart-service:latest
```

### Step 2: Create Namespace
```bash
kubectl apply -f k8s/cart-manifests-bundle.yaml
```

### Step 3: Verify Deployment
```bash
# Check deployment status
kubectl rollout status deployment/cart-service -n ecommerce-prod

# Check pod status
kubectl get pods -n ecommerce-prod -l app=cart-service

# Check service
kubectl get svc cart-service -n ecommerce-prod

# Check HPA
kubectl get hpa cart-service-hpa -n ecommerce-prod

# Check events
kubectl get events -n ecommerce-prod --sort-by='.lastTimestamp'
```

### Step 4: Test the Service
```bash
# Port-forward for local testing
kubectl port-forward svc/cart-service 3000:3000 -n ecommerce-prod

# Test health endpoint
curl http://localhost:3000/health

# Test ready endpoint
curl http://localhost:3000/ready
```

## Rolling Updates

### Update Deployment
```bash
# Update image
kubectl set image deployment/cart-service cart-service=<new-image-tag> -n ecommerce-prod

# Monitor rollout
kubectl rollout status deployment/cart-service -n ecommerce-prod

# View rollout history
kubectl rollout history deployment/cart-service -n ecommerce-prod

# Rollback if needed
kubectl rollout undo deployment/cart-service -n ecommerce-prod
```

## Scaling

### Manual Scaling
```bash
# Scale to specific number of replicas
kubectl scale deployment/cart-service -n ecommerce-prod --replicas=5

# Verify scaling
kubectl get pods -n ecommerce-prod -l app=cart-service
```

### Auto-Scaling
The HPA will automatically scale between 3-20 replicas based on CPU/memory utilization.

## Monitoring

### Logs
```bash
# View logs for all cart-service pods
kubectl logs -l app=cart-service -n ecommerce-prod --tail=100 -f

# View logs for specific pod
kubectl logs cart-service-<pod-id> -n ecommerce-prod -f
```

### Metrics
```bash
# View pod metrics
kubectl top pods -n ecommerce-prod -l app=cart-service

# View HPA metrics
kubectl describe hpa cart-service-hpa -n ecommerce-prod
```

## Troubleshooting

### Pod Not Starting
```bash
# Describe pod for events
kubectl describe pod <pod-id> -n ecommerce-prod

# Check container logs
kubectl logs <pod-id> -n ecommerce-prod

# Check Redis connectivity
kubectl exec -it <pod-id> -n ecommerce-prod -- nc -zv cart-redis.ecommerce-prod.svc.cluster.local 6379
```

### Service Not Accessible
```bash
# Check service endpoints
kubectl get endpoints cart-service -n ecommerce-prod

# Verify service selector
kubectl get svc cart-service -n ecommerce-prod -o yaml
```

### Update Secrets
```bash
# Update Redis password
kubectl create secret generic redis-secrets -n ecommerce-prod \
  --from-literal=host=cart-redis.ecommerce-prod.svc.cluster.local \
  --from-literal=port=6379 \
  --from-literal=password=<new-password> \
  --dry-run=client -o yaml | kubectl apply -f -

# Restart pods to pick up new secrets
kubectl rollout restart deployment/cart-service -n ecommerce-prod
```

## Security

### Pod Security
- All pods run as non-root user (UID 1001)
- Read-only root filesystem
- No privilege escalation
- All capabilities dropped

### Network Security
- Network policies restrict ingress/egress
- Only allowed services can communicate
- Redis access restricted to specific pods
- DNS resolution allowed for service discovery

## Cost Optimization

### Resource Limits
Set appropriate limits to prevent resource waste:
- Memory: 512Mi (max)
- CPU: 500m (max)

### Auto-Scaling
HPA scales based on actual load:
- Minimum: 3 replicas (always running)
- Maximum: 20 replicas (peak load)

## Compliance

### PCI-DSS
- No payment data stored in cart service
- All secrets managed via Kubernetes Secrets
- Network policies restrict data flow

### GDPR
- User data deletable via cart purge endpoint
- Audit logs maintained for all operations

---

*Documentation Version: 1.0.0 | Last Updated: 2026-06-05*
