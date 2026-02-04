# 📁 Kubernetes Directory Structure

## Overview

This directory contains everything needed to deploy your NestJS microservices application to Kubernetes with a multi-node architecture.

```
k8s/
├── 📄 Kubernetes Manifests (14 YAML files)
│   ├── 00-namespace.yaml
│   ├── 01-configmap.yaml
│   ├── 02-secrets.yaml
│   ├── 03-mongodb-statefulset.yaml
│   ├── 04-redis-statefulset.yaml
│   ├── 05-rabbitmq-statefulset.yaml
│   ├── 06-clickhouse-statefulset.yaml
│   ├── 07-api-deployment.yaml
│   ├── 08-grpc-deployment.yaml
│   ├── 09-webhook-deployment.yaml
│   ├── 10-worker-deployment.yaml
│   ├── 11-ingress.yaml
│   ├── 12-hpa.yaml
│   ├── 13-pdb.yaml
│   └── 14-network-policies.yaml
│
├── 🔧 Helper Scripts (4 shell scripts)
│   ├── deploy.sh
│   ├── cleanup.sh
│   ├── restart-port-forward.sh
│   └── view-logs.sh
│
└── 📚 Documentation (4 markdown files)
    ├── README.md
    ├── ARCHITECTURE.md
    ├── QUICK_REFERENCE.md
    └── SUMMARY.md
```

---

## 📄 Kubernetes Manifests

### Configuration Layer

| File | Purpose | Size |
|------|---------|------|
| **00-namespace.yaml** | Namespace, resource quotas, and limits | 733B |
| **01-configmap.yaml** | Application configuration (env vars) | 1.8K |
| **02-secrets.yaml** | Sensitive data (passwords, keys) | 1.1K |

### Stateful Services Layer

| File | Service | Port | Storage |
|------|---------|------|---------|
| **03-mongodb-statefulset.yaml** | MongoDB | 27017 | 10Gi |
| **04-redis-statefulset.yaml** | Redis | 6379 | 5Gi |
| **05-rabbitmq-statefulset.yaml** | RabbitMQ | 5672, 15672 | 5Gi |
| **06-clickhouse-statefulset.yaml** | ClickHouse | 8123, 9000 | 10Gi |

### Application Services Layer

| File | Service | Entry Point | Port |
|------|---------|-------------|------|
| **07-api-deployment.yaml** | REST API | main.ts | 3001 |
| **08-grpc-deployment.yaml** | gRPC Service | main-grpc.ts | 50051 |
| **09-webhook-deployment.yaml** | Stripe Webhooks | main-stripe-webhook.ts | 3003 |
| **10-worker-deployment.yaml** | RabbitMQ Worker | main-worker.ts | N/A |

### Networking & Policy Layer

| File | Purpose |
|------|---------|
| **11-ingress.yaml** | NGINX Ingress routing configuration |
| **12-hpa.yaml** | Horizontal Pod Autoscalers (4 HPAs) |
| **13-pdb.yaml** | Pod Disruption Budgets (4 PDBs) |
| **14-network-policies.yaml** | Network security policies (5 policies) |

---

## 🔧 Helper Scripts

### Main Scripts

| Script | Purpose | Usage |
|--------|---------|-------|
| **deploy.sh** | Complete cluster deployment | `./k8s/deploy.sh` |
| **cleanup.sh** | Remove all resources | `./k8s/cleanup.sh` |
| **restart-port-forward.sh** | Restart port forwarding | `./k8s/restart-port-forward.sh` |
| **view-logs.sh** | Interactive log viewer | `./k8s/view-logs.sh` |

### Script Details

#### deploy.sh (12K)
- ✅ Checks prerequisites
- ✅ Installs NGINX Ingress
- ✅ Installs Metrics Server
- ✅ Builds Docker image
- ✅ Applies all manifests
- ✅ Sets up port forwarding
- ✅ Displays status and URLs

#### cleanup.sh (1.1K)
- ⚠️ Deletes namespace
- ⚠️ Removes all resources
- ⚠️ Stops port forwarding
- ℹ️ Warns before deletion

