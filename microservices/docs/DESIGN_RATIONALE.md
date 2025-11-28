# Design Rationale: MMT Microservices Architecture

## Executive Summary

This document provides the design rationale for transforming the Manage My Truck (MMT) monolithic application into a microservices-based architecture, detailing the decomposition strategy, design patterns, and architectural decisions.

---

## 1. Problem Domain

**Domain**: Fleet Management and Transport Operations

**Problem Statement**: Transport businesses need an efficient system to manage their fleet operations, track financial transactions, monitor driver performance, and generate business intelligence for decision-making.

**System Scope**:
- Fleet and driver management
- Financial tracking (income and expenses)
- Business analytics and reporting
- Alert and notification system
- User authentication and authorization

---

## 2. Decomposition Strategy

### Chosen Approach: **Business Capability Decomposition**

**Rationale**: We chose Business Capability decomposition over Business Domain decomposition because:

1. **Alignment with Business Functions**: Each microservice represents a distinct business capability that delivers value independently
2. **Organizational Structure**: Maps well to how transport businesses organize their operations (finance, operations, analytics)
3. **Scalability**: Different capabilities have different scaling requirements (e.g., analytics needs more compute, notifications need queuing)
4. **Independent Evolution**: Business capabilities can evolve independently based on business needs

### Business Capabilities Identified

| Business Capability | Microservice | Justification |
|---------------------|--------------|---------------|
| **API Management & Routing** | API Gateway | Centralized entry point, security, routing |
| **User Management & Security** | Auth Service | Authentication, authorization, user profiles |
| **Fleet Operations** | Fleet Service | Core business: truck and driver management |
| **Financial Management** | Finance Service | Income, expenses, loan calculations |
| **Business Intelligence** | Analytics Service | Reporting, aggregation, insights |
| **Communication & Alerts** | Notification Service | Alerts, notifications, event handling |

---

## 3. Microservices Architecture

### 3.1 API Gateway Service

**Responsibility**:
- Single entry point for all client requests
- Request routing and load balancing
- Authentication validation
- Circuit breaker implementation
- Rate limiting

**Technology Stack**:
- Node.js + Express
- Opossum (Circuit Breaker)
- JWT validation
- HTTP Proxy middleware

**Database**: None (stateless routing layer)

**Patterns Implemented**:
- ✅ API Gateway Pattern
- ✅ Circuit Breaker Pattern

**Why This Design**:
- Simplifies client communication (single endpoint)
- Centralized security and cross-cutting concerns
- Prevents cascading failures with circuit breaker
- Independent scaling of routing layer

---

### 3.2 Auth Service

**Responsibility**:
- User authentication (Google OAuth 2.0, JWT)
- User registration and login
- Token generation and validation
- User profile management
- Admin role management

**Technology Stack**:
- Node.js + Express
- MongoDB (users database)
- Google OAuth Library
- JWT + BCrypt

**Database**:
- Database Name: `mmt_auth_db`
- Collections: `users`

**Communication**:
- REST API endpoints
- Synchronous HTTP calls

**Patterns Implemented**:
- ✅ Database-per-Service Pattern

**API Endpoints**:
```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/google
POST   /api/auth/validate-token
GET    /api/auth/profile
PUT    /api/auth/profile
```

**Why This Design**:
- Authentication is a critical security boundary
- Separate database ensures user data isolation
- Independent scaling for auth operations
- Can be secured and audited separately

---

### 3.3 Fleet Service

**Responsibility**:
- Truck CRUD operations
- Driver profile management
- Vehicle catalog
- Fleet status tracking

**Technology Stack**:
- Node.js + Express
- MongoDB (fleet database)
- gRPC (for fast queries)
- Protocol Buffers

**Database**:
- Database Name: `mmt_fleet_db`
- Collections: `trucks`, `drivers`

**Communication**:
- REST API (CRUD operations)
- gRPC (queries from Analytics Service)

**Patterns Implemented**:
- ✅ Database-per-Service Pattern

**REST Endpoints**:
```
GET    /api/fleet/trucks
POST   /api/fleet/trucks
GET    /api/fleet/trucks/:id
PUT    /api/fleet/trucks/:id
DELETE /api/fleet/trucks/:id
GET    /api/fleet/drivers
POST   /api/fleet/drivers
```

**gRPC Services**:
```protobuf
service FleetService {
  rpc GetTrucks(TruckQuery) returns (TruckList);
  rpc GetTruckById(TruckId) returns (Truck);
  rpc GetDrivers(DriverQuery) returns (DriverList);
}
```

