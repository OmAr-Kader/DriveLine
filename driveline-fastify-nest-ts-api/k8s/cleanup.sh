#!/bin/bash

###############################################################################
# Cleanup Script - Remove all Kubernetes resources
###############################################################################

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}⚠️  WARNING: This will delete all DriveLineExpress resources!${NC}"
echo -e "${YELLOW}⏸  Press Ctrl+C to cancel, or wait 5 seconds to continue...${NC}"
sleep 5

echo -e "${RED}🗑  Deleting namespace and all resources...${NC}"

# Stop port forwarding
if [ -f /tmp/kubectl-port-forward.pid ]; then
    PID=$(cat /tmp/kubectl-port-forward.pid)
    kill $PID 2>/dev/null || true
    rm /tmp/kubectl-port-forward.pid
fi

lsof -ti:3000 | xargs kill -9 2>/dev/null || true

# Delete namespace (this deletes everything in it)
kubectl delete namespace driveline --wait=true

echo -e "${GREEN}✅ Cleanup complete!${NC}"
echo ""
echo -e "${YELLOW}Note: PersistentVolumes may still exist. To delete them:${NC}"
echo -e "${YELLOW}kubectl get pv${NC}"
echo -e "${YELLOW}kubectl delete pv <pv-name>${NC}"
