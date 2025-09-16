# Docker Deployment Guide

This guide explains how to build and deploy your Amplify application using Docker.

## Prerequisites

1. **Docker Desktop** installed and running
2. **Docker Hub account** and CLI logged in (`docker login`)
3. **Production environment files** configured:
   - `backend/.env.prod` with real production credentials
   - `frontend/.env.prod` with real production URLs

## Quick Start

### 1. Configure Your Docker Hub Username

**Configuration:**

The scripts are pre-configured with your Docker Hub username (`enayetsyl`). If you need to change it:

**For Windows (.bat):**

- Edit `build-and-push.bat` line 9: `set DOCKER_USERNAME=your-username`

**For Linux/Mac (.sh):**

- Edit `build-and-push.sh` line 10: `DOCKER_USERNAME=${DOCKER_USERNAME:-"your-username"}`
- Or set environment variable: `export DOCKER_USERNAME=your-username`

### 2. Build and Push Images

**Windows:**

```batch
build-and-push.bat
# Or with custom tag:
build-and-push.bat v1.0.0
```

**Linux/Mac:**

```bash
./build-and-push.sh
# Or with custom tag:
./build-and-push.sh v1.0.0
```

**Manual Commands (what the script does):**

```bash
# Backend
docker build -t enayetsyl/amplify-backend:latest -f docker/dockerfile.backend .
docker push enayetsyl/amplify-backend:latest

# Frontend
docker build -t enayetsyl/amplify-frontend:latest -f docker/dockerfile.frontend .
docker push enayetsyl/amplify-frontend:latest
```

### 3. Deploy to Production

After images are pushed, deploy using:

```bash
# Backend
docker run -d \
  --name amplify-backend \
  -p 8978:8978 \
  --env-file backend/.env.prod \
  your-username/amplify-backend:latest

# Frontend
docker run -d \
  --name amplify-frontend \
  -p 80:8979 \
  --env-file frontend/.env.prod \
  your-username/amplify-frontend:latest
```

## Environment Configuration

### Backend (.env.prod)

```bash
# Database
MONGO_URI=mongodb+srv://prod-user:prod-pass@cluster.mongodb.net/prod-db

# Security
JWT_SECRET=your-production-jwt-secret
JWT_REFRESH_SECRET=your-production-refresh-secret

# Payments
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key
NEXT_PAYMENT_GATEWAY_PUBLIC_KEY=pk_live_your_stripe_publishable_key

# AWS S3
S3_ACCESS_KEY=your-prod-aws-access-key
S3_SECRET_ACCESS_KEY=your-prod-aws-secret-key
S3_BUCKET_NAME=your-prod-bucket

# Email
SMTP_USER=noreply@yourdomain.com
SMTP_PASS=your-production-email-password

# LiveKit
LIVEKIT_API_URL=https://your-prod-livekit.livekit.cloud
LIVEKIT_API_KEY=your-prod-livekit-key
LIVEKIT_API_SECRET=your-prod-livekit-secret
```

### Frontend (.env.prod)

```bash
NEXT_PUBLIC_BACKEND_BASE_URL=https://your-api-domain.com
NEXT_PUBLIC_SOCKET_URL=wss://your-api-domain.com
NEXT_PUBLIC_FRONTEND_BASE_URL=https://your-frontend-domain.com
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_publishable_key
NEXT_PUBLIC_LIVEKIT_URL=wss://your-prod-livekit.livekit.cloud
```

## Available Scripts

### Development

```bash
# Start development environment
docker-compose -f docker/docker-compose.yml up --build
```

### Production

```bash
# Start production environment
docker-compose -f docker/docker-compose.prod.yml up --build

# Or run individual services
docker-compose -f docker/docker-compose.prod.yml up backend-server
docker-compose -f docker/docker-compose.prod.yml up frontend-server
```

## Image Management

### List Images

```bash
docker images | grep amplify
```

### Remove Old Images

```bash
docker image prune -f
```

### Check Running Containers

```bash
docker ps
```

### View Logs

```bash
docker logs amplify-backend
docker logs amplify-frontend
```

## Troubleshooting

### Common Issues

1. **"Docker not running"**

   - Start Docker Desktop
   - Wait for it to fully start

2. **"Authentication required"**

   - Run `docker login`
   - Check your Docker Hub credentials

3. **"Network timeout"**

   - Check internet connection
   - Try again later

4. **"Port already in use"**
   - Change port mapping: `-p 8080:8979`
   - Or stop conflicting service

### Environment Variables Not Loading

Ensure your `.env.prod` files are in the correct locations:

- `backend/.env.prod`
- `frontend/.env.prod`

And that they contain valid production values (not test credentials).

## Security Notes

- Never commit `.env` files with real credentials
- Use different credentials for each environment
- Rotate secrets regularly
- Use Docker secrets in production orchestrators (Kubernetes, Docker Swarm)

## Support

For issues with this deployment setup, check:

1. Docker Desktop is running
2. Environment files are properly configured
3. Docker Hub credentials are correct
4. Network connectivity to Docker Hub
