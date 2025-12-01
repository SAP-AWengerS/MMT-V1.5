#!/bin/bash

# ============================================================
# MMT Microservices - Docker Hub Push Script
# ============================================================
# This script builds and pushes all microservice images to Docker Hub
# Usage: ./push-to-dockerhub.sh <dockerhub-username> [version-tag]
# Example: ./push-to-dockerhub.sh myusername v1.0.0
# ============================================================

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Check arguments
if [ -z "$1" ]; then
    echo -e "${RED}Error: Docker Hub username is required${NC}"
    echo -e "${YELLOW}Usage: $0 <dockerhub-username> [version-tag]${NC}"
    echo -e "${YELLOW}Example: $0 myusername v1.0.0${NC}"
    exit 1
fi

DOCKERHUB_USERNAME="$1"
VERSION_TAG="${2:-latest}"

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   MMT Microservices - Docker Hub Image Push              ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${CYAN}Docker Hub Username: ${YELLOW}${DOCKERHUB_USERNAME}${NC}"
echo -e "${CYAN}Version Tag: ${YELLOW}${VERSION_TAG}${NC}"
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}✗ Docker is not installed. Please install Docker first.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Docker is installed${NC}"

# Check if user is logged in to Docker Hub
echo ""
echo -e "${YELLOW}Checking Docker Hub authentication...${NC}"
if ! docker info | grep -q "Username"; then
    echo -e "${YELLOW}⚠  Not logged in to Docker Hub. Please login:${NC}"
    docker login
    if [ $? -ne 0 ]; then
        echo -e "${RED}✗ Docker Hub login failed${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✓ Already logged in to Docker Hub${NC}"
fi

# Define microservices
declare -a SERVICES=(
    "api-gateway"
    "auth-service"
    "fleet-service"
    "finance-service"
    "analytics-service"
    "notification-service"
)

# Change to microservices directory
cd microservices

echo ""
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}Starting build and push process for ${#SERVICES[@]} services${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
echo ""

# Build and push each service
SUCCESS_COUNT=0
FAILED_SERVICES=()

for SERVICE in "${SERVICES[@]}"; do
    echo -e "${CYAN}──────────────────────────────────────────────────────────${NC}"
    echo -e "${CYAN}Processing: ${YELLOW}${SERVICE}${NC}"
    echo -e "${CYAN}──────────────────────────────────────────────────────────${NC}"

    # Check if Dockerfile exists
    if [ ! -f "${SERVICE}/Dockerfile" ]; then
        echo -e "${RED}✗ Dockerfile not found for ${SERVICE}${NC}"
        FAILED_SERVICES+=("${SERVICE}")
        continue
    fi

    # Define image names
    IMAGE_NAME="${DOCKERHUB_USERNAME}/mmt-${SERVICE}"
    IMAGE_TAG_VERSION="${IMAGE_NAME}:${VERSION_TAG}"
    IMAGE_TAG_LATEST="${IMAGE_NAME}:latest"

    echo -e "${YELLOW}Building image: ${IMAGE_TAG_VERSION}${NC}"

    # Build the Docker image
    if docker build -t "${IMAGE_TAG_VERSION}" -t "${IMAGE_TAG_LATEST}" "./${SERVICE}"; then
        echo -e "${GREEN}✓ Successfully built ${SERVICE}${NC}"

        # Push version tag
        echo -e "${YELLOW}Pushing image: ${IMAGE_TAG_VERSION}${NC}"
        if docker push "${IMAGE_TAG_VERSION}"; then
            echo -e "${GREEN}✓ Successfully pushed ${IMAGE_TAG_VERSION}${NC}"
        else
            echo -e "${RED}✗ Failed to push ${IMAGE_TAG_VERSION}${NC}"
            FAILED_SERVICES+=("${SERVICE}")
            continue
        fi

        # Push latest tag (if version is not 'latest')
        if [ "${VERSION_TAG}" != "latest" ]; then
            echo -e "${YELLOW}Pushing image: ${IMAGE_TAG_LATEST}${NC}"
            if docker push "${IMAGE_TAG_LATEST}"; then
                echo -e "${GREEN}✓ Successfully pushed ${IMAGE_TAG_LATEST}${NC}"
            else
                echo -e "${RED}✗ Failed to push ${IMAGE_TAG_LATEST}${NC}"
            fi
        fi

        SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
        echo -e "${GREEN}✓ ${SERVICE} completed successfully${NC}"
    else
        echo -e "${RED}✗ Failed to build ${SERVICE}${NC}"
        FAILED_SERVICES+=("${SERVICE}")
    fi

    echo ""
done

# Summary
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}                     DEPLOYMENT SUMMARY                     ${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${GREEN}Successfully processed: ${SUCCESS_COUNT}/${#SERVICES[@]} services${NC}"

if [ ${#FAILED_SERVICES[@]} -gt 0 ]; then
    echo -e "${RED}Failed services: ${FAILED_SERVICES[*]}${NC}"
    echo ""
    exit 1
fi

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   All images successfully pushed to Docker Hub! 🎉        ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Display pushed images
echo -e "${BLUE}Pushed Images:${NC}"
for SERVICE in "${SERVICES[@]}"; do
    echo -e "  ${GREEN}•${NC} ${DOCKERHUB_USERNAME}/mmt-${SERVICE}:${VERSION_TAG}"
    if [ "${VERSION_TAG}" != "latest" ]; then
        echo -e "  ${GREEN}•${NC} ${DOCKERHUB_USERNAME}/mmt-${SERVICE}:latest"
    fi
done

echo ""
echo -e "${BLUE}View your images at:${NC}"
echo -e "  ${CYAN}https://hub.docker.com/u/${DOCKERHUB_USERNAME}${NC}"
echo ""

echo -e "${YELLOW}Next steps:${NC}"
echo -e "  1. Update docker-compose.yml to use your images"
echo -e "  2. Update Kubernetes deployment files with your image names"
echo -e "  3. Deploy to your target environment"
echo ""

echo -e "${CYAN}Example docker-compose.yml image reference:${NC}"
echo -e "  ${YELLOW}image: ${DOCKERHUB_USERNAME}/mmt-auth-service:${VERSION_TAG}${NC}"
echo ""
