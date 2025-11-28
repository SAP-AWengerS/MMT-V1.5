#!/bin/bash

# ==============================================
# MMT Microservices - Kubernetes Deployment
# ==============================================

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Error handler
error_exit() {
    echo -e "${RED}✗ Error: $1${NC}" >&2
    exit 1
}

# Success message
success_msg() {
    echo -e "${GREEN}✓ $1${NC}"
}

# Info message
info_msg() {
    echo -e "${BLUE}ℹ $1${NC}"
}

# Warning message
warn_msg() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

echo -e "${BLUE}╔═══════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║    MMT Microservices - Kubernetes Deployment        ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if kubectl is installed
if ! command -v kubectl &> /dev/null; then
    error_exit "kubectl is not installed. Please install kubectl first."
fi
success_msg "kubectl is installed"

# Check if a Kubernetes cluster is running
if ! kubectl cluster-info &> /dev/null; then
    warn_msg "No Kubernetes cluster detected."

    if command -v minikube &> /dev/null; then
        info_msg "Starting Minikube..."
        minikube start --cpus=4 --memory=8192 --driver=docker || error_exit "Failed to start Minikube"
        success_msg "Minikube started successfully"

        # Enable metrics server for HPA
        info_msg "Enabling metrics-server addon..."
        minikube addons enable metrics-server || warn_msg "Failed to enable metrics-server, HPA may not work"
    else
        error_exit "Minikube is not installed. Please install Minikube or configure a Kubernetes cluster."
    fi
else
    success_msg "Kubernetes cluster is running"
    kubectl cluster-info | head -1
fi

echo ""
echo -e "${CYAN}════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}  Starting Deployment Process${NC}"
echo -e "${CYAN}════════════════════════════════════════════════════════${NC}"
echo ""

cd microservices/kubernetes || error_exit "Failed to change to kubernetes directory"

# Step 1: Create namespace
echo -e "${YELLOW}[1/9] Creating namespace...${NC}"
kubectl apply -f namespace.yaml || error_exit "Failed to create namespace"
success_msg "Namespace created"
echo ""

# Step 2: Create or update secrets
echo -e "${YELLOW}[2/9] Setting up secrets...${NC}"
if [ ! -f "secrets/secrets.yaml" ]; then
    warn_msg "secrets/secrets.yaml not found"
    if [ -f "secrets/secrets.yaml.example" ]; then
        info_msg "Creating secrets.yaml from example..."
        cp secrets/secrets.yaml.example secrets/secrets.yaml
        warn_msg "Please edit secrets/secrets.yaml with your actual secrets before production use"
        read -p "Press Enter to continue with default secrets (for testing only)..."
    else
        error_exit "secrets/secrets.yaml.example not found"
    fi
fi
kubectl apply -f secrets/ || error_exit "Failed to create secrets"
success_msg "Secrets created"
echo ""

# Step 3: Create ConfigMaps
echo -e "${YELLOW}[3/9] Creating ConfigMaps...${NC}"
if [ -d "configmaps" ] && [ "$(ls -A configmaps/*.yaml 2>/dev/null)" ]; then
    kubectl apply -f configmaps/ || error_exit "Failed to create ConfigMaps"
    success_msg "ConfigMaps created"
else
    warn_msg "No ConfigMaps found to apply"
fi
echo ""

# Step 4: Create Persistent Volumes
echo -e "${YELLOW}[4/9] Creating Persistent Volumes...${NC}"
if [ -d "storage" ] && [ -f "storage/persistent-volumes.yaml" ]; then
    kubectl apply -f storage/ || error_exit "Failed to create persistent volumes"
    success_msg "Persistent volumes created"
else
    warn_msg "No persistent volumes configuration found"
fi
echo ""

# Step 5: Deploy infrastructure (MongoDB & RabbitMQ)
echo -e "${YELLOW}[5/9] Deploying infrastructure (MongoDB & RabbitMQ)...${NC}"
kubectl apply -f deployments/infrastructure.yaml || error_exit "Failed to deploy infrastructure"
success_msg "Infrastructure deployment initiated"
echo ""

