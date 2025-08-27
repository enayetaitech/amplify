--- C:\work\amplify-new\tsconfig.base.json ---

{
  "files": [],
  "references": [
    {
      "path": "./shared"
    },
    {
      "path": "./backend"
    },
    {
      "path": "./frontend"
    }
  ],
  "compilerOptions": {
    "composite": true,
    "declaration": true,
    "declarationMap": true,
    "skipLibCheck": true,
    "strict": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
     "baseUrl": ".",
    "paths": {
      "@shared/*": ["shared/*"],
      "@backend/*": ["backend/*"],
      "@frontend/*": ["frontend/*"]
    }
  }
}

--- C:\work\amplify-new\.githooks\pre-commit ---

#!/usr/bin/env sh
set -e
[ -d frontend/.next ] && rm -rf frontend/.next
echo "  Building backend…"
npm --prefix backend run build
echo "  Building frontend…"
npm --prefix frontend run build
echo "  Linting frontend…"
npm --prefix frontend run lint
echo "✅  All checks passed!"

--- C:\work\amplify-new\.github\workflows\ci.yml ---

# .github/workflows/ci.yml
name: Build Breaks

on:
  push:
    branches:
      - main
  pull_request:
    branches:
      - main

jobs:
  backend-build:
    name: 🛠 Backend Build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Use Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "18.x"
       

      - name: Install backend dependencies
        run: |
          cd backend
          npm ci

      - name: Build backend
        run: |
          cd backend
          npm run build
          
  frontend-build:
    name: 🎨 Frontend Build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Use Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "18.x"
        

      - name: Install frontend dependencies (ignore peer-dep conflicts)
        run: |
          cd frontend
          npm ci --legacy-peer-deps

      - name: Build frontend
        run: |
          cd frontend
          npm run build
          
--- C:\work\amplify-new\docker\docker-compose.yml ---

version: "3.8"

services:
  backend-server:
    container_name: backend
    build:

      context: ..
      dockerfile: docker/dockerfile.backend
    ports:
      - "8978:8978"
    volumes:
      - ../backend:/app/backend
      - /app/backend/node_modules
    env_file:
      - ../backend/.env


  frontend-server:
    container_name: frontend
    build:

      context: ..
      dockerfile: docker/dockerfile.frontend

    ports:
      - "8979:8979"
    depends_on:
      - backend-server

    volumes:
      - ../frontend:/app/frontend
      - /app/frontend/node_modules
    env_file:
      - ../frontend/.env
    command: npm run dev -- -p 8979

--- C:\work\amplify-new\docker\dockerfile.backend ---

# Use the official Node.js 20 Alpine image
FROM node:20-alpine AS base

# Set the working directory
WORKDIR /app

# Install OS dependencies including build tools and libraries needed to build your project
RUN apk update && apk add --no-cache \
    ttf-freefont \
    chromium \
    git \
    build-base \
    python3 \
    py3-pip \
    automake \
    autoconf \
    libtool \
    linux-headers \
    libstdc++ \
    libc6-compat \
    net-tools \
    iputils \
    curl \
    openssl \
    openssl-dev

# Create symbolic link for `python` if needed
RUN ln -sf python3 /usr/bin/python

# Create a second stage for actual running
FROM base AS run

# Set working directory again (new layer)
WORKDIR /app

# Copy package files first for better layer caching
COPY backend/package.json backend/package-lock.json ./backend/

# Install dependencies
RUN cd backend && npm install --force

# Copy the full app (excluding Docker context)
COPY . .

# Expose necessary ports
EXPOSE 8978

# Set working directory to backend
WORKDIR /app/backend

# Start the application
CMD ["npm", "run", "dev"]

--- C:\work\amplify-new\docker\dockerfile.frontend ---

# Base stage with dependencies
FROM node:20-alpine AS base

WORKDIR /app

# Install OS & build dependencies
RUN apk update && apk add --no-cache \
    ttf-freefont \
    chromium \
    git \
    build-base \
    python3 \
    py3-pip \
    automake \
    autoconf \
    libtool \
    linux-headers \
    libstdc++ \
    libc6-compat \
    net-tools \
    iputils \
    curl

# Symlink for python if needed
RUN ln -sf python3 /usr/bin/python

# Application build stage
FROM base AS run

WORKDIR /app

# Pre-clean (these folders should not exist before copying; better to use .dockerignore)
# Still keeping these lines in case of dirty Docker context
RUN rm -rf frontend/.next \
           frontend/node_modules

# Copy only necessary package files first for caching
COPY frontend/package.json frontend/package-lock.json ./frontend/

# Install dependencies
RUN cd frontend && npm install --force

# Copy the rest of the app
COPY . .

# Build the frontend
RUN cd frontend && npm run build

# Set correct working directory
WORKDIR /app/frontend

# Expose the Next.js port
EXPOSE 8979

# Start the application
CMD ["npm", "run", "start", "--", "-p", "8979"]
