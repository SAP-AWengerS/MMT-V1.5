# Manage My Truck - Microservices Architecture

<p align="center">
  <img src="frontend/public/favicon.png" alt="Manage My Truck Logo" width="100"/>
</p>

<p align="center">
  <strong>Fleet Management Platform with Microservices Architecture</strong>
  <br/>
  <i>Built with React, Node.js, Express, MongoDB & Kubernetes</i>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Status-Production Ready-brightgreen?style=flat-square" alt="Status"/>
  <img src="https://img.shields.io/badge/Microservices-6 Services-blue?style=flat-square" alt="Microservices"/>
  <img src="https://img.shields.io/badge/Made%20with-❤️-red?style=flat-square" alt="Made with love"/>
</p>

---

## 📖 Overview

**Manage My Truck** is a comprehensive fleet management platform built with modern microservices architecture. It empowers transport businesses to efficiently manage trucks, track expenses, monitor profits, and generate insightful reports through an intuitive interface.

### 🏗️ Architecture

The application is built using a microservices architecture with 6 independent services:

```
┌─────────────────────────────────────────────────────────────────┐
│                    Client (React Frontend)                       │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTPS
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    API Gateway :5001                             │
│         (Circuit Breaker, Rate Limiting, Routing)                │
└──┬────────┬────────┬────────┬────────┬────────────────────────┘
   │ REST   │ REST   │ REST   │ gRPC   │ REST
   ▼        ▼        ▼        ▼        ▼
┌──────┐ ┌──────┐ ┌────────┐ ┌─────────┐ ┌──────────┐
│ Auth │ │Fleet │ │Finance │ │Analytics│ │Notific.  │
│:3001 │ │:3002 │ │:3003   │ │:3004    │ │:3005     │
└───┬──┘ └──┬───┘ └───┬────┘ └────┬────┘ └────┬─────┘
    │       │         │           │           │
    ▼       ▼         ▼           ▼           ▼
┌──────────────────────────────────────────────────────────┐
│         Database Layer (MongoDB - Database per Service)   │
│  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐  ┌─────┐│
│  │Auth DB │  │Fleet DB│  │Fin. DB │  │Analyt. │  │Notif││
│  └────────┘  └────────┘  └────────┘  └────────┘  └─────┘│
└──────────────────────────────────────────────────────────┘
```

### ✨ Key Features

- **🚛 Fleet Management** - Comprehensive truck and driver management
- **💰 Financial Tracking** - Income, expenses, and profit analysis
- **📊 Analytics & Reporting** - Real-time insights and visualizations
- **🔐 Secure Authentication** - JWT-based auth with Google OAuth support
- **🔔 Notifications** - Real-time alerts via RabbitMQ message broker
- **🎯 API Gateway** - Centralized routing with circuit breaker pattern
- **📦 Containerized** - Docker & Kubernetes ready

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ and npm
- **MongoDB** 7.3+ (or MongoDB Atlas)
- **Docker** & **Docker Compose** (recommended)
- **Git**

Optional (for Kubernetes deployment):
- **kubectl** and **Minikube** or any Kubernetes cluster

### Option 1: Docker Compose (Recommended for Development)

The easiest way to get started:

```bash
# Clone the repository
git clone <your-repo-url>
cd mmt-v1.5

# Run the deployment script
./deploy-docker.sh
```

This will:
- ✅ Build all microservices
- ✅ Start MongoDB and RabbitMQ
- ✅ Deploy all 6 services
- ✅ Configure networking

**Access the services:**
- API Gateway: http://localhost:5001
- All services will be running and connected

### Option 2: Kubernetes (Production)

For production-grade deployment:

```bash
# Clone the repository
git clone <your-repo-url>
cd mmt-v1.5

# Run the Kubernetes deployment script
./deploy-kubernetes.sh
```

This will:
- ✅ Start Minikube (if not running)
- ✅ Deploy all services to Kubernetes
- ✅ Set up health checks and auto-scaling
- ✅ Configure service discovery

