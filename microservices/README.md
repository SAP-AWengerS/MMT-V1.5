# MMT Microservices Architecture

## 🎯 Project Overview

This project transforms the Manage My Truck (MMT) monolithic application into a production-ready microservices architecture for a Scalable Services assignment. The implementation demonstrates modern service design, deployment practices, and three critical design patterns.

## 📋 Assignment Requirements Covered

### ✅ Service Design & Implementation (8 Marks)

#### Problem Domain: Fleet Management & Transport Operations
- **Domain**: Transport and logistics management
- **System Scope**: Fleet management, financial tracking, analytics, and notifications
- **Business Need**: Efficient truck fleet operations, expense tracking, and business intelligence

#### Microservices (6 Services - Exceeds requirement of 5)

1. **API Gateway** - API management, routing, circuit breaker
2. **Auth Service** - User authentication and authorization
3. **Fleet Service** - Truck and driver management
4. **Finance Service** - Income, expenses, loan calculations
5. **Analytics Service** - Business intelligence and reporting
6. **Notification Service** - Alerts and event-driven notifications

#### Communication Mechanisms (All 4 Required)

| Mechanism | Service | Use Case |
|-----------|---------|----------|
| **REST** | Auth, Fleet, Finance, Notification | CRUD operations |
| **gRPC** | Fleet ↔ Analytics | High-performance data queries |
| **GraphQL** | Finance Service | Complex financial queries |
| **Message Broker** | Notification Service | Asynchronous events (RabbitMQ) |

#### Decomposition Strategy: Business Capability

**Rationale**: Each service represents a distinct business capability:
- **API Management**: Centralized routing and security
- **User Management**: Authentication and authorization
- **Fleet Operations**: Core fleet management
- **Financial Management**: Income and expense tracking
- **Business Intelligence**: Analytics and reporting
- **Communication**: Alerts and notifications

**Justification**: See `docs/DESIGN_RATIONALE.md` for detailed explanation

### ✅ Patterns & Reliability (4 Marks)

#### 1. API Gateway Pattern
- **Location**: `api-gateway/server.js`
- **Implementation**: Centralized entry point for all client requests
- **Benefits**:
  - Single endpoint for clients
  - Centralized authentication
  - Rate limiting and security headers
  - Protocol translation (REST to gRPC/GraphQL)
- **Scalability**: Gateway can be horizontally scaled independently
- **Resilience**: Centralized error handling and circuit breakers

#### 2. Circuit Breaker Pattern
- **Location**: `api-gateway/server.js` (using Opossum library)
- **Implementation**: Per-service circuit breakers with fallbacks
- **Configuration**:
  ```javascript
  {
    timeout: 3000ms,
    errorThresholdPercentage: 50%,
    resetTimeout: 30000ms
  }
  ```
- **Benefits**:
  - Prevents cascading failures
  - Fast-fail mechanism
  - Automatic recovery
  - Service health monitoring
- **Scalability**: System remains responsive under partial failures
- **Resilience**: ⭐ Critical for preventing cascade failures

#### 3. Database-per-Service Pattern
- **Implementation**: Each service has its own MongoDB database
- **Databases**:
  - `mmt_auth_db` - Auth Service
  - `mmt_fleet_db` - Fleet Service
  - `mmt_finance_db` - Finance Service
  - `mmt_analytics_db` - Analytics Service
  - `mmt_notifications_db` - Notification Service
- **Benefits**:
  - Data isolation and independence
  - Independent scaling per database
  - Fault isolation
  - Technology flexibility
- **Scalability**: ⭐ Each database scales independently
- **Resilience**: ⭐ Database failure contained to one service

### ✅ Deployment (3 Marks)

#### Containerization
- ✅ All 6 services containerized with Docker
- ✅ Dockerfiles with health checks
- ✅ Multi-stage builds for optimization
- ✅ Alpine Linux base images (lightweight)

#### Kubernetes Deployment
- ✅ Minikube cluster deployment
- ✅ Deployment manifests for all services
- ✅ Service manifests (ClusterIP, NodePort)
- ✅ ConfigMaps for configuration
- ✅ Secrets for sensitive data
- ✅ Health checks and liveness probes

#### Container Registry
- ✅ Docker images pushed to DockerHub
- ✅ Tagged with version numbers
- ✅ Public repository for easy access

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client Layer                             │
│                    (React Frontend / Mobile)                     │
└─────────────────────────────────┬───────────────────────────────┘
                                  │ HTTPS
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API Gateway :3000                           │
│         (Circuit Breaker, Rate Limiting, Auth)                   │
└──┬────────┬────────┬────────┬────────┬──────────────────────────┘
   │        │        │        │        │
   │ REST   │ REST   │ REST   │ gRPC   │ REST
   │        │        │        │        │
   ▼        ▼        ▼        ▼        ▼