#### restart-port-forward.sh (1.3K)
- 🔄 Kills existing port forward
- 🔄 Starts new port forward
- 🔄 Verifies connection

#### view-logs.sh (3.1K)
- 📋 Interactive menu
- 📋 View logs by service
- 📋 Pod status display

---

## 📚 Documentation

### Document Overview

| Document | Pages | Purpose | Read When |
|----------|-------|---------|-----------|
| **README.md** | 17K | Complete setup guide | Before deployment |
| **ARCHITECTURE.md** | 13K | Architecture details | Understanding design |
| **QUICK_REFERENCE.md** | 7.4K | Quick commands | Daily operations |
| **SUMMARY.md** | 11K | What was created | After reading this |

### Documentation Guide

#### 1. Start Here: SUMMARY.md
- Overview of what was created
- Quick start guide
- Key benefits
- Next steps

#### 2. Deployment: README.md
- Prerequisites check
- Step-by-step setup
- Detailed explanations
- Troubleshooting guide
- Production considerations

#### 3. Understanding: ARCHITECTURE.md
- System architecture diagrams
- Node distribution
- Traffic flow
- Network policies
- Resource allocation
- Best practices

#### 4. Daily Use: QUICK_REFERENCE.md
- Essential commands
- Common workflows
- Troubleshooting tips
- Quick access

---

## 🗂️ File Organization

### By Category

```
Configuration Files:
└── 00-namespace.yaml (Namespace setup)
└── 01-configmap.yaml (App config)
└── 02-secrets.yaml (Sensitive data)

Infrastructure Services:
└── 03-mongodb-statefulset.yaml (Database)
└── 04-redis-statefulset.yaml (Cache)
└── 05-rabbitmq-statefulset.yaml (Message queue)
└── 06-clickhouse-statefulset.yaml (Analytics)

Application Services:
└── 07-api-deployment.yaml (REST API)
└── 08-grpc-deployment.yaml (gRPC)
└── 09-webhook-deployment.yaml (Webhooks)
└── 10-worker-deployment.yaml (Background jobs)

Networking & Policies:
└── 11-ingress.yaml (External access)
└── 12-hpa.yaml (Auto-scaling)
└── 13-pdb.yaml (High availability)
└── 14-network-policies.yaml (Security)

Automation:
└── deploy.sh (Deploy everything)
└── cleanup.sh (Remove everything)
└── restart-port-forward.sh (Fix networking)
└── view-logs.sh (Monitor logs)

Documentation:
└── README.md (Setup guide)
└── ARCHITECTURE.md (Architecture docs)
└── QUICK_REFERENCE.md (Quick commands)
└── SUMMARY.md (Overview)
└── INDEX.md (This file)
```

### By Deployment Order

```
Phase 1: Base Setup
├── 00-namespace.yaml
├── 01-configmap.yaml
└── 02-secrets.yaml

Phase 2: Infrastructure
├── 03-mongodb-statefulset.yaml
├── 04-redis-statefulset.yaml
├── 05-rabbitmq-statefulset.yaml
└── 06-clickhouse-statefulset.yaml

Phase 3: Applications
├── 07-api-deployment.yaml
├── 08-grpc-deployment.yaml
├── 09-webhook-deployment.yaml
└── 10-worker-deployment.yaml

Phase 4: Networking
├── 11-ingress.yaml
├── 12-hpa.yaml
├── 13-pdb.yaml
└── 14-network-policies.yaml
```

---

## 📊 Statistics

### Files by Type

| Type | Count | Total Size |
|------|-------|------------|
| YAML Manifests | 14 | ~35K |
| Shell Scripts | 4 | ~18K |
| Markdown Docs | 4 | ~48K |
| **Total** | **22** | **~101K** |

### Resource Breakdown

| Category | Count |
|----------|-------|
| Namespaces | 1 |
| ConfigMaps | 1 |
| Secrets | 1 |
| StatefulSets | 4 |
| Deployments | 4 |
| Services | 8 |
| Ingress | 1 |
| HPA | 4 |
| PDB | 4 |
| NetworkPolicies | 5 |
| **Total Resources** | **33** |

### Service Distribution