**Why This Design**:
- Fleet management is core business capability
- gRPC provides high-performance data queries for analytics
- Separate database allows independent scaling
- Can handle high-frequency truck status updates

---

### 3.4 Finance Service

**Responsibility**:
- Income tracking
- Expense management (fuel, DEF, other)
- Loan calculations
- Financial queries and reports

**Technology Stack**:
- Node.js + Express
- MongoDB (finance database)
- GraphQL (Apollo Server)
- ExcelJS (reports)

**Database**:
- Database Name: `mmt_finance_db`
- Collections: `income`, `fuel_expenses`, `def_expenses`, `other_expenses`, `loans`

**Communication**:
- REST API (CRUD operations)
- GraphQL (complex financial queries)

**Patterns Implemented**:
- ✅ Database-per-Service Pattern

**REST Endpoints**:
```
POST   /api/finance/income
GET    /api/finance/income
POST   /api/finance/expenses/fuel
POST   /api/finance/expenses/def
POST   /api/finance/expenses/other
POST   /api/finance/loans/calculate
```

**GraphQL Schema**:
```graphql
type Query {
  getTotalExpenses(truckId: ID!, startDate: String!, endDate: String!): ExpenseSummary
  getIncomeByTruck(truckId: ID!): [Income]
  getFinancialReport(filters: ReportFilters!): FinancialReport
}
```

**Why This Design**:
- Financial data requires strong isolation
- GraphQL enables complex queries (joins, aggregations)
- Independent scaling for compute-intensive calculations
- Audit trail and compliance requirements

---

### 3.5 Analytics Service

**Responsibility**:
- Total expense aggregation
- Metadata and statistics
- Dashboard data preparation
- Business intelligence queries

**Technology Stack**:
- Node.js + Express
- MongoDB (analytics database)
- gRPC Client (queries Fleet Service)
- Data aggregation pipelines

**Database**:
- Database Name: `mmt_analytics_db`
- Collections: `aggregated_expenses`, `metadata`, `statistics`

**Communication**:
- gRPC Server (fast data serving)
- gRPC Client (queries other services)

**Patterns Implemented**:
- ✅ Database-per-Service Pattern

**gRPC Services**:
```protobuf
service AnalyticsService {
  rpc GetTotalExpenses(ExpenseQuery) returns (ExpenseSummary);
  rpc GetMetadata(MetadataQuery) returns (MetadataResponse);
  rpc GetDashboardStats(StatsQuery) returns (DashboardStats);
}
```

**Why This Design**:
- Analytics requires aggregation from multiple services
- gRPC provides high-performance data transfer
- Separate database for pre-computed aggregations
- Can scale independently for heavy analytical workloads

---

### 3.6 Notification Service

**Responsibility**:
- Alert creation and management
- Email notifications
- Event-driven notifications
- Notification history

**Technology Stack**:
- Node.js + Express
- MongoDB (notifications database)
- RabbitMQ (message broker)
- Event-driven architecture

**Database**:
- Database Name: `mmt_notifications_db`
- Collections: `alerts`, `notification_history`

**Communication**:
- REST API (alert management)
- RabbitMQ (asynchronous events)

**Patterns Implemented**:
- ✅ Database-per-Service Pattern

**Message Broker Events**:
```
truck.created → Send welcome alert
expense.threshold.exceeded → Send warning alert
income.recorded → Send confirmation
maintenance.due → Send reminder
```

**Why This Design**:
- Notifications are inherently asynchronous
- Message broker ensures reliable delivery
- Decouples notification logic from business logic
- Can handle high volume of events without blocking

---

## 4. Design Patterns Implementation

### 4.1 API Gateway Pattern

**Implementation**: Centralized API Gateway service

**Benefits**:
- **Simplified Client**: Single endpoint for all services
- **Security**: Centralized authentication and authorization
- **Cross-cutting Concerns**: Logging, rate limiting, CORS in one place
- **Service Discovery**: Clients don't need to know service locations
- **Protocol Translation**: Can handle different protocols internally

**Scalability Impact**:
- Gateway can be horizontally scaled independently
- Reduces client-side complexity
- Enables better caching strategies

**Resilience Impact**:
- Single point for implementing circuit breakers
- Centralized error handling
- Graceful degradation of services

---

### 4.2 Circuit Breaker Pattern

