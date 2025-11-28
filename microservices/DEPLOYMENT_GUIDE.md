# MMT Microservices Deployment Guide

## 📋 Prerequisites

Before deploying the MMT microservices, ensure you have the following installed:

- **Docker** (v20.10+)
- **Docker Compose** (v2.0+)
- **Kubernetes/Minikube** (v1.28+)
- **kubectl** CLI tool
- **Node.js** (v18+) - for local development
- **MongoDB** (v7.0+) - or use containerized version
- **RabbitMQ** (v3.12+) - or use containerized version

## 🚀 Deployment Options

### Option 1: Local Development with Docker Compose (Recommended for Testing)

#### Step 1: Clone and Navigate
```bash
cd mmt-v1.5/microservices
```

#### Step 2: Configure Environment
```bash
# Create .env files for each service
cp api-gateway/.env.example api-gateway/.env
cp auth-service/.env.example auth-service/.env
# Edit the .env files with your configuration
```

#### Step 3: Start All Services
```bash
docker-compose up --build
```

#### Step 4: Verify Services
```bash
# Check all containers are running
docker-compose ps

# Test API Gateway health
curl http://localhost:3000/health

# Test Auth Service health
curl http://localhost:3001/health
```

#### Step 5: Access Services
- **API Gateway**: http://localhost:3000
- **Auth Service**: http://localhost:3001
- **Fleet Service**: http://localhost:3002
- **Finance Service (GraphQL)**: http://localhost:3003/graphql
- **Analytics Service**: http://localhost:3004
- **Notification Service**: http://localhost:3005
- **RabbitMQ Management**: http://localhost:15672 (admin/password)
- **MongoDB**: localhost:27017 (admin/password)

### Option 2: Kubernetes Deployment (Production)

#### Step 1: Start Minikube
```bash
# Start Minikube with sufficient resources
minikube start --cpus=4 --memory=8192 --disk-size=20g

# Enable required addons
minikube addons enable ingress
minikube addons enable metrics-server
minikube addons enable dashboard
```

#### Step 2: Create Namespace
```bash
kubectl apply -f kubernetes/namespace.yaml
```

#### Step 3: Create Secrets
```bash
# Copy and edit secrets file
cp kubernetes/secrets/secrets.yaml.example kubernetes/secrets/secrets.yaml

# IMPORTANT: Edit secrets.yaml and replace all placeholder values
# Then apply secrets
kubectl apply -f kubernetes/secrets/secrets.yaml
```

#### Step 4: Build and Push Docker Images

##### Build All Images
```bash
# API Gateway
cd api-gateway
docker build -t yourusername/mmt-api-gateway:1.0.0 .
cd ..

# Auth Service
cd auth-service
docker build -t yourusername/mmt-auth-service:1.0.0 .
cd ..

# Repeat for other services...
```

##### Push to DockerHub
```bash
# Login to DockerHub
docker login

# Push all images
docker push yourusername/mmt-api-gateway:1.0.0
docker push yourusername/mmt-auth-service:1.0.0
docker push yourusername/mmt-fleet-service:1.0.0
docker push yourusername/mmt-finance-service:1.0.0
docker push yourusername/mmt-analytics-service:1.0.0
docker push yourusername/mmt-notification-service:1.0.0
```

**Note**: Replace `yourusername` with your actual DockerHub username in:
- kubernetes/deployments/api-gateway-deployment.yaml
- All other deployment YAML files

#### Step 5: Deploy MongoDB and RabbitMQ (Optional)

If not using external services, deploy in Kubernetes:

```bash
# MongoDB
kubectl apply -f - <<EOF
apiVersion: apps/v1
kind: Deployment
metadata:
  name: mongodb
  namespace: mmt
spec:
  replicas: 1
  selector:
    matchLabels:
      app: mongodb
  template:
    metadata:
      labels:
        app: mongodb
    spec:
      containers:
      - name: mongodb
        image: mongo:7.0
        ports:
        - containerPort: 27017
        env:
        - name: MONGO_INITDB_ROOT_USERNAME
          value: "admin"
        - name: MONGO_INITDB_ROOT_PASSWORD
          value: "password"
---
apiVersion: v1
kind: Service
metadata:
  name: mongodb
  namespace: mmt
spec:
  ports:
  - port: 27017
  selector:
    app: mongodb
EOF

# RabbitMQ
kubectl apply -f - <<EOF
apiVersion: apps/v1
kind: Deployment
metadata:
  name: rabbitmq
  namespace: mmt
spec:
  replicas: 1
  selector:
    matchLabels:
      app: rabbitmq
  template:
    metadata:
      labels:
        app: rabbitmq
    spec:
      containers:
      - name: rabbitmq
        image: rabbitmq:3.12-management
        ports:
        - containerPort: 5672
        - containerPort: 15672
        env:
        - name: RABBITMQ_DEFAULT_USER
          value: "admin"
        - name: RABBITMQ_DEFAULT_PASS
          value: "password"
---
apiVersion: v1
kind: Service
metadata:
  name: rabbitmq
  namespace: mmt
spec:
  ports:
  - port: 5672
    name: amqp
  - port: 15672
    name: management
  selector:
    app: rabbitmq
EOF
```

#### Step 6: Deploy Microservices
```bash
# Deploy all services
kubectl apply -f kubernetes/deployments/
kubectl apply -f kubernetes/services/

# Wait for all pods to be ready
kubectl wait --for=condition=ready pod --all -n mmt --timeout=300s
```

#### Step 7: Verify Deployment
```bash
# Check all pods
kubectl get pods -n mmt

# Check all services
kubectl get svc -n mmt

# Check deployments
kubectl get deployments -n mmt

# View logs
kubectl logs -f deployment/api-gateway -n mmt
```

