# GCP Deployment Guide - MMT Microservices

## 🎯 Overview

This guide walks you through deploying all 6 MMT microservices to **Google Cloud Platform (GCP)** using:
- **Google Kubernetes Engine (GKE)** for container orchestration
- **Google Container Registry (GCR)** for Docker images
- **Cloud MongoDB Atlas** for databases
- **CloudAMQP** for RabbitMQ

**Estimated Time**: 45-60 minutes
**Estimated Cost**: ~$50-100/month (can use free tier initially)

---

## 📋 Prerequisites

1. **Google Cloud Account** with billing enabled
   - Sign up at: https://cloud.google.com/
   - $300 free credit for new users

2. **gcloud CLI** installed
   ```bash
   # Install gcloud CLI
   # macOS
   brew install --cask google-cloud-sdk

   # Or download from: https://cloud.google.com/sdk/docs/install

   # Verify installation
   gcloud --version
   ```

3. **kubectl** installed
   ```bash
   # Install kubectl
   gcloud components install kubectl

   # Verify
   kubectl version --client
   ```

4. **Docker** installed and running
   ```bash
   docker --version
   ```

---

## 🚀 Step-by-Step Deployment

### STEP 1: Set Up GCP Project (5 minutes)

#### 1.1 Login to GCP
```bash
# Login to your Google account
gcloud auth login

# This will open a browser - login with your Google account
```

#### 1.2 Create a New Project
```bash
# Create project
gcloud projects create mmt-microservices-prod --name="MMT Microservices"

# Set as current project
gcloud config set project mmt-microservices-prod

# Verify
gcloud config get-value project
```

#### 1.3 Enable Required APIs
```bash
# Enable Container Registry API
gcloud services enable containerregistry.googleapis.com

# Enable Kubernetes Engine API
gcloud services enable container.googleapis.com

# Enable Compute Engine API
gcloud services enable compute.googleapis.com

# This may take 1-2 minutes
```

#### 1.4 Set Default Region
```bash
# Set region (choose closest to you)
gcloud config set compute/region us-central1
gcloud config set compute/zone us-central1-a

# For India, use:
# gcloud config set compute/region asia-south1
# gcloud config set compute/zone asia-south1-a
```

---

### STEP 2: Set Up External Services (10 minutes)

#### 2.1 MongoDB Atlas (Free Tier)

**Go to MongoDB Atlas**: https://www.mongodb.com/cloud/atlas

1. **Create Account** and login
2. **Create Free Cluster**:
   - Choose AWS/GCP
   - Region: Same as your GCP region
   - Cluster Name: `mmt-cluster`
   - Click "Create Cluster" (takes 3-5 minutes)

3. **Configure Network Access**:
   - Click "Network Access" → "Add IP Address"
   - Choose "Allow Access from Anywhere" (0.0.0.0/0)
   - Click "Confirm"

4. **Create Database User**:
   - Click "Database Access" → "Add New Database User"
   - Username: `mmtadmin`
   - Password: Generate secure password (save it!)
   - Database User Privileges: "Read and write to any database"
   - Click "Add User"

5. **Get Connection String**:
   - Click "Connect" → "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your password
   - Example: `mongodb+srv://mmtadmin:PASSWORD@mmt-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority`

6. **Create 6 Databases**:
   ```
   mmt_auth_db
   mmt_fleet_db
   mmt_finance_db
   mmt_analytics_db
   mmt_notifications_db
   ```

   You can create these via MongoDB Compass or they'll be created automatically when services connect.

#### 2.2 CloudAMQP (Free Tier)

**Go to CloudAMQP**: https://www.cloudamqp.com/

1. **Create Account** and login
2. **Create Instance**:
   - Name: `mmt-rabbitmq`
   - Plan: "Little Lemur" (Free)
   - Region: Same as GCP region
   - Click "Create Instance"

3. **Get Connection URL**:
   - Click on your instance
   - Copy "AMQP URL"
   - Example: `amqps://username:password@hostname/vhost`

**Save these credentials** - you'll need them for Kubernetes secrets!

---

### STEP 3: Build and Push Docker Images (15 minutes)

#### 3.1 Configure Docker for GCR
```bash
# Configure Docker to use gcloud as credential helper
gcloud auth configure-docker

# Set project ID
export PROJECT_ID=mmt-microservices-prod
```

#### 3.2 Navigate to Project
```bash
cd ~/Projects/External/mmt-v1.5/microservices
```

#### 3.3 Build All Images

**API Gateway:**
```bash
cd api-gateway
docker build -t gcr.io/${PROJECT_ID}/mmt-api-gateway:1.0.0 .
docker push gcr.io/${PROJECT_ID}/mmt-api-gateway:1.0.0
cd ..
```

