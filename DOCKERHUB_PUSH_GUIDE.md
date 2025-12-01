# Docker Hub Push Guide

## Overview

This guide explains how to build and push all MMT microservices Docker images to Docker Hub using the automated script.

## Prerequisites

1. **Docker installed and running**
   ```bash
   docker --version
   ```

2. **Docker Hub account**
   - Create an account at https://hub.docker.com if you don't have one

3. **Docker Hub login**
   ```bash
   docker login
   ```
   Enter your Docker Hub username and password when prompted.

## Quick Start

### Basic Usage (Latest Tag)

```bash
./push-to-dockerhub.sh <your-dockerhub-username>
```

Example:
```bash
./push-to-dockerhub.sh johndoe
```

This will build and push all images with the `latest` tag.

### With Version Tag

```bash
./push-to-dockerhub.sh <your-dockerhub-username> <version-tag>
```

Example:
```bash
./push-to-dockerhub.sh johndoe v1.0.0
```

This will push images with both the specified version tag AND the `latest` tag.

## What Gets Pushed

The script will build and push the following 6 microservice images:

1. **mmt-api-gateway** - API Gateway service
2. **mmt-auth-service** - Authentication service
3. **mmt-fleet-service** - Fleet management service (REST + gRPC)
4. **mmt-finance-service** - Finance management service (GraphQL)
5. **mmt-analytics-service** - Analytics service (gRPC)
6. **mmt-notification-service** - Notification service (RabbitMQ consumer)

### Image Naming Convention

Images will be named as:
```
<dockerhub-username>/mmt-<service-name>:<tag>
```

Examples:
- `johndoe/mmt-auth-service:latest`
- `johndoe/mmt-auth-service:v1.0.0`
- `johndoe/mmt-fleet-service:latest`
- `johndoe/mmt-fleet-service:v1.0.0`

## Step-by-Step Process

### Step 1: Login to Docker Hub

```bash
docker login
```

Enter your credentials when prompted.

### Step 2: Run the Push Script

For production release:
```bash
./push-to-dockerhub.sh <username> v1.0.0
```

For development/testing:
```bash
./push-to-dockerhub.sh <username> dev
```

For latest:
```bash
./push-to-dockerhub.sh <username>
```

### Step 3: Monitor the Build Process

The script will:
1. ✓ Check Docker installation
2. ✓ Verify Docker Hub authentication
3. ✓ Build each microservice image
4. ✓ Tag images appropriately
5. ✓ Push images to Docker Hub
6. ✓ Display summary of successful/failed operations

### Step 4: Verify on Docker Hub

Visit your Docker Hub repositories:
```
https://hub.docker.com/u/<your-username>
```

You should see all 6 repositories created.

## Script Features

### ✅ Automated Building
- Builds all 6 microservices automatically
- Uses multi-stage builds where applicable
- Optimized layer caching

### ✅ Smart Tagging
- Tags images with specified version
- Also tags with `latest` (when version ≠ latest)
- Supports semantic versioning (v1.0.0, v2.1.3, etc.)

### ✅ Error Handling
- Continues if one service fails
- Reports failed services at the end
- Non-zero exit code on failures

### ✅ Progress Reporting
- Colorful console output
- Real-time progress updates
- Detailed summary at completion

### ✅ Authentication Check
- Verifies Docker Hub login
- Prompts for login if needed
- Validates credentials before proceeding

## Common Use Cases

### 1. Initial Push to Docker Hub

```bash
# First time pushing
./push-to-dockerhub.sh myusername v1.0.0
```

### 2. Update After Code Changes

```bash
# Increment version
./push-to-dockerhub.sh myusername v1.0.1
```

### 3. Development Builds

```bash
# Use dev tag for testing
./push-to-dockerhub.sh myusername dev
```

### 4. Release Candidate

```bash
# Tag as release candidate
./push-to-dockerhub.sh myusername v2.0.0-rc1
```

### 5. Latest Production Build

```bash
# Update latest tag
./push-to-dockerhub.sh myusername latest
```

## Using Pushed Images

### In docker-compose.yml

After pushing, update your `docker-compose.yml`:

```yaml
services:
  auth-service:
    image: <username>/mmt-auth-service:v1.0.0
    # ... rest of config

  fleet-service:
    image: <username>/mmt-fleet-service:v1.0.0
    # ... rest of config
```

### In Kubernetes Deployments

Update deployment YAML files:

```yaml
spec:
  containers:
  - name: auth-service
    image: <username>/mmt-auth-service:v1.0.0
```

### Pull and Run Locally