# Step 6: Wait for infrastructure to be ready
echo -e "${YELLOW}[6/9] Waiting for infrastructure to be ready...${NC}"
info_msg "This may take a few minutes..."
kubectl wait --for=condition=available --timeout=300s deployment/mongodb -n mmt 2>/dev/null || warn_msg "MongoDB deployment timeout - checking status..."
kubectl wait --for=condition=available --timeout=300s deployment/rabbitmq -n mmt 2>/dev/null || warn_msg "RabbitMQ deployment timeout - checking status..."

# Check if pods are actually running
MONGODB_READY=$(kubectl get deployment mongodb -n mmt -o jsonpath='{.status.readyReplicas}' 2>/dev/null || echo "0")
RABBITMQ_READY=$(kubectl get deployment rabbitmq -n mmt -o jsonpath='{.status.readyReplicas}' 2>/dev/null || echo "0")

if [ "$MONGODB_READY" -ge 1 ] && [ "$RABBITMQ_READY" -ge 1 ]; then
    success_msg "Infrastructure is ready"
else
    warn_msg "Infrastructure may not be fully ready. Proceeding anyway..."
    info_msg "MongoDB ready replicas: $MONGODB_READY"
    info_msg "RabbitMQ ready replicas: $RABBITMQ_READY"
fi

# Give databases a moment to initialize
sleep 5
echo ""

# Step 7: Deploy services
echo -e "${YELLOW}[7/9] Deploying Kubernetes services...${NC}"
kubectl apply -f services/ || error_exit "Failed to deploy services"
success_msg "Services deployed"
echo ""

# Step 8: Deploy applications
echo -e "${YELLOW}[8/9] Deploying application microservices...${NC}"
kubectl apply -f deployments/api-gateway-deployment.yaml || error_exit "Failed to deploy applications"
success_msg "Applications deployment initiated"
echo ""

# Step 9: Apply autoscaling (HPA)
echo -e "${YELLOW}[9/9] Configuring autoscaling...${NC}"
if [ -d "autoscaling" ] && [ -f "autoscaling/hpa.yaml" ]; then
    # Check if metrics-server is available
    if kubectl get apiservice v1beta1.metrics.k8s.io &> /dev/null || kubectl get apiservice v1.metrics.k8s.io &> /dev/null; then
        kubectl apply -f autoscaling/ || warn_msg "Failed to apply HPA configuration"
        success_msg "Autoscaling configured"
    else
        warn_msg "Metrics server not available. Skipping HPA configuration."
        info_msg "To enable HPA, install metrics-server: kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml"
    fi
else
    warn_msg "No autoscaling configuration found"
fi
echo ""

# Wait for all deployments to be ready
echo -e "${CYAN}════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}  Waiting for all deployments to be ready...${NC}"
echo -e "${CYAN}════════════════════════════════════════════════════════${NC}"
echo ""
info_msg "This may take several minutes for all pods to start..."
echo ""

# Wait for each deployment with individual timeouts
DEPLOYMENTS=("api-gateway" "auth-service" "fleet-service" "finance-service" "analytics-service" "notification-service")
for deployment in "${DEPLOYMENTS[@]}"; do
    echo -n "Waiting for $deployment... "
    if kubectl wait --for=condition=available --timeout=300s deployment/$deployment -n mmt 2>/dev/null; then
        echo -e "${GREEN}✓${NC}"
    else
        echo -e "${YELLOW}⚠ (timeout, may still be starting)${NC}"
    fi
done

echo ""
echo -e "${CYAN}════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}  Deployment Summary${NC}"
echo -e "${CYAN}════════════════════════════════════════════════════════${NC}"
echo ""

# Display deployment status
echo -e "${BLUE}Pod Status:${NC}"
kubectl get pods -n mmt -o wide

echo ""
echo -e "${BLUE}Service Status:${NC}"
kubectl get services -n mmt

echo ""
echo -e "${BLUE}Deployment Status:${NC}"
kubectl get deployments -n mmt

# Check if HPA is available
if kubectl get hpa -n mmt &> /dev/null 2>&1; then
    echo ""
    echo -e "${BLUE}Autoscaling Status:${NC}"
    kubectl get hpa -n mmt
fi

