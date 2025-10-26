# 🎉 SETUP SCRIPT UPGRADED - Arch Linux Auto-Install Support

## What's New

The `setup-demo.sh` script has been upgraded with **automatic Docker installation** for Arch Linux (and other distros)!

---

## ✨ Key Features

### 1. **Automatic OS Detection**
The script now detects your operating system automatically:
- Arch Linux / Manjaro / EndeavourOS
- Ubuntu / Debian
- RHEL / CentOS / Fedora
- macOS

### 2. **Auto-Install Docker** 🚀
If Docker is not installed, the script will:
1. Detect your OS
2. Ask permission to install Docker
3. Run the appropriate package manager commands
4. Configure Docker service
5. Add your user to the docker group
6. Verify the installation

### 3. **Arch Linux Support** 🔵
For Arch Linux, the script executes:
```bash
sudo pacman -Sy --noconfirm
sudo pacman -S --noconfirm docker docker-compose
sudo systemctl start docker.service
sudo systemctl enable docker.service
sudo usermod -aG docker $USER
```

### 4. **Interactive Installation**
The script asks for permission before installing:
```
[INFO] Detected OS: arch
Would you like to automatically install Docker? (y/n)
```

### 5. **Graceful Fallback**
If auto-installation fails or is declined, the script provides detailed manual installation instructions for your specific OS.

---

## 🚀 How to Use

### Quick Start (Recommended)

```bash
cd /home/rajashekhar_sunkara/Desktop/OEP
./setup-demo.sh
```

**What happens:**
1. Script checks if Docker is installed
2. If not found, detects your OS (Arch Linux)
3. Asks: "Would you like to automatically install Docker? (y/n)"
4. Type `y` and press Enter
5. Script installs Docker and Docker Compose
6. Configures everything and starts the platform
7. Seeds demo data and performs health checks
8. Shows access URLs and credentials

**Total time:** ~10-15 minutes

---

## 📋 Before Running

### No Prerequisites Needed!
The script now handles everything, but you should have:
- ✅ Sudo privileges (for installing packages)
- ✅ Active internet connection
- ✅ ~10 GB free disk space

### What Gets Installed (on Arch)
- `docker` - Container runtime
- `docker-compose` - Multi-container orchestration
- `curl` - HTTP client (if missing)
- `jq` - JSON processor (optional)

---

## 🔧 Supported Installation Methods

### Arch Linux / Manjaro / EndeavourOS
```bash
# Automatic via setup-demo.sh
./setup-demo.sh
# Type 'y' when prompted

# Manual alternative
sudo pacman -Sy
sudo pacman -S docker docker-compose
sudo systemctl start docker.service
sudo systemctl enable docker.service
sudo usermod -aG docker $USER
newgrp docker
./setup-demo.sh
```

### Ubuntu / Debian
```bash
# Automatic
./setup-demo.sh
# Type 'y' when prompted

# Manual alternative
sudo apt-get update
sudo apt-get install -y docker.io docker-compose
sudo systemctl start docker
sudo usermod -aG docker $USER
./setup-demo.sh
```

### RHEL / CentOS / Fedora
```bash
# Automatic
./setup-demo.sh
# Type 'y' when prompted

# Manual alternative
sudo dnf install -y docker docker-compose
sudo systemctl start docker
sudo usermod -aG docker $USER
./setup-demo.sh
```

---

## 🎯 Example Run (Arch Linux)

```bash
[rajashekhar_sunkara@archlinux OEP]$ ./setup-demo.sh

╔════════════════════════════════════════════╗
║  OEP Exam Platform - Demo Setup Script    ║
║  Version: 1.0.0                            ║
╚════════════════════════════════════════════╝


================================
Checking System Requirements
================================

[WARNING] Docker not found
[WARNING] Docker Compose not found
[SUCCESS] Node.js found: v20.19.2
[SUCCESS] npm found: 10.8.2
[SUCCESS] curl found

[WARNING] Critical dependencies missing: docker docker-compose

[INFO] Detected OS: arch

Would you like to automatically install Docker? (y/n) y

================================
Installing Docker on Arch Linux
================================

[INFO] Updating package database...
[INFO] Installing Docker...
[INFO] Starting Docker service...
[INFO] Adding current user to docker group...
[SUCCESS] Docker installed successfully!

[INFO] Verifying Docker installation...
[SUCCESS] Docker verified: 24.0.7
[SUCCESS] Docker Compose verified: 2.23.0

[SUCCESS] All critical requirements met!

================================
Cleaning Up Existing Containers
================================

[INFO] No existing containers found

... (continues with setup)
```

---

## 📚 New Documentation

### Files Created/Updated:

1. **`setup-demo.sh`** (Updated)
   - Added `detect_os()` function
   - Added `install_docker_arch()` function
   - Added `install_docker_ubuntu()` function
   - Added `install_docker_rhel()` function
   - Added `auto_install_docker()` function
   - Enhanced `check_requirements()` with auto-install logic

2. **`INSTALLATION.md`** (NEW - 350+ lines)
   - Comprehensive installation guide
   - OS-specific instructions
   - Troubleshooting section
   - Verification checklist
   - Security notes

3. **`README.md`** (Updated)
   - Highlighted auto-install feature
   - Added supported OS list
   - Referenced INSTALLATION.md

4. **`DEMO_READY.md`** (Updated)
   - Updated setup script description
   - Added auto-install information

---

## 🛠️ Troubleshooting

### Issue: "Permission denied" after installation

**Solution:**
```bash
# The docker group was added, but you need to activate it
newgrp docker

# Or log out and back in
```

### Issue: "systemctl not found"

**Solution:**
```bash
# You might be on a different init system or WSL
# Start Docker manually
sudo dockerd &

# Then run the script
./setup-demo.sh
```

### Issue: Installation fails with package conflicts

**Solution:**
```bash
# Update your system first
sudo pacman -Syu

# Then run the script again
./setup-demo.sh
```

### Issue: Script still says Docker not found after install

**Solution:**
```bash
# Verify Docker is actually installed
which docker
docker --version

# If installed but not detected, reload shell
source ~/.bashrc
# or
exec bash

# Then run script
./setup-demo.sh
```

---

## ✅ Verification

After running the script, verify everything works:

```bash
# 1. Check Docker
docker --version
# Expected: Docker version 20.10+ or 24.0+

# 2. Check Docker Compose  
docker-compose --version
# Expected: docker-compose version 1.29+ or 2.x

# 3. Check running containers
docker-compose ps
# Expected: 9 containers running (db, redis, minio, api, worker, web, admin, etc.)

# 4. Access the platform
# Student app: http://localhost:5173
# Admin panel: http://localhost:5174
# API docs: http://localhost:8000/docs
```

---

## 🎬 Ready to Demo!

Your platform is now fully set up with:
- ✅ Docker and Docker Compose installed
- ✅ All services running
- ✅ Database migrated and seeded
- ✅ 57 demo users created
- ✅ 1 exam with 7 questions
- ✅ 30 submitted attempts for analytics

**Login and start the demo:**
- Student: `student001 / pass123` at http://localhost:5173
- Admin: `admin / admin123` at http://localhost:5174
- Instructor: `hic1 / pass123` at http://localhost:5174

---

## 📖 Further Reading

- **Full Setup Guide:** See `INSTALLATION.md`
- **Demo Walkthrough:** See `DEMO_SETUP.md`
- **Quick Commands:** Run `./commands.sh`
- **Grading Features:** See `CHUNK_9_COMPLETE.md`

---

**Upgrade Complete!** 🎉

The setup script is now **truly zero-configuration** for Arch Linux users!
