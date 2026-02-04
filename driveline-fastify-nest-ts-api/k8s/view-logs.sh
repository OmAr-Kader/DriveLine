#!/bin/bash

###############################################################################
# View Logs Script - Easily view logs from different services
###############################################################################

# Color codes
BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

show_menu() {
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}📋 DriveLineExpress - Log Viewer${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo "1) REST API logs"
    echo "2) gRPC Service logs"
    echo "3) Webhook Service logs"
    echo "4) Worker Service logs"
    echo "5) MongoDB logs"
    echo "6) Redis logs"
    echo "7) RabbitMQ logs"
    echo "8) ClickHouse logs"
    echo "9) All pods status"
    echo "0) Exit"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

while true; do
    show_menu
    read -p "Select an option (0-9): " choice
    
    case $choice in
        1)
            echo -e "${YELLOW}📄 Viewing REST API logs (Press Ctrl+C to exit)...${NC}"
            kubectl logs -f -l component=api -n driveline --tail=100
            ;;
        2)
            echo -e "${YELLOW}📄 Viewing gRPC Service logs (Press Ctrl+C to exit)...${NC}"
            kubectl logs -f -l component=grpc -n driveline --tail=100
            ;;
        3)
            echo -e "${YELLOW}📄 Viewing Webhook Service logs (Press Ctrl+C to exit)...${NC}"
            kubectl logs -f -l component=webhook -n driveline --tail=100
            ;;
        4)
            echo -e "${YELLOW}📄 Viewing Worker Service logs (Press Ctrl+C to exit)...${NC}"
            kubectl logs -f -l component=worker -n driveline --tail=100
            ;;
        5)
            echo -e "${YELLOW}📄 Viewing MongoDB logs (Press Ctrl+C to exit)...${NC}"
            kubectl logs -f -l app=mongodb -n driveline --tail=100
            ;;
        6)
            echo -e "${YELLOW}📄 Viewing Redis logs (Press Ctrl+C to exit)...${NC}"
            kubectl logs -f -l app=redis -n driveline --tail=100
            ;;
        7)
            echo -e "${YELLOW}📄 Viewing RabbitMQ logs (Press Ctrl+C to exit)...${NC}"
            kubectl logs -f -l app=rabbitmq -n driveline --tail=100
            ;;
        8)
            echo -e "${YELLOW}📄 Viewing ClickHouse logs (Press Ctrl+C to exit)...${NC}"
            kubectl logs -f -l app=clickhouse -n driveline --tail=100
            ;;
        9)
            echo -e "${YELLOW}📊 Pod Status:${NC}"
            kubectl get pods -n driveline -o wide
            ;;
        0)
            echo -e "${GREEN}👋 Goodbye!${NC}"
            exit 0
            ;;
        *)
            echo -e "${RED}❌ Invalid option. Please try again.${NC}"
            ;;
    esac
done