**Auth Service:**
```bash
cd auth-service
docker build -t gcr.io/${PROJECT_ID}/mmt-auth-service:1.0.0 .
docker push gcr.io/${PROJECT_ID}/mmt-auth-service:1.0.0
cd ..
```

**Fleet Service:**
```bash
cd fleet-service
docker build -t gcr.io/${PROJECT_ID}/mmt-fleet-service:1.0.0 .
docker push gcr.io/${PROJECT_ID}/mmt-fleet-service:1.0.0
cd ..
```

**Finance Service:**
```bash
cd finance-service
docker build -t gcr.io/${PROJECT_ID}/mmt-finance-service:1.0.0 .
docker push gcr.io/${PROJECT_ID}/mmt-finance-service:1.0.0
cd ..
```

**Analytics Service:**
```bash
cd analytics-service
docker build -t gcr.io/${PROJECT_ID}/mmt-analytics-service:1.0.0 .
docker push gcr.io/${PROJECT_ID}/mmt-analytics-service:1.0.0
cd ..
```

**Notification Service:**
```bash
cd notification-service
docker build -t gcr.io/${PROJECT_ID}/mmt-notification-service:1.0.0 .
docker push gcr.io/${PROJECT_ID}/mmt-notification-service:1.0.0
cd ..
```

#### 3.4 Verify Images
```bash
# List images in GCR
gcloud container images list

# You should see all 6 images
```

---

### STEP 4: Create GKE Cluster (10 minutes)

#### 4.1 Create Cluster
```bash
# Create a GKE cluster
gcloud container clusters create mmt-cluster \
  --num-nodes=3 \
  --machine-type=e2-medium \
  --disk-size=20 \
  --zone=us-central1-a \
  --enable-autoscaling \
  --min-nodes=2 \
  --max-nodes=5

# This takes 5-10 minutes
```

For India region:
```bash
gcloud container clusters create mmt-cluster \
  --num-nodes=3 \
  --machine-type=e2-medium \
  --disk-size=20 \
  --zone=asia-south1-a \
  --enable-autoscaling \
  --min-nodes=2 \
  --max-nodes=5
```

#### 4.2 Get Cluster Credentials
```bash
# Configure kubectl
gcloud container clusters get-credentials mmt-cluster --zone=us-central1-a

# Verify connection
kubectl cluster-info
kubectl get nodes
```

---

### STEP 5: Configure Kubernetes Secrets (5 minutes)

#### 5.1 Create Namespace
```bash
kubectl apply -f kubernetes/namespace.yaml

# Verify
kubectl get namespaces
```

#### 5.2 Create Secrets File

