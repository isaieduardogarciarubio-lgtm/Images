/* ──────────────────────────────────────────────────────────────── */
/* MELI CRYPTOGRAPHY LIBRARY                                        */
/* WebCrypto-based ECDSA P-256, AES-256-GCM, PBKDF2, SHA-256       */
/* ──────────────────────────────────────────────────────────────── */

const CryptoLib = (() => {
  const ITERATIONS = 310000;
  const ALGORITHM_ECDSA = { name: 'ECDSA', namedCurve: 'P-256' };
  const HASH_ALGO = 'SHA-256';

  return {
    /* Generate random passphrase in format MELI-XXXX-XXXX-XXXX-XXXX */
    generatePassphrase() {
      const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      let passphrase = 'MELI-';
      for (let i = 0; i < 4; i++) {
        let segment = '';
        for (let j = 0; j < 4; j++) {
          const idx = Math.floor(Math.random() * chars.length);
          segment += chars[idx];
        }
        passphrase += segment;
        if (i < 3) passphrase += '-';
      }
      return passphrase;
    },

    /* Generate ECDSA P-256 key pair */
    async generateKeyPair() {
      return await crypto.subtle.generateKey(
        ALGORITHM_ECDSA,
        true,
        ['sign', 'verify']
      );
    },

    /* Export public key to JWK */
    async exportPublicKey(publicKey) {
      return await crypto.subtle.exportKey('jwk', publicKey);
    },

    /* Import public key from JWK */
    async importPublicKey(jwk) {
      return await crypto.subtle.importKey(
        'jwk',
        jwk,
        ALGORITHM_ECDSA,
        false,
        ['verify']
      );
    },

    /* Import private key from JWK */
    async importPrivateKey(jwk) {
      return await crypto.subtle.importKey(
        'jwk',
        jwk,
        ALGORITHM_ECDSA,
        false,
        ['sign']
      );
    },

    /* Encrypt private key with passphrase using PBKDF2 + AES-256-GCM */
    async encryptPrivateKey(privateKey, passphrase) {
      const privateJwk = await crypto.subtle.exportKey('jwk', privateKey);
      const privateJsonStr = JSON.stringify(privateJwk);
      const privateBytes = new TextEncoder().encode(privateJsonStr);

      const salt = crypto.getRandomValues(new Uint8Array(16));
      const iv = crypto.getRandomValues(new Uint8Array(12));

      const passphraseKey = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(passphrase),
        'PBKDF2',
        false,
        ['deriveKey']
      );

      const aesKey = await crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt,
          iterations: ITERATIONS,
          hash: HASH_ALGO
        },
        passphraseKey,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt']
      );

      const ciphertext = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        aesKey,
        privateBytes
      );

      return {
        ciphertext: this._toBase64Url(new Uint8Array(ciphertext)),
        salt: this._toBase64Url(salt),
        iv: this._toBase64Url(iv)
      };
    },

    /* Decrypt private key with passphrase */
    async decryptPrivateKey(ciphertextB64, passphrase, saltB64, ivB64) {
      const ciphertext = this._fromBase64Url(ciphertextB64);
      const salt = this._fromBase64Url(saltB64);
      const iv = this._fromBase64Url(ivB64);

      const passphraseKey = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(passphrase),
        'PBKDF2',
        false,
        ['deriveKey']
      );

      const aesKey = await crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt,
          iterations: ITERATIONS,
          hash: HASH_ALGO
        },
        passphraseKey,
        { name: 'AES-GCM', length: 256 },
        false,
        ['decrypt']
      );

      const privateBytes = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        aesKey,
        ciphertext
      );

      const privateJsonStr = new TextDecoder().decode(privateBytes);
      return JSON.parse(privateJsonStr);
    },

    /* Canonical JSON (deterministic) */
    canonicalize(value) {
      if (value === null) return 'null';
      if (typeof value === 'string') return JSON.stringify(value);
      if (typeof value === 'number' || typeof value === 'boolean') return String(value);
      if (Array.isArray(value)) {
        return '[' + value.map(v => this.canonicalize(v)).join(',') + ']';
      }
      if (typeof value === 'object') {
        const keys = Object.keys(value).sort();
        const items = keys.map(k => JSON.stringify(k) + ':' + this.canonicalize(value[k]));
        return '{' + items.join(',') + '}';
      }
      return '';
    },

    /* Sign payload with private key */
    async signPayload(payload, privateKey) {
      const canonical = this.canonicalize(payload);
      const message = new TextEncoder().encode(canonical);

      const signature = await crypto.subtle.sign(
        { name: 'ECDSA', hash: HASH_ALGO },
        privateKey,
        message
      );

      return this._toBase64Url(new Uint8Array(signature));
    },

    /* Verify payload signature with public key */
    async verifySignature(payload, signature, publicKey) {
      try {
        const canonical = this.canonicalize(payload);
        const message = new TextEncoder().encode(canonical);
        const signatureBytes = this._fromBase64Url(signature);

        return await crypto.subtle.verify(
          { name: 'ECDSA', hash: HASH_ALGO },
          publicKey,
          signatureBytes,
          message
        );
      } catch {
        return false;
      }
    },

    /* SHA-256 hash */
    async sha256(data) {
      let bytes;
      if (typeof data === 'string') {
        bytes = new TextEncoder().encode(data);
      } else {
        bytes = data;
      }

      const hashBuffer = await crypto.subtle.digest(HASH_ALGO, bytes);
      return Array.from(new Uint8Array(hashBuffer))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
    },

    /* Base64URL encode/decode */
    _toBase64Url(bytes) {
      let binary = '';
      for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      return btoa(binary)
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
    },

    _fromBase64Url(str) {
      str = str
        .replace(/-/g, '+')
        .replace(/_/g, '/');
      while (str.length % 4) str += '=';
      const binary = atob(str);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      return bytes;
    }
  };
})();
