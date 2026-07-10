# Device Badge System — Threat Model & Residual Risk Assessment

## Executive Summary

This threat model identifies residual security risks in the Device Badge cryptographic system after Phase 1 mitigations (shared libraries removal, registry-as-index optimization, and signature-gap closure). The system is production-ready with understood limitations and documented compensating controls.

---

## Trust Model

### Root of Trust
- **Root public key**: Pinned in verifier HTML source code (PINNED_ROOT_PUBLIC_KEY_JWK)
- **Issuer list**: Signed by root key, stored in Grid's public_config bucket
- **Badge events**: Cryptographically signed by issuer private key, stored in per-issuer ledger buckets
- **Verifier baseline**: Signature validation + time-based expiration checks

### Key Assumptions
1. **Verifier deployment is immutable** — The pinned root key in verifier.html is the source of truth
2. **Grid ACLs are enforced** — Editor access to a bucket implies full control; permissions are correctly configured
3. **Private keys remain in admin memory only** — Never persisted to disk or localStorage
4. **Issuer keys are not shared** — One issuer = one private key = one ledger bucket

---

## Identified Residual Risks

### RISK 1: Issuer Can Forge/Edit Badges Between Checkpoints

**Threat**: An issuer with private key access can:
- Issue fraudulent badges with arbitrary device data
- Back-date or future-date badge issue timestamps
- Edit device_id, owner_name, or other badge fields in their ledger

**Impact**: HIGH — Attacker can issue fake badges appearing to come from a trusted issuer

**Current Mitigations**:
1. **Checkpoint anchoring**: Admin app creates signed checkpoint entries containing `latest_event_hash` for each issuer. Verifier checks hash chain against checkpoint if present.
2. **Hash chain validation**: If a checkpoint exists and event signature is valid but event hash doesn't match ledger hash chain, verification fails.
3. **Revocation**: Admin can revoke issuer key by updating trusted_issuers, causing all future badges to verify against the revoked key (which fails).

**Residual Risk**: If no checkpoint has been created since the fraudulent badges were issued, verification cannot detect tampering. Checkpoints are created on-demand; stale or missing checkpoints mean no integrity anchor.

**Mitigation Timeline**:
- Auto-checkpoint on admin app open (checks 24h staleness)
- Manual checkpoint trigger available in admin UI
- Operator should establish cadence: e.g., daily checkpoints or per-change

**Recommendation**: For high-assurance deployments, enable automated daily checkpoints and require operator sign-off on checkpoint integrity before accepting badges issued since the last checkpoint.

---

### RISK 2: Admin/Root Key Compromise

**Threat**: An attacker with access to the root private key can:
- Sign a fake issuer list, promoting unauthorized issuers
- Revoke legitimate issuers
- Rotate the root key, orphaning existing checkpoints

**Impact**: CRITICAL — Entire badge system trust is compromised

**Current Mitigations**:
1. **Passphrase protection**: Root key is stored in Grid encrypted with passphrase (AES-256-GCM, PBKDF2-SHA256 310k iterations)
2. **Admin app access control**: Root key operations require entering passphrase each time (no persistent session)
3. **Root key rotation**: Admin can rotate root key; requires updating PINNED_ROOT_PUBLIC_KEY_JWK in verifier and redeploying

**Residual Risk**: 
- Root passphrase can be brute-forced if admin uses weak passphrase (attack complexity depends on entropy)
- Forgotten passphrase cannot be recovered (no recovery mechanism)
- Between key compromise and key rotation, all new signatures are trusted maliciously

**Mitigation Timeline**:
- Immediate: Use strong passphrase (20+ random characters)
- Medium: Implement secure passphrase storage (1Password, Bitwarden, etc.)
- Long: Two-admin multi-signature requirement for root key operations (future enhancement)

**Recommendation**: Root key passphrase should be stored in a secrets manager and rotated every 90 days. If passphrase is forgotten, manually generate new root key and re-sign issuer list.

---

