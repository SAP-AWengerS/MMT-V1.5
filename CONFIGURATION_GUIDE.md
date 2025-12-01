# 🔧 Configuration Guide - Environment & Secrets

This guide explains all configuration files needed for the Manage My Truck application and where to set them up.

---

## 📋 Configuration Files Overview

### Quick Checklist

Before running the application, ensure you've created these files:

**Docker Compose / Native Deployment:**
- [ ] `microservices/api-gateway/.env` ← **Required**
- [ ] `frontend/.env` ← **Required**
- [ ] Individual service `.env` files ← Optional (for native only)

**Kubernetes Deployment:**
- [ ] `microservices/api-gateway/.env` ← **Required**
- [ ] `frontend/.env` ← **Required**
- [ ] `microservices/kubernetes/secrets/secrets.yaml` ← **Required**

---

## 🎯 Deployment-Specific Configuration

### For Docker Compose (Recommended for Development)

**Required Files:**
1. `microservices/api-gateway/.env`
2. `frontend/.env`

Docker Compose handles all service configuration through the `docker-compose.yml` file and environment variables. Individual services don't need `.env` files as configurations are passed via Docker Compose.

### For Kubernetes

**Required Files:**
1. `microservices/api-gateway/.env` (still needed for local development)
2. `frontend/.env`
3. `microservices/kubernetes/secrets/secrets.yaml` ← **Critical for K8s**

Kubernetes uses the `secrets.yaml` file to inject secrets into all service pods.

### For Native Deployment (No Docker)

**Required Files:**
1. `microservices/api-gateway/.env`
2. `microservices/auth-service/.env`
3. `microservices/fleet-service/.env`
4. `microservices/finance-service/.env`
5. `microservices/analytics-service/.env`
6. `microservices/notification-service/.env`
7. `frontend/.env`

Each service needs its own `.env` file when running natively.

---

## 📝 Complete Configuration Templates

### 1. API Gateway Environment File

**Location:** `microservices/api-gateway/.env`

```bash
# Create from example
cd microservices/api-gateway
cp .env.example .env
```

**Content:**
```env
# Server Configuration
PORT=5001
NODE_ENV=production

# Security
JWT_SECRET=your-jwt-secret-minimum-32-characters-long

# Google OAuth (Optional - for Google Sign-In)
GOOGLE_CLIENT_ID=your-google-client-id-from-console
GOOGLE_CLIENT_SECRET=your-google-client-secret-from-console

# Microservice URLs (Docker Compose)
AUTH_SERVICE_URL=http://auth-service:3001
FLEET_SERVICE_URL=http://fleet-service:3002
FINANCE_SERVICE_URL=http://finance-service:3003
ANALYTICS_SERVICE_URL=http://analytics-service:3004
NOTIFICATION_SERVICE_URL=http://notification-service:3005

# For native/local development, use localhost:
# AUTH_SERVICE_URL=http://localhost:3001
# FLEET_SERVICE_URL=http://localhost:3002
# FINANCE_SERVICE_URL=http://localhost:3003
# ANALYTICS_SERVICE_URL=http://localhost:3004
# NOTIFICATION_SERVICE_URL=http://localhost:3005

# Circuit Breaker Configuration (Optional)
CIRCUIT_BREAKER_TIMEOUT=3000
CIRCUIT_BREAKER_ERROR_THRESHOLD=50
CIRCUIT_BREAKER_RESET_TIMEOUT=30000
```

---

### 2. Frontend Environment File

**Location:** `frontend/.env`

```bash
# Create the file
cd frontend
nano .env
```

**Content:**
```env
# Backend API URL
REACT_APP_BACKEND_URL=http://localhost:5001

# Google OAuth (Optional - must match backend)
REACT_APP_GOOGLE_CLIENT_ID=your-google-client-id-from-console

# Optional: Custom Configuration
# REACT_APP_API_TIMEOUT=5000
# REACT_APP_DEBUG_MODE=false
```

---

### 3. Kubernetes Secrets File

**Location:** `microservices/kubernetes/secrets/secrets.yaml`

