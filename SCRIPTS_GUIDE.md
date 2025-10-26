# 🚀 OEP Setup Scripts - Complete Guide

This directory contains automated setup scripts for the OEP Exam Platform with **zero-configuration deployment**.

---

## 📋 Available Scripts

### 1. `check-system.sh` - System Detection Tool

**Check your system before installation:**

```bash
./check-system.sh
```

**What it does:**
- ✅ Detects your operating system (Arch, Ubuntu, Fedora, etc.)
- ✅ Shows which installation method would be used
- ✅ Checks current Docker installation status
- ✅ Verifies user permissions and Docker daemon status
- ✅ Provides installation recommendations

**Use this to:**
- Verify your system is supported
- See what commands will be run
- Check if Docker is already installed
- Diagnose installation issues

---

### 2. `setup-demo.sh` - Complete Automated Setup ⭐ RECOMMENDED

**Full zero-to-demo deployment with auto-install:**

```bash
./setup-demo.sh
```

**What it does:**
1. ✅ Detects your operating system
2. ✅ **Auto-installs Docker** if missing (with permission)
3. ✅ Configures Docker service and user permissions
4. ✅ Cleans up any existing containers
5. ✅ Creates environment files with secure defaults
6. ✅ Generates encryption keys (AES-256, RSA)
7. ✅ Builds all Docker containers (9 services)
8. ✅ Starts services in dependency order
9. ✅ Runs database migrations (Alembic)
10. ✅ Seeds demo data (57 users, 30 attempts)
11. ✅ Starts frontend applications
12. ✅ Performs health checks on all services
13. ✅ Displays access URLs and credentials

**Time:** ~10-15 minutes (first run)  
**Prerequisites:** None! (Script installs everything)

**Supported Auto-Install:**
- Arch Linux / Manjaro / EndeavourOS
- Ubuntu / Debian
- RHEL / CentOS / Fedora

---

### 3. `quick-start.sh` - Fast Setup

**Quick deployment (requires Docker pre-installed):**

```bash
./quick-start.sh
```

**What it does:**
- ✅ Starts all services with `docker-compose up -d`
- ✅ Waits for services to be ready
- ✅ Runs database migrations
- ✅ Seeds demo data
- ✅ Performs health checks
- ✅ Displays access information

**Time:** ~3-5 minutes  
**Prerequisites:** Docker and Docker Compose must be installed

**Use this when:**
- You already have Docker installed
- You've run `setup-demo.sh` before and just want to restart
- You want the fastest possible setup

---

### 4. `commands.sh` - Command Reference

**View all available commands:**

```bash
./commands.sh
```

**What it shows:**
- ✅ Setup & start commands
- ✅ Stop & cleanup commands
- ✅ Restart & logs commands
- ✅ Database operations
- ✅ Testing commands
- ✅ Debugging tools
- ✅ Health checks
- ✅ Development workflows
- ✅ Demo credentials
- ✅ Access points
- ✅ Useful command combinations

**Use this as:**
- Quick reference card
- Cheat sheet for daily operations
- Troubleshooting guide

---

## 🎯 Which Script Should I Use?

### First Time Setup

```bash
# 1. Check your system (optional but recommended)
./check-system.sh

# 2. Run full automated setup
./setup-demo.sh
```

### Already Installed Docker

```bash
# Use quick start
./quick-start.sh
```

### Restarting After Shutdown

```bash
# Quick restart
docker-compose up -d

# Or full reset with fresh data
./setup-demo.sh
```

### Need Help with Commands

```bash
# View reference
./commands.sh

# Or check specific documentation
cat INSTALLATION.md
cat DEMO_SETUP.md
```

---

## 📖 Detailed Workflow

### Complete First-Time Setup (Arch Linux Example)

```bash
# Step 1: Check system
./check-system.sh
# Output: "Arch Linux detected, auto-install available"

# Step 2: Run setup
./setup-demo.sh
# Prompt: "Would you like to automatically install Docker? (y/n)"
# Type: y

# Script installs Docker, builds containers, seeds data...
# ~10-15 minutes later...

# Step 3: Access the platform
# Student app: http://localhost:5173
# Login: student001 / pass123

# Step 4: View available commands
./commands.sh
```

---

## 🔧 Troubleshooting

### Script shows "Docker not found" after installation

```bash
# Reload your shell
exec bash

# Or log out and back in
# Then try again
./setup-demo.sh
```

### Permission denied errors

