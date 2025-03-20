import os
import base64
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC

# Get encryption key from environment, or generate one
def get_or_create_key():
    key = os.environ.get("ENCRYPTION_KEY")
    if not key:
        # Generate a key and print it (for first-time setup)
        salt = os.urandom(16)
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=100000,
        )
        key = base64.urlsafe_b64encode(kdf.derive(b"cloudcostiq"))
        print(f"Generated encryption key: {key.decode()}")
        print("Add this to your .env file as ENCRYPTION_KEY")
    else:
        key = key.encode()
    return key

# Create a Fernet cipher suite
def get_cipher_suite():
    key = get_or_create_key()
    return Fernet(key)

# Functions for encrypting and decrypting data
def encrypt_data(data_string):
    cipher_suite = get_cipher_suite()
    return cipher_suite.encrypt(data_string.encode()).decode()

def decrypt_data(encrypted_string):
    cipher_suite = get_cipher_suite()
    return cipher_suite.decrypt(encrypted_string.encode()).decode()