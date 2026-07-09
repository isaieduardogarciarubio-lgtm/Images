/* ──────────────────────────────────────────────────────────────── */
/* MELI GRID API WRAPPER                                            */
/* Unified interface for reading/writing state buckets and states   */
/* ──────────────────────────────────────────────────────────────── */

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
    if (options.body && typeof options.body === 'object') {
      options.headers = { ...options.headers, 'Content-Type': 'application/json' };
      options.body = JSON.stringify(options.body);
    }
    const res = await fetch(url, opts);
    if (!res.ok) {
      const err = new Error(`HTTP ${res.status}`);
      err.status = res.status;
      throw err;
    }
    return res.json();
  }

  return {
    /* Get current user info from /api/v1/me */
    async getMe() {
      return fetchJson('/api/v1/me');
    },

    /* Read state bucket by name */
    async readState(name) {
      if (!window.GRID || !window.GRID.docId) {
        throw new Error('GRID.docId not set');
      }
      const url = `/api/v1/documents/${window.GRID.docId}/states/${encodeURIComponent(name)}`;
      const res = await fetchJson(url);
      if (window.GRID._stateUpdatedAtByName) {
        window.GRID._stateUpdatedAtByName[name] = res.updated_at;
      }
      return res.state || {};
    },

    /* Write state bucket (PUT with control optimistic) */
    async setState(name, state) {
      if (!window.GRID || !window.GRID.docId) {
        throw new Error('GRID.docId not set');
      }

      const url = `/api/v1/documents/${window.GRID.docId}/states/${encodeURIComponent(name)}`;
      const ifUpdatedAt = window.GRID._stateUpdatedAtByName && window.GRID._stateUpdatedAtByName[name];

      const fn = async () => {
        const res = await fetchJson(url, {
          method: 'PUT',
          body: {
            state,
            if_updated_at: ifUpdatedAt || ''
          }
        });
        if (window.GRID._stateUpdatedAtByName) {
          window.GRID._stateUpdatedAtByName[name] = res.updated_at;
        }
        return res;
      };

      return retry(fn);
    },

    /* Patch state bucket */
    async patchState(name, patch) {
      if (!window.GRID || !window.GRID.docId) {
        throw new Error('GRID.docId not set');
      }

      const url = `/api/v1/documents/${window.GRID.docId}/states/${encodeURIComponent(name)}`;
      const ifUpdatedAt = window.GRID._stateUpdatedAtByName && window.GRID._stateUpdatedAtByName[name];

      const fn = async () => {
        const res = await fetchJson(url, {
          method: 'PATCH',
          body: {
            patch,
            if_updated_at: ifUpdatedAt || ''
          }
        });
        if (window.GRID._stateUpdatedAtByName) {
          window.GRID._stateUpdatedAtByName[name] = res.updated_at;
        }
        return res;
      };

      return retry(fn);
    },

    /* Initialize default state buckets if needed */
    async initDefaultBuckets() {
      const buckets = ['trusted_issuers', 'issuer_keys', 'pending_issuers', 'badge_registry', 'checkpoints', 'public_config'];
      for (const bucket of buckets) {
        try {
          await this.readState(bucket);
        } catch {
          const defaults = {
            trusted_issuers: { issuers: [], signature: null, signed_by_root_at: null },
            issuer_keys: [],
            pending_issuers: {},
            badge_registry: {},
            checkpoints: {},
            public_config: { version: '1.0', created_at: new Date().toISOString() }
          };
          if (defaults[bucket]) {
            await this.setState(bucket, defaults[bucket]);
          }
        }
      }
    }
  };
})();
