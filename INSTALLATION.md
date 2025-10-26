# OEP Exam Platform - Installation Guide

Complete installation guide for all supported operating systems with automatic dependency installation.

---

## 🚀 Quick Start (Recommended)

The setup script now **automatically detects your OS and installs Docker** if it's missing!

```bash
cd /home/rajashekhar_sunkara/Desktop/OEP
./setup-demo.sh
```

The script will:
1. ✅ Detect your operating system (Arch, Ubuntu, Fedora, macOS, etc.)
2. ✅ Check for Docker and Docker Compose
3. ✅ **Ask to automatically install missing dependencies**
4. ✅ Configure and start all services
5. ✅ Seed demo data
6. ✅ Verify system health

**Supported Auto-Installation:**
- Arch Linux / Manjaro / EndeavourOS
- Ubuntu / Debian
- RHEL / CentOS / Fedora

---

## 📦 Arch Linux Installation

### Automatic (Recommended)

```bash
./setup-demo.sh
# When prompted "Would you like to automatically install Docker? (y/n)", type: y
```

### Manual Installation

If you prefer to install Docker manually:

```bash
# Update package database
sudo pacman -Sy

# Install Docker and Docker Compose
sudo pacman -S docker docker-compose curl jq

# Start and enable Docker service
sudo systemctl start docker.service
sudo systemctl enable docker.service

# Add your user to docker group (to run without sudo)
sudo usermod -aG docker $USER

# Log out and back in, or use newgrp
newgrp docker

# Verify installation
docker --version
docker-compose --version

# Now run the setup script
./setup-demo.sh
```

---

## 🐧 Ubuntu / Debian Installation

### Automatic (Recommended)

```bash
./setup-demo.sh
# When prompted, type: y
```

### Manual Installation

```bash
# Update package lists
sudo apt-get update

# Install Docker and tools
sudo apt-get install -y docker.io docker-compose curl jq

# Start Docker service
sudo systemctl start docker
sudo systemctl enable docker

# Add user to docker group
sudo usermod -aG docker $USER

# Log out and back in

# Verify installation
docker --version
docker-compose --version

# Run setup script
./setup-demo.sh
```

---

## 🎩 RHEL / CentOS / Fedora Installation

### Automatic (Recommended)

```bash
./setup-demo.sh
# When prompted, type: y
```

### Manual Installation

```bash
# Install Docker and tools
sudo dnf install -y docker docker-compose curl jq

# Start Docker service
sudo systemctl start docker
sudo systemctl enable docker

# Add user to docker group
sudo usermod -aG docker $USER

# Log out and back in

# Verify installation
docker --version
docker-compose --version

# Run setup script
./setup-demo.sh
```

---

## 🍎 macOS Installation

Docker Desktop must be installed manually on macOS.

### Using Homebrew

```bash
# Install Homebrew if not already installed
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Docker Desktop
brew install --cask docker

# Install command-line tools
brew install docker-compose curl jq

# Start Docker Desktop app
open /Applications/Docker.app

# Wait for Docker to start, then verify
docker --version
docker-compose --version

# Run setup script
./setup-demo.sh
```

---

## 🔧 Troubleshooting

### Issue: "Permission denied" when running docker commands

**Cause:** Your user is not in the docker group.

**Solution:**
```bash
# Arch Linux
sudo usermod -aG docker $USER
newgrp docker

# Ubuntu/Debian
sudo usermod -aG docker $USER
# Then log out and back in
```

### Issue: "Cannot connect to Docker daemon"

**Cause:** Docker service is not running.

**Solution:**
```bash
# Start Docker service
sudo systemctl start docker

# Enable on boot
sudo systemctl enable docker

# Check status
sudo systemctl status docker
```

### Issue: Setup script fails with "docker-compose not found"

**Cause:** Docker Compose plugin vs standalone binary.

