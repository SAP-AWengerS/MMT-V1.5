# Kubernetes Deployment Troubleshooting Guide

This guide helps you diagnose and fix common issues with the MMT Microservices Kubernetes deployment.

## Table of Contents

1. [Quick Diagnostics](#quick-diagnostics)
2. [Common Issues](#common-issues)
3. [Pod-Specific Issues](#pod-specific-issues)
4. [Network Issues](#network-issues)
5. [Database Issues](#database-issues)
6. [Performance Issues](#performance-issues)
7. [Helpful Commands](#helpful-commands)

---

## Quick Diagnostics

Run these commands first to get an overview of your deployment:

```bash
# Check all resources in mmt namespace
kubectl get all -n mmt

# Check pod status
kubectl get pods -n mmt -o wide

# Check recent events
kubectl get events -n mmt --sort-by='.lastTimestamp' | tail -20

# Check if services are exposed correctly
kubectl get services -n mmt
```

---

## Common Issues

### 1. Pods Not Starting (Pending State)

**Symptoms:**
- Pods stuck in `Pending` state
- No containers are running

**Diagnosis:**
```bash
kubectl describe pod <pod-name> -n mmt
kubectl get events -n mmt --field-selector involvedObject.name=<pod-name>
```

**Common Causes & Solutions:**

#### Insufficient Resources
```bash
# Check node resources
kubectl describe nodes | grep -A 5 "Allocated resources"

# Solution: Reduce resource requests or add more nodes
kubectl scale deployment <deployment-name> --replicas=1 -n mmt
```

#### Image Pull Errors
```bash
# Check if imagePullPolicy is correct
kubectl get deployment <deployment-name> -n mmt -o yaml | grep imagePullPolicy

# For local development with Minikube
eval $(minikube docker-env)
docker images | grep mmt

# Solution: Build images in Minikube's Docker environment
cd microservices
docker build -t mmt-api-gateway:v2.1.0 ./api-gateway
docker build -t mmt-auth-service:1.0.0 ./auth-service
# ... build other services
```

#### Persistent Volume Issues
```bash
# Check PV and PVC status
kubectl get pv
kubectl get pvc -n mmt

# Solution: Ensure directories exist for hostPath volumes
minikube ssh
sudo mkdir -p /mnt/data/mongodb /mnt/data/rabbitmq
sudo chmod 777 /mnt/data/mongodb /mnt/data/rabbitmq
exit
```

### 2. Pods Crashing (CrashLoopBackOff)

**Symptoms:**
- Pods repeatedly restarting
- Status shows `CrashLoopBackOff` or `Error`

**Diagnosis:**
```bash
# View logs from crashed pod
kubectl logs <pod-name> -n mmt --previous

# View current logs
kubectl logs -f <pod-name> -n mmt

# Describe pod for restart count and events
kubectl describe pod <pod-name> -n mmt
```

**Common Causes & Solutions:**

#### Missing or Invalid Secrets
```bash
# Check if secrets exist
kubectl get secrets -n mmt

# Verify secret contents (base64 encoded)
kubectl get secret mmt-secrets -n mmt -o yaml

# Solution: Create/update secrets
cd microservices/kubernetes
cp secrets/secrets.yaml.example secrets/secrets.yaml
# Edit secrets.yaml with correct values
kubectl apply -f secrets/
```

#### Database Connection Issues
```bash
# Check if MongoDB is running
kubectl get pods -n mmt -l app=mongodb

# Test connection from a pod
kubectl exec -it <service-pod-name> -n mmt -- sh
# Inside pod:
nc -zv mongodb 27017
curl http://mongodb:27017
exit

# Solution: Wait for MongoDB to be ready
kubectl wait --for=condition=ready pod -l app=mongodb -n mmt --timeout=300s
```

#### Missing ConfigMap
```bash
# Check if ConfigMap exists
kubectl get configmap -n mmt

# Solution: Apply ConfigMaps
kubectl apply -f microservices/kubernetes/configmaps/
```

### 3. Service Not Accessible

**Symptoms:**
- Cannot access API Gateway
- Connection timeout or refused

**Diagnosis:**
```bash
# Check service endpoints
kubectl get endpoints -n mmt

# Check service details
kubectl describe service api-gateway -n mmt

# Test internal connectivity
kubectl run test-pod --rm -it --image=busybox -n mmt -- sh
# Inside pod:
wget -O- http://api-gateway:5001/health
exit
```

**Solutions:**

#### Port Forwarding Not Working
```bash
# Kill existing port-forward processes
pkill -f "port-forward"

# Start new port-forward
kubectl port-forward -n mmt service/api-gateway 5001:5001
```

#### Minikube Access Issues
```bash
# Get Minikube IP
minikube ip

# Get NodePort
kubectl get service api-gateway -n mmt -o jsonpath='{.spec.ports[0].nodePort}'

# Access via: http://<MINIKUBE_IP>:<NODE_PORT>

# Alternative: Use minikube service
minikube service api-gateway -n mmt

# Or create tunnel
minikube tunnel  # Run in separate terminal
```

---

## Pod-Specific Issues

### API Gateway Issues

```bash
# Check logs
kubectl logs -f deployment/api-gateway -n mmt

# Common issues:
# - Cannot connect to backend services
# - JWT secret not configured

# Verify service URLs
kubectl exec deployment/api-gateway -n mmt -- env | grep SERVICE_URL
```

### Auth Service Issues

```bash
# Check logs
kubectl logs -f deployment/auth-service -n mmt

# Test MongoDB connection
kubectl exec deployment/auth-service -n mmt -- sh -c "nc -zv mongodb 27017"

# Verify database name
kubectl exec deployment/auth-service -n mmt -- env | grep MONGODB_URI
```

### Fleet/Finance/Analytics Service Issues

```bash
# Check gRPC connectivity (for fleet and analytics)
kubectl exec deployment/analytics-service -n mmt -- sh -c "nc -zv fleet-service 50051"

# Verify environment variables
kubectl exec deployment/fleet-service -n mmt -- env | grep PORT
```

### Notification Service Issues

```bash
# Check RabbitMQ connection
kubectl exec deployment/notification-service -n mmt -- sh -c "nc -zv rabbitmq 5672"

# View RabbitMQ logs
kubectl logs -f deployment/rabbitmq -n mmt

# Access RabbitMQ Management UI
kubectl port-forward -n mmt service/rabbitmq 15672:15672
# Open http://localhost:15672 (admin/password)
```

---

## Network Issues

### DNS Resolution Problems

```bash
# Test DNS resolution
kubectl run -it --rm debug --image=busybox --restart=Never -n mmt -- nslookup api-gateway

# Check CoreDNS
kubectl get pods -n kube-system -l k8s-app=kube-dns
kubectl logs -n kube-system -l k8s-app=kube-dns
```

### Inter-Service Communication

```bash
# Test from one service to another
kubectl exec deployment/api-gateway -n mmt -- curl -v http://auth-service:3001/health

# Check service selector matches pod labels
kubectl get service auth-service -n mmt -o yaml | grep selector
kubectl get pods -n mmt -l app=auth-service --show-labels
```

---

## Database Issues

### MongoDB Not Starting

```bash
# Check MongoDB logs
kubectl logs -f deployment/mongodb -n mmt

# Check storage
kubectl get pvc -n mmt
kubectl describe pvc mongodb-pvc -n mmt

# If using local storage, ensure directory exists
minikube ssh "sudo mkdir -p /mnt/data/mongodb && sudo chmod 777 /mnt/data/mongodb"

# Restart MongoDB
kubectl rollout restart deployment/mongodb -n mmt
```

### RabbitMQ Connection Issues

```bash
# Check RabbitMQ status
kubectl logs -f deployment/rabbitmq -n mmt

# Verify credentials
kubectl get secret rabbitmq-secret -n mmt -o yaml

# Test connection
kubectl exec deployment/notification-service -n mmt -- sh -c "nc -zv rabbitmq 5672"
```

---

## Performance Issues

### High CPU/Memory Usage

```bash
# Check resource usage
kubectl top pods -n mmt
kubectl top nodes

# Check HPA status
kubectl get hpa -n mmt
kubectl describe hpa api-gateway-hpa -n mmt

# Scale manually if needed
kubectl scale deployment api-gateway --replicas=5 -n mmt
```

### Slow Response Times

```bash
# Check pod readiness
kubectl get pods -n mmt

# Review pod logs for performance issues
kubectl logs -f deployment/api-gateway -n mmt

# Check resource limits
kubectl describe deployment api-gateway -n mmt | grep -A 5 resources
```

---

## Helpful Commands

### Viewing Logs

```bash
# Follow logs from a deployment
kubectl logs -f deployment/<deployment-name> -n mmt

# View logs from all pods of a deployment
kubectl logs -f deployment/<deployment-name> --all-containers=true -n mmt

# View previous logs (from crashed container)
kubectl logs <pod-name> -n mmt --previous

# View logs with timestamps
kubectl logs <pod-name> -n mmt --timestamps

# Tail last 100 lines
kubectl logs <pod-name> -n mmt --tail=100
```

### Debugging Pods

```bash
# Execute command in pod
kubectl exec -it <pod-name> -n mmt -- sh

# Execute single command
kubectl exec <pod-name> -n mmt -- env

# Copy files from pod
kubectl cp <pod-name>:/path/to/file ./local-file -n mmt

# Create debug pod
kubectl run debug -it --rm --image=busybox -n mmt -- sh
```

### Resource Management

```bash
# View resource usage
kubectl top pods -n mmt
kubectl top nodes

# Scale deployments
kubectl scale deployment <name> --replicas=3 -n mmt

# Restart deployment
kubectl rollout restart deployment/<name> -n mmt

# Check rollout status
kubectl rollout status deployment/<name> -n mmt

# View rollout history
kubectl rollout history deployment/<name> -n mmt
```

### Cleanup and Reset

```bash
# Delete all resources in namespace
kubectl delete namespace mmt

# Or delete specific resources
kubectl delete deployment --all -n mmt
kubectl delete service --all -n mmt
kubectl delete pvc --all -n mmt

# Restart Minikube (if needed)
minikube delete
minikube start --cpus=4 --memory=8192
```

---

## Getting Additional Help

### Collect Diagnostic Information

```bash
# Create a diagnostic report
kubectl get all -n mmt > diagnostic-report.txt
kubectl describe pods -n mmt >> diagnostic-report.txt
kubectl get events -n mmt --sort-by='.lastTimestamp' >> diagnostic-report.txt
kubectl logs deployment/api-gateway -n mmt >> diagnostic-report.txt
```

### Enable Verbose Logging

Add to deployment environment variables:
```yaml
env:
- name: LOG_LEVEL
  value: "debug"
- name: DEBUG
  value: "*"
```

Then restart the deployment:
```bash
kubectl rollout restart deployment/<name> -n mmt
```

---

## Best Practices

1. **Always check logs first** - Most issues reveal themselves in logs
2. **Use `describe` command** - Provides detailed information about resources
3. **Check events** - Events show what Kubernetes is doing
4. **Verify connectivity** - Test network connections between services
5. **Monitor resources** - Watch CPU and memory usage
6. **Start simple** - Deploy one service at a time to isolate issues
7. **Use labels** - They make it easier to find and manage resources

---

## Emergency Recovery

If everything is broken:

```bash
# Complete reset
kubectl delete namespace mmt
minikube delete
minikube start --cpus=4 --memory=8192

# Rebuild images
eval $(minikube docker-env)
cd microservices
docker-compose build

# Tag images for Kubernetes
docker tag microservices-api-gateway:latest mmt-api-gateway:v2.1.0
docker tag microservices-auth-service:latest mmt-auth-service:1.0.0
docker tag microservices-fleet-service:latest mmt-fleet-service:v2.1.0
docker tag microservices-finance-service:latest mmt-finance-service:1.0.0
docker tag microservices-analytics-service:latest mmt-analytics-service:1.0.0
docker tag microservices-notification-service:latest mmt-notification-service:v2.1.0

# Redeploy
./deploy-kubernetes.sh
```

---

For more help, check:
- Kubernetes documentation: https://kubernetes.io/docs/
- kubectl cheat sheet: https://kubernetes.io/docs/reference/kubectl/cheatsheet/
- Project README: ../README.md