### Option 3: Manual Setup

<details>
<summary>Click to expand manual setup instructions</summary>

#### 1. Start MongoDB

```bash
# Using Docker
docker run -d -p 27017:27017 --name mongodb \
  -e MONGO_INITDB_ROOT_USERNAME=admin \
  -e MONGO_INITDB_ROOT_PASSWORD=password \
  mongo:7.0
```

#### 2. Start RabbitMQ

```bash
# Using Docker
docker run -d -p 5672:5672 -p 15672:15672 --name rabbitmq \
  -e RABBITMQ_DEFAULT_USER=admin \
  -e RABBITMQ_DEFAULT_PASS=password \
  rabbitmq:3.12-management
```

#### 3. Start each microservice

```bash
# Auth Service
cd microservices/auth-service
npm install
PORT=3001 MONGODB_URI=mongodb://admin:password@localhost:27017/mmt_auth_db?authSource=admin npm start

# Fleet Service
cd microservices/fleet-service
npm install
PORT=3002 MONGODB_URI=mongodb://admin:password@localhost:27017/mmt_fleet_db?authSource=admin npm start

# Finance Service
cd microservices/finance-service
npm install
PORT=3003 MONGODB_URI=mongodb://admin:password@localhost:27017/mmt_finance_db?authSource=admin npm start

# Analytics Service
cd microservices/analytics-service
npm install
PORT=3004 MONGODB_URI=mongodb://admin:password@localhost:27017/mmt_analytics_db?authSource=admin npm start

# Notification Service
cd microservices/notification-service
npm install
PORT=3005 MONGODB_URI=mongodb://admin:password@localhost:27017/mmt_notifications_db?authSource=admin RABBITMQ_URL=amqp://admin:password@localhost:5672 npm start

# API Gateway (in new terminal)
cd microservices/api-gateway
npm install
PORT=5001 AUTH_SERVICE_URL=http://localhost:3001 FLEET_SERVICE_URL=http://localhost:3002 FINANCE_SERVICE_URL=http://localhost:3003 ANALYTICS_SERVICE_URL=http://localhost:3004 NOTIFICATION_SERVICE_URL=http://localhost:3005 npm start
```

</details>

### Starting the Frontend

After the backend services are running:

```bash
cd frontend
npm install
npm start
```

Access the application at **http://localhost:3000**

---

## 📁 Project Structure

```
mmt-v1.5/
├── deploy-docker.sh              # Docker Compose deployment script
├── deploy-kubernetes.sh          # Kubernetes deployment script
├── start-app.sh                  # Start frontend with K8s backend
├── start-microservices.sh        # Start all services natively
│
├── microservices/
│   ├── docker-compose.yml        # Docker Compose configuration
│   ├── README.md                 # Microservices detailed documentation
│   │
│   ├── api-gateway/              # API Gateway Service
│   │   ├── server.js             # Gateway with circuit breaker
│   │   ├── adapters/             # Service adapters
│   │   └── Dockerfile
│   │
│   ├── auth-service/             # Authentication Service
│   │   ├── server.js             # JWT & OAuth implementation
│   │   ├── models/User.js
│   │   └── Dockerfile
│   │
│   ├── fleet-service/            # Fleet Management (gRPC)
│   │   ├── server.js
│   │   ├── fleet.proto           # gRPC definitions
│   │   ├── models/               # Truck, Driver models
│   │   └── Dockerfile
│   │
│   ├── finance-service/          # Finance Management (GraphQL)
│   │   ├── server.js
│   │   ├── models/               # Income, Expense models
│   │   └── Dockerfile
│   │
│   ├── analytics-service/        # Analytics (gRPC)
│   │   ├── server.js
│   │   ├── analytics.proto
│   │   └── Dockerfile
│   │
│   ├── notification-service/     # Notifications (RabbitMQ)
│   │   ├── server.js
│   │   ├── models/Alert.js
│   │   └── Dockerfile
│   │
│   ├── kubernetes/               # Kubernetes manifests
│   │   ├── namespace.yaml
│   │   ├── deployments/
│   │   ├── services/
│   │   ├── secrets/
│   │   └── configmaps/
│   │
│   └── docs/                     # API Documentation
│       ├── DESIGN_RATIONALE.md
│       ├── openapi/              # REST API specs
│       ├── proto/                # gRPC definitions
│       └── graphql/              # GraphQL schemas
│
├── frontend/                     # React Frontend
│   ├── src/
│   │   ├── Components/
│   │   ├── Pages/
│   │   ├── Routes/
│   │   └── App.js
│   └── package.json
│
└── backend/                      # Legacy monolith (deprecated)
    └── ...                       # Use microservices instead
```

