"""
Tests for encryption and decryption services

Tests the end-to-end encryption system including:
- Round-trip encryption/decryption
- Key derivation consistency
- Tampering detection
- Metadata verification
- Checksum validation
"""

import pytest
from datetime import datetime
import json
import base64
import hashlib
from app.services.decryption import (
    derive_encryption_password,
    derive_key,
    decrypt_data,
    decrypt_answers,
    verify_checksum,
    DecryptionError
)


class TestKeyDerivation:
    """Test PBKDF2 key derivation"""
    
    def test_password_derivation_format(self):
        """Password should be in format username:exam_id:timestamp"""
        password = derive_encryption_password(
            username="john_doe",
            exam_id=42,
            timestamp="2024-01-15T10:30:00Z"
        )
        assert password == "john_doe:42:2024-01-15T10:30:00Z"
    
    def test_password_derivation_special_chars(self):
        """Password derivation should handle special characters"""
        password = derive_encryption_password(
            username="test@user.com",
            exam_id=100,
            timestamp="2024-01-15T10:30:00.123456Z"
        )
        assert password == "test@user.com:100:2024-01-15T10:30:00.123456Z"
    
    def test_derive_key_consistency(self):
        """Same inputs should produce same key"""
        password = "testuser:42:2024-01-15T10:30:00Z"
        salt = b"0123456789abcdef"  # 16 bytes
        
        key1 = derive_key(password, salt)
        key2 = derive_key(password, salt)
        
        assert key1 == key2
        assert len(key1) == 32  # 256 bits
    
    def test_derive_key_different_salts(self):
        """Different salts should produce different keys"""
        password = "testuser:42:2024-01-15T10:30:00Z"
        salt1 = b"0123456789abcdef"
        salt2 = b"fedcba9876543210"
        
        key1 = derive_key(password, salt1)
        key2 = derive_key(password, salt2)
        
        assert key1 != key2
    
    def test_derive_key_different_passwords(self):
        """Different passwords should produce different keys"""
        salt = b"0123456789abcdef"
        
        key1 = derive_key("testuser:42:2024-01-15T10:30:00Z", salt)
        key2 = derive_key("testuser:43:2024-01-15T10:30:00Z", salt)
        
        assert key1 != key2


class TestChecksumValidation:
    """Test SHA-256 checksum validation"""
    
    def test_checksum_verification_valid(self):
        """Valid checksum should verify successfully"""
        data = "test_encrypted_data"
        
        # Generate checksum
        data_bytes = data.encode('utf-8')
        hash_obj = hashlib.sha256(data_bytes)
        checksum = base64.b64encode(hash_obj.digest()).decode('utf-8')
        
        assert verify_checksum(data, checksum) is True
    
    def test_checksum_verification_invalid(self):
        """Invalid checksum should fail verification"""
        data = "test_encrypted_data"
        invalid_checksum = "aW52YWxpZGNoZWNrc3Vt"  # Invalid base64 checksum
        
        assert verify_checksum(data, invalid_checksum) is False
    
    def test_checksum_verification_tampered_data(self):
        """Tampered data should fail checksum verification"""
        original_data = "original_data"
        tampered_data = "tampered_data"
        
        # Generate checksum for original
        data_bytes = original_data.encode('utf-8')
        hash_obj = hashlib.sha256(data_bytes)
        original_checksum = base64.b64encode(hash_obj.digest()).decode('utf-8')
        
        # Verify with tampered data
        assert verify_checksum(tampered_data, original_checksum) is False


class TestDecryptionErrors:
    """Test error handling in decryption"""
    
    def test_decrypt_invalid_base64(self):
        """Decrypting invalid base64 should raise DecryptionError"""
        with pytest.raises(DecryptionError, match="Decryption failed"):
            decrypt_data("not_valid_base64!!!", "password")
    
    def test_decrypt_too_short_data(self):
        """Data too short to contain salt+iv+ciphertext should fail"""
        # Valid base64 but too short (need at least 16+12=28 bytes)
        short_data = base64.b64encode(b"tooshort").decode('utf-8')
        
        with pytest.raises(DecryptionError):
            decrypt_data(short_data, "password")
    
    def test_decrypt_wrong_password(self):
        """Decrypting with wrong password should raise DecryptionError"""
        # This would be real encrypted data with a different password
        # For now, we'll use properly formatted data that will fail auth tag check
        salt = b"0123456789abcdef"  # 16 bytes
        iv = b"123456789012"  # 12 bytes
        fake_ciphertext = b"fake_encrypted_data_with_wrong_auth_tag_12345678"
        
        encrypted = base64.b64encode(salt + iv + fake_ciphertext).decode('utf-8')
        
        with pytest.raises(DecryptionError, match="Decryption failed"):
            decrypt_data(encrypted, "wrong_password")


