# MMT Microservices - Kubernetes Deployment

Complete Kubernetes deployment configuration for the MMT (Modern Management for Truckers) microservices application.

## 📋 Overview

This directory contains all the Kubernetes manifests and configurations needed to deploy the MMT microservices platform to any Kubernetes cluster (Minikube, GKE, EKS, AKS, etc.).

## 🚀 Quick Start

**Get up and running in 5 minutes:**

```bash
# 1. Start Minikube (for local development)
minikube start --cpus=4 --memory=8192 --driver=docker

# 2. Build and tag Docker images
eval $(minikube docker-env)
cd microservices && docker-compose build
# Tag images (see QUICKSTART.md for full commands)

# 3. Deploy to Kubernetes
cd .. && chmod +x deploy-kubernetes.sh
./deploy-kubernetes.sh

# 4. Access the API Gateway
kubectl port-forward -n mmt service/api-gateway 5001:5001
```

📚 **For detailed instructions, see [QUICKSTART.md](./QUICKSTART.md)**

## 📁 Directory Structure

```
kubernetes/
├── README.md                          # This file
├── QUICKSTART.md                      # Quick start guide
├── TROUBLESHOOTING.md                 # Troubleshooting guide
├── namespace.yaml                     # Kubernetes namespace
├── configmaps/
│   └── app-config.yaml               # Application configuration
├── secrets/
│   ├── secrets.yaml.example          # Template for secrets
│   └── secrets.yaml                  # Actual secrets (gitignored)
├── storage/
│   └── persistent-volumes.yaml       # PV and PVC for databases
├── deployments/
│   ├── infrastructure.yaml           # MongoDB & RabbitMQ
│   └── api-gateway-deployment.yaml   # All microservices
├── services/
│   └── services.yaml                 # Kubernetes services
└── autoscaling/
    └── hpa.yaml                      # HorizontalPodAutoscaler configs
```

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Kubernetes Cluster                       │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Namespace: mmt                          │   │
│  │                                                      │   │
│  │  ┌──────────────┐                                   │   │
│  │  │ API Gateway  │◄─── NodePort 30000               │   │
│  │  │   (5001)     │                                   │   │
│  │  └──────┬───────┘                                   │   │
│  │         │                                           │   │
│  │    ┌────┴──────────────────────┐                   │   │
│  │    │                           │                   │   │
│  │  ┌─▼──────┐  ┌────────┐  ┌────▼────┐  ┌─────────┐ │   │
│  │  │ Auth   │  │ Fleet  │  │ Finance │  │Analytics│ │   │
│  │  │(3001)  │  │(3002)  │  │ (3003)  │  │ (3004)  │ │   │
│  │  └────┬───┘  └───┬────┘  └────┬────┘  └────┬────┘ │   │
│  │       │          │            │             │      │   │
│  │       └──────────┴────────────┴─────────────┘      │   │
│  │                     │                              │   │
│  │            ┌────────▼────────┐                     │   │
│  │            │  Notification   │                     │   │
│  │            │    (3005)       │                     │   │
│  │            └────────┬────────┘                     │   │
│  │                     │                              │   │
│  │       ┌─────────────┴─────────────┐               │   │
│  │       │                           │               │   │
│  │  ┌────▼────────┐        ┌─────────▼────────┐     │   │
│  │  │  MongoDB    │        │    RabbitMQ      │     │   │
│  │  │  (27017)    │        │  (5672/15672)    │     │   │
│  │  │ Persistent  │        │   Persistent     │     │   │
│  │  └─────────────┘        └──────────────────┘     │   │
│  │                                                   │   │
│  └───────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────┘
```

## 🎯 Features

### ✅ What's Included

- **Complete Microservices Stack**
  - API Gateway (port 5001)
  - Auth Service (port 3001)
  - Fleet Service (port 3002 + gRPC 50051)
  - Finance Service (port 3003)
  - Analytics Service (port 3004 + gRPC 50052)
  - Notification Service (port 3005)

- **Infrastructure**
  - MongoDB 7.0 with persistent storage
  - RabbitMQ 3.12 with management UI
  - Persistent volumes for data

- **Production-Ready Features**
  - Health checks (liveness & readiness probes)
  - Resource limits and requests
  - Horizontal Pod Autoscaling (HPA)
  - ConfigMaps for configuration
  - Secrets management
  - Rolling updates
  - Service discovery

- **High Availability**
  - 2 replicas per service (default)
  - Auto-scaling based on CPU/Memory
  - Circuit breakers for resilience

## 📦 Components

### Services

| Service | Port | Replicas | Features |
|---------|------|----------|----------|
| API Gateway | 5001 | 2-10 | REST API, Circuit Breakers |
| Auth Service | 3001 | 2-8 | JWT Auth, Google OAuth |
| Fleet Service | 3002 | 2-8 | REST + gRPC (50051) |
| Finance Service | 3003 | 2-8 | GraphQL, REST |
| Analytics Service | 3004 | 2-8 | REST + gRPC (50052) |
| Notification Service | 3005 | 2-8 | RabbitMQ Consumer |
| MongoDB | 27017 | 1 | Persistent Storage |
| RabbitMQ | 5672, 15672 | 1 | Message Queue |

### Resource Allocation

**Per Service Pod:**
- Requests: 256Mi memory, 250m CPU
- Limits: 512Mi memory, 500m CPU

**Infrastructure:**
- MongoDB: 512Mi-1Gi memory, 500m-1000m CPU
- RabbitMQ: 512Mi-1Gi memory, 250m-500m CPU

## 🔧 Configuration

### Environment Variables

Managed via ConfigMap (`configmaps/app-config.yaml`):
- Service URLs
- Port configurations
- Node environment
- JWT expiry settings

### Secrets

Managed via Kubernetes Secrets (`secrets/secrets.yaml`):
- JWT secret key
- MongoDB credentials
- RabbitMQ credentials
- Google OAuth credentials
- Database connection strings

**⚠️ Important:** Never commit `secrets.yaml` to git!

## 📖 Documentation

- **[QUICKSTART.md](./QUICKSTART.md)** - Get started in 5 minutes
- **[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)** - Comprehensive troubleshooting guide
- **[../DEPLOYMENT_GUIDE.md](../DEPLOYMENT_GUIDE.md)** - General deployment guide
- **[../GCP_DEPLOYMENT_GUIDE.md](../GCP_DEPLOYMENT_GUIDE.md)** - Google Cloud specific guide

## 🛠️ Common Operations

### View Status

```bash
# All resources
kubectl get all -n mmt

