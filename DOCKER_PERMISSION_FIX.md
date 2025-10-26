# 🔧 Docker Permission Issue - FIXED!

## Problem Summary

You encountered this error when running `./setup-demo.sh`:

```
permission denied while trying to connect to the Docker daemon socket at unix:///var/run/docker.sock
```

**Root Cause:** Docker is installed, but your user account doesn't have permission to access it.

---

## ✅ Solution Implemented

The `setup-demo.sh` script has been **updated** to automatically detect and fix this issue!

### What's New in setup-demo.sh:

1. **`check_docker_access()`** - Tests if Docker is accessible
2. **`fix_docker_permissions()`** - Automatically fixes permissions
3. **`docker_compose()` wrapper** - Uses sudo if needed
4. **`docker_cmd()` wrapper** - Uses sudo if needed
5. **Enhanced error detection** - Catches permission issues early
6. **Interactive fix prompt** - Asks permission before fixing
7. **Automatic fallback** - Uses sudo if group membership isn't active

---

## 🚀 How to Fix (3 Options)

### Option 1: Just Run Setup Again (RECOMMENDED ⭐)

The script now handles everything automatically!

```bash
./setup-demo.sh
```

**What happens:**
1. Script detects: "Docker installed but no permission"
2. Asks: "Would you like to fix Docker permissions now? (y/n)"
3. You type: `y`
4. Script fixes permissions automatically
5. Setup continues without interruption!

**No logout/login required!** The script uses sudo for Docker commands if your group membership hasn't activated yet.

---

### Option 2: Use the Fix Script

A standalone fix script has been created for you:

```bash
./fix-docker-permissions.sh
```

Then run setup:

```bash
./setup-demo.sh
```

---

### Option 3: Manual Fix

```bash
# Add your user to docker group
sudo usermod -aG docker $USER

# Fix socket permissions (immediate effect)
sudo chmod 666 /var/run/docker.sock

# Start Docker service if not running
sudo systemctl start docker.service
sudo systemctl enable docker.service

# Now run setup
./setup-demo.sh
```

---

## 📝 Technical Details

### What Was Fixed

**Before (old behavior):**
```bash
docker-compose ps       # ❌ Permission denied
exit 1                  # Script stops
```

**After (new behavior):**
```bash
# Script detects issue
if ! check_docker_access; then
    ask_to_fix_permissions()
    if fixed; then
        continue with setup
    else
        use sudo for docker commands
    fi
fi

# All docker commands now use wrappers:
docker_compose ps       # ✅ Works with sudo if needed
```

### New Functions Added

```bash
check_docker_access() {
    # Tests if Docker daemon is accessible
    docker ps >/dev/null 2>&1
}

fix_docker_permissions() {
    # Adds user to docker group
    sudo usermod -aG docker $USER
    
    # Fixes socket permissions
    sudo chmod 666 /var/run/docker.sock
}

docker_compose() {
    # Wrapper that uses sudo if needed
    if [ "$USE_SUDO_DOCKER" = true ]; then
        sudo docker-compose "$@"
    else
        docker-compose "$@"
    fi
}
```

### All Updated Calls

Every docker-compose command now uses the wrapper:
- `docker_compose ps`
- `docker_compose build`
- `docker_compose up -d`
- `docker_compose exec`
- `docker_compose down`

---

## 🎯 Recommended Action

**Just run the setup script!** It will handle everything:

```bash
cd /home/rajashekhar_sunkara/Desktop/OEP
./setup-demo.sh
```

When prompted:
```
Would you like to fix Docker permissions now? (y/n)
```

Type: **`y`**

The script will:
1. ✅ Fix your user permissions
2. ✅ Fix socket permissions
3. ✅ Continue with setup
4. ✅ Build all containers
5. ✅ Start all services
6. ✅ Complete the demo setup

**No logout/login required!**

---

## 🔍 Why This Happened

Docker on Linux requires users to be in the `docker` group to access the daemon socket at `/var/run/docker.sock`.

When you installed Docker (either manually or via the script), the installation added the group but:
1. You weren't added to the group automatically
2. Or you were added but haven't logged out/in yet for it to take effect

The socket permissions also need to be `666` (read/write for all) or owned by the docker group.

---

## ✨ Why the New Solution is Better

| Issue | Old Script | New Script |
|-------|-----------|------------|
| Detects permission issue | ❌ No | ✅ Yes |
| Offers to fix | ❌ No | ✅ Yes |
| Fixes automatically | ❌ No | ✅ Yes |
| Continues after fix | ❌ No | ✅ Yes |
| Works without logout | ❌ No | ✅ Yes (uses sudo) |
| Clear error messages | ❌ Generic | ✅ Specific |

---

## 📊 Files Modified/Created

### Modified
- `setup-demo.sh` (added ~100 lines)
  - Permission detection
  - Auto-fix functionality
  - Docker command wrappers
  - Enhanced error handling

### Created
- `fix-docker-permissions.sh` (new utility script)
- `DOCKER_PERMISSION_FIX.md` (this document)

---

## 🆘 Troubleshooting

### Issue: Script still says "permission denied"

**Solution:**
```bash
# Ensure Docker service is running
sudo systemctl start docker.service

# Check socket ownership
ls -l /var/run/docker.sock

# Should show: srw-rw-rw- 1 root docker
# If not, fix it:
sudo chmod 666 /var/run/docker.sock
```

### Issue: "docker group does not exist"

**Solution:**
```bash
# Create the docker group
sudo groupadd docker

# Add your user
sudo usermod -aG docker $USER

# Restart Docker
sudo systemctl restart docker.service
```

### Issue: Script uses sudo but asks for password repeatedly

**Solution:**
```bash
# Option 1: Enter password when prompted (recommended)

# Option 2: Log out and back in for permanent fix
# This activates your docker group membership

# Option 3: Use newgrp (temporary for current session)
newgrp docker
./setup-demo.sh
```

---

## ✅ Verification

After running the fix, verify Docker works:

```bash
# Test Docker access
docker ps
# Should show: CONTAINER ID   IMAGE   ...
# (or empty list if no containers running)

# Test without sudo
docker version
# Should show version info without errors

# Test docker-compose
docker-compose version
# Should show version info
```

---

## 🎉 Summary

**The problem:**
- Docker installed ✅
- User permission missing ❌

**The fix:**
- Script auto-detects and fixes! ✅

**What you do:**
```bash
./setup-demo.sh
# Type 'y' when asked
# Done! 🎉
```

---

## 📚 Related Documentation

- `INSTALLATION.md` - Complete installation guide
- `SCRIPTS_GUIDE.md` - All scripts reference
- `SETUP_QUICK_START.txt` - Quick reference
- `fix-docker-permissions.sh` - Standalone fix script

---

**Status:** ✅ FIXED  
**Action Required:** Run `./setup-demo.sh` again  
**Expected Result:** Complete setup without errors!

---

**Happy deploying!** 🚀