**Implementation**: Opossum library in API Gateway

**Configuration**:
```javascript
{
  timeout: 3000,          // 3 seconds
  errorThresholdPercentage: 50,
  resetTimeout: 30000,    // 30 seconds
  fallback: cachedResponse or error message
}
```

**Benefits**:
- **Prevents Cascading Failures**: Stops calling failing services
- **Fast Fail**: Immediate response instead of waiting for timeout
- **Self-Healing**: Automatically retries after reset timeout
- **Monitoring**: Tracks service health and failure rates

**Scalability Impact**:
- System remains responsive under partial failures
- Resources not wasted on failing services
- Better overall system throughput

**Resilience Impact**:
- ⭐ **Critical for Resilience**: Primary defense against cascading failures
- Provides fallback mechanisms
- Enables graceful degradation
- Maintains system availability even when services fail

---

### 4.3 Database-per-Service Pattern

**Implementation**: Each service has its own MongoDB database

**Database Isolation**:
```
API Gateway:      None (stateless)
Auth Service:     mmt_auth_db
Fleet Service:    mmt_fleet_db
Finance Service:  mmt_finance_db
Analytics Service: mmt_analytics_db
Notification Service: mmt_notifications_db
```

**Benefits**:
- **Data Isolation**: Services own their data
- **Technology Freedom**: Each service can choose optimal DB
- **Independent Scaling**: Scale databases based on service needs
- **Fault Isolation**: Database failure affects only one service
- **Independent Deployment**: Schema changes don't affect other services

**Scalability Impact**:
- ⭐ **Horizontal Scaling**: Each database can scale independently
- Different databases can have different scaling strategies
- Read replicas can be added per service
- Sharding can be applied where needed

**Resilience Impact**:
- ⭐ **Fault Isolation**: Database failure contained to one service
- No single point of failure for all data
- Services can continue operating if others fail

**Trade-offs**:
- **Data Consistency**: Need to implement eventual consistency
- **Transactions**: No distributed ACID transactions (use Saga pattern if needed)
- **Data Duplication**: Some data may be replicated across services
- **Queries**: Cross-service queries require service-to-service communication

---

## 5. Communication Mechanisms

### 5.1 REST APIs

**Used By**: Auth, Fleet, Finance, Notification services

**Why REST**:
- Standard protocol, widely understood
- Excellent for CRUD operations
- Easy to document with OpenAPI
- HTTP caching support
- Browser-friendly

**Use Cases**:
- User authentication and registration
- Truck and driver management
- Expense and income recording
- Alert management

---

### 5.2 gRPC

**Used By**: Fleet ↔ Analytics, Analytics Service

**Why gRPC**:
- High performance (Protocol Buffers)
- 7x faster than REST for data queries
- Strong typing with .proto files
- Bi-directional streaming support
- Efficient for service-to-service communication

**Use Cases**:
- Analytics querying fleet data
- Real-time dashboard updates
- Bulk data transfers
- High-frequency queries

---

### 5.3 GraphQL

**Used By**: Finance Service

**Why GraphQL**:
- Complex financial queries
- Single request for multiple resources
- Client-specified data shape
- Reduces over-fetching
- Perfect for financial reports

**Use Cases**:
- Financial reports with multiple data sources
- Dashboard financial widgets
- Complex expense aggregations
- Custom financial queries

---

### 5.4 Message Broker (RabbitMQ)

**Used By**: Notification Service (consumer), All services (publishers)

**Why Message Broker**:
- Asynchronous communication
- Event-driven architecture
- Decoupling of services
- Guaranteed message delivery
- Load leveling

**Use Cases**:
- Expense threshold alerts
- Maintenance reminders
- Income confirmations
- Event notifications

**Event Flow Example**:
```
Finance Service → [expense.created event] → RabbitMQ → Notification Service
Fleet Service → [truck.created event] → RabbitMQ → Notification Service
```

---

## 6. Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client Layer                             │
│                    (React Frontend / Mobile)                     │
└─────────────────────────────────┬───────────────────────────────┘
                                  │
                                  │ HTTPS
                                  │
┌─────────────────────────────────▼───────────────────────────────┐
│                         API Gateway                              │
│              (Circuit Breaker, Rate Limiting, Auth)             │
└─────┬────────┬────────┬────────┬────────┬────────┬──────────────┘
      │        │        │        │        │        │
      │ REST   │ REST   │ REST   │ gRPC   │ gRPC   │ REST
      │        │        │        │        │        │
