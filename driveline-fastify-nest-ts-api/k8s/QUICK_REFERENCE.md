# ⚡ Quick Reference Guide

## 🚀 Quick Start (TL;DR)

```bash
# 1. Navigate to project
cd /Users/omar-kader/Desktop/Back-End/NestJS/driveline-express-nest-ts-api

# 2. Deploy everything
./k8s/deploy.sh

# 3. Test
curl http://localhost:3000/api/v1/health
```

---

## 📋 Essential Commands

### Deployment
```bash
# Deploy entire cluster
./k8s/deploy.sh

# Deploy specific resource
kubectl apply -f k8s/07-api-deployment.yaml

# Rebuild and redeploy
docker build -t driveline-express-nest-ts-api:0.5.0 .
kubectl rollout restart deployment driveline-api -n driveline
```

### Monitoring
```bash
# Interactive log viewer
./k8s/view-logs.sh

# View all pods
kubectl get pods -n driveline

# Watch pods in real-time
kubectl get pods -n driveline -w

# Resource usage
kubectl top pods -n driveline

# HPA status
kubectl get hpa -n driveline
```

### Logs
```bash
# API logs
kubectl logs -f -l component=api -n driveline

# Worker logs
kubectl logs -f -l component=worker -n driveline

# gRPC logs
kubectl logs -f -l component=grpc -n driveline

# All services
kubectl logs -f --all-containers=true -n driveline
```

### Scaling
```bash
# Scale API to 5 replicas
kubectl scale deployment driveline-api -n driveline --replicas=5

# Scale worker to 8 replicas
kubectl scale deployment driveline-worker -n driveline --replicas=8
```

### Port Forwarding
```bash
# Restart port forwarding
./k8s/restart-port-forward.sh

# Manual port forward
kubectl port-forward -n ingress-nginx service/ingress-nginx-controller 3000:80
```

### Cleanup
```bash
# Delete everything
./k8s/cleanup.sh

# Or manually
kubectl delete namespace driveline
```

---

## 🌐 Access URLs

| Service | URL |
|---------|-----|
| Health Check | `http://localhost:3000/api/v1/health` |
| Stats API | `http://localhost:3000/api/v1/stats/counts` |
| Webhooks | `http://localhost:3000/webhook/v1/stripe` |
| RabbitMQ UI | `http://localhost:30672` (guest/guest) |

---

## 🏗️ Architecture Overview

```
localhost:3000
    ↓
NGINX Ingress
    ↓
┌──────────┬─────────┬──────────┬─────────┐
│ REST API │  gRPC   │ Webhook  │ Worker  │
│  (3001)  │ (50051) │  (3003)  │ (Queue) │
└────┬─────┴────┬────┴────┬─────┴────┬────┘
     │          │         │          │
  ┌──┴──────────┴─────────┴──────────┴──┐
  │ MongoDB • Redis • RabbitMQ • ClickHouse │
  └────────────────────────────────────────┘
```

---

## 📊 Service Details

| Service | Replicas | Port | HPA Range |
|---------|----------|------|-----------|
| REST API | 2 | 3001 | 2-10 |
| gRPC | 2 | 50051 | 2-8 |
| Webhook | 2 | 3003 | 2-6 |
| Worker | 3 | N/A | 3-10 |

---

## 🔧 Troubleshooting

### Pods Not Starting
```bash
kubectl describe pod <pod-name> -n driveline
kubectl logs <pod-name> -n driveline
kubectl get events -n driveline --sort-by='.lastTimestamp'
```

### Port Forward Issues
```bash
./k8s/restart-port-forward.sh
```

### Image Issues
```bash
docker build -t driveline-express-nest-ts-api:0.5.0 .
kubectl rollout restart deployment driveline-api -n driveline
```

### Database Issues
```bash
kubectl logs -l app=mongodb -n driveline
kubectl exec -it mongodb-0 -n driveline -- mongosh
kubectl exec -it redis-0 -n driveline -- redis-cli ping
```

---

## 📦 File Structure

