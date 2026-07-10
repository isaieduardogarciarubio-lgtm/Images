# Device Badge System — Deployment & Operations Guide

## Pre-Deployment Checklist

### 1. Root Key Setup (Admin)
- [ ] Generate root key using admin app
- [ ] Store root passphrase in secure vault (1Password, Bitwarden, etc.)
- [ ] Copy root public key JWK from admin app to verifier.html (`PINNED_ROOT_PUBLIC_KEY_JWK`)
- [ ] Redeploy verifier with pinned key
- [ ] Add admin passphrases to vault for future access

### 2. Grid Setup

**Important — Grid's ACL model is per whole document, not per bucket.** Anyone with Editor
access to the main document can write to *any* state bucket inside it, including buckets
that belong to other issuers or to admin governance (`trusted_issuers`, `checkpoints`).
To isolate each issuer from the others, each issuer needs their own dedicated Grid document.

**This is enforced, not optional.** The issuer app refuses to generate a key — the onboarding
form doesn't even render — until the Ledger Workspace exists. There is no shared-document
fallback; this was deliberately removed so isolation can't be silently skipped.

- [ ] Create Grid document for main data (all governance buckets: `trusted_issuers`,
      `public_config`, `checkpoints`, `pending_issuers`, `issuer_keys`, `badge_registry`)
- [ ] **No manual step required here.** The Ledger Workspace (a Grid Workspace with
      `linked_doc_permission: viewer`, saved to `public_config.ledger_workspace_id`) is
      created automatically the first time an admin adds someone in the "Pendientes" tab —
      that's the actual moment isolation becomes necessary, so creation is tied to that
      action instead of firing on every admin page load. Every existing admin (from
      `root_key_wraps`) is added as a viewer member at creation time automatically; any admin
      added later via "Agregar administrador" is auto-added as a member too.
- [ ] (Optional) If you want to add non-admin verifier readers to the workspace ahead of time,
      or the automatic creation failed for some reason, use the "Emisores" tab: it shows the
      current workspace status and has a manual "Crear ahora" fallback button plus an
      "Agregar como lector" field for arbitrary LDAPs.
- [ ] From this point on, **every issuer's ledger document is created and linked automatically**
      when they generate their key in the issuer app — no manual doc creation or docId entry
      is required. The issuer becomes the owner of their own ledger doc (full write access,
      isolated from other issuers); workspace members get automatic read-only access.
      If the workspace isn't set up yet (e.g. root key doesn't exist, or auto-creation failed),
      the issuer app shows a blocking message instead of the onboarding form and refuses to
      create a key — there is no shared-document fallback.
- [ ] Verify Grid ACLs on the main document:
  - `trusted_issuers`, `public_config`, `checkpoints`, `pending_issuers`, `issuer_keys`:
    Editor: admins only. Reader: verifier + issuer apps as needed.
  - `badge_registry`: Editor: issuer app (writes badge index), Reader: verifier app

### 3. Issuer Onboarding
- [ ] For each issuer:
  1. Issuer generates key in issuer app — this automatically creates and links their
     dedicated ledger document. Blocked entirely if the Ledger Workspace isn't configured yet
     (no key is created, no shared-document fallback).
  2. Admin reviews pending key in admin app
  3. Admin approves key → issuer added to `trusted_issuers` (their `ledger_doc_id` is
     mirrored in automatically)
  4. Issuer can now issue badges
  5. Document issuer passphrase in vault

### 4. Verifier Deployment
- [ ] PINNED_ROOT_PUBLIC_KEY_JWK is set (not null)
- [ ] Deployed to HTTPS endpoint
- [ ] Grid document ID in code matches actual document
- [ ] Test: Can fetch and validate a test badge

### 5. Checkpoint Baseline
- [ ] Admin app open (triggers auto-checkpoint check)
- [ ] Manual checkpoint generation to establish baseline
- [ ] Checkpoints visible in admin "Checkpoints" tab

---

## Daily Operations

### Admin Workflow
1. **Morning**: Open admin app (triggers 1-hour periodic checkpoint checks)
2. **When issuing keys**: Approve pending issuer keys in "Emisores" tab
3. **End of day** (or on-demand): Generate checkpoint if any changes occurred
   - Navigate to "Checkpoints" tab
   - Enter root passphrase
   - Click "Generar Checkpoint"
   - Verify all issuers have recent checkpoints

### Issuer Workflow
1. Issue new badges: Tab "Emitir / Renovar"
2. Renew expiring badges: Use "Previous Badge ID" field
3. Revoke compromised badges: Tab "Revocar" → enter Badge ID, reason, passphrase
4. Verify badge: Share meli-device-badge://BGE-... QR code or badge ID

