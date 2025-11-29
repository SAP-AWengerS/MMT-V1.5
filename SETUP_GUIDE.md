# 🚀 Complete Setup Guide - Manage My Truck

This guide will walk you through setting up the Manage My Truck application from scratch using the microservices architecture.

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Start (Recommended)](#quick-start-recommended)
3. [Manual Setup](#manual-setup)
4. [Environment Configuration](#environment-configuration)
5. [Verification](#verification)
6. [Troubleshooting](#troubleshooting)
7. [Common Commands](#common-commands)

---

## Prerequisites

Before you begin, ensure you have the following installed:

### Required

- ✅ **Node.js 18+** - [Download](https://nodejs.org/)
- ✅ **npm** (comes with Node.js)
- ✅ **Git** - [Download](https://git-scm.com/)
- ✅ **Docker** - [Download](https://www.docker.com/products/docker-desktop/)
- ✅ **Docker Compose** (included with Docker Desktop)

### Optional (for Kubernetes)

- ⭐ **kubectl** - [Install Guide](https://kubernetes.io/docs/tasks/tools/)
- ⭐ **Minikube** - [Install Guide](https://minikube.sigs.k8s.io/docs/start/)

### Verify Installation

Run these commands to verify your setup:

```bash
node --version    # Should be v18.x.x or higher
npm --version     # Should be 9.x.x or higher
git --version     # Any recent version
docker --version  # Should be 20.x.x or higher
docker-compose --version  # Should be 2.x.x or higher
```

---

## Quick Start (Recommended)

### Step 1: Clone the Repository

```bash
git clone https://github.com/your-repo/mmt-v1.5.git
cd mmt-v1.5
```

### Step 2: Deploy Microservices with Docker

Run the automated deployment script:

```bash
./deploy-docker.sh
```

This script will:
- ✅ Check Docker installation
- ✅ Create environment files from templates
- ✅ Build all Docker images
- ✅ Start MongoDB and RabbitMQ
- ✅ Deploy all 6 microservices
- ✅ Configure networking
- ✅ Display access URLs

**Expected Output:**
```
╔═══════════════════════════════════════════════════════╗
║           Deployment Successful! 🎉                   ║
╚═══════════════════════════════════════════════════════╝

Access URLs:
  • API Gateway:         http://localhost:5001
  • Auth Service:        http://localhost:3001
  • Fleet Service:       http://localhost:3002
  • Finance Service:     http://localhost:3003
  • Analytics Service:   http://localhost:3004
  • Notification Service: http://localhost:3005
  • MongoDB:             mongodb://localhost:27017
  • RabbitMQ Management: http://localhost:15672
```

### Step 3: Configure Environment Variables

Edit the API Gateway configuration (optional):

```bash
nano microservices/api-gateway/.env
```

Add your Google OAuth credentials:
```env
GOOGLE_CLIENT_ID=your-google-client-id-here
GOOGLE_CLIENT_SECRET=your-google-client-secret-here
```

### Step 4: Start the Frontend

```bash
cd frontend
npm install
npm start
```

The React app will open at **http://localhost:3000**

### Step 5: Create Your First Account

1. Open http://localhost:3000
2. Click "Sign up with Google" or "Register"
3. Complete the registration
4. Start managing your fleet!

---

## Manual Setup

If you prefer to set up services individually:

### Step 1: Clone Repository

```bash
git clone https://github.com/your-repo/mmt-v1.5.git
cd mmt-v1.5
```

### Step 2: Start Infrastructure Services

#### Start MongoDB

```bash
docker run -d \
  --name mmt-mongodb \
  -p 27017:27017 \
  -e MONGO_INITDB_ROOT_USERNAME=admin \
  -e MONGO_INITDB_ROOT_PASSWORD=password \
  -v mongodb_data:/data/db \
  mongo:7.0
```

#### Start RabbitMQ

```bash
docker run -d \
  --name mmt-rabbitmq \
  -p 5672:5672 \
  -p 15672:15672 \
  -e RABBITMQ_DEFAULT_USER=admin \
  -e RABBITMQ_DEFAULT_PASS=password \
  rabbitmq:3.12-management
```

### Step 3: Start Microservices

Open 6 separate terminal windows and run:

**Terminal 1 - Auth Service:**
```bash
cd microservices/auth-service
npm install
PORT=3001 \
MONGODB_URI=mongodb://admin:password@localhost:27017/mmt_auth_db?authSource=admin \
JWT_SECRET=your-secret-key \
npm start
```

**Terminal 2 - Fleet Service:**
```bash
cd microservices/fleet-service
npm install
PORT=3002 \
GRPC_PORT=50051 \
MONGODB_URI=mongodb://admin:password@localhost:27017/mmt_fleet_db?authSource=admin \
npm start
```

**Terminal 3 - Finance Service:**
```bash
cd microservices/finance-service
npm install
PORT=3003 \
MONGODB_URI=mongodb://admin:password@localhost:27017/mmt_finance_db?authSource=admin \
FLEET_SERVICE_URL=http://localhost:3002 \
npm start
```

**Terminal 4 - Analytics Service:**
```bash
cd microservices/analytics-service
npm install
PORT=3004 \
GRPC_PORT=50052 \
MONGODB_URI=mongodb://admin:password@localhost:27017/mmt_analytics_db?authSource=admin \
FLEET_GRPC_URL=localhost:50051 \
npm start
```

**Terminal 5 - Notification Service:**
```bash
cd microservices/notification-service
npm install
PORT=3005 \
MONGODB_URI=mongodb://admin:password@localhost:27017/mmt_notifications_db?authSource=admin \
RABBITMQ_URL=amqp://admin:password@localhost:5672 \
npm start
```

**Terminal 6 - API Gateway:**
```bash
cd microservices/api-gateway
npm install
PORT=5001 \
JWT_SECRET=your-secret-key \
AUTH_SERVICE_URL=http://localhost:3001 \
FLEET_SERVICE_URL=http://localhost:3002 \
FINANCE_SERVICE_URL=http://localhost:3003 \
ANALYTICS_SERVICE_URL=http://localhost:3004 \
NOTIFICATION_SERVICE_URL=http://localhost:3005 \
npm start
```

### Step 4: Start Frontend

**Terminal 7 - Frontend:**
```bash
cd frontend
npm install
npm start
```

---

## Environment Configuration

### Creating .env Files

Each service needs a `.env` file. You can copy from examples:

```bash
# API Gateway
cd microservices/api-gateway
cp .env.example .env
# Edit with your values
nano .env
```

### Required Environment Variables

#### API Gateway (`microservices/api-gateway/.env`)
```env
PORT=5001
JWT_SECRET=your-jwt-secret-min-32-chars
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Service URLs (Docker)
AUTH_SERVICE_URL=http://auth-service:3001
FLEET_SERVICE_URL=http://fleet-service:3002
FINANCE_SERVICE_URL=http://finance-service:3003
ANALYTICS_SERVICE_URL=http://analytics-service:3004
NOTIFICATION_SERVICE_URL=http://notification-service:3005

# For native/local development, use localhost instead
# AUTH_SERVICE_URL=http://localhost:3001
# FLEET_SERVICE_URL=http://localhost:3002
# etc...
```

#### Frontend (`frontend/.env`)
```env
REACT_APP_BACKEND_URL=http://localhost:5001
REACT_APP_GOOGLE_CLIENT_ID=your-google-client-id
```

### Getting Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
5. Add authorized redirect URI: `http://localhost:3000/auth/google/callback`
6. Copy Client ID and Client Secret to your `.env` files

---

## Verification

### 1. Check Service Health

```bash
# Check all services
curl http://localhost:5001/health  # API Gateway
curl http://localhost:3001/health  # Auth
curl http://localhost:3002/health  # Fleet
curl http://localhost:3003/health  # Finance
curl http://localhost:3004/health  # Analytics
curl http://localhost:3005/health  # Notifications
```

All should return `{"status":"healthy"}` or similar.

### 2. Check Docker Containers

```bash
cd microservices
docker-compose ps
```

All services should show status as "Up" and "healthy".

### 3. Test Authentication

```bash
# Register a new user
curl -X POST http://localhost:5001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "Test123456"
  }'
```

You should receive a token in the response.

### 4. Access Frontend

1. Open http://localhost:3000
2. You should see the login page
3. Try registering/logging in
4. Dashboard should load successfully

---

## Troubleshooting

### Issue: Port Already in Use

**Error:** `Port 5001 is already in use`

**Solution:**
```bash
# Find process using the port
lsof -ti:5001

# Kill the process
kill -9 $(lsof -ti:5001)

# Or change the port in .env file
PORT=5002
```

### Issue: MongoDB Connection Failed

**Error:** `MongoServerError: Authentication failed`

**Solution:**
```bash
# Check if MongoDB is running
docker ps | grep mongodb

# Restart MongoDB
docker restart mmt-mongodb

# Check logs
docker logs mmt-mongodb
```

### Issue: Docker Compose Build Fails

**Error:** `failed to solve with frontend dockerfile.v0`

**Solution:**
```bash
# Clean Docker cache
docker system prune -a

# Rebuild without cache
cd microservices
docker-compose build --no-cache
docker-compose up -d
```

### Issue: Services Can't Communicate

**Error:** `ECONNREFUSED` or `Service not found`

**Solution:**
```bash
# Check if all containers are on the same network
docker network inspect microservices_mmt-network

# Restart all services
cd microservices
docker-compose restart
```

### Issue: Frontend Can't Connect to Backend

**Error:** `Network Error` or `Failed to fetch`

**Solution:**
1. Check `frontend/.env` has correct `REACT_APP_BACKEND_URL`
2. Ensure API Gateway is running on the correct port
3. Check browser console for CORS errors
4. Restart frontend: `cd frontend && npm start`

### Issue: RabbitMQ Not Working

**Error:** `Connection to RabbitMQ failed`

**Solution:**
```bash
# Check RabbitMQ status
docker logs mmt-rabbitmq

# Restart RabbitMQ
docker restart mmt-rabbitmq

# Access management UI to verify
open http://localhost:15672
# Login: admin / password
```

---

## Common Commands

### Docker Compose

```bash
cd microservices

# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# Restart a specific service
docker-compose restart api-gateway

# View logs
docker-compose logs -f

# View logs for specific service
docker-compose logs -f finance-service

# Rebuild and restart
docker-compose up -d --build

# Check service status
docker-compose ps
```

### Kubernetes

```bash
# Deploy to Minikube
./deploy-kubernetes.sh

# Check pods
kubectl get pods -n mmt

# Check services
kubectl get services -n mmt

# View logs
kubectl logs -f <pod-name> -n mmt

# Describe pod
kubectl describe pod <pod-name> -n mmt

# Port forward
kubectl port-forward -n mmt service/api-gateway 5001:3000

# Scale service
kubectl scale deployment fleet-service --replicas=3 -n mmt

# Delete all
kubectl delete namespace mmt
```

### Development

```bash
# Install dependencies for all services
cd microservices
for service in auth-service fleet-service finance-service analytics-service notification-service api-gateway; do
  cd $service
  npm install
  cd ..
done

# Run tests (if available)
npm test

# Check for outdated packages
npm outdated
```

---

## Next Steps

After successful setup:

1. ✅ **Explore the UI** - Navigate through different pages
2. ✅ **Add a Truck** - Go to Fleet Management
3. ✅ **Track Expenses** - Add fuel, DEF, and other expenses
4. ✅ **View Analytics** - Check the dashboard for insights
5. ✅ **Test GraphQL** - Visit http://localhost:3003/graphql
6. ✅ **Monitor RabbitMQ** - Visit http://localhost:15672

---

## Additional Resources

- **Main README**: See [README.md](README.md) for overview
- **Microservices Docs**: See [microservices/README.md](microservices/README.md)
- **Design Rationale**: See [microservices/docs/DESIGN_RATIONALE.md](microservices/docs/DESIGN_RATIONALE.md)
- **Deployment Guide**: See [microservices/DEPLOYMENT_GUIDE.md](microservices/DEPLOYMENT_GUIDE.md)
- **GCP Deployment**: See [microservices/GCP_DEPLOYMENT_GUIDE.md](microservices/GCP_DEPLOYMENT_GUIDE.md)

---

## Support

For issues or questions:

1. Check the [Troubleshooting](#troubleshooting) section
2. Review service logs: `docker-compose logs -f`
3. Check GitHub issues
4. Contact the development team

---

<p align="center">
  <strong>Happy Fleet Managing! 🚛</strong>
</p>
