# API Gateway Service

## Overview

The API Gateway serves as the single entry point for all client requests in the MMT microservices architecture. It implements the **API Gateway Pattern** and **Circuit Breaker Pattern** to provide routing, authentication, rate limiting, and resilience.

## Features

### 🔐 Security
- JWT token validation
- Rate limiting (100 requests per 15 minutes per IP)
- Helmet.js security headers
- CORS configuration

### 🔄 Circuit Breaker
- Automatic failure detection
- Fast-fail mechanism
- Self-healing (30s reset timeout)
- Fallback responses
- Per-service circuit breakers

### 🚦 Routing
Routes requests to appropriate microservices:
- `/api/auth/*` → Auth Service (Port 3001)
- `/api/fleet/*` → Fleet Service (Port 3002)
- `/api/finance/*` → Finance Service (Port 3003)
- `/api/analytics/*` → Analytics Service (Port 3004)
- `/api/notification/*` → Notification Service (Port 3005)
- `/graphql` → Finance Service (GraphQL endpoint)

### 📊 Monitoring
- Health check endpoint: `GET /health`
- Winston logging (console + file)
- Circuit breaker statistics
- Request/response logging

## Circuit Breaker Configuration

```javascript
{
  timeout: 3000,                    // Request timeout: 3 seconds
  errorThresholdPercentage: 50,    // Open circuit if 50% of requests fail
  resetTimeout: 30000,              // Try again after 30 seconds
}
```

### Circuit States

1. **CLOSED**: Normal operation, requests pass through
2. **OPEN**: Service failing, requests fail immediately with fallback
3. **HALF-OPEN**: Testing if service recovered

## Installation

```bash
cd microservices/api-gateway
npm install
```

## Environment Variables

Create a `.env` file (see `.env.example`):

```env
PORT=3000
JWT_SECRET=your-secret-key
AUTH_SERVICE_URL=http://localhost:3001
FLEET_SERVICE_URL=http://localhost:3002
FINANCE_SERVICE_URL=http://localhost:3003
ANALYTICS_SERVICE_URL=http://localhost:3004
NOTIFICATION_SERVICE_URL=http://localhost:3005
```

## Running the Service

### Development
```bash
npm run dev
```

### Production
```bash
npm start
```

### Docker
```bash
docker build -t mmt-api-gateway .
docker run -p 3000:3000 --env-file .env mmt-api-gateway
```

## API Usage

### Authentication Required

All endpoints (except public routes) require JWT token:

```bash
curl -H "Authorization: Bearer <token>" http://localhost:3000/api/fleet/trucks
```

### Public Routes (No Auth Required)
- `POST /api/auth/login`
- `POST /api/auth/register`
- `POST /api/auth/google`
- `GET /health`

### Health Check

```bash
curl http://localhost:3000/health
```

Response:
```json
{
  "status": "UP",
  "timestamp": "2025-01-26T10:00:00.000Z",
  "services": {
    "auth": {
      "status": "UP",
      "stats": {
        "fires": 100,
        "failures": 0,
        "successes": 100
      }
    },
    "fleet": { "status": "UP", "stats": {...} },
    "finance": { "status": "UP", "stats": {...} },
    "analytics": { "status": "UP", "stats": {...} },
    "notification": { "status": "UP", "stats": {...} }
  }
}
```

## Circuit Breaker Behavior

### When a Service Fails

1. **First failure**: Request fails, breaker stays CLOSED
2. **50% failure rate**: Circuit opens (OPEN state)
3. **Subsequent requests**: Fail immediately with fallback message
4. **After 30 seconds**: Circuit enters HALF-OPEN state
5. **Test request succeeds**: Circuit closes (back to normal)
6. **Test request fails**: Circuit reopens for another 30 seconds

### Fallback Response

When circuit is OPEN:
```json
{
  "error": "fleet service is currently unavailable. Please try again later.",
  "fallback": true
}
```

## Architecture Benefits

### Scalability
- Gateway can be horizontally scaled
- Independent of backend services
- Load balancing at gateway level

### Resilience
- Prevents cascading failures
- Fast-fail for unavailable services
- Graceful degradation
- Service health monitoring

### Security
- Centralized authentication
- Rate limiting per IP
- Token validation before routing
- Security headers (Helmet.js)

## Logs

Logs are written to:
- `gateway.log` - All logs
- `gateway-error.log` - Error logs only
- Console output

## Performance

- Sub-millisecond routing overhead
- 3-second timeout per service
- 100 requests per 15 minutes per IP (configurable)
- Efficient circuit breaker with minimal overhead

## Dependencies

- **express**: Web framework
- **http-proxy-middleware**: Request proxying
- **opossum**: Circuit breaker implementation
- **jsonwebtoken**: JWT validation
- **winston**: Logging
- **helmet**: Security headers
- **express-rate-limit**: Rate limiting
- **cors**: CORS middleware

## Error Handling

### 401 Unauthorized
```json
{
  "error": "Access token required"
}
```

### 403 Forbidden
```json
{
  "error": "Invalid or expired token"
}
```

### 404 Not Found
```json
{
  "error": "Route not found",
  "path": "/api/unknown"
}
```

### 429 Too Many Requests
```json
{
  "message": "Too many requests from this IP, please try again later."
}
```

### 503 Service Unavailable (Circuit Open)
```json
{
  "error": "fleet service is currently unavailable",
  "message": "Circuit breaker is open. Please try again later."
}
```

## Testing

### Test Health Endpoint
```bash
curl http://localhost:3000/health
```

### Test Authentication
```bash
# Should fail (no token)
curl http://localhost:3000/api/fleet/trucks

# Should succeed
curl -H "Authorization: Bearer <valid-token>" \
     http://localhost:3000/api/fleet/trucks
```

### Test Rate Limiting
```bash
# Send 101 requests rapidly
for i in {1..101}; do
  curl http://localhost:3000/health
done
# 101st request should be rate limited
```

### Simulate Circuit Breaker
```bash
# Stop a backend service (e.g., Fleet Service on port 3002)
# Make requests to trigger circuit breaker
for i in {1..10}; do
  curl -H "Authorization: Bearer <token>" \
       http://localhost:3000/api/fleet/trucks
done
# Circuit should open after 50% failure rate
```

## Production Deployment

### Docker Compose
```yaml
services:
  api-gateway:
    image: mmt-api-gateway:latest
    ports:
      - "3000:3000"
    environment:
      - JWT_SECRET=${JWT_SECRET}
      - AUTH_SERVICE_URL=http://auth-service:3001
      - FLEET_SERVICE_URL=http://fleet-service:3002
    depends_on:
      - auth-service
      - fleet-service
      - finance-service
```

### Kubernetes
See `kubernetes/deployments/api-gateway-deployment.yaml`

## Monitoring & Observability

- Health checks every 30 seconds
- Circuit breaker event logging
- Request/response logging with Winston
- Service-level metrics in health endpoint

## Future Enhancements

- [ ] Request caching
- [ ] Advanced rate limiting (per user)
- [ ] API versioning support
- [ ] Request/Response transformation
- [ ] Distributed tracing (Jaeger/Zipkin)
- [ ] Metrics export (Prometheus)
- [ ] WebSocket support
- [ ] API key management

---

**Part of MMT Microservices Architecture**