```bash
# Make scripts executable
chmod +x *.sh

# For Docker permissions
sudo usermod -aG docker $USER
newgrp docker
```

### Port conflicts (5173, 8000, etc.)

```bash
# Find what's using the port
sudo lsof -i :5173

# Kill the process or edit docker-compose.yml
# to use different ports
```

### Script hangs during installation

```bash
# Check Docker service
sudo systemctl status docker

# View script output with debug
bash -x ./setup-demo.sh
```

### Database connection fails

```bash
# Check if database container is running
docker-compose ps db

# View database logs
docker-compose logs db

# Restart database
docker-compose restart db
```

---

## 📊 Script Comparison

| Feature | check-system.sh | setup-demo.sh | quick-start.sh | commands.sh |
|---------|----------------|---------------|----------------|-------------|
| **Purpose** | Detect & verify | Full automation | Fast restart | Reference |
| **Installs Docker** | No (info only) | Yes (auto) | No | No (info) |
| **Builds Containers** | No | Yes | No | No |
| **Seeds Data** | No | Yes | Yes | No |
| **Health Checks** | Partial | Yes | Yes | No |
| **Time** | <1 min | 10-15 min | 3-5 min | <1 min |
| **Prerequisites** | None | None | Docker | None |
| **Use When** | First check | First setup | Restart | Need help |

---

## 🎬 Demo Flow

### Complete Demo Preparation

```bash
# Day before demo
./check-system.sh          # Verify system
./setup-demo.sh            # Full setup (15 min)

# Test the platform
curl http://localhost:8000/docs
curl http://localhost:5173

# Practice demo scenarios (see DEMO_SETUP.md)

# Day of demo
docker-compose ps          # Verify all running
./commands.sh              # Review commands

# If services stopped
./quick-start.sh           # Fast restart (3 min)

# During demo
# Use credentials from commands.sh or DEMO_READY.md
```

---

## 📚 Documentation Files

- **`INSTALLATION.md`** - Detailed OS-specific installation guide
- **`DEMO_SETUP.md`** - Complete demo walkthrough (4 scenarios)
- **`DEMO_READY.md`** - Quick demo checklist
- **`UPGRADE_NOTES.md`** - Recent improvements and features
- **`QUICK_REFERENCE.md`** - Platform features and API endpoints
- **`README.md`** - Main project documentation

---

## 🎉 Quick Start Summary

**For absolute beginners:**

```bash
# One command to rule them all
./setup-demo.sh
```

**For experienced users:**

```bash
# Check system
./check-system.sh

# Full setup or quick restart
./setup-demo.sh    # OR    ./quick-start.sh

# Reference
./commands.sh
```

**For troubleshooting:**

```bash
# Debug mode
bash -x ./setup-demo.sh

# Check logs
docker-compose logs -f

# Restart everything
docker-compose restart
```

---

## ✨ What Makes These Scripts Special

1. **Zero Configuration**: No manual editing of config files
2. **Auto-Detection**: Automatically detects your OS and available tools
3. **Auto-Installation**: Installs Docker with your permission
4. **Idempotent**: Safe to run multiple times
5. **Error Handling**: Comprehensive error messages and recovery
6. **Health Checks**: Verifies each step before proceeding
7. **Documentation**: Extensive inline comments and help text
8. **Cross-Platform**: Works on Arch, Ubuntu, Fedora, macOS
9. **User-Friendly**: Color-coded output, progress indicators
10. **Production-Ready**: Generates secure keys, proper permissions

---

## 🔐 Security Notes

### Auto-Installation Safety

The scripts:
- ✅ Always ask permission before installing
- ✅ Show exactly what commands will run
- ✅ Use official package repositories only
- ✅ Generate unique encryption keys per installation
- ✅ Set proper file permissions
- ✅ Configure Docker daemon correctly

### Docker Group Warning

Adding users to the `docker` group grants root-equivalent privileges. This is standard for Docker but be aware of the security implications.

For production environments, consider Docker rootless mode:
```bash
# See: https://docs.docker.com/engine/security/rootless/
```

---

## 🆘 Getting More Help

1. **Read the docs**: `cat INSTALLATION.md`
2. **Check system**: `./check-system.sh`
3. **View logs**: `docker-compose logs -f`
4. **Debug mode**: `bash -x ./setup-demo.sh`
5. **GitHub Issues**: Report problems with full error output

---

**Scripts ready!** Choose your adventure and get started! 🚀