```bash
# Create from example
cd microservices/kubernetes/secrets
cp secrets.yaml.example secrets.yaml
nano secrets.yaml
```

**Content:**
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: mmt-secrets
  namespace: mmt
type: Opaque
stringData:
  # JWT Secret (must be at least 32 characters)
  jwt-secret: "your-jwt-secret-minimum-32-characters-long"

  # MongoDB URIs (pointing to MongoDB service in K8s)
  mongodb-uri-auth: "mongodb://admin:password@mongodb:27017/mmt_auth_db?authSource=admin"
  mongodb-uri-fleet: "mongodb://admin:password@mongodb:27017/mmt_fleet_db?authSource=admin"
  mongodb-uri-finance: "mongodb://admin:password@mongodb:27017/mmt_finance_db?authSource=admin"
  mongodb-uri-analytics: "mongodb://admin:password@mongodb:27017/mmt_analytics_db?authSource=admin"
  mongodb-uri-notifications: "mongodb://admin:password@mongodb:27017/mmt_notifications_db?authSource=admin"

  # RabbitMQ URL (pointing to RabbitMQ service in K8s)
  rabbitmq-url: "amqp://admin:password@rabbitmq:5672"

  # Google OAuth (Optional)
  google-client-id: "your-google-client-id-from-console"
  google-client-secret: "your-google-client-secret-from-console"
```

**⚠️ CRITICAL SECURITY NOTES:**
- This file contains **REAL credentials** - never commit it to git
- Already in `.gitignore` - keep it there!
- Only commit `secrets.yaml.example` with placeholder values
- Change default MongoDB/RabbitMQ passwords in production

---

### 4. Individual Service .env Files (Optional - Native Deployment)

Only needed if running services natively without Docker.

**Auth Service** (`microservices/auth-service/.env`):
```env
PORT=3001
MONGODB_URI=mongodb://admin:password@localhost:27017/mmt_auth_db?authSource=admin
JWT_SECRET=your-jwt-secret-minimum-32-characters-long
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

**Fleet Service** (`microservices/fleet-service/.env`):
```env
PORT=3002
GRPC_PORT=50051
MONGODB_URI=mongodb://admin:password@localhost:27017/mmt_fleet_db?authSource=admin
```

**Finance Service** (`microservices/finance-service/.env`):
```env
PORT=3003
MONGODB_URI=mongodb://admin:password@localhost:27017/mmt_finance_db?authSource=admin
FLEET_SERVICE_URL=http://localhost:3002
```

**Analytics Service** (`microservices/analytics-service/.env`):
```env
PORT=3004
GRPC_PORT=50052
MONGODB_URI=mongodb://admin:password@localhost:27017/mmt_analytics_db?authSource=admin
FLEET_GRPC_URL=localhost:50051
```

**Notification Service** (`microservices/notification-service/.env`):
```env
PORT=3005
MONGODB_URI=mongodb://admin:password@localhost:27017/mmt_notifications_db?authSource=admin
RABBITMQ_URL=amqp://admin:password@localhost:5672
```

---

## 🔑 Getting OAuth Credentials

### Google OAuth Setup

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/

2. **Create/Select Project**
   - Click "Select a project" → "New Project"
   - Name: "Manage My Truck" (or your choice)
   - Click "Create"

3. **Enable Google+ API**
   - Go to "APIs & Services" → "Library"
   - Search for "Google+ API"
   - Click "Enable"

4. **Create OAuth Credentials**
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth 2.0 Client ID"
   - Application type: "Web application"
   - Name: "MMT Web App"

5. **Configure Authorized URIs**
   - Authorized JavaScript origins:
     - `http://localhost:3000`
     - `http://localhost:5001`
   - Authorized redirect URIs:
     - `http://localhost:3000/auth/google/callback`
     - `http://localhost:5001/api/auth/google/callback`

6. **Copy Credentials**
   - Copy the **Client ID** and **Client Secret**
   - Add them to your configuration files

---

## 🔄 Configuration Priority

### Docker Compose