```
Application Pods:  4 services (9 replicas)
Infrastructure:    4 services (4 replicas)
Total Pods:       ~13 initial pods
Max Pods (HPA):   ~34 pods
```

---

## 🚀 Quick Start Guide

### First Time Setup

```bash
# 1. Navigate to project
cd /Users/omar-kader/Desktop/Back-End/NestJS/driveline-express-nest-ts-api

# 2. Review configuration
cat k8s/SUMMARY.md          # Overview
cat k8s/README.md           # Full guide

# 3. Deploy
./k8s/deploy.sh

# 4. Verify
kubectl get pods -n driveline
curl http://localhost:3000/api/v1/health
```

### Daily Operations

```bash
# View logs
./k8s/view-logs.sh

# Check status
kubectl get pods -n driveline

# Scale service
kubectl scale deployment driveline-api -n driveline --replicas=5

# Update app
docker build -t driveline-express-nest-ts-api:0.5.0 .
kubectl rollout restart deployment driveline-api -n driveline
```

---

## 🎯 What to Read Next

### For First-Time Users
1. Read **SUMMARY.md** - Get overview
2. Read **README.md** - Understand setup
3. Run **deploy.sh** - Deploy cluster
4. Keep **QUICK_REFERENCE.md** handy

### For Understanding Architecture
1. Read **ARCHITECTURE.md** - Deep dive
2. Review manifests (00-14)
3. Study network policies

### For Daily Operations
1. Use **QUICK_REFERENCE.md**
2. Run **view-logs.sh**
3. Check Kubernetes docs

---

## 🔗 Quick Links

### External Resources
- [Kubernetes Docs](https://kubernetes.io/docs/)
- [NGINX Ingress](https://kubernetes.github.io/ingress-nginx/)
- [Docker Desktop K8s](https://docs.docker.com/desktop/kubernetes/)
- [NestJS Docs](https://docs.nestjs.com/)

### Internal Documentation
- [Full Setup Guide](README.md)
- [Architecture Details](ARCHITECTURE.md)
- [Quick Commands](QUICK_REFERENCE.md)
- [Project Overview](SUMMARY.md)

---

## 💡 Pro Tips

### File Management
- ✅ Manifests are numbered for deployment order
- ✅ Scripts are executable (chmod +x already done)
- ✅ Documentation is comprehensive
- ✅ All configs in one place

### Version Control
```bash
# Add to .gitignore if needed
k8s/.env
k8s/*-override.yaml
```

### Customization
- Edit ConfigMap: `k8s/01-configmap.yaml`
- Edit Secrets: `k8s/02-secrets.yaml`
- Change replicas: Edit deployment files
- Adjust resources: Edit deployment files

---

## 🎓 Learning Path

### Beginner
1. Deploy with `deploy.sh`
2. View logs with `view-logs.sh`
3. Read `QUICK_REFERENCE.md`
4. Experiment with `kubectl` commands

### Intermediate
1. Understand each manifest file
2. Read `ARCHITECTURE.md`
3. Modify ConfigMaps and Secrets
4. Scale services manually

### Advanced
1. Customize network policies
2. Tune HPA settings
3. Implement monitoring
4. Add CI/CD pipeline

---

## 📞 Getting Help

### Troubleshooting Steps
1. Check pod status: `kubectl get pods -n driveline`
2. View logs: `./k8s/view-logs.sh`
3. Check events: `kubectl get events -n driveline`
4. Review documentation: `k8s/README.md`

### Common Issues
- Port forwarding: `./k8s/restart-port-forward.sh`
- Pod not starting: Check logs and describe pod
- Image issues: Rebuild with `docker build`
- Resource limits: Check with `kubectl top`

---

## ✅ Verification Checklist

After deployment, verify:
- [ ] All pods running: `kubectl get pods -n driveline`
- [ ] Services accessible: `kubectl get svc -n driveline`
- [ ] Ingress working: `curl http://localhost:3000/api/v1/health`
- [ ] HPA active: `kubectl get hpa -n driveline`
- [ ] Logs available: `./k8s/view-logs.sh`

---

**This directory contains everything you need for a production-ready Kubernetes deployment! 🚀**

*For questions, refer to README.md or QUICK_REFERENCE.md*