┌─────▼──┐ ┌──▼────┐ ┌─▼─────┐ ┌▼──────┐ ┌▼──────┐ ┌▼───────────┐
│  Auth  │ │ Fleet │ │Finance│ │Analytics│ │Notif. │ │  RabbitMQ  │
│Service │ │Service│ │Service│ │Service│ │Service│ │  (Broker)  │
│        │ │       │ │       │ │       │ │       │ │            │
│ REST   │ │REST   │ │REST   │ │gRPC   │ │REST   │ │  Events    │
│        │ │gRPC   │ │GraphQL│ │       │ │Events │ │            │
└────┬───┘ └───┬───┘ └───┬───┘ └───┬───┘ └───┬───┘ └──────▲─────┘
     │         │         │         │         │            │
     │         │         │         │         │            │
┌────▼─────────▼─────────▼─────────▼─────────▼────────────┴──────┐
│                    Database Layer                                │
│  (Database-per-Service Pattern)                                 │
│                                                                  │
│  ┌───────┐  ┌───────┐  ┌────────┐  ┌──────────┐  ┌──────────┐│
│  │ Auth  │  │ Fleet │  │Finance │  │Analytics │  │   Notif. ││
│  │  DB   │  │  DB   │  │  DB    │  │    DB    │  │    DB    ││
│  │(Mongo)│  │(Mongo)│  │(Mongo) │  │ (Mongo)  │  │ (Mongo)  ││
│  └───────┘  └───────┘  └────────┘  └──────────┘  └──────────┘│
└──────────────────────────────────────────────────────────────────┘
```

---

## 7. Scalability Benefits

### 7.1 Independent Scaling
- **Finance Service**: Scale during month-end processing
- **Analytics Service**: Scale for heavy report generation
- **Fleet Service**: Scale for high-frequency truck updates
- **API Gateway**: Scale based on traffic patterns

### 7.2 Resource Optimization
- Allocate more resources to compute-intensive services
- Different services can use different instance types
- Cost-effective scaling (only scale what's needed)

### 7.3 Technology Flexibility
- Each service can use optimal technology stack
- Database can be optimized per service (indexing, sharding)
- Can introduce caching at service level

### 7.4 Performance Isolation
- Slow queries in one service don't affect others
- Database locks are isolated
- Memory leaks contained to single service

---

## 8. Resilience Benefits

### 8.1 Fault Isolation
- Service failure doesn't cascade
- Database failure affects only one capability
- Circuit breaker prevents overload

### 8.2 Independent Deployment
- Deploy services independently
- Rollback single service if needed
- Zero-downtime deployments per service

### 8.3 Redundancy
- Multiple instances per service
- Database replication per service
- Load balancing at API Gateway

### 8.4 Monitoring & Health Checks
- Health endpoints per service
- Independent monitoring
- Service-level metrics

---

## 9. Trade-offs and Considerations

### 9.1 Increased Complexity
- More moving parts to manage
- Network latency between services
- Distributed debugging challenges

**Mitigation**:
- Comprehensive logging and tracing
- Health checks and monitoring
- Circuit breakers for resilience

### 9.2 Data Consistency
- No distributed transactions
- Eventual consistency model

**Mitigation**:
- Event-driven updates
- Compensating transactions
- Idempotent operations

### 9.3 Operational Overhead
- More services to deploy and monitor
- DevOps complexity

**Mitigation**:
- Kubernetes for orchestration
- Docker for consistent deployment
- Automated CI/CD pipelines

---

## 10. Conclusion

This microservices architecture provides a robust, scalable, and resilient solution for fleet management operations. The Business Capability decomposition aligns with how transport businesses operate, while the three design patterns (API Gateway, Circuit Breaker, Database-per-Service) ensure scalability and resilience.

**Key Achievements**:
- ✅ 6 microservices based on business capabilities
- ✅ 3 design patterns implemented
- ✅ 4 communication mechanisms (REST, gRPC, GraphQL, Message Broker)
- ✅ Independent scalability per service
- ✅ Fault isolation and resilience
- ✅ Clear separation of concerns
- ✅ Production-ready architecture

**Production Readiness**:
- Containerized with Docker
- Orchestrated with Kubernetes
- Comprehensive API documentation
- Monitoring and health checks
- Security at gateway level
- Event-driven notifications

This architecture is ready for deployment and can handle the demands of a modern fleet management platform.