### RISK 3: Grid Bucket ACL Misconfiguration

**Threat**: Misconfigured Grid ACLs allow unauthorized actors to:
- Write to badge_registry or checkpoints (tampering with badge mappings or integrity anchors)
- Write to trusted_issuers or public_config (promoting fake issuers, swapping root key)
- Write to issuer ledgers (creating fake badge events)

**Impact**: HIGH to CRITICAL depending on bucket

**Current Mitigations**:
1. **Signature validation on reads**: Verifier validates all signatures cryptographically, so unsigned tampering is detectable
2. **Root key pinning**: Verifier doesn't trust public_config.root_public_key at read-time; it compares against pinned value
3. **Explicit ledger control**: Each issuer controls their own ledger bucket via access control list

**Residual Risk**:
- Misconfigured ACLs are an operational risk, not a crypto risk
- Registry tampering (badge → key_id mapping) is only mitigated by signature validation; registry structure itself is not signed

**Mitigation Timeline**:
- Pre-deployment: Audit Grid bucket permissions
- Post-deployment: Monthly ACL review
- Automation: Script to validate expected permissions (reader: verifier app, writer: issuer app, etc.)

**Recommendation**: Grid buckets should use "Editor" role narrowly (only apps that need write access) and rely on signature validation as defense-in-depth for tampering detection.

---

### RISK 4: Badge Status Field Mutable by Registry (Partially Mitigated)

**Threat**: A malicious Grid editor could set `badge_registry[badgeId].status = 'revoked'` to invalidate a legitimate badge without issuer consent.

**Impact**: MEDIUM — Badge invalidity is not cryptographically enforced; registry can be weaponized

**Current Mitigations**:
1. **Status reconstruction from events**: Verifier determines badge status by:
   - Checking if issuer's key is revoked (from trusted_issuers.status)
   - Checking if badge has a superseding renewal event in ledger
   - NOT reading `badge_registry[badgeId].status` directly
2. **Registry-as-index pattern**: Registry is consulted only for O(1) ledger lookup, not for truth about badge validity

**Residual Risk**: Verifier still reads registry.entry.key_id, which could point to a fake issuer. However, signature validation will fail if key_id is wrong.

**Mitigation Timeline**: CLOSED by Phase 1 refactoring. Registry is now purely an index; status truth comes from ledger + issuer trust status.

**Recommendation**: Document that badge_registry.*.status is informational (for UI caching) and never used for trust decisions.

---

### RISK 5: Replay / Stale Badge Acceptance

**Threat**: Attacker could:
- Present an old, expired badge and hope verifier clock is set incorrectly
- Intercept a badge and present it multiple times in different contexts

**Impact**: LOW to MEDIUM depending on use case (replay attacks are context-dependent)

**Current Mitigations**:
1. **Expiration validation**: Verifier checks `now > badge.expires_at` and rejects expired badges
2. **Issued-at timestamp**: Badge includes `issued_at`; relying party can check this is recent if needed
3. **HTTP transport**: Badges are presented over HTTPS; TLS provides replay protection in transit

**Residual Risk**:
- No nonce/challenge mechanism for badge presentation
- No rate-limiting on verifier endpoint
- Verifier is stateless; cannot detect repeated presentations of same badge

**Mitigation Timeline**: Defer to deployment context
- For low-assurance (e.g., internal device tracking): No action needed
- For high-assurance (e.g., cross-organization trust): Implement nonce-based presentation challenge or centralized badge acceptance log

**Recommendation**: Verifier should reject badges with `issued_at > now()` (issued in the future) as a sanity check.

---

### RISK 6: Private Key Loss (Issuer/Root)

**Threat**: Private key file corruption or accidental deletion prevents key owner from issuing new badges or rotating keys.

**Impact**: MEDIUM — Operational disruption; not a security breach

**Current Mitigations**:
1. **Passphrase protection**: Keys are encrypted and stored in Grid; not on local disk
2. **Admin-only operations**: Only the admin app can decrypt and use the root key
3. **Issuer key wrapping**: Each issuer's key is wrapped with their own passphrase; root can rotate issuer keys without losing them

