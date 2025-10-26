"""
Decryption Service
Backend service for decrypting student exam answers
Uses same AES-256-GCM + PBKDF2 as client-side encryption
"""
import base64
import hashlib
import json
from typing import Any, Dict, List
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.backends import default_backend


# Constants (must match client-side)
ITERATIONS = 250000  # PBKDF2 iterations
KEY_LENGTH = 32  # 256 bits for AES-256
IV_LENGTH = 12  # GCM standard IV length
SALT_LENGTH = 16  # 128 bits


class DecryptionError(Exception):
    """Custom exception for decryption failures"""
    pass


def derive_encryption_password(username: str, exam_id: int, timestamp: str) -> str:
    """
    Derive encryption password from student context
    Must match client-side derivation exactly
    
    Args:
        username: Student username
        exam_id: Exam ID
        timestamp: ISO8601 submission timestamp
        
    Returns:
        Derived password string
    """
    return f"{username}:{exam_id}:{timestamp}"


def derive_key(password: str, salt: bytes) -> bytes:
    """
    Derive AES-256 key from password using PBKDF2
    
    Args:
        password: Password string
        salt: Salt bytes (16 bytes)
        
    Returns:
        32-byte AES key
    """
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=KEY_LENGTH,
        salt=salt,
        iterations=ITERATIONS,
        backend=default_backend()
    )
    return kdf.derive(password.encode('utf-8'))


def decrypt_data(encrypted_data: str, password: str) -> Any:
    """
    Decrypt data using AES-256-GCM
    
    Args:
        encrypted_data: Base64-encoded encrypted data (salt+iv+ciphertext)
        password: Password for key derivation
        
    Returns:
        Decrypted data (parsed from JSON)
        
    Raises:
        DecryptionError: If decryption fails or authentication tag invalid
    """
    try:
        # Decode from base64
        combined_data = base64.b64decode(encrypted_data)
        
        # Extract salt, IV, and ciphertext
        salt = combined_data[:SALT_LENGTH]
        iv = combined_data[SALT_LENGTH:SALT_LENGTH + IV_LENGTH]
        ciphertext = combined_data[SALT_LENGTH + IV_LENGTH:]
        
        # Derive decryption key
        key = derive_key(password, salt)
        
        # Decrypt using AES-GCM
        aesgcm = AESGCM(key)
        plaintext = aesgcm.decrypt(iv, ciphertext, None)
        
        # Parse JSON
        json_string = plaintext.decode('utf-8')
        return json.loads(json_string)
        
    except Exception as e:
        raise DecryptionError(f"Decryption failed: {str(e)}")


def decrypt_answers(
    encrypted_answers: str,
    username: str,
    exam_id: int,
    timestamp: str
) -> List[Dict[str, Any]]:
    """
    Decrypt exam answers
    
    Args:
        encrypted_answers: Base64-encoded encrypted answers
        username: Student username
        exam_id: Exam ID
        timestamp: ISO8601 submission timestamp
        
    Returns:
        List of decrypted answer objects
        
    Raises:
        DecryptionError: If decryption fails or metadata doesn't match
    """
    # Derive password
    password = derive_encryption_password(username, exam_id, timestamp)
    
    # Decrypt
    payload = decrypt_data(encrypted_answers, password)
    
    # Verify metadata
    if payload.get('username') != username:
        raise DecryptionError(f"Username mismatch: expected {username}, got {payload.get('username')}")
    
    if payload.get('examId') != exam_id:
        raise DecryptionError(f"Exam ID mismatch: expected {exam_id}, got {payload.get('examId')}")
    
    # Return answers
    return payload.get('answers', [])


def verify_checksum(encrypted_data: str, expected_checksum: str) -> bool:
    """
    Verify SHA-256 checksum of encrypted data
    
    Args:
        encrypted_data: Base64-encoded encrypted data
        expected_checksum: Expected SHA-256 checksum (base64)
        
    Returns:
        True if checksum matches, False otherwise
    """
    try:
        # Generate checksum
        data_bytes = encrypted_data.encode('utf-8')
        hash_obj = hashlib.sha256(data_bytes)
        computed_checksum = base64.b64encode(hash_obj.digest()).decode('utf-8')
        
        return computed_checksum == expected_checksum
    except Exception:
        return False


def decrypt_attempt_answers(
    attempt,
    username: str
) -> List[Dict[str, Any]]:
    """
    Decrypt answers from a StudentAttempt object
    
    Args:
        attempt: StudentAttempt ORM object with encrypted_final_answers
        username: Student username for verification
        
    Returns:
        List of decrypted answer objects
        
    Raises:
        DecryptionError: If decryption fails
        ValueError: If required fields are missing
    """
    # Validate required fields
    if not attempt.encrypted_final_answers:
        raise ValueError("No encrypted answers found in attempt")
    
    if not attempt.encryption_timestamp:
        raise ValueError("No encryption timestamp found in attempt")
    
    # Verify checksum if available
    if attempt.encryption_checksum:
        if not verify_checksum(attempt.encrypted_final_answers, attempt.encryption_checksum):
            raise DecryptionError("Checksum verification failed - data may be corrupted")
    
    # Decrypt answers
    timestamp = attempt.encryption_timestamp.isoformat()
    
    return decrypt_answers(
        encrypted_answers=attempt.encrypted_final_answers,
        username=username,
        exam_id=attempt.exam_id,
        timestamp=timestamp
    )


# Example usage for testing
if __name__ == "__main__":
    # This would be used in grading service
    print("Decryption service loaded")
    print(f"Using PBKDF2 with {ITERATIONS} iterations and SHA-256")
    print(f"AES-{KEY_LENGTH * 8}-GCM encryption")
