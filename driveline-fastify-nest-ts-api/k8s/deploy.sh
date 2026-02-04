#!/bin/bash

###############################################################################
# Kubernetes Cluster Setup Script for macOS
# DriveLineExpress NestJS API - Multi-Node Deployment
###############################################################################

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored messages
print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_step() {
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}📍 STEP: $1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

###############################################################################
# Step 1: Pre-flight Checks
###############################################################################
print_step "Pre-flight Checks"

# Check if kubectl is installed
if ! command -v kubectl &> /dev/null; then
    print_error "kubectl not found. Please install kubectl first."
    exit 1
fi
print_success "kubectl is installed: $(kubectl version --client --short 2>/dev/null || kubectl version --client 2>/dev/null | head -n 1)"

# Check if Docker Desktop is running
if ! docker info &> /dev/null; then
    print_error "Docker is not running. Please start Docker Desktop."
    exit 1
fi
print_success "Docker Desktop is running"

# Check if Kubernetes is enabled in Docker Desktop
if ! kubectl cluster-info &> /dev/null; then
    print_error "Kubernetes is not enabled in Docker Desktop."
    print_info "Please enable Kubernetes in Docker Desktop: Preferences > Kubernetes > Enable Kubernetes"
    exit 1
fi
print_success "Kubernetes is enabled and accessible"

# Display cluster info
print_info "Cluster Information:"
kubectl cluster-info

###############################################################################
# Step 2: Enable Kubernetes Metrics Server
###############################################################################
print_step "Installing Metrics Server (for HPA)"

if kubectl get deployment metrics-server -n kube-system &> /dev/null; then
    print_warning "Metrics Server already installed"
else
    print_info "Installing Metrics Server..."
    kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml
    
    # Patch metrics-server for Docker Desktop (insecure TLS)
    print_info "Patching Metrics Server for Docker Desktop..."
    kubectl patch deployment metrics-server -n kube-system --type='json' \
        -p='[{"op": "add", "path": "/spec/template/spec/containers/0/args/-", "value": "--kubelet-insecure-tls"}]'
    
    print_info "Waiting for Metrics Server to be ready..."
    kubectl wait --for=condition=available --timeout=120s deployment/metrics-server -n kube-system
fi
print_success "Metrics Server is ready"

###############################################################################
# Step 3: Install NGINX Ingress Controller
###############################################################################
print_step "Installing NGINX Ingress Controller"

if kubectl get namespace ingress-nginx &> /dev/null; then
    print_warning "NGINX Ingress Controller already installed"
else
    print_info "Installing NGINX Ingress Controller..."
    kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.11.3/deploy/static/provider/cloud/deploy.yaml
    
    print_info "Waiting for Ingress Controller to be ready..."
    kubectl wait --namespace ingress-nginx \
        --for=condition=ready pod \
        --selector=app.kubernetes.io/component=controller \
        --timeout=120s
fi
print_success "NGINX Ingress Controller is ready"

###############################################################################
# Step 4: Label the ingress-nginx namespace
###############################################################################
print_step "Configuring NGINX Ingress Namespace"

kubectl label namespace ingress-nginx name=ingress-nginx --overwrite
print_success "Namespace labeled for network policies"

###############################################################################
# Step 5: Build Docker Image
###############################################################################
print_step "Building Docker Image"

print_info "Building driveline-express-nest-ts-api:0.5.0 image..."
docker build -t driveline-express-nest-ts-api:0.5.0 .

print_success "Docker image built successfully"

###############################################################################
# Step 6: Apply Kubernetes Manifests
###############################################################################
print_step "Deploying Kubernetes Resources"

# Apply manifests in order
print_info "Creating namespace and base configurations..."
kubectl apply -f k8s/00-namespace.yaml
kubectl apply -f k8s/01-configmap.yaml
kubectl apply -f k8s/02-secrets.yaml

print_info "Deploying stateful services (MongoDB, Redis, RabbitMQ, ClickHouse)..."
kubectl apply -f k8s/03-mongodb-statefulset.yaml
kubectl apply -f k8s/04-redis-statefulset.yaml
kubectl apply -f k8s/05-rabbitmq-statefulset.yaml
kubectl apply -f k8s/06-clickhouse-statefulset.yaml

print_info "Waiting for stateful services to be ready (this may take a few minutes)..."
kubectl wait --for=condition=ready pod -l app=mongodb -n driveline --timeout=300s
kubectl wait --for=condition=ready pod -l app=redis -n driveline --timeout=300s
kubectl wait --for=condition=ready pod -l app=rabbitmq -n driveline --timeout=300s
kubectl wait --for=condition=ready pod -l app=clickhouse -n driveline --timeout=300s

print_info "Deploying application services..."
kubectl apply -f k8s/07-api-deployment.yaml
kubectl apply -f k8s/08-grpc-deployment.yaml
kubectl apply -f k8s/09-webhook-deployment.yaml
kubectl apply -f k8s/10-worker-deployment.yaml

