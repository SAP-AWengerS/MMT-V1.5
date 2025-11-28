#!/bin/bash

# ==============================================
# MMT Microservices - Docker Compose Deployment
# ==============================================

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔═══════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   MMT Microservices - Docker Compose Deployment     ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}✗ Docker is not installed. Please install Docker first.${NC}"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo -e "${RED}✗ Docker Compose is not installed. Please install Docker Compose first.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Docker and Docker Compose are installed${NC}"
echo ""

# Check if .env files exist
echo -e "${YELLOW}Checking environment configuration...${NC}"
if [ ! -f "microservices/api-gateway/.env" ]; then
    echo -e "${YELLOW}⚠  API Gateway .env not found, creating from example...${NC}"
    cp microservices/api-gateway/.env.example microservices/api-gateway/.env
    echo -e "${YELLOW}⚠  Please edit microservices/api-gateway/.env with your configuration${NC}"
fi

echo ""
echo -e "${BLUE}Starting microservices with Docker Compose...${NC}"
cd microservices

# Stop any existing containers
echo -e "${YELLOW}Stopping existing containers (if any)...${NC}"
docker-compose down 2>/dev/null || true

# Build and start all services
echo -e "${BLUE}Building and starting all services...${NC}"
docker-compose up -d --build

# Wait for services to be healthy
echo ""
echo -e "${YELLOW}Waiting for services to be healthy...${NC}"
sleep 10

# Check service status
echo ""
echo -e "${BLUE}Service Status:${NC}"
docker-compose ps

# Display access URLs
echo ""
echo -e "${GREEN}╔═══════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║           Deployment Successful! 🎉                   ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}Access URLs:${NC}"
echo -e "  ${GREEN}•${NC} API Gateway:        http://localhost:5001"
echo -e "  ${GREEN}•${NC} Auth Service:       http://localhost:3001"
echo -e "  ${GREEN}•${NC} Fleet Service:      http://localhost:3002"
echo -e "  ${GREEN}•${NC} Finance Service:    http://localhost:3003"
echo -e "  ${GREEN}•${NC} Analytics Service:  http://localhost:3004"
echo -e "  ${GREEN}•${NC} Notification Service: http://localhost:3005"
echo -e "  ${GREEN}•${NC} MongoDB:            mongodb://localhost:27017"
echo -e "  ${GREEN}•${NC} RabbitMQ Management: http://localhost:15672 (admin/password)"
echo ""
echo -e "${YELLOW}Useful commands:${NC}"
echo -e "  ${GREEN}•${NC} View logs:    cd microservices && docker-compose logs -f"
echo -e "  ${GREEN}•${NC} Stop services: cd microservices && docker-compose down"
echo -e "  ${GREEN}•${NC} Restart:      cd microservices && docker-compose restart"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo -e "  1. Start the frontend: cd frontend && npm install && npm start"
echo -e "  2. Access the application at http://localhost:3000"
echo ""
