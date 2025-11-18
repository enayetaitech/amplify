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

# Task 1: Git stash
echo "Task 1: Stashing local changes..."
git stash
log_task "Git stash" "success"

# Task 2: Git pull
echo "Task 2: Pulling latest changes from origin/main..."
git pull origin main
log_task "Git pull" "success"

# Task 3: Detect what changed
echo "Task 3: Detecting changes..."
PREV_COMMIT=$(git rev-parse HEAD~1 2>/dev/null || echo "")
CURRENT_COMMIT=$(git rev-parse HEAD)

if [ -z "$PREV_COMMIT" ]; then
    # First commit or no previous commit, check all files
    BACKEND_CHANGED=true
    FRONTEND_CHANGED=true
    echo "No previous commit found, will build both backend and frontend"
else
    # Check what files changed
    CHANGED_FILES=$(git diff --name-only "$PREV_COMMIT" "$CURRENT_COMMIT" 2>/dev/null || git diff --name-only HEAD~1 HEAD 2>/dev/null || echo "")
    
    BACKEND_CHANGED=false
    FRONTEND_CHANGED=false
    
    if echo "$CHANGED_FILES" | grep -qE "^backend/|^shared/"; then
        BACKEND_CHANGED=true
        echo "Backend or shared code changed"
    fi
    
    if echo "$CHANGED_FILES" | grep -qE "^frontend/|^shared/"; then
        FRONTEND_CHANGED=true
        echo "Frontend or shared code changed"
    fi
    
    # If shared changed, both need to be built
    if echo "$CHANGED_FILES" | grep -qE "^shared/"; then
        BACKEND_CHANGED=true
        FRONTEND_CHANGED=true
        echo "Shared code changed, will build both backend and frontend"
    fi
    
    # Allow manual override via environment variables
    if [ "${BUILD_BACKEND:-}" = "true" ]; then
        BACKEND_CHANGED=true
    elif [ "${BUILD_BACKEND:-}" = "false" ]; then
        BACKEND_CHANGED=false
    fi
    
    if [ "${BUILD_FRONTEND:-}" = "true" ]; then
        FRONTEND_CHANGED=true
    elif [ "${BUILD_FRONTEND:-}" = "false" ]; then
        FRONTEND_CHANGED=false
    fi
fi

if [ "$BACKEND_CHANGED" = "false" ] && [ "$FRONTEND_CHANGED" = "false" ]; then
    echo "No backend or frontend changes detected. Nothing to build."
    log_task "Change detection" "skipped"
    exit 0
fi

log_task "Change detection" "success"

# Task 4: Backend build (conditional)
if [ "$BACKEND_CHANGED" = "true" ]; then
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
if [ "$FRONTEND_CHANGED" = "true" ]; then
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

# Task 6: Stop and delete old PM2 processes (after building, before starting new ones)
echo "Task 6: Stopping and cleaning up old PM2 processes..."
if [ "$BACKEND_CHANGED" = "true" ]; then
    pm2 stop amplify-backend-prod || true
    pm2 delete amplify-backend-prod || true
fi
if [ "$FRONTEND_CHANGED" = "true" ]; then
    # Delete all amplify-frontend processes to ensure only one instance
    pm2 stop amplify-frontend || true
    pm2 delete amplify-frontend || true
    # Clean up any remaining processes by iterating through PM2 list
    pm2 list | grep -i "amplify-frontend" | awk '{print $2}' | while read -r id; do
        [ -n "$id" ] && pm2 delete "$id" 2>/dev/null || true
    done
fi
log_task "Stopping and cleaning up old PM2 processes" "success"

# Task 7: Start backend PM2 process (only if backend was built)
if [ "$BACKEND_CHANGED" = "true" ]; then
    echo "Task 7: Starting backend PM2 process..."
    pm2 start dist/server.js --name amplify-backend-prod --cwd /var/www/amplify/backend --interpreter node
    log_task "Start backend PM2 process" "success"
else
    echo "Task 7: Skipping backend PM2 restart (no backend changes)"
    log_task "Start backend PM2 process" "skipped"
fi

# Task 8: Start frontend PM2 process (only if frontend was built)
if [ "$FRONTEND_CHANGED" = "true" ]; then
    echo "Task 8: Starting frontend PM2 process..."
    pm2 start node --name amplify-frontend \
      --cwd /var/www/amplify/frontend -- \
      ./node_modules/next/dist/bin/next start -p 8979
    log_task "Start frontend PM2 process" "success"
else
    echo "Task 8: Skipping frontend PM2 restart (no frontend changes)"
    log_task "Start frontend PM2 process" "skipped"
fi

# Task 9: Save PM2 configuration
echo "Task 9: Saving PM2 configuration..."
pm2 save
log_task "Save PM2 configuration" "success"

echo "=========================================="
echo "Deployment completed successfully!"
echo "=========================================="

