# Secrets Directory

This directory contains sensitive cryptographic keys and credentials used in the application.

## ⚠️ SECURITY WARNING

**NEVER commit actual secret files to version control!**

This directory is gitignored to prevent accidental commits.

## Development Setup

For local development, generate keys using:

```bash
make gen-keys
# or
./scripts/gen-keys.sh
```

This will create:
- `private_key.pem` - RSA private key (4096-bit) for decrypting exam submissions
- `public_key.pem` - RSA public key (distributed to clients for encryption)

## Production Setup

**DO NOT use development keys in production!**

For production environments:

1. Use a proper Key Management Service (KMS):
   - AWS KMS
   - Google Cloud KMS
   - Azure Key Vault
   - HashiCorp Vault

2. Configure the application to retrieve keys from KMS at runtime

3. Implement key rotation policies

4. Enable audit logging for all key access

## File Structure (Development)

```
secrets/
├── private_key.pem     # RSA private key (gitignored)
├── public_key.pem      # RSA public key (gitignored)
└── README.md           # This file
```

## Key Usage

- **Public Key**: Embedded in the student exam client for encrypting final exam submissions
- **Private Key**: Used by admin dashboard to decrypt submissions for grading/review

## Permissions

The generated keys should have appropriate file permissions:
- Private key: `600` (read/write for owner only)
- Public key: `644` (read for all, write for owner)