---

## 🛠️ Technology Stack

### Microservices

| Service | Technology | Communication | Database |
|---------|-----------|---------------|----------|
| **API Gateway** | Express, Opossum | REST | - |
| **Auth Service** | Express, JWT, OAuth | REST | MongoDB |
| **Fleet Service** | Express, gRPC | REST + gRPC | MongoDB |
| **Finance Service** | Express, GraphQL | REST + GraphQL | MongoDB |
| **Analytics Service** | Express, gRPC | gRPC | MongoDB |
| **Notification Service** | Express, RabbitMQ | REST + Events | MongoDB |

### Frontend & Infrastructure

- **Frontend**: React 18.3, Bootstrap 5.3, Ant Design 5.20
- **Databases**: MongoDB 7.3+ (Database-per-Service pattern)
- **Message Broker**: RabbitMQ 3.12
- **Containerization**: Docker, Docker Compose
- **Orchestration**: Kubernetes (Minikube/GKE/EKS)
- **API Patterns**: REST, gRPC, GraphQL, Event-Driven

---

## 🔌 API Access

### REST APIs (via API Gateway)

All services are accessible through the API Gateway at `http://localhost:5001/api/`:

```bash
# Authentication
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me

# Fleet Management
GET    /api/fleet/trucks
POST   /api/fleet/trucks
GET    /api/fleet/drivers

# Finance
GET    /api/finance/income
POST   /api/finance/expenses
GET    /api/finance/total

# Analytics
GET    /api/analytics/dashboard
GET    /api/analytics/reports

# Notifications
GET    /api/notifications/alerts
POST   /api/notifications/send
```

### GraphQL API

Finance service provides a GraphQL endpoint for complex queries:

```graphql
# Endpoint: http://localhost:3003/graphql

query {
  getTotalExpenses(
    truckId: "123"
    startDate: "2024-01-01"
    endDate: "2024-12-31"
  ) {
    total
    fuelExpenses
    defExpenses
    otherExpenses
  }
}
```

### gRPC APIs

Fleet and Analytics services use gRPC for high-performance communication. Proto files are in `microservices/docs/proto/`.

---

## 🔧 Configuration

### Environment Variables

Create `.env` files in each service directory:

**API Gateway** (`microservices/api-gateway/.env`):
```env
PORT=5001
JWT_SECRET=your-secret-key
AUTH_SERVICE_URL=http://auth-service:3001
FLEET_SERVICE_URL=http://fleet-service:3002
FINANCE_SERVICE_URL=http://finance-service:3003
ANALYTICS_SERVICE_URL=http://analytics-service:3004
NOTIFICATION_SERVICE_URL=http://notification-service:3005
```

**Each Service** (`microservices/[service-name]/.env`):
```env
PORT=300X
MONGODB_URI=mongodb://admin:password@mongodb:27017/mmt_[service]_db?authSource=admin
JWT_SECRET=your-secret-key
```

**Frontend** (`frontend/.env`):
```env
REACT_APP_BACKEND_URL=http://localhost:5001
REACT_APP_GOOGLE_CLIENT_ID=your-google-client-id
```

---

