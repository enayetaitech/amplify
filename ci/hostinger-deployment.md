1. SSH in:
```bash
ssh root@your_server_ip
```
2. Update packages & install essentials:
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y build-essential curl git nginx
```

3. Install Node.js LTS and PM2 if not available:
```bash
# 1. Check for Node.js
if command -v node >/dev/null 2>&1; then
  echo "✅ Node.js is already installed: $(node -v)"
else
  echo "⚙️ Installing Node.js…"
  curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
  sudo apt install -y nodejs
fi

# 2. Check for npm (it comes with Node.js)
if command -v npm >/dev/null 2>&1; then
  echo "✅ npm is already installed: $(npm -v)"
else
  echo "⚠️ npm not found; ensure Node.js installed correctly"
fi

# 3. Check for PM2
if command -v pm2 >/dev/null 2>&1; then
  echo "✅ PM2 already installed: $(pm2 -v)"
else
  echo "⚙️ Installing PM2 globally…"
  sudo npm install -g pm2
fi
```