#### Step 8: Access Services

##### Option A: Using Minikube Service
```bash
# Get API Gateway URL
minikube service api-gateway -n mmt --url

# Access the service
curl $(minikube service api-gateway -n mmt --url)/health
```

##### Option B: Using Port Forwarding
```bash
# Port forward API Gateway
kubectl port-forward svc/api-gateway 3000:3000 -n mmt

# Access at http://localhost:3000
```

##### Option C: Using NodePort
```bash
# Get Minikube IP
minikube ip

# Access at http://<minikube-ip>:30000
```

## 📊 Monitoring and Management

### View Kubernetes Dashboard
```bash
minikube dashboard
```

### View Logs
```bash
# Real-time logs
kubectl logs -f deployment/api-gateway -n mmt

# Logs from specific pod
kubectl logs <pod-name> -n mmt

# Logs from all pods of a deployment
kubectl logs -l app=api-gateway -n mmt --all-containers=true
```

### Check Resource Usage
```bash
# Pod resource usage
kubectl top pods -n mmt

# Node resource usage
kubectl top nodes
```

### Scale Services
```bash
# Scale API Gateway
kubectl scale deployment api-gateway --replicas=3 -n mmt

# Scale Auth Service
kubectl scale deployment auth-service --replicas=2 -n mmt
```

### Rolling Updates
```bash
# Update image
kubectl set image deployment/api-gateway api-gateway=yourusername/mmt-api-gateway:1.1.0 -n mmt

# Check rollout status
kubectl rollout status deployment/api-gateway -n mmt

# Rollback if needed
kubectl rollout undo deployment/api-gateway -n mmt
```

## 🧪 Testing the Deployment

### 1. Health Checks
```bash
# API Gateway
curl http://localhost:3000/health

# Should return:
# {
#   "status": "UP",
#   "timestamp": "...",
#   "services": {
#     "auth": {"status": "UP", ...},
#     ...
#   }
# }
```

### 2. Register a User
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123"
  }'
```

### 3. Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'

# Save the token from response
```

### 4. Test Authenticated Endpoint
```bash
curl -H "Authorization: Bearer <your-token>" \
  http://localhost:3000/api/auth/profile
```

### 5. Test Circuit Breaker
```bash
# Stop a service
kubectl scale deployment fleet-service --replicas=0 -n mmt

# Make requests (circuit will open after 50% failure rate)
for i in {1..10}; do
  curl -H "Authorization: Bearer <token>" \
    http://localhost:3000/api/fleet/trucks
done

# Restart service
kubectl scale deployment fleet-service --replicas=2 -n mmt
```

### 6. Test GraphQL
```bash
curl -X POST http://localhost:3000/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "query": "query { getTotalExpenses(truckId: \"123\", startDate: \"2024-01-01\", endDate: \"2024-12-31\") { totalExpenses fuelExpenses defExpenses otherExpenses } }"
  }'
```

## 🔧 Troubleshooting

### Pods Not Starting
```bash
# Describe pod to see events
kubectl describe pod <pod-name> -n mmt

# Check pod logs
kubectl logs <pod-name> -n mmt

# Check if image exists
kubectl get pods -n mmt -o jsonpath='{range .items[*]}{.spec.containers[*].image}{"\n"}{end}'
```

### Service Not Accessible
```bash
# Check service endpoints
kubectl get endpoints -n mmt

# Test service connectivity from another pod
kubectl run -it --rm debug --image=curlimages/curl --restart=Never -n mmt -- curl http://auth-service:3001/health
```

### Database Connection Issues
```bash
# Check MongoDB is running
kubectl get pods -l app=mongodb -n mmt

# Check MongoDB service
kubectl get svc mongodb -n mmt

# Test MongoDB connection
kubectl run -it --rm mongo-test --image=mongo:7.0 --restart=Never -n mmt -- mongosh mongodb://admin:password@mongodb:27017
```

### Out of Memory
```bash
# Increase resource limits in deployment YAML
resources:
  limits:
    memory: "1Gi"
    cpu: "1000m"

# Apply changes
kubectl apply -f kubernetes/deployments/
```

## 🗑️ Cleanup

### Stop Docker Compose
```bash
docker-compose down

# Remove volumes
docker-compose down -v
```

### Delete Kubernetes Deployment
```bash
# Delete all resources in namespace
kubectl delete namespace mmt

# Or delete specific resources
kubectl delete -f kubernetes/deployments/
kubectl delete -f kubernetes/services/
kubectl delete -f kubernetes/secrets/
```

### Stop Minikube
```bash
minikube stop

# Delete minikube cluster
minikube delete
```

## 📝 Notes

1. **Production Secrets**: Never commit actual secrets to git. Use proper secret management tools.
2. **Resource Limits**: Adjust resource limits based on your cluster capacity.
3. **Scaling**: Services can be scaled independently based on load.
4. **Monitoring**: Consider adding Prometheus and Grafana for production monitoring.
5. **Ingress**: For production, configure proper Ingress with TLS certificates.
6. **Backup**: Regularly backup MongoDB data in production.

## 🎯 Next Steps

1. Set up CI/CD pipeline for automated deployments
2. Configure proper monitoring and alerting
3. Set up log aggregation (ELK stack or similar)
4. Implement distributed tracing (Jaeger/Zipkin)
5. Configure auto-scaling policies
6. Set up disaster recovery procedures

---

For more details, see:
- [README.md](README.md) - Project overview
- [docs/DESIGN_RATIONALE.md](docs/DESIGN_RATIONALE.md) - Architecture decisions
- [api-gateway/README.md](api-gateway/README.md) - API Gateway details
