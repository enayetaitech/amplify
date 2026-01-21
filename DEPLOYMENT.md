## Amplify Deployment Guide (Backend & Frontend)

This project is a monorepo with:

- `backend` (Express + Mongoose)
- `frontend` (Next.js)
- `shared` (TypeScript library)

Both backend and frontend are deployed on the same Linux server using `pm2` and the root `deploy.sh` script.

---

## 1. One-time server setup

1. **SSH into the server**

   ```bash
   ssh user@your_server_ip
   ```

2. **Install system packages**

   ```bash
   sudo apt update && sudo apt upgrade -y
   sudo apt install -y build-essential curl git nginx
   ```

3. **Install Node.js 18 LTS and PM2**

   ```bash
   # Install Node.js 18.x
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt install -y nodejs

   # Confirm versions
   node -v
   npm -v

   # Install PM2 globally
   sudo npm install -g pm2
   ```

4. **Clone the repository into `/var/www/amplify`**

   ```bash
   sudo mkdir -p /var/www
   cd /var/www
   sudo git clone git@github.com:YOUR_ORG/amplify.git amplify
   sudo chown -R $USER:$USER /var/www/amplify
   cd /var/www/amplify
   ```

   The deployment script assumes:

   - Backend path: `/var/www/amplify/backend`
   - Frontend path: `/var/www/amplify/frontend`

5. **Create environment files**

   - `backend/.env` (database URL, secrets, frontend URL, etc.)
   - `frontend/.env.local` (backend base URL, public keys, etc.)

   Make sure these match the expectations in `backend/config` and `frontend` configs.

6. **Make the deployment script executable**

   ```bash
   cd /var/www/amplify
   chmod +x deploy.sh
   ```

7. **Set up nginx (high level)**

   - Configure nginx to:
     - Proxy API requests to the backend Node process.
     - Proxy web traffic to the frontend Next.js app (default port `8979` used in `deploy.sh`).
   - Reload nginx:

   ```bash
   sudo systemctl reload nginx
   ```

> For more detailed server-provisioning notes, see `ci/hostinger-deployment.md`.

---

## 2. How the deployment script works

The root `deploy.sh` script orchestrates backend and frontend deployment using `git`, `npm`, and `pm2`.

High-level flow:

1. Stops the PM2 apps:
   - `amplify-backend-prod`
   - `amplify-frontend`
2. Stashes local changes and pulls latest from `origin/main`.
3. Installs dependencies and builds:
   - `backend` (`npm ci && npm run build`)
   - `frontend` (`npm ci && npm run build`)
4. Starts the apps under PM2:
   - Backend: `pm2 start dist/server.js --name amplify-backend-prod --cwd /var/www/amplify/backend`
   - Frontend: `pm2 start node --name amplify-frontend --cwd /var/www/amplify/frontend -- ./node_modules/next/dist/bin/next start -p 8979`
5. Saves the PM2 process list (`pm2 save`) so it can be resurrected on reboot.

---

## 3. Full deployment (backend + frontend)

Use this when you want to deploy both backend and frontend changes together.

1. **SSH into the server**

   ```bash
   ssh user@your_server_ip
   ```

2. **Go to the project root**

   ```bash
   cd /var/www/amplify
   ```

3. **Run the deployment script**

   ```bash
   ./deploy.sh
   ```

   This will:

   - Stop existing PM2 processes.
   - Stash any uncommitted local changes.
   - Pull latest code from `origin/main`.
   - Rebuild backend and frontend.
   - Restart both apps via PM2.

4. **Verify processes are running**

   ```bash
   pm2 status
   ```

   You should see:

   - `amplify-backend-prod` (backend)
   - `amplify-frontend` (frontend)

5. **Hit your domain / IP in the browser**

   Confirm both:

   - API endpoints are responding correctly.
   - Frontend UI is loading and talking to the backend.

---

## 4. Backend-only deployment

Use this when you change only the backend and want to avoid rebuilding the frontend.

1. **SSH into the server & cd to project**

   ```bash
   ssh user@your_server_ip
   cd /var/www/amplify
   ```

2. **Run deployment for backend only**

   ```bash
   BUILD_BACKEND=true BUILD_FRONTEND=false ./deploy.sh
   ```

   This will:

   - Stop only the backend PM2 app.
   - Pull new code.
   - Rebuild `backend`.
   - Restart only `amplify-backend-prod`.

3. **Check logs if needed**

   ```bash
   pm2 logs amplify-backend-prod
   ```

---

## 5. Frontend-only deployment

Use this when you change only the frontend and want to avoid rebuilding the backend.

1. **SSH into the server & cd to project**

   ```bash
   ssh user@your_server_ip
   cd /var/www/amplify
   ```

2. **Run deployment for frontend only**

   ```bash
   BUILD_BACKEND=false BUILD_FRONTEND=true ./deploy.sh
   ```

   This will:

   - Stop only the frontend PM2 app.
   - Pull new code.
   - Rebuild `frontend`.
   - Restart only `amplify-frontend`.

3. **Check logs if needed**

   ```bash
   pm2 logs amplify-frontend
   ```

---

## 6. Common checks & troubleshooting

- **Check PM2 processes**

  ```bash
  pm2 status
  ```

- **View logs**

  ```bash
  pm2 logs amplify-backend-prod
  pm2 logs amplify-frontend
  ```

- **Restart a single app**

  ```bash
  pm2 restart amplify-backend-prod
  pm2 restart amplify-frontend
  ```

If deployment fails, read the console output from `./deploy.sh` and PM2 logs, fix the underlying issue (build error, env misconfig, etc.), then rerun the script.

