#!/bin/bash

# Key Generation Script for Development Environment
# WARNING: This generates keys for DEVELOPMENT ONLY. 
# DO NOT use these keys in production!

set -e

SECRETS_DIR="./secrets"
PRIVATE_KEY="${SECRETS_DIR}/private_key.pem"
PUBLIC_KEY="${SECRETS_DIR}/public_key.pem"

echo "🔐 Generating development encryption keys..."

# Create secrets directory if it doesn't exist
mkdir -p "${SECRETS_DIR}"

# Check if keys already exist
if [ -f "${PRIVATE_KEY}" ]; then
    echo "⚠️  Private key already exists at ${PRIVATE_KEY}"
    read -p "Do you want to regenerate? This will overwrite existing keys. (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Aborted. Keeping existing keys."
        exit 0
    fi
fi

# Generate RSA private key (4096 bits)
echo "Generating RSA private key (4096 bits)..."
openssl genrsa -out "${PRIVATE_KEY}" 4096

# Extract public key from private key
echo "Extracting public key..."
openssl rsa -in "${PRIVATE_KEY}" -pubout -out "${PUBLIC_KEY}"

# Set appropriate permissions
chmod 600 "${PRIVATE_KEY}"
chmod 644 "${PUBLIC_KEY}"

echo ""
echo "✅ Keys generated successfully!"
echo ""
echo "Private key: ${PRIVATE_KEY}"
echo "Public key:  ${PUBLIC_KEY}"
echo ""
echo "⚠️  IMPORTANT SECURITY NOTES:"
echo "  1. These keys are for DEVELOPMENT ONLY"
echo "  2. Never commit private keys to version control"
echo "  3. The ./secrets directory is gitignored"
echo "  4. For production, use a proper KMS (AWS KMS, GCP KMS, etc.)"
echo ""
echo "📝 Next steps:"
echo "  1. Run 'make dev-up' to start all services"
echo "  2. Run 'make seed' to populate demo data"
echo ""