print_info "Configuring Ingress and policies..."
kubectl apply -f k8s/11-ingress.yaml
kubectl apply -f k8s/12-hpa.yaml
kubectl apply -f k8s/13-pdb.yaml
kubectl apply -f k8s/14-network-policies.yaml

print_success "All Kubernetes resources deployed"

###############################################################################
# Step 7: Wait for Application Pods
###############################################################################
print_step "Waiting for Application Pods to be Ready"

print_info "Waiting for API pods..."
kubectl wait --for=condition=ready pod -l component=api -n driveline --timeout=300s

print_info "Waiting for gRPC pods..."
kubectl wait --for=condition=ready pod -l component=grpc -n driveline --timeout=300s

print_info "Waiting for Webhook pods..."
kubectl wait --for=condition=ready pod -l component=webhook -n driveline --timeout=300s

print_info "Waiting for Worker pods..."
kubectl wait --for=condition=ready pod -l component=worker -n driveline --timeout=300s

print_success "All application pods are ready!"

###############################################################################
# Step 8: Setup Port Forwarding
###############################################################################
print_step "Setting Up Port Forwarding"

print_info "Setting up port forwarding for localhost:3000..."
print_warning "This will run in the background. To stop: kill \$(lsof -ti:3000)"

# Kill any existing process on port 3000
lsof -ti:3000 | xargs kill -9 2>/dev/null || true

# Start port forwarding in background
kubectl port-forward -n ingress-nginx service/ingress-nginx-controller 3000:80 > /tmp/kubectl-port-forward.log 2>&1 &
PF_PID=$!

# Wait a moment for port forwarding to establish
sleep 3

if ps -p $PF_PID > /dev/null; then
    print_success "Port forwarding established (PID: $PF_PID)"
    echo $PF_PID > /tmp/kubectl-port-forward.pid
else
    print_error "Port forwarding failed. Check /tmp/kubectl-port-forward.log"
    exit 1
fi

###############################################################################
# Step 9: Display Cluster Status
###############################################################################
print_step "Cluster Status"

echo ""
print_info "=== Namespace Status ==="
kubectl get all -n driveline

echo ""
print_info "=== Pod Status ==="
kubectl get pods -n driveline -o wide

echo ""
print_info "=== Service Status ==="
kubectl get svc -n driveline

echo ""
print_info "=== Ingress Status ==="
kubectl get ingress -n driveline

echo ""
print_info "=== HPA Status ==="
kubectl get hpa -n driveline

###############################################################################
# Step 10: Success Message and Access URLs
###############################################################################
echo ""
print_step "✨ Deployment Complete! ✨"

cat << EOF

${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}
${GREEN}🎉 Your Kubernetes cluster is now running!${NC}
${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}

${BLUE}📡 Access URLs:${NC}
${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}
  🌐 REST API:       http://localhost:3000/api/v1/
  📊 Health Check:   http://localhost:3000/api/v1/health
  📈 Stats:          http://localhost:3000/api/v1/stats/counts
  🔗 Webhooks:       http://localhost:3000/webhook/v1/stripe
  🐰 RabbitMQ UI:    http://localhost:30672 (guest/guest)

${BLUE}📦 Services Running:${NC}
${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}
  ✅ REST API        - 2 replicas (Port 3001)
  ✅ gRPC Service    - 2 replicas (Port 50051)
  ✅ Webhook Service - 2 replicas (Port 3003)
  ✅ Worker Service  - 3 replicas (RabbitMQ)
  ✅ MongoDB         - 1 replica
  ✅ Redis           - 1 replica
  ✅ RabbitMQ        - 1 replica
  ✅ ClickHouse      - 1 replica

${BLUE}🛠  Useful Commands:${NC}
${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}
  View all pods:         ${YELLOW}kubectl get pods -n driveline${NC}
  View logs (API):       ${YELLOW}kubectl logs -f -l component=api -n driveline${NC}
  View logs (Worker):    ${YELLOW}kubectl logs -f -l component=worker -n driveline${NC}
  View logs (gRPC):      ${YELLOW}kubectl logs -f -l component=grpc -n driveline${NC}
  Scale API:             ${YELLOW}kubectl scale deployment driveline-api -n driveline --replicas=5${NC}
  Delete everything:     ${YELLOW}kubectl delete namespace driveline${NC}
  Restart port forward:  ${YELLOW}./k8s/restart-port-forward.sh${NC}

${BLUE}🔍 Monitoring:${NC}
${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}
  Watch pods:            ${YELLOW}kubectl get pods -n driveline -w${NC}
  Resource usage:        ${YELLOW}kubectl top pods -n driveline${NC}
  Describe pod:          ${YELLOW}kubectl describe pod <pod-name> -n driveline${NC}
  Events:                ${YELLOW}kubectl get events -n driveline --sort-by='.lastTimestamp'${NC}

${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}
${GREEN}💡 Test your API:${NC}
${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}
  ${YELLOW}curl http://localhost:3000/api/v1/health${NC}
  ${YELLOW}curl http://localhost:3000/api/v1/stats/counts${NC}

${GREEN}Happy coding! 🚀${NC}

EOF
