#!/bin/bash

# Build and Push Docker Images to Docker Hub
# Usage: ./build-and-push.sh [tag]
# If no tag is provided, it will use 'latest'

set -e  # Exit on any error

# Configuration
DOCKER_USERNAME=${DOCKER_USERNAME:-"enayetsyl"}
BACKEND_IMAGE="${DOCKER_USERNAME}/amplify-backend"
FRONTEND_IMAGE="${DOCKER_USERNAME}/amplify-frontend"
TAG=${1:-"latest"}

echo "🚀 Starting Docker build and push process..."
echo "📦 Backend Image: ${BACKEND_IMAGE}:${TAG}"
echo "🌐 Frontend Image: ${FRONTEND_IMAGE}:${TAG}"
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop and try again."
    exit 1
fi

# Login to Docker Hub (optional - will prompt if not logged in)
echo "🔐 Checking Docker Hub authentication..."
if ! docker info 2>/dev/null | grep -q "Username"; then
    echo "Please login to Docker Hub:"
    docker login
fi

echo ""
echo "🏗️  Building Backend Image..."
docker build \
  -t ${BACKEND_IMAGE}:${TAG} \
  -f docker/dockerfile.backend \
  .
echo "✅ Backend build completed!"

echo ""
echo "🏗️  Building Frontend Image..."
# Temporarily rename frontend/.env to avoid dev env leaking into prod build
ENV_MOVED=0
if [ -f frontend/.env ]; then
    echo "🔧 Temporarily moving frontend/.env to frontend/.env.dev.backup"
    mv frontend/.env frontend/.env.dev.backup
    ENV_MOVED=1
fi
docker build \
  -t ${FRONTEND_IMAGE}:${TAG} \
  -f docker/dockerfile.frontend \
  .
echo "✅ Frontend build completed!"

# Restore the dev .env after build
if [ "$ENV_MOVED" = "1" ] && [ -f frontend/.env.dev.backup ]; then
    echo "🔁 Restoring frontend/.env from backup"
    mv frontend/.env.dev.backup frontend/.env
fi

echo ""
echo "📤 Pushing Images to Docker Hub..."

echo "📤 Pushing Backend Image..."
docker push ${BACKEND_IMAGE}:${TAG}
echo "✅ Backend push completed!"

echo "📤 Pushing Frontend Image..."
docker push ${FRONTEND_IMAGE}:${TAG}
echo "✅ Frontend push completed!"

echo ""
echo "🎉 All images built and pushed successfully!"
echo ""
echo "📋 Summary:"
echo "   Backend:  $BACKEND_IMAGE:$TAG"
echo "   Frontend: $FRONTEND_IMAGE:$TAG"
echo ""
echo "💡 Usage in production:"
echo "   docker run -d -p 8978:8978 --env-file backend/.env.prod $BACKEND_IMAGE:$TAG"
echo "   docker run -d -p 80:8979 --env-file frontend/.env.prod $FRONTEND_IMAGE:$TAG"