```
k8s/
├── 00-namespace.yaml          # Namespace, quotas, limits
├── 01-configmap.yaml          # Configuration
├── 02-secrets.yaml            # Secrets (passwords, keys)
├── 03-mongodb-statefulset.yaml
├── 04-redis-statefulset.yaml
├── 05-rabbitmq-statefulset.yaml
├── 06-clickhouse-statefulset.yaml
├── 07-api-deployment.yaml     # REST API
├── 08-grpc-deployment.yaml    # gRPC service
├── 09-webhook-deployment.yaml # Stripe webhooks
├── 10-worker-deployment.yaml  # RabbitMQ workers
├── 11-ingress.yaml            # NGINX Ingress
├── 12-hpa.yaml                # Auto-scaling
├── 13-pdb.yaml                # Disruption budgets
├── 14-network-policies.yaml   # Network security
├── deploy.sh                  # Main deployment script
├── cleanup.sh                 # Cleanup script
├── restart-port-forward.sh    # Port forward helper
├── view-logs.sh               # Log viewer
├── README.md                  # Full documentation
└── ARCHITECTURE.md            # Architecture details
```

---

## 🔄 Common Workflows

### Update Application Code
```bash
# 1. Build new image
docker build -t driveline-express-nest-ts-api:0.5.0 .

# 2. Rolling restart
kubectl rollout restart deployment driveline-api -n driveline
kubectl rollout restart deployment driveline-grpc -n driveline
kubectl rollout restart deployment driveline-webhook -n driveline
kubectl rollout restart deployment driveline-worker -n driveline

# 3. Check status
kubectl rollout status deployment driveline-api -n driveline
```

### Update Configuration
```bash
# Edit config
kubectl edit configmap driveline-config -n driveline

# Restart to apply
kubectl rollout restart deployment driveline-api -n driveline
```

### View Service Status
```bash
kubectl get all -n driveline
kubectl get pods -n driveline -o wide
kubectl get svc -n driveline
kubectl get ingress -n driveline
```

---

## 💡 Tips & Tricks

### Watch Resources
```bash
# Watch pods
kubectl get pods -n driveline -w

# Watch HPA
kubectl get hpa -n driveline -w

# Watch events
kubectl get events -n driveline -w
```

### Debug Pod
```bash
# Shell into pod
kubectl exec -it <pod-name> -n driveline -- /bin/sh

# Run command in pod
kubectl exec <pod-name> -n driveline -- env

# Copy files from pod
kubectl cp driveline/<pod-name>:/path/to/file ./local-file
```

### Resource Usage
```bash
# Overall usage
kubectl top pods -n driveline
kubectl top nodes

# Specific pod
kubectl top pod <pod-name> -n driveline
```

---

## 🚨 Emergency Commands

### Service Down
```bash
# Check status
kubectl get pods -n driveline | grep -v Running

# Describe problem pod
kubectl describe pod <pod-name> -n driveline

# Force restart
kubectl delete pod <pod-name> -n driveline
```

### High Resource Usage
```bash
# Check usage
kubectl top pods -n driveline --sort-by=memory
kubectl top pods -n driveline --sort-by=cpu

# Scale down
kubectl scale deployment driveline-api -n driveline --replicas=1
```

### Complete Reset
```bash
# Nuclear option - delete everything
./k8s/cleanup.sh

# Redeploy
./k8s/deploy.sh
```

---

## 📚 Resources

- **Full Documentation**: [k8s/README.md](README.md)
- **Architecture Details**: [k8s/ARCHITECTURE.md](ARCHITECTURE.md)
- **Kubernetes Docs**: https://kubernetes.io/docs/
- **NGINX Ingress**: https://kubernetes.github.io/ingress-nginx/

---

## ⚙️ Configuration Files

### Change Ports
Edit `k8s/01-configmap.yaml`:
```yaml
PORT_API: "3001"
GRPC_PORT: "50051"
PORT_WEBHOOK: "3003"
```

### Change Replicas
Edit deployment files or scale directly:
```bash
kubectl scale deployment driveline-api -n driveline --replicas=X
```

### Change Resources
Edit deployment files:
```yaml
resources:
  requests:
    memory: "512Mi"
    cpu: "300m"
  limits:
    memory: "1Gi"
    cpu: "1000m"
```

---

**Keep this guide handy for quick reference! 📖**
