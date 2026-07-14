"""Authenticated encryption for external music provider credentials."""

from __future__ import annotations

import os
from dataclasses import dataclass
from typing import TYPE_CHECKING

from cryptography.exceptions import InvalidTag
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives.kdf.hkdf import HKDF

if TYPE_CHECKING:
    from uuid import UUID

    from kernelon_api.modules.music.application import MusicAccountProvider

ENCRYPTION_VERSION = 1
NONCE_SIZE = 12
KEY_DERIVATION_SALT = b"KernelOn music credential key derivation\x00v1"
KEY_DERIVATION_INFO = b"kernelon/music-account-credential/aes-256-gcm/v1"
AAD_DOMAIN = b"kernelon/music-account-credential/aad"


class MusicCredentialDecryptionError(RuntimeError):
    """A credential failed authenticated decryption without exposing its contents."""


@dataclass(frozen=True, slots=True)
class EncryptedMusicCredential:
    """Database-safe authenticated ciphertext envelope."""

    ciphertext: bytes
    nonce: bytes
    version: int


class MusicCredentialCipher:
    """Derive a domain-separated AES-GCM key from KernelOn's configured root secret."""

    def __init__(self, root_secret: str) -> None:
        key = HKDF(
            algorithm=hashes.SHA256(),
            length=32,
            salt=KEY_DERIVATION_SALT,
            info=KEY_DERIVATION_INFO,
        ).derive(root_secret.encode())
        self._cipher = AESGCM(key)

    def encrypt(
        self,
        user_id: UUID,
        provider: MusicAccountProvider,
        plaintext: str,
    ) -> EncryptedMusicCredential:
        nonce = os.urandom(NONCE_SIZE)
        ciphertext = self._cipher.encrypt(
            nonce,
            plaintext.encode(),
            self._aad(user_id, provider, ENCRYPTION_VERSION),
        )
        return EncryptedMusicCredential(ciphertext, nonce, ENCRYPTION_VERSION)

    def decrypt(
        self,
        user_id: UUID,
        provider: MusicAccountProvider,
        encrypted: EncryptedMusicCredential,
    ) -> str:
        try:
            plaintext = self._cipher.decrypt(
                encrypted.nonce,
                encrypted.ciphertext,
                self._aad(user_id, provider, encrypted.version),
            )
            return plaintext.decode()
        except (InvalidTag, UnicodeDecodeError, ValueError) as exc:
            raise MusicCredentialDecryptionError from exc

    @staticmethod
    def _aad(user_id: UUID, provider: MusicAccountProvider, version: int) -> bytes:
        return b"\x00".join(
            (AAD_DOMAIN, str(version).encode("ascii"), user_id.bytes, provider.encode("ascii"))
        )