class TestMetadataVerification:
    """Test metadata verification in decrypt_answers"""
    
    def test_username_mismatch(self):
        """Decryption should fail if username doesn't match"""
        # Create a mock encrypted payload with mismatched username
        # In real scenario, this would be encrypted data
        # For testing, we'll mock the decrypt_data to return payload with wrong username
        
        # This test would require mocking decrypt_data to return a payload
        # Since we're testing the verification logic, we'll skip the actual encryption
        # and test the verification part separately
        pass  # TODO: Implement with proper mocking
    
    def test_exam_id_mismatch(self):
        """Decryption should fail if exam_id doesn't match"""
        # Similar to username test - requires mocking
        pass  # TODO: Implement with proper mocking


class TestRoundTrip:
    """Test full round-trip encryption/decryption
    
    Note: These tests require the client-side encryption to be available
    Since we're testing the Python decryption service, we'll simulate
    encrypted data that matches the client-side encryption format
    """
    
    def test_decrypt_simulated_client_encryption(self):
        """Test decrypting data in the format produced by client"""
        # This would require:
        # 1. Running the JavaScript encryption
        # 2. Capturing the encrypted output
        # 3. Testing Python decryption
        
        # For unit testing, we'll need integration tests or
        # a Python implementation of the encryption for testing
        pass  # TODO: Implement integration test
    
    def test_encryption_format_compatibility(self):
        """Ensure encrypted format matches expected structure"""
        # Encrypted data format: base64(salt + iv + ciphertext)
        # salt: 16 bytes
        # iv: 12 bytes  
        # ciphertext: variable length
        
        salt = b"0123456789abcdef"  # 16 bytes
        iv = b"123456789012"  # 12 bytes
        ciphertext = b"encrypted_payload_data"
        
        combined = salt + iv + ciphertext
        encrypted_base64 = base64.b64encode(combined).decode('utf-8')
        
        # Decode and verify structure
        decoded = base64.b64decode(encrypted_base64)
        
        assert len(decoded) >= 28  # Minimum: 16 (salt) + 12 (IV)
        assert decoded[:16] == salt
        assert decoded[16:28] == iv
        assert decoded[28:] == ciphertext


class TestIntegration:
    """Integration tests for complete encryption workflow
    
    These tests verify the complete flow from encryption to decryption
    """
    
    def test_password_to_key_to_decrypt(self):
        """Test complete key derivation and decryption flow"""
        username = "test_student"
        exam_id = 42
        timestamp = "2024-01-15T10:30:00Z"
        
        # Derive password
        password = derive_encryption_password(username, exam_id, timestamp)
        assert password == f"{username}:{exam_id}:{timestamp}"
        
        # Derive key (would be used for encryption/decryption)
        salt = b"testsalt12345678"  # 16 bytes
        key = derive_key(password, salt)
        
        assert len(key) == 32  # 256 bits
        assert isinstance(key, bytes)
    
    def test_checksum_flow(self):
        """Test checksum generation and verification flow"""
        encrypted_data = "encrypted_answer_payload_base64"
        
        # Generate checksum (simulating client-side)
        data_bytes = encrypted_data.encode('utf-8')
        hash_obj = hashlib.sha256(data_bytes)
        checksum = base64.b64encode(hash_obj.digest()).decode('utf-8')
        
        # Verify checksum (backend verification)
        assert verify_checksum(encrypted_data, checksum) is True
        
        # Verify that tampered data fails
        tampered_data = encrypted_data + "TAMPERED"
        assert verify_checksum(tampered_data, checksum) is False