### Verifier Workflow
- Stateless: Just enter Badge ID or scan QR
- Returns: VÁLIDA, REVOCADA, REEMPLAZADA, VENCIDA, or error
- No passphrases or admin access needed

---

## Emergency Procedures

### Scenario 1: Forgotten Root Passphrase
**Impact**: Cannot rotate root key or sign new issuer approvals until recovered

**Recovery**:
1. Generate new root key in admin app (overwrites old one)
2. Extract new public key JWK
3. Update PINNED_ROOT_PUBLIC_KEY_JWK in verifier.html
4. Redeploy verifier
5. All old checkpoints become orphaned (non-critical; issuers still trusted via signed events)

**Prevention**: Store passphrase in 2FA-protected vault (1Password, Bitwarden)

---

### Scenario 2: Forgotten Issuer Passphrase
**Impact**: Issuer cannot sign new badges or revocations

**Recovery**:
1. Admin app: Revoke issuer key in "Emisores" tab → mark as 'revoked'
2. Issuer generates new key in issuer app
3. Admin approves new key
4. Issuer can resume issuing (old badges remain valid, new ones signed by new key)

**Prevention**: Store passphrase in issuer's personal vault; never share

---

### Scenario 3: Issuer Key Compromise (Suspected)
**Impact**: Attacker could issue fraudulent badges

**Immediate Actions**:
1. Admin: Revoke issuer key in "Emisores" tab → mark as 'revoked'
   - All badges signed by this key become invalid (verifier shows: LLAVE REVOCADA)
2. Issuer: Generate new key
3. Admin: Approve new key
4. Issuer: Resume issuing
5. Audit: Search badge_ledger for suspicious events after compromise discovered

**Optional**: 
- Manually revoke specific fraudulent badges before marking key revoked (finer control)
- Preserve compromised ledger snapshot for forensics

---

### Scenario 4: Root Key Compromise (Suspected)
**Impact**: Attacker could approve fake issuers

**Immediate Actions**:
1. Generate new root key in admin app (immediately invalidates old key)
2. Extract new public key JWK
3. Publish new PINNED_ROOT_PUBLIC_KEY_JWK in security notice
4. Coordinate with verifier operator to redeploy
5. All old checkpoints signed by old key become invalid (non-critical)

**Timeline**: Redeploy verifier within hours; in interim, attackers could forge issuer approvals but issuers are checked against hash chain at verification time

---

### Scenario 5: Grid Bucket Tampering (Detected)
**Impact**: Depends on which bucket; detected by signature validation at verify time

**If badge_registry tampered**:
- No impact; registry is index-only, not trusted for truth
- Verifier will reconstruct state from signed ledger events

**If badge_ledger_* tampered**:
- Verifier will reject because signature doesn't match tampered payload
- Admin can create checkpoint to anchor ledger before tampering

**If trusted_issuers tampered**:
- Verifier will reject because signature doesn't match tampered issuer list
- Check admin's copy of signed trusted_issuers payload

**If checkpoints tampered**:
- Verifier will reject because checkpoint signature invalid
- New checkpoint can be generated to re-anchor ledger

**Recovery**:
1. Audit Grid ACLs and user permissions
2. Generate fresh checkpoint after cleanup
3. Document incident and timeline

---

## Monitoring & Alerts

### Metrics to Track
1. **Checkpoint staleness**: Should not exceed 24 hours
   - Admin app logs when checkpoints are auto-generated
   - Set operational SLO: daily checkpoint minimum
2. **Badge issuance rate**: Anomalies indicate issuer key compromise
3. **Revocation rate**: Spikes indicate incident
4. **Failed verifications**: Track "FIRMA INVÁLIDA" and "EVENTO NO ENCONTRADO"

### Recommended Monitoring
- **Daily**: Check checkpoint dates in admin "Checkpoints" tab (visual)
- **Weekly**: Audit Grid bucket sizes and recent changes
- **Monthly**: Review issuer activity logs and ACL permissions
- **Quarterly**: Plan and execute key rotation (preventative)

### Alerting Rules
- **Critical**: Checkpoint > 48h old (integrity anchor decaying)
- **Warning**: No checkpoint in last 24h (expected during low activity)
- **Info**: Issuer key revoked (normal operational event)

---

## Maintenance Schedule

### Weekly
- [ ] Verify all apps are accessible (admin, issuer, verifier)
- [ ] Check checkpoint dates
- [ ] Spot-check a recent badge (issue + verify)

### Monthly
- [ ] Audit Grid bucket sizes (growing unbounded = issue)
- [ ] Review and confirm ACLs are correctly set
- [ ] Test recovery procedure for one scenario