**Residual Risk**:
- If admin password is forgotten, the root key cannot be recovered
- If issuer password is forgotten, their key cannot be recovered
- Grid bucket deletion would permanently lose all key data

**Mitigation Timeline**:
- Immediate: Store passphrases in secrets manager
- Post-deployment: Establish key rotation cadence (annual or per incident)
- Long-term: Implement escrow key split (Shamir's Secret Sharing) for root key recovery

**Recommendation**: Establish a documented key rotation procedure and ensure passphrases are stored in a high-availability secrets vault.

---

## Threat Matrix Summary

| Threat | Impact | Likelihood | Mitigation | Residual Risk |
|--------|--------|-----------|-----------|---------------|
| Issuer forges badges between checkpoints | HIGH | MEDIUM | Hash chain + checkpoint validation | MEDIUM (checkpoint staleness) |
| Root key compromise | CRITICAL | LOW | Passphrase + pinning in verifier | LOW (if passphrase is strong) |
| Grid ACL misconfiguration | HIGH | MEDIUM | Signature validation + regular audits | MEDIUM (operational risk) |
| Registry status field tampering | MEDIUM | MEDIUM | Status from ledger, not registry | LOW (closed by Phase 1) |
| Replay / stale badge | MEDIUM | LOW | Expiration + issuer revocation | LOW (context-dependent) |
| Private key loss | MEDIUM | LOW | Encrypted storage + passphrase vault | MEDIUM (recovery complexity) |

---

## Security Properties Preserved

1. ✅ **Signature integrity**: All badges and checkpoints are ECDSA P-256 signed; tampering is cryptographically detectable
2. ✅ **Confidentiality**: Badge data is not encrypted at rest (by design); consider TLS-only access if PII is sensitive
3. ✅ **Authenticity**: Root key pinning ensures issuer list is from the real admin, not a malicious Grid editor
4. ✅ **Hash chain continuity**: Checkpoint validation ensures issuer hasn't rewritten history since last checkpoint
5. ✅ **O(1) verification**: Registry-as-index means verifier scales to millions of badges without performance degradation

---

## Deployment Checklist

- [ ] Root key passphrase is strong (20+ random characters) and stored in secrets vault
- [ ] PINNED_ROOT_PUBLIC_KEY_JWK is set in verifier.html (not null)
- [ ] Grid bucket ACLs are reviewed and follow least-privilege principle
- [ ] Admin app auto-checkpoint is enabled (default: 24h staleness check)
- [ ] Operator has documented procedure for checkpoint review before accepting new badges
- [ ] Grid bucket deletion is restricted (via IAM or operational controls)
- [ ] Regular audits scheduled (monthly ACL review, quarterly key rotation)
- [ ] Incident response plan exists for: key compromise, password loss, ACL misconfiguration

---

## Phase 2 Enhancements (Post-Production)

- [ ] Badge revocation via signed ledger event (not just key revocation)
- [ ] Automated daily checkpoint generation
- [ ] Centralized badge acceptance log (replay detection)
- [ ] Two-admin multi-signature for sensitive root operations
- [ ] Shamir's Secret Sharing for root key recovery
- [ ] CSP headers on verifier if Grid deployment allows

---

## Conclusion

The Device Badge system is **production-ready** with residual risks properly understood and compensating controls in place. The cryptographic core (ECDSA P-256, AES-256-GCM) is solid. Residual risks are primarily **operational** (checkpoint staleness, passphrase management) rather than cryptographic.

The system should be deployed with:
1. **Strong operational discipline**: Checkpoint cadence, passphrase vault, regular ACL audits
2. **Clear monitoring**: Track checkpoint staleness and badge issuance rates
3. **Incident response**: Procedure for key compromise and password loss

The signature-gap and shared-libraries anti-pattern have been closed. The verifier now scales O(1) and trusts only signed ledger events, not mutable buckets.
