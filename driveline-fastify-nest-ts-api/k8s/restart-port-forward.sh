#!/bin/bash

###############################################################################
# Restart Port Forwarding Script
# Use this script if port forwarding stops working
###############################################################################

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${YELLOW}🔄 Restarting port forwarding...${NC}"

# Kill existing port forward processes
if [ -f /tmp/kubectl-port-forward.pid ]; then
    PID=$(cat /tmp/kubectl-port-forward.pid)
    kill $PID 2>/dev/null || true
    rm /tmp/kubectl-port-forward.pid
fi

# Kill any process on port 3000
lsof -ti:3000 | xargs kill -9 2>/dev/null || true

# Wait a moment
sleep 2

# Start new port forward
echo -e "${YELLOW}Starting new port forward...${NC}"
kubectl port-forward -n ingress-nginx service/ingress-nginx-controller 3000:80 > /tmp/kubectl-port-forward.log 2>&1 &
PF_PID=$!

# Save PID
echo $PF_PID > /tmp/kubectl-port-forward.pid

# Wait and verify
sleep 3

if ps -p $PF_PID > /dev/null; then
    echo -e "${GREEN}✅ Port forwarding restarted successfully (PID: $PF_PID)${NC}"
    echo -e "${GREEN}🌐 Access your API at: http://localhost:3000${NC}"
else
    echo -e "${RED}❌ Port forwarding failed. Check /tmp/kubectl-port-forward.log${NC}"
    exit 1
fi