## 📊 Monitoring & Health Checks

Each service provides health check endpoints:

```bash
# Check individual services
curl http://localhost:3001/health  # Auth
curl http://localhost:3002/health  # Fleet
curl http://localhost:3003/health  # Finance
curl http://localhost:3004/health  # Analytics
curl http://localhost:3005/health  # Notifications

# Check API Gateway
curl http://localhost:5001/health
```

### Kubernetes Monitoring

```bash
# View all pods
kubectl get pods -n mmt

# Check logs
kubectl logs -f <pod-name> -n mmt

# View service status
kubectl get services -n mmt

# Check metrics
kubectl top pods -n mmt
```

---

## 🧪 Testing

### Docker Compose

```bash
# View logs
cd microservices
docker-compose logs -f

# Restart a service
docker-compose restart api-gateway

# Stop all services
docker-compose down
```

### Kubernetes

```bash
# Scale a service
kubectl scale deployment fleet-service --replicas=3 -n mmt

# Rolling update
kubectl rollout restart deployment api-gateway -n mmt

# Check rollout status
kubectl rollout status deployment api-gateway -n mmt
```

---

## 📚 Documentation

- **[Setup Guide](SETUP_GUIDE.md)** - Complete step-by-step setup instructions
- **[Configuration Guide](CONFIGURATION_GUIDE.md)** - Environment & secrets configuration
- **[Deployment Comparison](DEPLOYMENT_COMPARISON.md)** - Docker vs Kubernetes explained
- **[Microservices Architecture](microservices/README.md)** - Detailed microservices documentation
- **[Design Rationale](microservices/docs/DESIGN_RATIONALE.md)** - Architecture decisions
- **[Deployment Guide](microservices/DEPLOYMENT_GUIDE.md)** - Production deployment
- **[GCP Guide](microservices/GCP_DEPLOYMENT_GUIDE.md)** - Google Cloud Platform deployment
- **[API Specifications](microservices/docs/)** - OpenAPI, gRPC, GraphQL schemas

---

## 🚀 Deployment Options

### 1. Local Development (Docker Compose)

```bash
./deploy-docker.sh
```

Perfect for local development and testing.

### 2. Kubernetes (Minikube)

```bash
./deploy-kubernetes.sh
```

Production-like environment on your local machine.

### 3. Cloud Kubernetes (GKE/EKS/AKS)

```bash
# Configure kubectl to your cluster
kubectl config use-context <your-cluster>

# Deploy
cd microservices/kubernetes
kubectl apply -f namespace.yaml
kubectl apply -f secrets/
kubectl apply -f deployments/
kubectl apply -f services/
```

### 4. Cloud Managed Services

See `microservices/GCP_DEPLOYMENT_GUIDE.md` for deploying to:
- Google Kubernetes Engine (GKE)
- AWS Elastic Kubernetes Service (EKS)
- Azure Kubernetes Service (AKS)

---

## 🔐 Security Best Practices

- ✅ JWT-based authentication with short-lived tokens
- ✅ Environment variables for sensitive data
- ✅ HTTPS/TLS in production
- ✅ Rate limiting on API Gateway
- ✅ Database-per-service isolation
- ✅ Kubernetes secrets for credentials
- ✅ Network policies for service communication

---

## 🤝 Contributing

This is an internal project. For questions or issues, contact the development team.

---

## 👥 Team

- **Brinda S** - [@BrindaS11](https://github.com/BrindaS11)
- **Eby Tom** - [@ebytom](https://github.com/ebytom)
- **Govind M J** - [@gobmj](https://github.com/gobmj)
- **Joyal Devassy** - [@joyaldevassy14](https://github.com/joyaldevassy14)
- **Neha Bimal** - [@nehabimal](https://github.com/nehabimal)

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<p align="center">
  <strong>Made with ❤️ by Team AWengerS</strong>
  <br/>
  <sub>Fleet Management | Microservices | Cloud Native</sub>
</p>