echo ""
echo -e "${GREEN}╔═══════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║           Deployment Successful! 🎉                   ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════════╝${NC}"
echo ""

# Get access information
API_GATEWAY_PORT=$(kubectl get service api-gateway -n mmt -o jsonpath='{.spec.ports[0].nodePort}' 2>/dev/null || echo "N/A")

echo -e "${BLUE}Access Information:${NC}"
echo -e "${CYAN}──────────────────────────────────────────────────────${NC}"

# Check if using Minikube
if command -v minikube &> /dev/null && minikube status &> /dev/null 2>&1; then
    MINIKUBE_IP=$(minikube ip 2>/dev/null || echo "N/A")
    echo -e "${YELLOW}Minikube Environment Detected${NC}"
    echo ""
    echo -e "  ${GREEN}•${NC} API Gateway URL: ${CYAN}http://${MINIKUBE_IP}:${API_GATEWAY_PORT}${NC}"
    echo ""
    echo -e "${YELLOW}Alternative Access Methods:${NC}"
    echo -e "  ${GREEN}1.${NC} Port Forward: ${CYAN}kubectl port-forward -n mmt service/api-gateway 5001:5001${NC}"
    echo -e "  ${GREEN}2.${NC} Minikube Service: ${CYAN}minikube service api-gateway -n mmt${NC}"
    echo -e "  ${GREEN}3.${NC} Minikube Tunnel: ${CYAN}minikube tunnel${NC} (in a separate terminal)"
else
    echo -e "${YELLOW}Standard Kubernetes Cluster${NC}"
    echo ""
    echo -e "  ${GREEN}•${NC} NodePort: ${CYAN}${API_GATEWAY_PORT}${NC}"
    echo -e "  ${GREEN}•${NC} Access via: ${CYAN}http://<NODE_IP>:${API_GATEWAY_PORT}${NC}"
    echo ""
    echo -e "${YELLOW}Recommended Access Method:${NC}"
    echo -e "  Port Forward: ${CYAN}kubectl port-forward -n mmt service/api-gateway 5001:5001${NC}"
fi

echo ""
echo -e "${CYAN}──────────────────────────────────────────────────────${NC}"
echo ""
echo -e "${YELLOW}Useful Commands:${NC}"
echo -e "  ${GREEN}•${NC} View pods:           ${CYAN}kubectl get pods -n mmt${NC}"
echo -e "  ${GREEN}•${NC} View services:       ${CYAN}kubectl get services -n mmt${NC}"
echo -e "  ${GREEN}•${NC} View deployments:    ${CYAN}kubectl get deployments -n mmt${NC}"
echo -e "  ${GREEN}•${NC} View logs:           ${CYAN}kubectl logs -f <pod-name> -n mmt${NC}"
echo -e "  ${GREEN}•${NC} Describe pod:        ${CYAN}kubectl describe pod <pod-name> -n mmt${NC}"
echo -e "  ${GREEN}•${NC} Scale deployment:    ${CYAN}kubectl scale deployment <name> --replicas=3 -n mmt${NC}"
echo -e "  ${GREEN}•${NC} Restart deployment:  ${CYAN}kubectl rollout restart deployment <name> -n mmt${NC}"
echo ""
echo -e "${YELLOW}Troubleshooting:${NC}"
echo -e "  ${GREEN}•${NC} Check pod status:    ${CYAN}kubectl get pods -n mmt -o wide${NC}"
echo -e "  ${GREEN}•${NC} Check events:        ${CYAN}kubectl get events -n mmt --sort-by='.lastTimestamp'${NC}"
echo -e "  ${GREEN}•${NC} View all resources:  ${CYAN}kubectl get all -n mmt${NC}"
echo ""
echo -e "${YELLOW}Cleanup:${NC}"
echo -e "  ${GREEN}•${NC} Delete all:          ${CYAN}kubectl delete namespace mmt${NC}"
echo ""
echo -e "${BLUE}Next Steps:${NC}"
echo -e "  1. Test the API Gateway endpoint"
echo -e "  2. Configure the frontend to use the Kubernetes API Gateway"
echo -e "  3. Monitor logs for any issues: ${CYAN}kubectl logs -f deployment/api-gateway -n mmt${NC}"
echo ""