┌─────┐ ┌──────┐ ┌───────┐ ┌────────┐ ┌────────┐  ┌──────────┐
│Auth │ │Fleet │ │Finance│ │Analytics│ │Notif.  │  │ RabbitMQ │
│:3001│ │:3002 │ │:3003  │ │:3004   │ │:3005   │  │ :5672    │
└──┬──┘ └───┬──┘ └───┬───┘ └───┬────┘ └───┬────┘  └────▲─────┘
   │        │        │         │          │            │
   │        │        │         │          │   Events   │
   ▼        ▼        ▼         ▼          ▼            │
┌──────────────────────────────────────────────────────┴────────┐
│              Database Layer (MongoDB)                          │
│  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐ │
│  │ Auth   │  │ Fleet  │  │Finance │  │Analytics│  │ Notif. │ │
│  │  DB    │  │  DB    │  │  DB    │  │   DB    │  │  DB    │ │
│  └────────┘  └────────┘  └────────┘  └────────┘  └────────┘ │
└──────────────────────────────────────────────────────────────┘
```

## 📁 Project Structure

```
microservices/
├── api-gateway/              # API Gateway + Circuit Breaker
│   ├── server.js
│   ├── package.json
│   ├── Dockerfile
│   ├── .env.example
│   └── README.md
│
├── auth-service/             # Authentication (Database-per-Service)
│   ├── server.js
│   ├── models/User.js
│   ├── package.json
│   ├── Dockerfile
│   └── .env.example
│
├── fleet-service/            # Fleet Management + gRPC
│   ├── server.js
│   ├── grpc/
│   │   ├── fleet.proto
│   │   └── grpc-server.js
│   ├── models/
│   ├── package.json
│   └── Dockerfile
│
├── finance-service/          # Finance + GraphQL
│   ├── server.js
│   ├── graphql/
│   │   ├── schema.js
│   │   └── resolvers.js
│   ├── models/
│   ├── package.json
│   └── Dockerfile
│
├── analytics-service/        # Analytics + gRPC
│   ├── server.js
│   ├── grpc/
│   ├── package.json
│   └── Dockerfile
│
├── notification-service/     # Notifications + RabbitMQ
│   ├── server.js
│   ├── rabbitmq/
│   ├── package.json
│   └── Dockerfile
│
├── docs/
│   ├── DESIGN_RATIONALE.md   # Decomposition justification
│   ├── architecture/
│   │   └── architecture-diagram.png
│   ├── openapi/              # REST API specs
│   │   ├── auth-service.yaml
│   │   ├── fleet-service.yaml
│   │   └── finance-service.yaml
│   ├── proto/                # gRPC proto files
│   │   ├── fleet.proto
│   │   └── analytics.proto
│   └── graphql/              # GraphQL schemas
│       └── finance-schema.graphql
│
└── kubernetes/
    ├── deployments/          # K8s Deployment manifests
    ├── services/             # K8s Service manifests
    ├── configmaps/           # Configuration
    └── secrets/              # Sensitive data
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Docker & Docker Compose
- Kubernetes (Minikube)
- MongoDB
- RabbitMQ

### 1. Clone Repository
```bash
git clone <repository-url>
cd mmt-v1.5/microservices
```

### 2. Start with Docker Compose (Development)
```bash
docker-compose up --build
```

### 3. Deploy to Kubernetes (Production)
```bash
# Start Minikube
minikube start

# Apply configurations
kubectl apply -f kubernetes/configmaps/
kubectl apply -f kubernetes/secrets/
kubectl apply -f kubernetes/deployments/
kubectl apply -f kubernetes/services/

# Check status
kubectl get pods
kubectl get services
```

### 4. Access Services

| Service | URL | Port |
|---------|-----|------|
| API Gateway | http://localhost:3000 | 3000 |
| Auth Service | http://localhost:3001 | 3001 |
| Fleet Service | http://localhost:3002 | 3002 |
| Finance Service | http://localhost:3003 | 3003 |
| Analytics Service | http://localhost:3004 | 3004 |
| Notification Service | http://localhost:3005 | 3005 |
| GraphQL Playground | http://localhost:3003/graphql | 3003 |

## 📊 API Documentation

### REST APIs (OpenAPI 3.0)
- Auth Service: `docs/openapi/auth-service.yaml`
- Fleet Service: `docs/openapi/fleet-service.yaml`
- Finance Service: `docs/openapi/finance-service.yaml`

### gRPC (Protocol Buffers)
- Fleet Service: `docs/proto/fleet.proto`
- Analytics Service: `docs/proto/analytics.proto`

### GraphQL
- Finance Service: `docs/graphql/finance-schema.graphql`
- Playground: http://localhost:3003/graphql

## 🧪 Testing

### Test Individual Service
```bash
cd <service-name>
npm install
npm start
```

### Test API Gateway
```bash
# Health check
curl http://localhost:3000/health

# Auth (register)
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"password123"}'

# Get trucks (authenticated)
curl -H "Authorization: Bearer <token>" \
  http://localhost:3000/api/fleet/trucks
```

