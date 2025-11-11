#!/bin/bash

# Deployment script for Amplify application
# Logs status after each task

set -e  # Exit on error (but we'll handle errors gracefully where needed)

echo "=========================================="
echo "Starting deployment process..."
echo "=========================================="
echo ""

# Function to log task status
log_task() {
    local task_name=$1
    local status=$2
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    if [ "$status" = "success" ]; then
        echo "[$timestamp] ✓ $task_name - SUCCESS"
    else
        echo "[$timestamp] ✗ $task_name - FAILED"
    fi
    echo ""
}

# Task 1: Stop PM2 processes (only those that will be rebuilt)
echo "Task 1: Stopping PM2 processes..."
if [ "${BUILD_BACKEND:-true}" = "true" ]; then
    pm2 stop amplify-backend-prod || true
fi
if [ "${BUILD_FRONTEND:-true}" = "true" ]; then
    pm2 stop amplify-frontend || true
fi
log_task "Stopping PM2 processes" "success"

# Task 2: Git stash
echo "Task 2: Stashing local changes..."
git stash
log_task "Git stash" "success"

# Task 3: Git pull
echo "Task 3: Pulling latest changes from origin/main..."
git pull origin main
log_task "Git pull" "success"

# Task 4: Backend build (conditional)
if [ "${BUILD_BACKEND:-true}" = "true" ]; then
    echo "Task 4: Building backend..."
    cd backend
    npm ci
    npm run build
    log_task "Backend build" "success"
    cd ..
else
    echo "Task 4: Skipping backend build (no backend changes detected)"
    log_task "Backend build" "skipped"
fi

# Task 5: Frontend build (conditional)
if [ "${BUILD_FRONTEND:-true}" = "true" ]; then
    echo "Task 5: Building frontend..."
    cd frontend
    npm ci
    npm run build
    log_task "Frontend build" "success"
    cd ..
else
    echo "Task 5: Skipping frontend build (no frontend changes detected)"
    log_task "Frontend build" "skipped"
fi

# Task 6: Start/restart backend PM2 process (only if backend was built or needs restart)
if [ "${BUILD_BACKEND:-true}" = "true" ]; then
    echo "Task 6: Starting/restarting backend PM2 process..."
    if pm2 describe amplify-backend-prod >/dev/null 2>&1; then
        pm2 restart amplify-backend-prod
        log_task "Restart backend PM2 process" "success"
    else
        pm2 start dist/server.js --name amplify-backend-prod --cwd /var/www/amplify/backend --interpreter node
        log_task "Start backend PM2 process" "success"
    fi
else
    echo "Task 6: Skipping backend PM2 restart (no backend changes)"
    log_task "Restart backend PM2 process" "skipped"
fi

# Task 7: Start frontend PM2 process (only if frontend was built or needs restart)
if [ "${BUILD_FRONTEND:-true}" = "true" ]; then
    echo "Task 7: Starting/restarting frontend PM2 process..."
    if pm2 describe amplify-frontend >/dev/null 2>&1; then
        pm2 restart amplify-frontend
        log_task "Restart frontend PM2 process" "success"
    else
        pm2 start node --name amplify-frontend \
          --cwd /var/www/amplify/frontend -- \
          ./node_modules/next/dist/bin/next start -p 8979
        log_task "Start frontend PM2 process" "success"
    fi
else
    echo "Task 7: Skipping frontend PM2 restart (no frontend changes)"
    log_task "Start frontend PM2 process" "skipped"
fi

# Task 8: Save PM2 configuration
echo "Task 8: Saving PM2 configuration..."
pm2 save
log_task "Save PM2 configuration" "success"

echo "=========================================="
echo "Deployment completed successfully!"
echo "=========================================="

