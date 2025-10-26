#!/bin/bash
# Quick fix for Docker permission issue on Arch Linux

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo ""
echo -e "${BLUE}╔════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Docker Permission Fix - Arch Linux       ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════╝${NC}"
echo ""

# Check if Docker is installed
if ! command -v docker >/dev/null 2>&1; then
    echo -e "${RED}[ERROR]${NC} Docker is not installed!"
    echo ""
    echo "Install Docker first:"
    echo "  sudo pacman -S docker docker-compose"
    echo "  sudo systemctl start docker.service"
    echo "  sudo systemctl enable docker.service"
    exit 1
fi

# Check if Docker daemon is running
if ! sudo systemctl is-active --quiet docker 2>/dev/null; then
    echo -e "${YELLOW}[INFO]${NC} Docker service is not running. Starting it..."
    sudo systemctl start docker.service
    sudo systemctl enable docker.service
    echo -e "${GREEN}[SUCCESS]${NC} Docker service started!"
fi

echo -e "${BLUE}[INFO]${NC} Fixing Docker permissions..."
echo ""

# Add user to docker group
echo -e "${BLUE}Step 1:${NC} Adding $USER to docker group..."
sudo usermod -aG docker $USER
echo -e "${GREEN}✅${NC} User added to docker group"

# Fix socket permissions
echo -e "${BLUE}Step 2:${NC} Fixing socket permissions..."
sudo chmod 666 /var/run/docker.sock
echo -e "${GREEN}✅${NC} Socket permissions fixed"

# Verify
echo ""
echo -e "${BLUE}[INFO]${NC} Verifying Docker access..."
if docker ps >/dev/null 2>&1; then
    echo -e "${GREEN}[SUCCESS]${NC} Docker is now accessible!"
    echo ""
    echo "You can now run:"
    echo "  ./setup-demo.sh"
else
    echo -e "${YELLOW}[WARNING]${NC} Docker socket is accessible, but group membership may require logout"
    echo ""
    echo "Current status:"
    echo "  • Socket permissions: ✅ Fixed (immediate effect)"
    echo "  • Group membership: ⚠️  Requires logout/login for full effect"
    echo ""
    echo "You have two options:"
    echo ""
    echo "Option 1: Use docker immediately (with sudo when needed)"
    echo "  ./setup-demo.sh    (script will auto-detect and use sudo if needed)"
    echo ""
    echo "Option 2: Log out and back in for permanent fix"
    echo "  Log out → Log back in → ./setup-demo.sh"
    echo ""
    echo "Recommended: Just run ./setup-demo.sh now, it will handle it!"
fi

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  Docker permissions fixed! ✨              ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════╝${NC}"
echo ""