# Pods
kubectl get pods -n mmt -o wide

# Services
kubectl get services -n mmt

# HPA status
kubectl get hpa -n mmt
```

### View Logs

```bash
# Specific service
kubectl logs -f deployment/api-gateway -n mmt

# All pods of a service
kubectl logs -f deployment/api-gateway --all-containers -n mmt

# Previous logs (crashed container)
kubectl logs <pod-name> -n mmt --previous
```

### Scale Services

```bash
# Manual scaling
kubectl scale deployment api-gateway --replicas=5 -n mmt

# Check HPA
kubectl get hpa -n mmt
```

### Restart Services

```bash
# Restart specific service
kubectl rollout restart deployment/api-gateway -n mmt

# Restart all services
kubectl rollout restart deployment -n mmt
```

### Access Services

```bash
# Port forward (recommended for local access)
kubectl port-forward -n mmt service/api-gateway 5001:5001

# Minikube service (auto-open browser)
minikube service api-gateway -n mmt

# Get service URL
minikube service api-gateway -n mmt --url
```

## 🔍 Monitoring

### Check Pod Health

```bash
# Resource usage
kubectl top pods -n mmt
kubectl top nodes

# Describe pod
kubectl describe pod <pod-name> -n mmt

# Events
kubectl get events -n mmt --sort-by='.lastTimestamp'
```

### Debug Issues

```bash
# Execute commands in pod
kubectl exec -it <pod-name> -n mmt -- sh

# Test connectivity
kubectl exec deployment/api-gateway -n mmt -- curl http://auth-service:3001/health
```

## 🧹 Cleanup

```bash
# Delete all resources
kubectl delete namespace mmt

# Stop Minikube
minikube stop

# Delete Minikube cluster
minikube delete
```

## 🚀 Production Deployment

For production deployments:

1. **Use proper secrets**
   ```bash
   # Generate strong secrets
   openssl rand -base64 32
   ```

2. **Configure persistent storage**
   - Use cloud provider storage classes (gp2, pd-standard, etc.)
   - Set up backup solutions

3. **Set up Ingress**
   ```bash
   # Install ingress controller
   kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.8.1/deploy/static/provider/cloud/deploy.yaml
   ```

4. **Enable monitoring**
   - Deploy Prometheus + Grafana
   - Configure log aggregation
   - Set up alerts

5. **Configure SSL/TLS**
   - Use cert-manager for automatic certificates
   - Configure HTTPS

## 📊 Performance Tuning

### Autoscaling Configuration

Edit `autoscaling/hpa.yaml`:
```yaml
spec:
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70  # Adjust based on needs
```

### Resource Limits

Edit deployments to adjust resources:
```yaml
resources:
  requests:
    memory: "256Mi"
    cpu: "250m"
  limits:
    memory: "512Mi"
    cpu: "500m"
```

## 🔐 Security Best Practices

1. **Use RBAC** - Enable role-based access control
2. **Network Policies** - Restrict pod-to-pod communication
3. **Pod Security Policies** - Enforce security standards
4. **Scan Images** - Use tools like Trivy or Snyk
5. **Rotate Secrets** - Regularly update credentials
6. **Use Private Registry** - For production images

## 🆘 Getting Help

1. **Check logs**: `kubectl logs -f deployment/<service> -n mmt`
2. **Check events**: `kubectl get events -n mmt`
3. **Read troubleshooting guide**: [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
4. **Describe resources**: `kubectl describe pod <pod-name> -n mmt`

## 📝 Notes

- **Port mismatch**: API Gateway uses port 5001 internally (matching Docker), but service is exposed on port 5001
- **Image pull policy**: Set to `Never` for local development with Minikube
- **Persistent volumes**: Use `hostPath` for local development, cloud storage for production
- **Autoscaling**: Requires metrics-server addon in Minikube

## 🔄 Updates and Maintenance

### Update Images

```bash
# Rebuild images
eval $(minikube docker-env)
cd microservices && docker-compose build

# Tag for Kubernetes
docker tag microservices-api-gateway:latest mmt-api-gateway:v2.1.0

# Load into Minikube
minikube image load mmt-api-gateway:v2.1.0

# Restart deployment
kubectl rollout restart deployment/api-gateway -n mmt
```

### Update Configuration

```bash
# Edit ConfigMap
kubectl edit configmap app-config -n mmt

# Or apply changes
kubectl apply -f configmaps/app-config.yaml

# Restart affected services
kubectl rollout restart deployment -n mmt
```

## 📚 Additional Resources

- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [kubectl Cheat Sheet](https://kubernetes.io/docs/reference/kubectl/cheatsheet/)
- [Minikube Documentation](https://minikube.sigs.k8s.io/docs/)
- [Kubernetes Best Practices](https://kubernetes.io/docs/concepts/configuration/overview/)

---

**Status**: ✅ Production Ready
**Last Updated**: November 2025
**Tested On**: Minikube v1.32+, Kubernetes v1.28+

For questions or issues, please refer to the [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) guide.