**Solution:**
```bash
# Try using docker compose (plugin) instead
docker compose version

# If this works, the script will auto-detect it
# Otherwise, install docker-compose:

# Arch Linux
sudo pacman -S docker-compose

# Ubuntu/Debian
sudo apt-get install docker-compose

# RHEL/Fedora
sudo dnf install docker-compose
```

### Issue: "Failed to connect to bus" on Arch Linux

**Cause:** systemd-resolved issue or WSL environment.

**Solution:**
```bash
# If on WSL, start Docker manually
sudo dockerd &

# On native Arch, check systemd
sudo systemctl daemon-reload
sudo systemctl restart docker
```

### Issue: Port already in use (5173, 8000, etc.)

**Cause:** Another service is using the required ports.

**Solution:**
```bash
# Find what's using the port
sudo lsof -i :5173
sudo lsof -i :8000

# Kill the process or change ports in docker-compose.yml
```

---

## ✅ Verification Checklist

After installation, verify everything is working:

```bash
# 1. Check Docker
docker --version
# Expected: Docker version 20.10+ 

# 2. Check Docker Compose
docker-compose --version
# Expected: docker-compose version 1.29+ or Docker Compose version 2.x

# 3. Check Docker daemon
docker ps
# Expected: Should list containers (or empty if none running)

# 4. Test Docker
docker run hello-world
# Expected: "Hello from Docker!" message

# 5. Check user permissions
groups
# Expected: Should include 'docker' in the list
```

---

## 📋 System Requirements

### Minimum Requirements
- **OS:** Linux (any distro), macOS 10.15+, Windows 10/11 with WSL2
- **RAM:** 4 GB
- **Disk:** 10 GB free space
- **Docker:** 20.10+
- **Docker Compose:** 1.29+ or V2

### Recommended Requirements
- **OS:** Arch Linux, Ubuntu 22.04+, Fedora 38+
- **RAM:** 8 GB
- **Disk:** 20 GB free space (for logs and uploads)
- **Docker:** Latest stable
- **Docker Compose:** V2 (plugin)

---

## 🔐 Security Notes

### Docker Group Warning

Adding users to the `docker` group grants root-equivalent permissions. For production:

```bash
# Run Docker in rootless mode (advanced)
# See: https://docs.docker.com/engine/security/rootless/
```

### Firewall Configuration

If you have a firewall enabled:

```bash
# Allow Docker ports (example with ufw on Ubuntu)
sudo ufw allow 5173/tcp  # Student web app
sudo ufw allow 5174/tcp  # Admin dashboard
sudo ufw allow 8000/tcp  # API

# Or allow only from localhost
sudo ufw allow from 127.0.0.1 to any port 5173
```

---

## 🆘 Getting Help

### Check Logs

```bash
# View all logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f api
docker-compose logs -f db

# View last 100 lines
docker-compose logs --tail=100
```

### Debug Mode

```bash
# Run script with debug output
bash -x ./setup-demo.sh
```

### Common Commands

```bash
# Restart all services
docker-compose restart

# Stop all services
docker-compose down

# Rebuild and restart
docker-compose down && docker-compose up -d --build

# Check container status
docker-compose ps

# Shell into API container
docker-compose exec api bash
```

---

## 📚 Additional Resources

- **Arch Wiki - Docker:** https://wiki.archlinux.org/title/Docker
- **Docker Documentation:** https://docs.docker.com/
- **Docker Compose Docs:** https://docs.docker.com/compose/
- **OEP Documentation:** See `DEMO_SETUP.md`, `README.md`

---

## 🎯 Next Steps

After successful installation:

1. ✅ Access the platform at http://localhost:5173
2. ✅ Login with demo credentials (see `DEMO_READY.md`)
3. ✅ Follow the demo walkthrough (`DEMO_SETUP.md`)
4. ✅ Review the API docs at http://localhost:8000/docs

---

**Installation complete!** 🎉

For demo instructions, see: `DEMO_SETUP.md`  
For quick commands, run: `./commands.sh`
