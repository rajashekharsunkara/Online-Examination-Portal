#!/bin/bash
# Quick OS Detection Test
# This script tests the OS detection logic used in setup-demo.sh

echo "🔍 Detecting your operating system..."
echo ""

# Detect OS
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$ID
    OS_VERSION=$VERSION_ID
    OS_NAME=$NAME
elif [ -f /etc/arch-release ]; then
    OS="arch"
    OS_NAME="Arch Linux"
elif [ -f /etc/debian_version ]; then
    OS="debian"
    OS_NAME="Debian"
elif [ -f /etc/redhat-release ]; then
    OS="rhel"
    OS_NAME="Red Hat Enterprise Linux"
elif [[ "$OSTYPE" == "darwin"* ]]; then
    OS="macos"
    OS_NAME="macOS"
else
    OS="unknown"
    OS_NAME="Unknown"
fi

echo "📌 Detected Information:"
echo "  OS ID:      $OS"
echo "  OS Name:    $OS_NAME"
echo "  OS Version: ${OS_VERSION:-N/A}"
echo ""

# Check what installation method would be used
case "$OS" in
    arch|manjaro|endeavouros)
        echo "✅ Supported: Automatic installation using pacman"
        echo ""
        echo "Commands that would be run:"
        echo "  sudo pacman -Sy --noconfirm"
        echo "  sudo pacman -S --noconfirm docker docker-compose"
        echo "  sudo systemctl start docker.service"
        echo "  sudo systemctl enable docker.service"
        echo "  sudo usermod -aG docker \$USER"
        ;;
    ubuntu|debian|pop)
        echo "✅ Supported: Automatic installation using apt-get"
        echo ""
        echo "Commands that would be run:"
        echo "  sudo apt-get update"
        echo "  sudo apt-get install -y docker.io docker-compose curl jq"
        echo "  sudo systemctl start docker"
        echo "  sudo systemctl enable docker"
        echo "  sudo usermod -aG docker \$USER"
        ;;
    rhel|centos|fedora)
        echo "✅ Supported: Automatic installation using dnf"
        echo ""
        echo "Commands that would be run:"
        echo "  sudo dnf install -y docker docker-compose curl jq"
        echo "  sudo systemctl start docker"
        echo "  sudo systemctl enable docker"
        echo "  sudo usermod -aG docker \$USER"
        ;;
    macos)
        echo "⚠️  macOS detected: Manual Docker Desktop installation required"
        echo ""
        echo "Installation instructions:"
        echo "  brew install --cask docker"
        echo "  brew install docker-compose curl jq"
        ;;
    *)
        echo "❌ Not supported: Automatic installation not available"
        echo ""
        echo "You will need to install Docker manually."
        echo "Visit: https://docs.docker.com/engine/install/"
        ;;
esac

echo ""
echo "🔎 Checking current Docker installation..."
echo ""

# Check Docker
if command -v docker >/dev/null 2>&1; then
    DOCKER_VERSION=$(docker --version 2>/dev/null)
    echo "✅ Docker installed: $DOCKER_VERSION"
else
    echo "❌ Docker not found"
fi

# Check Docker Compose
if command -v docker-compose >/dev/null 2>&1; then
    COMPOSE_VERSION=$(docker-compose --version 2>/dev/null)
    echo "✅ Docker Compose installed: $COMPOSE_VERSION"
elif docker compose version >/dev/null 2>&1; then
    COMPOSE_VERSION=$(docker compose version 2>/dev/null)
    echo "✅ Docker Compose (plugin) installed: $COMPOSE_VERSION"
else
    echo "❌ Docker Compose not found"
fi

# Check if user is in docker group
if groups | grep -q docker; then
    echo "✅ Current user is in docker group"
else
    echo "⚠️  Current user is NOT in docker group"
    echo "   (Normal if Docker is not installed yet)"
fi

# Check if Docker daemon is running
if systemctl is-active --quiet docker 2>/dev/null; then
    echo "✅ Docker service is running"
elif pgrep -x dockerd >/dev/null; then
    echo "✅ Docker daemon is running (non-systemd)"
else
    echo "⚠️  Docker service is not running"
    echo "   (Normal if Docker is not installed yet)"
fi

echo ""
echo "─────────────────────────────────────────"
echo ""

# Determine action
if command -v docker >/dev/null 2>&1; then
    echo "🎉 Docker is already installed!"
    echo ""
    echo "You can run the setup script now:"
    echo "  ./setup-demo.sh"
else
    echo "📦 Docker is not installed."
    echo ""
    echo "The setup script will automatically install it for you!"
    echo "  ./setup-demo.sh"
    echo ""
    echo "Or install manually using the commands shown above."
fi

echo ""