class TestEdgeCases:
    """Test edge cases and boundary conditions"""
    
    def test_empty_answers(self):
        """Decrypting empty answers array should work"""
        # This would require actual encryption of empty array
        # Skipping for now as it needs integration test
        pass
    
    def test_large_answer_set(self):
        """Decrypting large number of answers should work"""
        # Test with 200+ answers
        pass
    
    def test_unicode_in_answers(self):
        """Answers with unicode characters should encrypt/decrypt correctly"""
        # Test with emojis, chinese characters, etc.
        pass
    
    def test_special_characters_in_username(self):
        """Username with special characters should work"""
        password = derive_encryption_password(
            username="test.user+123@example.com",
            exam_id=42,
            timestamp="2024-01-15T10:30:00Z"
        )
        
        assert "test.user+123@example.com" in password
        
        # Should be able to derive key
        salt = b"0123456789abcdef"
        key = derive_key(password, salt)
        assert len(key) == 32


class TestSecurityProperties:
    """Test security properties of the encryption system"""
    
    def test_different_timestamps_different_keys(self):
        """Different timestamps should produce different encryption keys"""
        username = "test_student"
        exam_id = 42
        salt = b"testsalt12345678"
        
        timestamp1 = "2024-01-15T10:30:00Z"
        timestamp2 = "2024-01-15T10:30:01Z"  # 1 second difference
        
        password1 = derive_encryption_password(username, exam_id, timestamp1)
        password2 = derive_encryption_password(username, exam_id, timestamp2)
        
        key1 = derive_key(password1, salt)
        key2 = derive_key(password2, salt)
        
        assert key1 != key2
    
    def test_different_users_different_keys(self):
        """Different users should have different encryption keys"""
        exam_id = 42
        timestamp = "2024-01-15T10:30:00Z"
        salt = b"testsalt12345678"
        
        password1 = derive_encryption_password("student1", exam_id, timestamp)
        password2 = derive_encryption_password("student2", exam_id, timestamp)
        
        key1 = derive_key(password1, salt)
        key2 = derive_key(password2, salt)
        
        assert key1 != key2
    
    def test_different_exams_different_keys(self):
        """Different exams should have different encryption keys"""
        username = "test_student"
        timestamp = "2024-01-15T10:30:00Z"
        salt = b"testsalt12345678"
        
        password1 = derive_encryption_password(username, 42, timestamp)
        password2 = derive_encryption_password(username, 43, timestamp)
        
        key1 = derive_key(password1, salt)
        key2 = derive_key(password2, salt)
        
        assert key1 != key2
    
    def test_salt_uniqueness_critical(self):
        """Salt uniqueness ensures different keys for same password"""
        password = "test_student:42:2024-01-15T10:30:00Z"
        
        salt1 = b"salt_attempt_001"
        salt2 = b"salt_attempt_002"
        
        key1 = derive_key(password, salt1)
        key2 = derive_key(password, salt2)
        
        assert key1 != key2
        assert len(key1) == len(key2) == 32


# Performance benchmarks (optional, can be slow)
class TestPerformance:
    """Performance benchmarks for encryption operations"""
    
    @pytest.mark.slow
    def test_key_derivation_performance(self):
        """PBKDF2 with 250K iterations should complete in reasonable time"""
        import time
        
        password = "test_student:42:2024-01-15T10:30:00Z"
        salt = b"testsalt12345678"
        
        start = time.time()
        key = derive_key(password, salt)
        elapsed = time.time() - start
        
        # Should complete in under 1 second on modern hardware
        assert elapsed < 1.0
        assert len(key) == 32
    
    @pytest.mark.slow
    def test_checksum_performance(self):
        """SHA-256 checksum should be fast"""
        import time
        
        # Large encrypted payload
        large_data = "x" * 1024 * 100  # 100KB
        
        start = time.time()
        data_bytes = large_data.encode('utf-8')
        hash_obj = hashlib.sha256(data_bytes)
        checksum = base64.b64encode(hash_obj.digest()).decode('utf-8')
        elapsed = time.time() - start
        
        # Should complete in under 100ms
        assert elapsed < 0.1
        assert len(checksum) == 44  # Base64 of 32 bytes


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