### Test Circuit Breaker
```bash
# Stop a service
docker stop fleet-service

# Make requests - circuit will open after 50% failure rate
for i in {1..10}; do
  curl -H "Authorization: Bearer <token>" \
    http://localhost:3000/api/fleet/trucks
done
```

### Test GraphQL
```graphql
# http://localhost:3003/graphql
query {
  getTotalExpenses(truckId: "123", startDate: "2024-01-01", endDate: "2024-12-31") {
    total
    fuelExpenses
    defExpenses
    otherExpenses
  }
}
```

## 🐳 Docker Images

### Build All Images
```bash
./build-images.sh
```

### Push to DockerHub
```bash
docker tag mmt-api-gateway:latest yourusername/mmt-api-gateway:1.0.0
docker push yourusername/mmt-api-gateway:1.0.0

# Repeat for all services
```

### Pull from DockerHub
```bash
docker pull yourusername/mmt-api-gateway:1.0.0
docker pull yourusername/mmt-auth-service:1.0.0
# ... etc
```

## ☸️ Kubernetes Deployment

### Deploy to Minikube
```bash
# Start cluster
minikube start --cpus=4 --memory=8192

# Enable addons
minikube addons enable ingress
minikube addons enable metrics-server

# Deploy services
kubectl apply -f kubernetes/

# Check deployment
kubectl get all -n mmt

# Access services
minikube service api-gateway -n mmt
```

### Scale Services
```bash
kubectl scale deployment fleet-service --replicas=3
kubectl scale deployment api-gateway --replicas=2
```

### Monitor
```bash
kubectl logs -f <pod-name>
kubectl top pods
kubectl describe pod <pod-name>
```

## 📈 Scalability & Resilience Benefits

### Scalability
✅ **Independent Scaling**: Each service scales based on its load
✅ **Horizontal Scaling**: Add more instances as needed
✅ **Resource Optimization**: Allocate resources per service needs
✅ **Database Scaling**: Each DB scales independently

### Resilience
✅ **Fault Isolation**: Service failure doesn't cascade
✅ **Circuit Breaker**: Fast-fail for unavailable services
✅ **Database Isolation**: DB failure affects only one service
✅ **Graceful Degradation**: System continues with partial functionality
✅ **Health Checks**: Automatic service monitoring
✅ **Auto-recovery**: Kubernetes restarts failed pods

## 📚 Documentation

- **Design Rationale**: `docs/DESIGN_RATIONALE.md`
- **API Gateway**: `api-gateway/README.md`
- **OpenAPI Specs**: `docs/openapi/`
- **gRPC Proto Files**: `docs/proto/`
- **GraphQL Schemas**: `docs/graphql/`
- **Architecture Diagram**: `docs/architecture/`

## 🔧 Technology Stack

| Layer | Technology |
|-------|-----------|
| **API Gateway** | Express, Opossum (Circuit Breaker) |
| **Auth** | JWT, BCrypt, Google OAuth |
| **Services** | Node.js, Express |
| **Databases** | MongoDB (per service) |
| **gRPC** | @grpc/grpc-js, Protocol Buffers |
| **GraphQL** | Apollo Server |
| **Message Broker** | RabbitMQ |
| **Containerization** | Docker |
| **Orchestration** | Kubernetes (Minikube) |
| **Logging** | Winston |

## 🎓 Assignment Deliverables Checklist

- [x] **Problem Domain Identified**: Fleet Management
- [x] **6 Microservices Designed** (exceeds requirement of 5)
- [x] **REST Communication**: Auth, Fleet, Finance, Notification
- [x] **gRPC Communication**: Fleet ↔ Analytics
- [x] **GraphQL Communication**: Finance Service
- [x] **Message Broker**: RabbitMQ in Notification Service
- [x] **Business Capability Decomposition**: Justified in docs
- [x] **API Gateway Pattern**: Implemented with routing
- [x] **Circuit Breaker Pattern**: Opossum library in Gateway
- [x] **Database-per-Service Pattern**: 5 separate MongoDB DBs
- [x] **Scalability Explanation**: Documented
- [x] **Resilience Explanation**: Documented
- [x] **All Services Containerized**: 6 Dockerfiles
- [x] **Kubernetes Manifests**: Deployments, Services, ConfigMaps
- [x] **Minikube Deployment**: Ready
- [x] **DockerHub Push**: Instructions included
- [x] **Architecture Diagram**: Included
- [x] **OpenAPI Schemas**: For REST APIs
- [x] **Proto Files**: For gRPC services
- [x] **GraphQL Schema**: For Finance service

## 👥 Contributors

- Brinda S
- Eby Tom
- Govind M J
- Joyal Devassy
- Neha Bimal

## 📄 License

MIT License - see LICENSE file

---

**Assignment**: Scalable Services
**Topic**: Microservices Architecture with Modern Design Patterns
**Total Marks**: 15 (8 + 4 + 3)
