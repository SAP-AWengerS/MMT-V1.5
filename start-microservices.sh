#!/bin/bash

echo "🚀 Starting Microservices Architecture"
echo "======================================"
echo ""

# Fix Docker connection by unsetting DOCKER_HOST (minikube issue)
unset DOCKER_HOST
export DOCKER_HOST=

echo "✅ Docker environment fixed (DOCKER_HOST unset)"
echo ""

# Stop any existing containers
echo "🧹 Cleaning up any existing containers..."
cd microservices
docker-compose down 2>/dev/null

# Start all services
echo "🐳 Starting all microservices..."
docker-compose up -d

echo ""
echo "⏳ Waiting for services to initialize (20 seconds)..."
sleep 20

echo ""
echo "🏥 Health Checks:"
echo ""

# Test API Gateway
if curl -s http://localhost:5001/health > /dev/null 2>&1; then
    echo "✅ API Gateway (port 5001) - HEALTHY"
else
    echo "❌ API Gateway (port 5001) - NOT ACCESSIBLE"
fi

# Test Auth Service
if curl -s http://localhost:3001/health > /dev/null 2>&1; then
    echo "✅ Auth Service (port 3001) - HEALTHY"
else
    echo "❌ Auth Service (port 3001) - NOT ACCESSIBLE"
fi

# Test Fleet Service
if curl -s http://localhost:3002/health > /dev/null 2>&1; then
    echo "✅ Fleet Service (port 3002) - HEALTHY"
else
    echo "❌ Fleet Service (port 3002) - NOT ACCESSIBLE"
fi

# Test Finance Service
if curl -s http://localhost:3003/health > /dev/null 2>&1; then
    echo "✅ Finance Service (port 3003) - HEALTHY"
else
    echo "❌ Finance Service (port 3003) - NOT ACCESSIBLE"
fi

echo ""
echo "📊 Container Status:"
docker-compose ps

echo ""
echo "================================================"
echo "🎉 Microservices are running!"
echo ""
echo "📍 Important URLs:"
echo "   Frontend:        http://localhost:3000"
echo "   API Gateway:     http://localhost:8080"
echo "   RabbitMQ UI:     http://localhost:15672 (admin/password)"
echo ""
echo "🔧 Configuration:"
echo "   Frontend .env:   REACT_APP_BACKEND_URL=http://localhost:8080"
echo "   API Gateway:     Port 8080"
echo ""
echo "📝 Next Steps:"
echo "   1. Open your frontend at http://localhost:3000"
echo "   2. Frontend will make API calls to http://localhost:8080"
echo "   3. API Gateway will route to microservices"
echo ""
echo "🛑 To stop all services:"
echo "   cd microservices && docker-compose down"
echo ""
echo "📋 To view logs:"
echo "   docker-compose logs -f [service-name]"
echo "   Example: docker-compose logs -f api-gateway"
echo ""