Create `kubernetes/secrets/secrets.yaml` (don't commit to git!):

```bash
cd kubernetes/secrets
```

Create the file with your actual credentials:

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: mmt-secrets
  namespace: mmt
type: Opaque
stringData:
  # JWT Secret (generate a strong secret)
  jwt-secret: "your-super-secret-jwt-key-change-this-32chars"

  # MongoDB Connection Strings (from MongoDB Atlas)
  # Replace with your actual MongoDB Atlas connection string
  mongodb-uri-auth: "mongodb+srv://mmtadmin:PASSWORD@mmt-cluster.xxxxx.mongodb.net/mmt_auth_db?retryWrites=true&w=majority"
  mongodb-uri-fleet: "mongodb+srv://mmtadmin:PASSWORD@mmt-cluster.xxxxx.mongodb.net/mmt_fleet_db?retryWrites=true&w=majority"
  mongodb-uri-finance: "mongodb+srv://mmtadmin:PASSWORD@mmt-cluster.xxxxx.mongodb.net/mmt_finance_db?retryWrites=true&w=majority"
  mongodb-uri-analytics: "mongodb+srv://mmtadmin:PASSWORD@mmt-cluster.xxxxx.mongodb.net/mmt_analytics_db?retryWrites=true&w=majority"
  mongodb-uri-notifications: "mongodb+srv://mmtadmin:PASSWORD@mmt-cluster.xxxxx.mongodb.net/mmt_notifications_db?retryWrites=true&w=majority"

  # RabbitMQ Connection (from CloudAMQP)
  rabbitmq-url: "amqps://username:password@hostname/vhost"

  # Google OAuth (optional)
  google-client-id: "your-google-client-id.apps.googleusercontent.com"
  google-client-secret: "your-google-client-secret"
```

#### 5.3 Apply Secrets
```bash
kubectl apply -f secrets.yaml

# Verify
kubectl get secrets -n mmt
```

---

### STEP 6: Update Deployment Files for GCR (5 minutes)

Edit `kubernetes/deployments/api-gateway-deployment.yaml` and update all image references:

```bash
cd ../deployments
```

Replace `yourusername` with `gcr.io/mmt-microservices-prod` in all deployments:

**Quick find and replace:**
```bash
# macOS/Linux
sed -i '' 's|yourusername/mmt-|gcr.io/mmt-microservices-prod/mmt-|g' api-gateway-deployment.yaml

# Or manually edit the file
```

Update all 6 service images to:
```yaml
image: gcr.io/mmt-microservices-prod/mmt-api-gateway:1.0.0
image: gcr.io/mmt-microservices-prod/mmt-auth-service:1.0.0
image: gcr.io/mmt-microservices-prod/mmt-fleet-service:1.0.0
image: gcr.io/mmt-microservices-prod/mmt-finance-service:1.0.0
image: gcr.io/mmt-microservices-prod/mmt-analytics-service:1.0.0
image: gcr.io/mmt-microservices-prod/mmt-notification-service:1.0.0
```

---

### STEP 7: Deploy Services to GKE (5 minutes)

#### 7.1 Deploy All Services
```bash
# Deploy deployments
kubectl apply -f kubernetes/deployments/api-gateway-deployment.yaml

# Deploy services
kubectl apply -f kubernetes/services/services.yaml

# Wait for pods to start
kubectl get pods -n mmt --watch

# Press Ctrl+C when all pods show "Running"
```

#### 7.2 Verify Deployment
```bash
# Check all pods are running
kubectl get pods -n mmt

# Check services
kubectl get svc -n mmt

# Check deployments
kubectl get deployments -n mmt

# View logs
kubectl logs -f deployment/api-gateway -n mmt
```

---

### STEP 8: Expose API Gateway (5 minutes)

#### 8.1 Create LoadBalancer Service

Update `kubernetes/services/services.yaml` - change API Gateway service type:

```yaml
apiVersion: v1
kind: Service
metadata:
  name: api-gateway
  namespace: mmt
spec:
  type: LoadBalancer  # Changed from NodePort
  ports:
  - port: 80
    targetPort: 3000
    protocol: TCP
    name: http
  selector:
    app: api-gateway
```

Apply the change:
```bash
kubectl apply -f kubernetes/services/services.yaml
```

#### 8.2 Get External IP
```bash
# Wait for external IP (takes 2-3 minutes)
kubectl get svc api-gateway -n mmt --watch

# Press Ctrl+C when EXTERNAL-IP appears
```

Copy the **EXTERNAL-IP** - this is your API endpoint!

Example: `34.123.45.67`

---

### STEP 9: Test the Deployment (5 minutes)

#### 9.1 Test Health Checks
```bash
# Replace with your EXTERNAL-IP
export API_IP=34.123.45.67

# Test API Gateway
curl http://${API_IP}/health

# Should return: {"status":"UP",...}
```

#### 9.2 Test User Registration
```bash
# Register a user
curl -X POST http://${API_IP}/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123"
  }'

# Login
curl -X POST http://${API_IP}/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'

# Copy the JWT token from response
```

#### 9.3 Test Protected Endpoints
```bash
# Use token from login
export TOKEN="your-jwt-token-here"

# Get user profile
curl -H "Authorization: Bearer ${TOKEN}" \
  http://${API_IP}/api/auth/profile

# Add a truck
curl -X POST http://${API_IP}/api/fleet/trucks \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test",
    "truckNumber": "TRK001",
    "truckName": "Test Truck",
    "truckModel": "Volvo",
    "truckCapacity": 25000
  }'
```

---

### STEP 10: Configure Frontend (5 minutes)

Update your frontend to point to GCP:

**File**: `frontend/src/Config/Axios/Axios.js`

```javascript
import axios from 'axios';

