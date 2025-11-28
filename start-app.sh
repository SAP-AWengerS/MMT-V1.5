#!/bin/bash

# MMT Full Stack Startup Script
# Starts backend microservices on Kubernetes and frontend React app

echo "🚀 Starting MMT Full Stack Application"
echo "======================================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_info() {
    echo -e "${YELLOW}ℹ${NC} $1"
}

print_step() {
    echo -e "${BLUE}▶${NC} $1"
}

# Check if services are running
print_step "Step 1: Checking microservices status..."
if ! kubectl get deployments -n mmt &> /dev/null; then
    echo "❌ Microservices not deployed. Please run: cd microservices && ./deploy-minikube.sh"
    exit 1
fi

READY=$(kubectl get deployments -n mmt -o json | jq -r '.items[] | select(.status.readyReplicas == .status.replicas) | .metadata.name' | wc -l)
TOTAL=$(kubectl get deployments -n mmt -o json | jq -r '.items[] | .metadata.name' | wc -l)

if [ "$READY" -ne "$TOTAL" ]; then
    echo "❌ Not all services ready ($READY/$TOTAL). Please wait for all deployments."
    kubectl get deployments -n mmt
    exit 1
fi

print_success "All $TOTAL microservices are running"
echo ""

# Start port-forward to API Gateway
print_step "Step 2: Creating connection to API Gateway..."
kubectl port-forward -n mmt service/api-gateway 8080:3000 > /dev/null 2>&1 &
PF_PID=$!
sleep 3
print_success "API Gateway accessible at http://localhost:8080"
echo ""

# Check if frontend dependencies are installed
print_step "Step 3: Checking frontend setup..."
if [ ! -d "frontend/node_modules" ]; then
    print_info "Installing frontend dependencies (this may take a few minutes)..."
    cd frontend
    npm install
    cd ..
    print_success "Frontend dependencies installed"
else
    print_success "Frontend dependencies already installed"
fi
echo ""

# Cleanup function
cleanup() {
    echo ""
    print_info "Shutting down..."
    kill $PF_PID 2>/dev/null
    exit
}

trap cleanup EXIT INT TERM

# Start frontend
print_step "Step 4: Starting React frontend..."
echo ""
print_success "Backend API: http://localhost:8080"
print_success "Frontend will start at: http://localhost:3000"
echo ""
print_info "Press Ctrl+C to stop both frontend and backend connection"
echo ""
echo "======================================"
echo ""

cd frontend
npm start

# This will run until Ctrl+C
wait
