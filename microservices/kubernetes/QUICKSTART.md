# Kubernetes Quick Start Guide

Get your MMT Microservices running on Kubernetes in minutes!

## Prerequisites

- **kubectl** - Kubernetes command-line tool ([Install](https://kubernetes.io/docs/tasks/tools/))
- **Docker** - For building images ([Install](https://docs.docker.com/get-docker/))
- **Minikube** (recommended for local development) - ([Install](https://minikube.sigs.k8s.io/docs/start/))

OR

- Access to a Kubernetes cluster (GKE, EKS, AKS, etc.)

## Quick Start (5 minutes)

### Step 1: Start Kubernetes Cluster

```bash
# Using Minikube (local development)
minikube start --cpus=4 --memory=8192 --driver=docker

# Enable metrics server for autoscaling
minikube addons enable metrics-server
```

### Step 2: Build Docker Images

```bash
# Point Docker to Minikube's Docker daemon (for Minikube only)
eval $(minikube docker-env)

# Build all images
cd microservices
docker-compose build

# Tag images for Kubernetes
docker tag microservices-api-gateway:latest mmt-api-gateway:v2.1.0
docker tag microservices-auth-service:latest mmt-auth-service:1.0.0
docker tag microservices-fleet-service:latest mmt-fleet-service:v2.1.0
docker tag microservices-finance-service:latest mmt-finance-service:1.0.0
docker tag microservices-analytics-service:latest mmt-analytics-service:1.0.0
docker tag microservices-notification-service:latest mmt-notification-service:v2.1.0

cd ..
```

### Step 3: Configure Secrets

```bash
# Copy and edit secrets file
cd microservices/kubernetes
cp secrets/secrets.yaml.example secrets/secrets.yaml

# Edit secrets.yaml with your actual values (for production)
# For testing, you can use the default values
```

### Step 4: Deploy!

```bash
# Run the deployment script
cd ../..  # Return to project root
chmod +x deploy-kubernetes.sh
./deploy-kubernetes.sh
```

That's it! The script will:
- Create the namespace
- Apply secrets and ConfigMaps
- Set up persistent volumes
- Deploy MongoDB and RabbitMQ
- Deploy all microservices
- Configure autoscaling
- Show you how to access the services

### Step 5: Access Your Application

```bash
# Option 1: Port Forwarding (Recommended)
kubectl port-forward -n mmt service/api-gateway 5001:5001

# Now access: http://localhost:5001

# Option 2: Minikube Service (opens in browser)
minikube service api-gateway -n mmt

# Option 3: Get Minikube IP and NodePort
minikube ip  # Get IP
kubectl get service api-gateway -n mmt  # Get NodePort
# Access: http://<MINIKUBE_IP>:<NODE_PORT>
```

## Verify Deployment

```bash
# Check all pods are running
kubectl get pods -n mmt

# Check services
kubectl get services -n mmt

# View deployment status
kubectl get deployments -n mmt

# Check autoscaling
kubectl get hpa -n mmt
```

Expected output: All pods should be in `Running` state with `READY` showing `1/1` or `2/2`.

## Common Commands

### Viewing Logs

```bash
# View API Gateway logs
kubectl logs -f deployment/api-gateway -n mmt

# View specific service logs
kubectl logs -f deployment/auth-service -n mmt
kubectl logs -f deployment/fleet-service -n mmt
```

### Scaling

```bash
# Manual scaling
kubectl scale deployment api-gateway --replicas=5 -n mmt

# Check HPA status
kubectl get hpa -n mmt
```

### Restarting Services

```bash
# Restart a specific service
kubectl rollout restart deployment/api-gateway -n mmt

# Restart all services
kubectl rollout restart deployment -n mmt
```

### Cleanup

```bash
# Delete everything
kubectl delete namespace mmt

# Or stop Minikube
minikube stop
minikube delete
```

## Testing the Deployment

### 1. Test API Gateway Health

```bash
# Using port-forward
kubectl port-forward -n mmt service/api-gateway 5001:5001

# In another terminal
curl http://localhost:5001/health
```

### 2. Test Service Connectivity

```bash
# Create a test pod
kubectl run test --rm -it --image=curlimages/curl -n mmt -- sh

# Inside the pod, test services
curl http://api-gateway:5001/health
curl http://auth-service:3001/health
curl http://fleet-service:3002/health
curl http://finance-service:3003/health
curl http://analytics-service:3004/health
curl http://notification-service:3005/health

exit
```

### 3. Test Database Connection

```bash
# Check MongoDB
kubectl exec -it deployment/mongodb -n mmt -- mongosh -u admin -p password

# Inside MongoDB shell
show dbs
exit
```

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Kubernetes Cluster                       │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                  Namespace: mmt                     │    │
│  │                                                     │    │
│  │  ┌──────────────┐      ┌─────────────────────┐    │    │
│  │  │ API Gateway  │◄─────┤  External Access    │    │    │
│  │  │ (NodePort)   │      │  Port: 30000        │    │    │
│  │  └──────┬───────┘      └─────────────────────┘    │    │
│  │         │                                          │    │
│  │    ┌────┴────────────────────────┐                │    │
│  │    │                             │                │    │
│  │  ┌─▼──────┐  ┌────────┐  ┌──────▼─┐  ┌─────────┐ │    │
│  │  │ Auth   │  │ Fleet  │  │Finance │  │Analytics│ │    │
│  │  │Service │  │Service │  │Service │  │ Service │ │    │
│  │  └────┬───┘  └───┬────┘  └───┬────┘  └────┬────┘ │    │
│  │       │          │           │            │      │    │
│  │  ┌────▼──────────▼───────────▼────────────▼────┐ │    │
│  │  │          Notification Service               │ │    │
│  │  └─────────────────┬──────────────────────────┘ │    │
│  │                    │                             │    │
│  │  ┌─────────────────▼────────┐  ┌──────────────┐ │    │
│  │  │       MongoDB            │  │  RabbitMQ    │ │    │
│  │  │  (Persistent Storage)    │  │(Persistent)  │ │    │
│  │  └──────────────────────────┘  └──────────────┘ │    │
│  │                                                  │    │
│  └──────────────────────────────────────────────────┘    │
│                                                           │
└───────────────────────────────────────────────────────────┘
```

## Production Considerations

When deploying to production:

1. **Secrets Management**
   - Use proper secrets, not the example values
   - Consider using external secret managers (Vault, AWS Secrets Manager, etc.)

2. **Storage**
   - Replace `hostPath` volumes with cloud provider storage (EBS, GCE PD, etc.)
   - Configure backup solutions for MongoDB

3. **Networking**
   - Use LoadBalancer or Ingress instead of NodePort
   - Configure SSL/TLS certificates
   - Set up proper DNS

4. **Monitoring**
   - Deploy Prometheus and Grafana
   - Set up log aggregation (ELK stack, Loki, etc.)
   - Configure alerts

5. **Security**
   - Enable RBAC
   - Use Network Policies
   - Scan images for vulnerabilities
   - Implement pod security policies

## Troubleshooting

If something goes wrong:

1. **Check pod status**
   ```bash
   kubectl get pods -n mmt -o wide
   ```

2. **View logs**
   ```bash
   kubectl logs <pod-name> -n mmt
   ```

3. **Describe pod for events**
   ```bash
   kubectl describe pod <pod-name> -n mmt
   ```

4. **Check events**
   ```bash
   kubectl get events -n mmt --sort-by='.lastTimestamp'
   ```

For detailed troubleshooting, see [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)

## Next Steps

1. **Configure Frontend**: Update frontend to point to your Kubernetes API Gateway
2. **Set up Monitoring**: Deploy monitoring stack (Prometheus, Grafana)
3. **Configure Ingress**: Set up Ingress controller for better routing
4. **Enable CI/CD**: Automate deployments with GitHub Actions or Jenkins
5. **Implement Backup**: Set up backup solutions for databases

## Resources

- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [kubectl Cheat Sheet](https://kubernetes.io/docs/reference/kubectl/cheatsheet/)
- [Minikube Documentation](https://minikube.sigs.k8s.io/docs/)
- [Project README](../README.md)
- [Troubleshooting Guide](./TROUBLESHOOTING.md)

## Getting Help

- Check the [Troubleshooting Guide](./TROUBLESHOOTING.md)
- Review logs: `kubectl logs -f deployment/<service-name> -n mmt`
- Check events: `kubectl get events -n mmt`
- Create an issue on GitHub

---

Happy Deploying! 🚀