const instance = axios.create({
  baseURL: 'http://34.123.45.67/api',  // Replace with your EXTERNAL-IP
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token interceptor
instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default instance;
```

**For Production**: Use HTTPS and a custom domain (see Optional Steps below)

---

## 📊 Monitoring & Management

### View Logs
```bash
# API Gateway logs
kubectl logs -f deployment/api-gateway -n mmt

# All logs from all services
kubectl logs -l tier=backend -n mmt --all-containers=true

# Logs from specific pod
kubectl logs <pod-name> -n mmt
```

### Monitor Resources
```bash
# Pod resource usage
kubectl top pods -n mmt

# Node resource usage
kubectl top nodes

# Service status
kubectl get all -n mmt
```

### Scale Services
```bash
# Scale API Gateway
kubectl scale deployment api-gateway --replicas=5 -n mmt

# Scale Auth Service
kubectl scale deployment auth-service --replicas=3 -n mmt

# Auto-scaling (HPA)
kubectl autoscale deployment api-gateway \
  --cpu-percent=70 \
  --min=2 \
  --max=10 \
  -n mmt
```

### GCP Console Access

**View in GCP Console**:
1. Go to: https://console.cloud.google.com/
2. Navigate to "Kubernetes Engine" → "Workloads"
3. Select namespace: `mmt`
4. View pods, deployments, services

**Container Registry**:
- View images: "Container Registry" → "Images"

---

## 💰 Cost Optimization

### Free Tier Resources (First 90 days)
- $300 credit for new accounts
- Always free:
  - 1 f1-micro VM instance
  - 30 GB-months of standard storage

### Estimated Monthly Costs

**GKE Cluster** (3 e2-medium nodes):
- Nodes: ~$75/month (3 × $25)
- Load Balancer: ~$18/month
- Storage: ~$5/month

**External Services**:
- MongoDB Atlas (Free M0): $0
- CloudAMQP (Free): $0

**Total**: ~$98/month

### Cost Reduction Tips:
1. **Use Preemptible Nodes**: Save 80%
   ```bash
   --preemptible
   ```

2. **Stop Cluster When Not Needed**:
   ```bash
   gcloud container clusters resize mmt-cluster --num-nodes=0 --zone=us-central1-a
   ```

3. **Use Smaller Machines**:
   ```bash
   --machine-type=e2-small  # Instead of e2-medium
   ```

---

## 🔒 Optional: Set Up HTTPS & Custom Domain

### 1. Reserve Static IP
```bash
gcloud compute addresses create mmt-api-ip --global

# Get the IP
gcloud compute addresses describe mmt-api-ip --global
```

### 2. Point Domain to IP
- Go to your domain registrar
- Create A record pointing to the static IP

### 3. Install Cert-Manager
```bash
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml
```

### 4. Create Ingress with TLS
Create `kubernetes/ingress.yaml`:
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: mmt-ingress
  namespace: mmt
  annotations:
    kubernetes.io/ingress.global-static-ip-name: mmt-api-ip
    cert-manager.io/cluster-issuer: letsencrypt-prod
spec:
  tls:
  - hosts:
    - api.yourdomain.com
    secretName: mmt-tls
  rules:
  - host: api.yourdomain.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: api-gateway
            port:
              number: 3000
```

---

## 🧹 Cleanup / Teardown

When you're done or want to save costs:

### Delete Services
```bash
kubectl delete namespace mmt
```

### Delete Cluster
```bash
gcloud container clusters delete mmt-cluster --zone=us-central1-a
```

### Delete Images
```bash
gcloud container images delete gcr.io/${PROJECT_ID}/mmt-api-gateway:1.0.0
# ... repeat for all images
```

### Delete Project (Complete cleanup)
```bash
gcloud projects delete mmt-microservices-prod
```

---

## 🛑 Troubleshooting

### Pods Not Starting
```bash
# Check pod status
kubectl describe pod <pod-name> -n mmt

# Check logs
kubectl logs <pod-name> -n mmt

# Common issues:
# - Image pull errors: Check GCR permissions
# - Secret errors: Verify secrets exist
# - DB connection: Check MongoDB Atlas whitelist
```

### Cannot Access External IP
```bash
# Check service
kubectl get svc api-gateway -n mmt

# Check firewall rules
gcloud compute firewall-rules list

# Check pod health
kubectl get pods -n mmt
```

### High Costs
```bash
# Check resource usage
kubectl top nodes
kubectl top pods -n mmt

# Reduce replicas
kubectl scale deployment --all --replicas=1 -n mmt

# Or stop cluster
gcloud container clusters resize mmt-cluster --num-nodes=0 --zone=us-central1-a
```

---

## ✅ Deployment Checklist

- [ ] GCP project created
- [ ] MongoDB Atlas cluster created
- [ ] CloudAMQP instance created
- [ ] All 6 Docker images built and pushed to GCR
- [ ] GKE cluster created
- [ ] Kubernetes secrets configured
- [ ] All services deployed
- [ ] API Gateway has external IP
- [ ] Health checks passing
- [ ] User registration working
- [ ] Frontend updated with API endpoint
- [ ] Application fully functional

---

## 📞 Support & Resources

**GCP Documentation**:
- GKE: https://cloud.google.com/kubernetes-engine/docs
- GCR: https://cloud.google.com/container-registry/docs
- Pricing: https://cloud.google.com/pricing

**External Services**:
- MongoDB Atlas: https://docs.atlas.mongodb.com/
- CloudAMQP: https://www.cloudamqp.com/docs/index.html

**Our Documentation**:
- README.md - Project overview
- DESIGN_RATIONALE.md - Architecture decisions
- DEPLOYMENT_GUIDE.md - Minikube deployment

---

**Deployment Time**: 45-60 minutes
**Status**: ✅ PRODUCTION-READY ON GCP

Your MMT microservices backend is now running on Google Cloud Platform!
