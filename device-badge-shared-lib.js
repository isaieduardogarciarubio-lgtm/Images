/* Device Badge Shared Cryptographic Library
   Used by: device-badge-admin.html, device-badge-issuer.html, device-badge-verifier.html

   This code is stored in Grid document state bucket "shared_libs" and dynamically
   loaded by each app to ensure consistency. Updating this file automatically
   propagates to all apps without individual re-deployment.
*/

const CryptoLib = (() => {
  const ITERATIONS = 310000;
  const ALGORITHM_ECDSA = { name: 'ECDSA', namedCurve: 'P-256' };
  const HASH_ALGO = 'SHA-256';

  return {
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

    async generateKeyPair() {
      return await crypto.subtle.generateKey(
        ALGORITHM_ECDSA,
        true,
        ['sign', 'verify']
      );
    },

    async exportPublicKey(publicKey) {
      return await crypto.subtle.exportKey('jwk', publicKey);
    },

    async importPublicKey(jwk) {
      return await crypto.subtle.importKey(
        'jwk',
        jwk,
        ALGORITHM_ECDSA,
        false,
        ['verify']
      );
    },

    async importPrivateKey(jwk) {
      return await crypto.subtle.importKey(
        'jwk',
        jwk,
        ALGORITHM_ECDSA,
        false,
        ['sign']
      );
    },

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

      let privateBytes;
      try {
        privateBytes = await crypto.subtle.decrypt(
          { name: 'AES-GCM', iv },
          aesKey,
          ciphertext
        );
      } catch {
        throw new Error('Passphrase incorrecta');
      }

      const privateJsonStr = new TextDecoder().decode(privateBytes);
      return JSON.parse(privateJsonStr);
    },

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

const GridAPI = (() => {
  const MAX_RETRIES = 3;
  const RETRY_DELAY = 500;

  async function retry(fn) {
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        return await fn();
      } catch (err) {
        if (attempt < MAX_RETRIES - 1 && err.status === 409) {
          await new Promise(r => setTimeout(r, RETRY_DELAY * Math.pow(2, attempt)));
        } else {
          throw err;
        }
      }
    }
  }

  async function fetchJson(url, options = {}) {
    const opts = {
      credentials: 'include',
      ...options
    };
    if (opts.body && typeof opts.body === 'object') {
      opts.headers = { ...opts.headers, 'Content-Type': 'application/json' };
      opts.body = JSON.stringify(opts.body);
    }
    const res = await fetch(url, opts);
    if (!res.ok) {
      let detail = '';
      try {
        const body = await res.json();
        detail = body && (body.detail || body.error || body.message)
          ? (typeof (body.detail || body.error || body.message) === 'string'
              ? (body.detail || body.error || body.message)
              : JSON.stringify(body.detail || body.error || body.message))
          : JSON.stringify(body);
      } catch {
        try { detail = await res.text(); } catch {}
      }
      const err = new Error(`HTTP ${res.status}${detail ? ': ' + detail : ''}`);
      err.status = res.status;
      err.detail = detail;
      throw err;
    }
    return res.json();
  }

  return {
    async getMe() {
      return fetchJson('/api/v1/me');
    },

    async readState(name, defaultValue = null, docId = null) {
      const targetDocId = docId || (window.GRID && window.GRID.docId);
      if (!targetDocId) {
        throw new Error('GRID.docId not set');
      }
      const cacheKey = `${targetDocId}::${name}`;
      const url = `/api/v1/documents/${targetDocId}/states/${encodeURIComponent(name)}`;
      let res;
      try {
        res = await fetchJson(url);
      } catch (err) {
        if (err.status === 404) return defaultValue;
        throw err;
      }
      if (window.GRID._stateUpdatedAtByName) {
        window.GRID._stateUpdatedAtByName[cacheKey] = res.updated_at;
      }
      const state = res.state;
      if (state === undefined || state === null) return defaultValue;
      if (Array.isArray(defaultValue) && !Array.isArray(state)) return defaultValue;
      return state;
    },

    async readList(name, docId = null) {
      const wrapped = await this.readState(name, { list: [] }, docId);
      return Array.isArray(wrapped.list) ? wrapped.list : [];
    },

    async writeList(name, arr, docId = null) {
      return this.setState(name, { list: arr }, docId);
    },

    async setState(name, state, docId = null) {
      const targetDocId = docId || (window.GRID && window.GRID.docId);
      if (!targetDocId) {
        throw new Error('GRID.docId not set');
      }

      const cacheKey = `${targetDocId}::${name}`;
      const url = `/api/v1/documents/${targetDocId}/states/${encodeURIComponent(name)}`;
      const ifUpdatedAt = window.GRID._stateUpdatedAtByName && window.GRID._stateUpdatedAtByName[cacheKey];

      const fn = async () => {
        const res = await fetchJson(url, {
          method: 'PUT',
          body: { state, if_updated_at: ifUpdatedAt || '' }
        });
        if (window.GRID._stateUpdatedAtByName) {
          window.GRID._stateUpdatedAtByName[cacheKey] = res.updated_at;
        }
        return res;
      };

      return retry(fn);
    },

    async patchState(name, patch, docId = null) {
      const targetDocId = docId || (window.GRID && window.GRID.docId);
      if (!targetDocId) {
        throw new Error('GRID.docId not set');
      }

      const cacheKey = `${targetDocId}::${name}`;
      const url = `/api/v1/documents/${targetDocId}/states/${encodeURIComponent(name)}`;
      const ifUpdatedAt = window.GRID._stateUpdatedAtByName && window.GRID._stateUpdatedAtByName[cacheKey];

      const fn = async () => {
        const res = await fetchJson(url, {
          method: 'PATCH',
          body: { patch, if_updated_at: ifUpdatedAt || '' }
        });
        if (window.GRID._stateUpdatedAtByName) {
          window.GRID._stateUpdatedAtByName[cacheKey] = res.updated_at;
        }
        return res;
      };

      return retry(fn);
    },

    BUCKET_DEFAULTS: {
      trusted_issuers: { issuers: [], signature: null, signed_by_root_at: null },
      issuer_keys: { list: [] },
      pending_issuers: {},
      badge_registry: {},
      checkpoints: {},
      public_config: {}
    },

    async initDefaultBuckets() {
      const buckets = ['trusted_issuers', 'issuer_keys', 'pending_issuers', 'badge_registry', 'checkpoints', 'public_config'];
      for (const bucket of buckets) {
        const existing = await this.readState(bucket, undefined);
        if (existing === undefined) {
          await this.setState(bucket, this.BUCKET_DEFAULTS[bucket]);
        }
      }
    }
  };
})();