Configuration is loaded in this order:
1. `docker-compose.yml` environment variables
2. `.env` files (if specified in docker-compose.yml)
3. Default values in code

### Kubernetes

Configuration is loaded in this order:
1. `secrets.yaml` (mounted as environment variables)
2. ConfigMaps (if any)
3. Default values in code

### Native Deployment

Configuration is loaded in this order:
1. Environment variables passed at runtime
2. `.env` files in service directories
3. Default values in code

---

## 🛡️ Security Best Practices

### DO's ✅

- ✅ Use strong JWT secrets (minimum 32 characters)
- ✅ Change default MongoDB/RabbitMQ passwords in production
- ✅ Keep `.env` and `secrets.yaml` files local only
- ✅ Use environment-specific configurations
- ✅ Rotate secrets regularly
- ✅ Use HTTPS in production

### DON'Ts ❌

- ❌ Never commit actual secrets to git
- ❌ Never use default passwords in production
- ❌ Never share `.env` or `secrets.yaml` files
- ❌ Never hardcode credentials in source code
- ❌ Never expose sensitive endpoints publicly

---

## 📂 File Locations Summary

```
mmt-v1.5/
├── .gitignore                                    # Includes secrets.yaml
│
├── frontend/
│   └── .env                                      # ← CREATE THIS
│
└── microservices/
    ├── api-gateway/
    │   ├── .env.example                          # Template
    │   └── .env                                  # ← CREATE THIS
    │
    ├── auth-service/
    │   └── .env                                  # ← Optional (native only)
    │
    ├── fleet-service/
    │   └── .env                                  # ← Optional (native only)
    │
    ├── finance-service/
    │   └── .env                                  # ← Optional (native only)
    │
    ├── analytics-service/
    │   └── .env                                  # ← Optional (native only)
    │
    ├── notification-service/
    │   └── .env                                  # ← Optional (native only)
    │
    └── kubernetes/
        └── secrets/
            ├── secrets.yaml.example              # Template
            └── secrets.yaml                      # ← CREATE THIS (K8s only)
```

---

## 🔍 Verification

### Check Configuration Files Exist

```bash
# Check required files
test -f microservices/api-gateway/.env && echo "✅ API Gateway .env exists" || echo "❌ Missing api-gateway/.env"
test -f frontend/.env && echo "✅ Frontend .env exists" || echo "❌ Missing frontend/.env"

# For Kubernetes
test -f microservices/kubernetes/secrets/secrets.yaml && echo "✅ Kubernetes secrets exists" || echo "⚠️ Missing secrets.yaml (needed for K8s)"
```

### Validate Configuration

```bash
# Test API Gateway can read its config
cd microservices/api-gateway
node -e "require('dotenv').config(); console.log('Port:', process.env.PORT); console.log('JWT Secret length:', process.env.JWT_SECRET?.length || 0)"
```

---

## 🆘 Troubleshooting

### Issue: "Cannot find module 'dotenv'"

**Solution:** Install dependencies first:
```bash
cd microservices/api-gateway
npm install
```

### Issue: "JWT_SECRET must be at least 32 characters"

**Solution:** Generate a strong secret:
```bash
# Generate random 64-character secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output to your `JWT_SECRET` field.

### Issue: "GOOGLE_CLIENT_ID is not set"

**Solution:** Either:
1. Set up Google OAuth (see "Getting OAuth Credentials" section)
2. Or disable OAuth and use email/password only (OAuth is optional)

### Issue: Services can't connect to MongoDB/RabbitMQ

**Solution:**
- For Docker: Use service names (`mongodb`, `rabbitmq`)
- For Native: Use `localhost`
- For K8s: Use service names within the cluster

---

## 📚 Additional Resources

- **[SETUP_GUIDE.md](SETUP_GUIDE.md)** - Complete setup instructions
- **[README.md](README.md)** - Project overview
- **[DEPLOYMENT_GUIDE.md](microservices/DEPLOYMENT_GUIDE.md)** - Production deployment

---

<p align="center">
  <strong>Keep your secrets safe! 🔐</strong>
</p>