### Quarterly
- [ ] Plan issuer key rotation (preemptive)
- [ ] Rotate Grid admin credentials if applicable
- [ ] Review and update this guide based on incidents

---

## Deployment Architecture Reference

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│   Admin App     │       │  Issuer App     │       │  Verifier App   │
│  (HTTPS)        │       │  (HTTPS)        │       │  (HTTPS)        │
└────────┬────────┘       └────────┬────────┘       └────────┬────────┘
         │                         │                         │
         │ Root + Checkpoint       │ Badge Events            │ Badge Lookup
         │ Signing                 │ Signing                 │ Verification
         │                         │                         │
         └─────────────┬───────────┴─────────────┬───────────┘
                       │                         │
                       │  Grid API (REST)        │
                       │                         │
         ┌─────────────┴───────────┬─────────────┘
         │                         │
         v                         v
    ┌──────────────────────────────────┐
    │  Grid Document (Meli)            │
    │  ├─ trusted_issuers (signed)     │
    │  ├─ issuer_keys (wrapped keys)   │
    │  ├─ badge_registry (index)       │
    │  ├─ badge_ledger_* (events)      │
    │  ├─ checkpoints (signed anchors) │
    │  ├─ public_config (root key)     │
    │  └─ pending_issuers              │
    └──────────────────────────────────┘
         ▲                ▲
         │ Backup         │ Read-only
         │ (weekly)       │ access
         │                │
    ┌────┴────┐      ┌────┴────────┐
    │ S3/GCS  │      │ Auditor Log  │
    └─────────┘      └─────────────┘
```

---

## Security Hardening (Post-Deployment)

### Phase 2 Recommendations (Post-Launch)
- [ ] Implement HSTS (Strict-Transport-Security) headers on all apps
- [ ] Configure CSP (Content-Security-Policy) if Grid deployment allows it
- [ ] Set up WAF rules for Grid endpoints
- [ ] Implement rate limiting on /api/v1/documents endpoints
- [ ] Enable Grid audit logging for all state bucket writes

### Phase 3 Recommendations (Production+1)
- [ ] Two-admin multi-signature for root key operations
- [ ] Shamir's Secret Sharing for root key recovery (N-of-M backup)
- [ ] Centralized badge acceptance log (replay detection)
- [ ] Automated nightly backup of Grid to immutable storage
- [ ] Security incident response playbook

---

## Support & Escalation

### Troubleshooting
- **"Error: HTTP 429"** → Grid is rate-limited. Wait 60+ seconds, retry
- **"trusted_issuers no tiene firma root válida"** → Root key mismatch or verifier stale
- **"El evento de emisión no está en ningún ledger"** → Badge doesn't exist (typo or fake badge ID)
- **"Hash chain no coincide con checkpoint"** → Ledger altered after checkpoint; contact admin

### Escalation Path
1. **Issuer issue**: Contact issuer app operator
2. **Grid/API issue**: Contact Grid infrastructure team
3. **Verifier/verification issue**: Check if PINNED_ROOT_PUBLIC_KEY_JWK is current
4. **Root key issue**: Only root admin can resolve; emergency procedures apply

---

## Compliance & Audit Trail

### What's Auditable
- **Badge issuance**: Ledger events are signed; timestamp, issuer LDAP, device data immutable
- **Badge revocation**: Revocation events are signed; timestamp, reason, revoke-by-LDAP immutable
- **Checkpoints**: Signed by root key; acts as integrity anchor for all preceding events
- **Issuer approval**: Recorded in trusted_issuers snapshot (signed by root)

### What's Not Auditable (By Design)
- Verifier reads (stateless; no logs by default)
- Admin reads (checkpoints are optional snapshots, not mandatory audit)
- Grid access logs (rely on Grid's audit trail if available)

### For Compliance
- Export signed ledger events and checkpoints to immutable log (S3, Cloud Firestore) weekly
- Maintain audit trail of issuer key approvals and revocations
- Document chain of custody for root and issuer passphrases (vault metadata)

---

## Final Checklist Before Production

- [ ] Root key generated and passphrase secured
- [ ] Verifier PINNED_ROOT_PUBLIC_KEY_JWK set and deployed
- [ ] Grid document created with correct ACLs
- [ ] All issuers onboarded and approved
- [ ] Test: Issue badge → Verify → Revoke → Verify revoked
- [ ] Monitoring/alerting configured (checkpoint staleness)
- [ ] Incident response procedures documented
- [ ] Backups scheduled (weekly Grid export to immutable storage)
- [ ] Operations team trained on daily and emergency workflows
- [ ] This guide reviewed and customized for your deployment

**Sign-off**: _________________________________   Date: __________

---

**Document Version**: 1.0  
**Last Updated**: 2026-07-10  
**Maintained By**: [Your Ops Team]