```bash
# Pull specific image
docker pull <username>/mmt-auth-service:v1.0.0

# Run container
docker run -d -p 3001:3001 <username>/mmt-auth-service:v1.0.0
```

## Troubleshooting

### Issue: "Error: Docker Hub username is required"

**Solution:** Provide username as first argument:
```bash
./push-to-dockerhub.sh myusername
```

### Issue: "Docker is not installed"

**Solution:** Install Docker Desktop:
- **macOS:** https://docs.docker.com/desktop/install/mac-install/
- **Linux:** https://docs.docker.com/engine/install/
- **Windows:** https://docs.docker.com/desktop/install/windows-install/

### Issue: "Not logged in to Docker Hub"

**Solution:** Login first:
```bash
docker login
```

### Issue: "Failed to push image"

**Possible causes:**
1. Network connectivity issues
2. Docker Hub account not verified
3. Repository doesn't exist (will be auto-created on first push)
4. Rate limit exceeded (Docker Hub has rate limits)

**Solution:**
- Check network connection
- Verify email on Docker Hub account
- Wait a few minutes and retry
- Consider Docker Hub Pro for higher limits

### Issue: "Dockerfile not found"

**Solution:** Ensure you're running the script from the project root directory:
```bash
cd /path/to/mmt-v1.5
./push-to-dockerhub.sh myusername
```

### Issue: Build fails for specific service

**Solution:**
1. Check the service's Dockerfile for errors
2. Ensure all dependencies are properly defined
3. Try building manually to see detailed error:
   ```bash
   cd microservices/<service-name>
   docker build -t test .
   ```

## Best Practices

### 1. Version Tagging
- Use semantic versioning (v1.0.0, v1.2.3)
- Tag releases with specific versions
- Keep `latest` tag for most recent stable version

### 2. Build Frequency
- Don't push on every commit
- Push after successful testing
- Use CI/CD for automated pushes

### 3. Image Size
- Images are optimized with multi-stage builds
- Use `node:18-alpine` base images
- Production dependencies only

### 4. Security
- Never commit Docker Hub credentials
- Use access tokens instead of password
- Enable 2FA on Docker Hub account
- Scan images for vulnerabilities:
  ```bash
  docker scan <username>/mmt-auth-service:v1.0.0
  ```

### 5. Documentation
- Document which version is in production
- Keep changelog of image versions
- Tag commits with corresponding image versions

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Build and Push to Docker Hub

on:
  push:
    tags:
      - 'v*'

jobs:
  push:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2

      - name: Login to Docker Hub
        uses: docker/login-action@v1
        with:
          username: ${{ secrets.DOCKERHUB_USERNAME }}
          password: ${{ secrets.DOCKERHUB_TOKEN }}

      - name: Build and Push
        run: |
          ./push-to-dockerhub.sh ${{ secrets.DOCKERHUB_USERNAME }} ${GITHUB_REF#refs/tags/}
```

## Advanced Usage

### Building Single Service

If you need to build just one service:

```bash
cd microservices/<service-name>
docker build -t <username>/mmt-<service-name>:v1.0.0 .
docker push <username>/mmt-<service-name>:v1.0.0
```

### Custom Registry (Not Docker Hub)

To push to a different registry, modify the script's `IMAGE_NAME` variable:

```bash
# Instead of: IMAGE_NAME="${DOCKERHUB_USERNAME}/mmt-${SERVICE}"
# Use: IMAGE_NAME="myregistry.com/${DOCKERHUB_USERNAME}/mmt-${SERVICE}"
```

### Multi-Architecture Builds

For ARM and x86 support:

```bash
docker buildx create --use
docker buildx build --platform linux/amd64,linux/arm64 \
  -t <username>/mmt-auth-service:v1.0.0 \
  --push microservices/auth-service
```

## Repository Management

### Making Repositories Public

By default, repositories are public. To make them private:
1. Go to Docker Hub
2. Navigate to your repository
3. Settings → Make Private

### Repository Descriptions

Add descriptions on Docker Hub:
1. Go to repository page
2. Edit → Description
3. Add comprehensive README

### Webhooks

Set up webhooks for automatic deployments:
1. Repository → Webhooks
2. Add webhook URL
3. Configure trigger events

## Summary

The `push-to-dockerhub.sh` script automates the entire process of building and pushing all MMT microservices to Docker Hub. Simply provide your Docker Hub username and optional version tag, and the script handles everything else.

For questions or issues, refer to the troubleshooting section or check the Docker Hub documentation at https://docs.docker.com/docker-hub/
