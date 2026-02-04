# 🚀 DriveLineExpress Kubernetes Deployment

Complete Kubernetes deployment setup for DriveLineExpress NestJS microservices application with multi-node architecture.

## 📋 Table of Contents

- [Architecture Overview](#architecture-overview)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Detailed Setup](#detailed-setup)
- [Architecture Components](#architecture-components)
- [Service Details](#service-details)
- [Access URLs](#access-urls)
- [Monitoring & Debugging](#monitoring--debugging)
- [Scaling](#scaling)
- [Network Policies](#network-policies)
- [Troubleshooting](#troubleshooting)
- [Production Considerations](#production-considerations)

---

## 🏗️ Architecture Overview

This Kubernetes deployment implements a **multi-node microservices architecture** with proper separation of concerns:

```
┌─────────────────────────────────────────────────────────────────┐
│                     NGINX Ingress Controller                     │
│                    (localhost:3000 → Services)                   │
└────────────┬────────────────────────────────────────────────────┘
             │
    ┌────────┴──────────┬──────────────────┬─────────────────┐
    │                   │                  │                 │
┌───▼────┐      ┌──────▼──────┐   ┌──────▼──────┐   ┌─────▼──────┐
│  REST  │      │    gRPC     │   │  Webhook    │   │  Worker    │
│  API   │◄────►│ Microservice│   │  Service    │   │  Service   │
│ (3001) │      │   (50051)   │   │   (3003)    │   │ (RabbitMQ) │
└───┬────┘      └──────┬──────┘   └──────┬──────┘   └─────┬──────┘
    │                  │                 │                 │
    └──────────┬───────┴─────────────────┴────────┬────────┘
               │                                   │
    ┌──────────▼───────────┐            ┌─────────▼──────────┐
    │   Stateful Services  │            │ Message Queue      │
    │  • MongoDB           │            │  • RabbitMQ        │
    │  • Redis             │            └────────────────────┘
    │  • ClickHouse        │
    └──────────────────────┘
```

### 🎯 Key Features

- ✅ **Multi-Node Architecture**: 4 dedicated worker nodes for different services
- ✅ **Horizontal Pod Autoscaling (HPA)**: Auto-scales based on CPU/Memory
- ✅ **Pod Disruption Budgets (PDB)**: Ensures high availability during updates
- ✅ **Network Policies**: Secure pod-to-pod communication
- ✅ **NGINX Ingress**: Production-ready ingress with rate limiting
- ✅ **StatefulSets**: Persistent storage for databases
- ✅ **Health Checks**: Liveness, readiness, and startup probes
- ✅ **Resource Limits**: CPU and memory limits for all pods
- ✅ **Rolling Updates**: Zero-downtime deployments

---

## 📦 Prerequisites

### Required Software

1. **macOS** (this guide is macOS-specific)
2. **Docker Desktop** (v4.x or higher)
   - Download: https://www.docker.com/products/docker-desktop
   - **Enable Kubernetes**: Docker Desktop → Settings → Kubernetes → Enable
3. **kubectl** (included with Docker Desktop)
4. **Terminal** with bash/zsh

### Verify Installation

```bash
# Check Docker
docker --version
docker info

# Check kubectl
kubectl version --client

# Check Kubernetes cluster
kubectl cluster-info
```

### Docker Desktop Configuration

**Minimum Recommended Resources:**
- CPUs: 4
- Memory: 8 GB
- Swap: 2 GB
- Disk: 20 GB

**Configure in Docker Desktop:**
```
Docker Desktop → Settings → Resources → Advanced
```

---

## 🚀 Quick Start

### 1. Clone and Navigate

```bash
cd /Users/omar-kader/Desktop/Back-End/NestJS/driveline-express-nest-ts-api
```

### 2. Make Scripts Executable

```bash
chmod +x k8s/*.sh
```

### 3. Deploy Everything

```bash
./k8s/deploy.sh
```

This single command will:
- ✅ Verify prerequisites
- ✅ Install NGINX Ingress Controller
- ✅ Build Docker image
- ✅ Deploy all Kubernetes resources
- ✅ Wait for services to be ready
- ✅ Setup port forwarding to localhost:3000

### 4. Verify Deployment

```bash
# Check all pods
kubectl get pods -n driveline

# Test API
curl http://localhost:3000/api/v1/health
curl http://localhost:3000/api/v1/stats/counts
```

---

## 📚 Detailed Setup

### Step-by-Step Manual Deployment

If you prefer to deploy manually or need more control:

#### 1. Enable Kubernetes in Docker Desktop

```bash
# Docker Desktop → Settings → Kubernetes → Enable Kubernetes
# Wait for Kubernetes to start (green indicator in Docker Desktop)
```

#### 2. Install Metrics Server

```bash
# Required for Horizontal Pod Autoscaling
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml

# Patch for Docker Desktop (insecure TLS)
kubectl patch deployment metrics-server -n kube-system --type='json' \
  -p='[{"op": "add", "path": "/spec/template/spec/containers/0/args/-", "value": "--kubelet-insecure-tls"}]'

# Verify
kubectl get deployment metrics-server -n kube-system
```

#### 3. Install NGINX Ingress Controller

```bash
# Install NGINX Ingress Controller
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.11.3/deploy/static/provider/cloud/deploy.yaml

# Label namespace for network policies
kubectl label namespace ingress-nginx name=ingress-nginx --overwrite

# Wait for ingress to be ready
kubectl wait --namespace ingress-nginx \
  --for=condition=ready pod \
  --selector=app.kubernetes.io/component=controller \
  --timeout=120s

# Verify
kubectl get pods -n ingress-nginx
```

#### 4. Build Docker Image

```bash
# Build the application image
docker build -t driveline-express-nest-ts-api:0.5.0 .

# Verify image
docker images | grep driveline
```

#### 5. Apply Kubernetes Manifests

```bash
# Create namespace and configs
kubectl apply -f k8s/00-namespace.yaml
kubectl apply -f k8s/01-configmap.yaml
kubectl apply -f k8s/02-secrets.yaml

# Deploy stateful services
kubectl apply -f k8s/03-mongodb-statefulset.yaml
kubectl apply -f k8s/04-redis-statefulset.yaml
kubectl apply -f k8s/05-rabbitmq-statefulset.yaml
kubectl apply -f k8s/06-clickhouse-statefulset.yaml

# Wait for stateful services
kubectl wait --for=condition=ready pod -l app=mongodb -n driveline --timeout=300s
kubectl wait --for=condition=ready pod -l app=redis -n driveline --timeout=300s
kubectl wait --for=condition=ready pod -l app=rabbitmq -n driveline --timeout=300s
kubectl wait --for=condition=ready pod -l app=clickhouse -n driveline --timeout=300s

# Deploy application services
kubectl apply -f k8s/07-api-deployment.yaml
kubectl apply -f k8s/08-grpc-deployment.yaml
kubectl apply -f k8s/09-webhook-deployment.yaml
kubectl apply -f k8s/10-worker-deployment.yaml

# Apply ingress and policies
kubectl apply -f k8s/11-ingress.yaml
kubectl apply -f k8s/12-hpa.yaml
kubectl apply -f k8s/13-pdb.yaml
kubectl apply -f k8s/14-network-policies.yaml
```

#### 6. Setup Port Forwarding

```bash
# Forward ingress controller to localhost:3000
kubectl port-forward -n ingress-nginx service/ingress-nginx-controller 3000:80
```

---

## 🔧 Architecture Components

### Namespaces

```yaml
driveline          # Main application namespace
ingress-nginx      # NGINX Ingress Controller namespace
kube-system        # System components (metrics-server)
```

### Application Services (Worker Nodes)

| Service | Component | Replicas | Port | Purpose |
|---------|-----------|----------|------|---------|
| **driveline-api** | REST API | 2-10 (HPA) | 3001 | Main HTTP API endpoints |
| **driveline-grpc** | gRPC | 2-8 (HPA) | 50051 | gRPC microservice |
| **driveline-webhook** | Webhook | 2-6 (HPA) | 3003 | Stripe webhook handler |
| **driveline-worker** | Worker | 3-10 (HPA) | N/A | RabbitMQ consumer |

### Stateful Services

| Service | Type | Replicas | Port | Storage |
|---------|------|----------|------|---------|
| **MongoDB** | StatefulSet | 1 | 27017 | 10Gi |
| **Redis** | StatefulSet | 1 | 6379 | 5Gi |
| **RabbitMQ** | StatefulSet | 1 | 5672, 15672 | 5Gi |
| **ClickHouse** | StatefulSet | 1 | 8123, 9000 | 10Gi |

---

## 🌐 Access URLs

### Application Endpoints

| Endpoint | URL | Description |
|----------|-----|-------------|
| Health Check | http://localhost:3000/api/v1/health | API health status |
| Stats API | http://localhost:3000/api/v1/stats/counts | Statistics endpoint |
| User API | http://localhost:3000/api/v1/user/* | User management |
| Course API | http://localhost:3000/api/v1/course/* | Course management |
| Stripe Webhook | http://localhost:3000/webhook/v1/stripe | Stripe webhooks |
| RabbitMQ UI | http://localhost:30672 | Management UI (guest/guest) |

### Testing

```bash
# Health check
curl http://localhost:3000/api/v1/health

# Stats endpoint
curl http://localhost:3000/api/v1/stats/counts

# With authentication
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:3000/api/v1/user/profile
```

---

## 🔍 Monitoring & Debugging

### View Logs

Use the interactive log viewer:

```bash
./k8s/view-logs.sh
```

Or view logs directly:

```bash
# API logs
kubectl logs -f -l component=api -n driveline

# gRPC logs
kubectl logs -f -l component=grpc -n driveline

# Worker logs
kubectl logs -f -l component=worker -n driveline

# Webhook logs
kubectl logs -f -l component=webhook -n driveline

# All pods logs (streaming)
kubectl logs -f --all-containers=true -n driveline
```

### Pod Status

```bash
# All pods
kubectl get pods -n driveline

# Detailed pod info
kubectl get pods -n driveline -o wide

# Watch pods in real-time
kubectl get pods -n driveline -w

# Describe a specific pod
kubectl describe pod <pod-name> -n driveline
```

### Resource Usage

```bash
# Pod resource usage
kubectl top pods -n driveline

# Node resource usage
kubectl top nodes

# HPA status
kubectl get hpa -n driveline
```

### Events

```bash
# Recent events
kubectl get events -n driveline --sort-by='.lastTimestamp'

# Watch events
kubectl get events -n driveline -w
```

### Service Endpoints

```bash
# List all services
kubectl get svc -n driveline

# Get service details
kubectl describe svc driveline-api-service -n driveline

# Get endpoints
kubectl get endpoints -n driveline
```

---

## 📈 Scaling

### Manual Scaling

```bash
# Scale API to 5 replicas
kubectl scale deployment driveline-api -n driveline --replicas=5

# Scale worker to 10 replicas
kubectl scale deployment driveline-worker -n driveline --replicas=10

# Scale gRPC service
kubectl scale deployment driveline-grpc -n driveline --replicas=4
```

### Horizontal Pod Autoscaler (HPA)

HPA is already configured and will automatically scale based on:
- CPU utilization (target: 70%)
- Memory utilization (target: 80%)

```bash
# Check HPA status
kubectl get hpa -n driveline

# Detailed HPA info
kubectl describe hpa driveline-api-hpa -n driveline

# Edit HPA settings
kubectl edit hpa driveline-api-hpa -n driveline
```

**HPA Ranges:**
- API: 2-10 replicas
- gRPC: 2-8 replicas
- Webhook: 2-6 replicas
- Worker: 3-10 replicas

---

## 🔒 Network Policies

Network policies are configured to:
- ✅ Isolate pods by component
- ✅ Allow only necessary pod-to-pod communication
- ✅ Block unauthorized traffic
- ✅ Allow ingress traffic only from NGINX Ingress

```bash
# View network policies
kubectl get networkpolicies -n driveline

# Describe a policy
kubectl describe networkpolicy api-network-policy -n driveline
```

---

## 🛠️ Troubleshooting

### Pods Not Starting

```bash
# Check pod status
kubectl get pods -n driveline

# Describe problematic pod
kubectl describe pod <pod-name> -n driveline

# View pod logs
kubectl logs <pod-name> -n driveline

# Check events
kubectl get events -n driveline --sort-by='.lastTimestamp'
```

### Image Pull Errors

```bash
# Rebuild image
docker build -t driveline-express-nest-ts-api:0.5.0 .

# Verify image exists
docker images | grep driveline

# Delete and recreate deployment
kubectl delete deployment driveline-api -n driveline
kubectl apply -f k8s/07-api-deployment.yaml
```

### Port Forwarding Issues

```bash
# Restart port forwarding
./k8s/restart-port-forward.sh

# Or manually
lsof -ti:3000 | xargs kill -9
kubectl port-forward -n ingress-nginx service/ingress-nginx-controller 3000:80
```

### Database Connection Issues

```bash
# Check MongoDB status
kubectl logs -l app=mongodb -n driveline

# Check MongoDB service
kubectl get svc mongodb-service -n driveline

# Connect to MongoDB pod
kubectl exec -it mongodb-0 -n driveline -- mongosh

# Check Redis
kubectl exec -it redis-0 -n driveline -- redis-cli ping

# Check RabbitMQ
kubectl logs -l app=rabbitmq -n driveline
```

### Resource Exhaustion

```bash
# Check resource usage
kubectl top pods -n driveline
kubectl top nodes

# Increase resources in Docker Desktop
# Docker Desktop → Settings → Resources → Advanced

# Or reduce replicas
kubectl scale deployment driveline-api -n driveline --replicas=1
```

### Ingress Not Working

```bash
# Check ingress status
kubectl get ingress -n driveline
kubectl describe ingress driveline-ingress -n driveline

# Check ingress controller
kubectl get pods -n ingress-nginx
kubectl logs -n ingress-nginx -l app.kubernetes.io/component=controller

# Verify service endpoints
kubectl get endpoints -n driveline
```

---

## 🔄 Common Operations

### Update Application

```bash
# Rebuild image
docker build -t driveline-express-nest-ts-api:0.5.0 .

# Restart deployments (rolling update)
kubectl rollout restart deployment driveline-api -n driveline
kubectl rollout restart deployment driveline-grpc -n driveline
kubectl rollout restart deployment driveline-webhook -n driveline
kubectl rollout restart deployment driveline-worker -n driveline

# Check rollout status
kubectl rollout status deployment driveline-api -n driveline
```

### Update Configuration

```bash
# Edit ConfigMap
kubectl edit configmap driveline-config -n driveline

# Edit Secrets
kubectl edit secret driveline-secrets -n driveline

# Restart pods to pickup changes
kubectl rollout restart deployment driveline-api -n driveline
```

### Backup Data

```bash
# Backup MongoDB
kubectl exec mongodb-0 -n driveline -- mongodump --archive=/tmp/backup.archive
kubectl cp driveline/mongodb-0:/tmp/backup.archive ./mongodb-backup.archive

# Backup Redis
kubectl exec redis-0 -n driveline -- redis-cli SAVE
kubectl exec redis-0 -n driveline -- cat /data/dump.rdb > ./redis-backup.rdb
```

### Complete Cleanup

```bash
# Delete everything
./k8s/cleanup.sh

# Or manually
kubectl delete namespace driveline

# Delete persistent volumes (if needed)
kubectl get pv
kubectl delete pv <pv-name>
```

---

## 🚀 Production Considerations

### Security

- [ ] Change all default passwords in `02-secrets.yaml`
- [ ] Use proper SSL/TLS certificates
- [ ] Enable RBAC (Role-Based Access Control)
- [ ] Scan images for vulnerabilities
- [ ] Implement Pod Security Standards
- [ ] Use external secrets management (e.g., HashiCorp Vault)

### High Availability

- [ ] Run multiple MongoDB replicas (replica set)
- [ ] Implement Redis Sentinel or Cluster
- [ ] Use external managed databases (AWS RDS, MongoDB Atlas)
- [ ] Multi-zone deployment
- [ ] Implement backup and disaster recovery

### Monitoring

- [ ] Install Prometheus & Grafana
- [ ] Set up alerting (AlertManager)
- [ ] Implement distributed tracing (Jaeger/Zipkin)
- [ ] Log aggregation (ELK Stack / Loki)
- [ ] Application Performance Monitoring (APM)

### Performance

- [ ] Tune resource requests/limits
- [ ] Implement caching strategies
- [ ] Use CDN for static assets
- [ ] Database query optimization
- [ ] Connection pooling configuration

### CI/CD

- [ ] Set up automated builds (GitHub Actions, Jenkins)
- [ ] Implement GitOps (ArgoCD, Flux)
- [ ] Automated testing pipeline
- [ ] Canary deployments
- [ ] Blue-green deployments

---

## 📝 Useful Scripts

### Deploy
```bash
./k8s/deploy.sh
```

### View Logs (Interactive)
```bash
./k8s/view-logs.sh
```

### Restart Port Forward
```bash
./k8s/restart-port-forward.sh
```

### Cleanup
```bash
./k8s/cleanup.sh
```

---

## 📚 Additional Resources

- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [NGINX Ingress Controller](https://kubernetes.github.io/ingress-nginx/)
- [Docker Desktop Kubernetes](https://docs.docker.com/desktop/kubernetes/)
- [NestJS Documentation](https://docs.nestjs.com/)

---

## 🐛 Support

If you encounter issues:

1. Check the [Troubleshooting](#troubleshooting) section
2. View logs: `./k8s/view-logs.sh`
3. Check events: `kubectl get events -n driveline --sort-by='.lastTimestamp'`
4. Verify resources: `kubectl get all -n driveline`

---

## 📄 License

Apache-2.0 License - See LICENSE file for details

---

**Built with ❤️ for Kubernetes by OmAr-Kader**
