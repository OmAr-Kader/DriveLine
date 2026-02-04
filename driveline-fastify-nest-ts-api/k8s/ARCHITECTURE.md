# 🏗️ Kubernetes Cluster Architecture

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              INGRESS LAYER                                       │
│  ┌────────────────────────────────────────────────────────────────────────┐    │
│  │              NGINX Ingress Controller (Port 80 → 3000)                 │    │
│  │                    Route: localhost:3000/*                              │    │
│  └──────────┬──────────────────────────┬──────────────────────────────────┘    │
└─────────────┼──────────────────────────┼───────────────────────────────────────┘
              │                          │
              │                          │
┌─────────────┼──────────────────────────┼───────────────────────────────────────┐
│             │      APPLICATION LAYER (Worker Nodes)                             │
│  ┌──────────▼────────┐      ┌─────────▼──────────┐                             │
│  │   REST API Pod    │      │   Webhook Pod       │                             │
│  │  (main.ts)        │      │  (main-stripe-      │                             │
│  │  Port: 3001       │      │   webhook.ts)       │                             │
│  │  Replicas: 2-10   │      │  Port: 3003         │                             │
│  │  HPA: ✓           │      │  Replicas: 2-6      │                             │
│  └──────────┬────────┘      └─────────┬───────────┘                             │
│             │                         │                                          │
│  ┌──────────▼────────┐      ┌─────────▼───────────┐                             │
│  │   gRPC Pod        │◄────►│   Worker Pod        │                             │
│  │  (main-grpc.ts)   │      │  (main-worker.ts)   │                             │
│  │  Port: 50051      │      │  RabbitMQ Consumer  │                             │
│  │  Replicas: 2-8    │      │  Replicas: 3-10     │                             │
│  │  HPA: ✓           │      │  HPA: ✓             │                             │
│  └──────────┬────────┘      └─────────┬───────────┘                             │
└─────────────┼──────────────────────────┼───────────────────────────────────────┘
              │                          │
              │                          │
┌─────────────┼──────────────────────────┼───────────────────────────────────────┐
│             │     DATA/PERSISTENCE LAYER (StatefulSets)                         │
│  ┌──────────▼────────┐      ┌─────────▼──────────┐                             │
│  │    MongoDB        │      │    RabbitMQ         │                             │
│  │  Port: 27017      │      │  Port: 5672, 15672  │                             │
│  │  PVC: 10Gi        │      │  PVC: 5Gi           │                             │
│  │  Replicas: 1      │      │  Replicas: 1        │                             │
│  └───────────────────┘      └─────────────────────┘                             │
│                                                                                  │
│  ┌───────────────────┐      ┌─────────────────────┐                             │
│  │    Redis          │      │    ClickHouse       │                             │
│  │  Port: 6379       │      │  Port: 8123, 9000   │                             │
│  │  PVC: 5Gi         │      │  PVC: 10Gi          │                             │
│  │  Replicas: 1      │      │  Replicas: 1        │                             │
│  └───────────────────┘      └─────────────────────┘                             │
└──────────────────────────────────────────────────────────────────────────────────┘
```

## Node Distribution

### Control Plane Node
- **Role**: Cluster management, scheduling, API server
- **Components**: 
  - kube-apiserver
  - etcd
  - kube-scheduler
  - kube-controller-manager

### Worker Node 1 - REST API
```yaml
Service: driveline-api (main.ts)
Port: 3001
Replicas: 2-10 (HPA enabled)
Resources:
  Request: 300m CPU, 512Mi RAM
  Limit: 1000m CPU, 1Gi RAM
Probes: Liveness, Readiness, Startup
```

### Worker Node 2 - gRPC Microservice
```yaml
Service: driveline-grpc (main-grpc.ts)
Port: 50051
Replicas: 2-8 (HPA enabled)
Resources:
  Request: 300m CPU, 512Mi RAM
  Limit: 1000m CPU, 1Gi RAM
Probes: TCP Socket checks
```

### Worker Node 3 - Webhook Service
```yaml
Service: driveline-webhook (main-stripe-webhook.ts)
Port: 3003
Replicas: 2-6 (HPA enabled)
Resources:
  Request: 200m CPU, 256Mi RAM
  Limit: 500m CPU, 512Mi RAM
Probes: HTTP health checks
```

### Worker Node 4 - RabbitMQ Worker
```yaml
Service: driveline-worker (main-worker.ts)
Queue: worker_queue_v1
Replicas: 3-10 (HPA enabled)
Resources:
  Request: 300m CPU, 512Mi RAM
  Limit: 1000m CPU, 1Gi RAM
Probes: Process health checks
```

## Traffic Flow

### External Request Flow
```
User Request → localhost:3000
    ↓
NGINX Ingress Controller (Port Forwarding)
    ↓
Ingress Rules (Path-based routing)
    ↓
┌─────────────────────────────────┐
│ /api/*     → API Service (3001) │
│ /webhook/* → Webhook Service    │
│ /*         → API Service        │
└─────────────────────────────────┘
    ↓
Backend Services (Load Balanced)
    ↓
Database/Cache Services
```

### Internal Service Communication
```
REST API ←─────────────→ gRPC Service
   │                         │
   ├─→ MongoDB ←─────────────┤
   ├─→ Redis   ←─────────────┤
   └─→ ClickHouse

Webhook Service ──→ RabbitMQ ──→ Worker Service
                                      │
                                      ├─→ MongoDB
                                      ├─→ gRPC
                                      └─→ External APIs
```

## Network Policies

### API Pod Communication
```yaml
Ingress:
  - From: NGINX Ingress (Port 3001)
Egress:
  - To: MongoDB (27017)
  - To: Redis (6379)
  - To: RabbitMQ (5672)
  - To: ClickHouse (8123)
  - To: gRPC Service (50051)
  - To: Internet (443, 80)
```

### gRPC Pod Communication
```yaml
Ingress:
  - From: API Pods (50051)
  - From: Worker Pods (50051)
Egress:
  - To: MongoDB (27017)
  - To: Redis (6379)
  - To: Internet (443, 80)
```

### Webhook Pod Communication
```yaml
Ingress:
  - From: NGINX Ingress (Port 3003)
Egress:
  - To: MongoDB (27017)
  - To: RabbitMQ (5672)
  - To: Internet (443, 80)
```

### Worker Pod Communication
```yaml
Egress Only:
  - To: MongoDB (27017)
  - To: RabbitMQ (5672)
  - To: gRPC Service (50051)
  - To: Internet (443, 80)
```

## High Availability Features

### 1. Pod Disruption Budgets (PDB)
- **API**: Minimum 1 pod available during disruptions
- **gRPC**: Minimum 1 pod available
- **Webhook**: Minimum 1 pod available
- **Worker**: Minimum 2 pods available

### 2. Horizontal Pod Autoscaling (HPA)
| Service | Min | Max | CPU Target | Memory Target |
|---------|-----|-----|------------|---------------|
| API | 2 | 10 | 70% | 80% |
| gRPC | 2 | 8 | 70% | 80% |
| Webhook | 2 | 6 | 70% | 80% |
| Worker | 3 | 10 | 70% | 80% |

### 3. Pod Anti-Affinity
- Pods of the same component prefer different nodes
- Improves fault tolerance
- Prevents single point of failure

### 4. Rolling Updates
```yaml
Strategy:
  Type: RollingUpdate
  MaxSurge: 1        # Create 1 extra pod during update
  MaxUnavailable: 0  # Keep all pods running during update
```

### 5. Health Checks
- **Liveness Probe**: Restart pod if unhealthy
- **Readiness Probe**: Remove from service if not ready
- **Startup Probe**: Allow long startup times

## Resource Allocation

### Total Cluster Resources (Minimum)
```yaml
CPUs: 4 cores
Memory: 8 GB
Storage: 35 GB (PersistentVolumes)
  - MongoDB: 10 GB
  - Redis: 5 GB
  - RabbitMQ: 5 GB
  - ClickHouse: 10 GB
  - System: 5 GB
```

### Per-Service Limits
```yaml
API Service (per pod):
  CPU: 200m request, 1000m limit
  Memory: 512Mi request, 1Gi limit

gRPC Service (per pod):
  CPU: 300m request, 1000m limit
  Memory: 512Mi request, 1Gi limit

Webhook Service (per pod):
  CPU: 200m request, 500m limit
  Memory: 256Mi request, 512Mi limit

Worker Service (per pod):
  CPU: 300m request, 1000m limit
  Memory: 512Mi request, 1Gi limit
```

## Monitoring Endpoints

### Application Metrics
```
API Health:     http://localhost:3000/api/v1/health
Webhook Health: http://localhost:3000/webhook/v1/health
RabbitMQ UI:    http://localhost:30672 (guest/guest)
```

### Kubernetes Metrics
```bash
# Pod metrics
kubectl top pods -n driveline

# Node metrics
kubectl top nodes

# HPA status
kubectl get hpa -n driveline

# Resource usage
kubectl describe nodes
```

## Security Layers

1. **Network Policies**: Restrict pod-to-pod communication
2. **RBAC**: Role-based access control (namespace isolation)
3. **Secrets**: Encrypted sensitive data (base64 encoded)
4. **Resource Quotas**: Prevent resource exhaustion
5. **Pod Security**: Non-root containers, read-only filesystems

## Deployment Strategy

### Zero-Downtime Updates
1. Build new Docker image
2. Update image tag in deployment
3. Rolling update begins:
   - Create new pod
   - Wait for readiness probe
   - Remove old pod
   - Repeat for all replicas

### Rollback Capability
```bash
# View rollout history
kubectl rollout history deployment driveline-api -n driveline

# Rollback to previous version
kubectl rollout undo deployment driveline-api -n driveline

# Rollback to specific revision
kubectl rollout undo deployment driveline-api -n driveline --to-revision=2
```

---

## Best Practices Implemented

✅ **Separation of Concerns**: Each service runs in dedicated pods
✅ **Stateless Applications**: Application logic separate from data
✅ **Immutable Infrastructure**: Containers are immutable
✅ **Configuration Management**: ConfigMaps and Secrets
✅ **Health Monitoring**: Comprehensive probe configuration
✅ **Resource Management**: CPU and memory limits
✅ **Auto-scaling**: HPA for dynamic load handling
✅ **High Availability**: Multiple replicas with anti-affinity
✅ **Network Security**: Network policies for isolation
✅ **Persistent Storage**: StatefulSets for databases
✅ **Graceful Shutdown**: Termination grace periods
✅ **Rolling Updates**: Zero-downtime deployments

---

**This architecture follows Kubernetes best practices and is production-ready with proper monitoring, scaling, and security configurations.**
