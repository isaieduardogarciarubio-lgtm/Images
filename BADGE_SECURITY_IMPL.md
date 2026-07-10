# Device Badge Security Implementation

Implementación completa de seguridad de badges de dispositivos según especificación de seguridad y flujo operativo (v0.1).

## Estructura

### Apps (3 HTMLs independientes)

- **device-badge-admin.html**: Gestión de root key, onboarding de emisores, aprobación de keys, revocación, y generación de checkpoints firmados.
- **device-badge-issuer.html**: Generación de passphrase, onboarding (una sola vez), emisión de badges, renovación, y revocación de badges.
- **device-badge-verifier.html**: Validación criptográfica completa de badges vía QR o Badge ID manual.

### Librerías (inline en cada HTML)

Grid sirve cada documento como un archivo autónomo — no resuelve `<script src="archivo.js">` a otros documentos. Por eso `CryptoLib` y `GridAPI` están **inline** dentro de cada uno de los 3 HTMLs (duplicados, no importados):

- **CryptoLib**: Criptografía WebCrypto (ECDSA P-256, AES-256-GCM, PBKDF2-SHA256, SHA-256, JSON canonical).
- **GridAPI**: Wrapper unificado para Grid state buckets y `/api/v1/me` (lectura/escritura con control optimista).

Si necesitas modificar la lógica de alguna, debes replicar el cambio en los 3 archivos.

## Almacenamiento (Grid State Buckets)

```
trusted_issuers          → { issuers: [], signature, signed_by_root_at }
issuer_keys              → [ { ldap, key_id, public_key_jwk, encrypted_private_key_jwk, salt, iv, status, ... } ]
pending_issuers          → { ldap: { status, approved_by, approved_at, role } }
badge_registry           → { badge_id: { device_id, status, issued_at, expires_at, key_id, ... } }
badge_ledger_<key_id>    → [ { payload, signature, event_hash, previous_event_hash } ] (uno por issuer)
checkpoints              → { key_id: { key_id, latest_event_hash, created_at, signature } } (firmado por root)
public_config            → { root_key_id, root_public_key, root_encrypted_private_key, root_salt, root_iv, ... }
```

## Flujo operativo

### 1. Setup inicial (Admin)

1. Abre **device-badge-admin.html**.
2. Tab "Root Key" → "Generar Root Key" → guarda la passphrase en lugar seguro (no se recupera).
3. Root key se guarda cifrada en `public_config`, solo como ciphertext.

### 2. Onboarding de emisor

**Admin:**
1. Tab "Pendientes" → ingresa LDAP del emisor → "Agregar a Pendientes".
2. LDAP queda en `pending_issuers`.

**Emisor:**
1. Abre **device-badge-issuer.html**.
2. App detecta que está en `pending_issuers` (no tiene llave aún).
3. Tab "Mi Llave" → "Generar Passphrase" → copia la passphrase → "Completar Onboarding".
4. App genera key pair ECDSA P-256, cifra private key con passphrase, guarda en `issuer_keys` con status="pending_approval".

**Admin:**
1. Tab "Emisores" → revisa la nueva key del issuer (status="pending_approval").
2. Tab "Checkpoints" → ingresa su passphrase root → "Generar Checkpoint Firmado".
3. App firma `trusted_issuers` con root key, incluye la public key del nuevo issuer, marca como active.

**Verifier ahora lo reconoce como issuer confiable.**

### 3. Emisión de badge

**Emisor:**
1. Tab "Emitir / Renovar" → carga datos del dispositivo (marca, modelo, IMEI últimos 4, device_id, vencimiento).
2. Ingresa su passphrase (desbloquea private key en memoria, solo para firmar).
3. App genera badge_id, canonicaliza payload, firma con private key (en memoria, se borra después).
4. Escribe evento en su `badge_ledger_<key_id>` (hash chain).
5. Actualiza `badge_registry` con status="active".
6. Muestra QR `meli-device-badge://BGE-...`.

### 4. Renovación

**Emisor:**
1. Tab "Emitir / Renovar" → rellena campos de nuevo dispositivo → ingresa "Badge ID anterior" (para renovar).
2. App crea nueva badge_id, set event_type="renewed", previous_badge_id apunta a la anterior.
3. Firma nueva badge, escribe evento.
4. En `badge_registry`, badge anterior cambia status="superseded", superseded_by=nueva_id.

**Verifier mostrará la anterior como REEMPLAZADA**, nueva como VÁLIDA.

### 5. Revocación

**Emisor o Admin:**
1. En **device-badge-issuer.html** (admin puede hacer esto en el future): botón "Revocar Badge" (TODO en esta v0).
2. App crea evento event_type="revoked", firma, escribe en ledger.
3. `badge_registry` actualiza status="revoked".

**Verifier mostrará REVOCADA**.

### 6. Reset de issuer (passphrase olvidada)

**Emisor → Admin:**
1. Issuer olvida passphrase, contacta admin.

**Admin:**
1. Tab "Emisores" → "Revocar Key" → motivo="forgotten_passphrase".
2. App marca la vieja key con status="revoked" en `issuer_keys`.
3. Issuer vuelve a `pending_onboarding` (TODO: automatizar esta transición).
4. Issuer abre **device-badge-issuer.html** de nuevo, genera nueva passphrase, nuevo key pair.

**Badges de la llave anterior siguen siendo válidas hasta expirar** (política: forgotten_passphrase).
Si es suspected_compromise, todas las badges de esa llave quedan invalid_key_revoked inmediatamente.

### 7. Verificación de badge

**Guardia o verificador:**
1. Abre **device-badge-verifier.html**.
2. Escanea QR del badge (app decodifica `meli-device-badge://BGE-...`), o ingresa Badge ID manualmente.
3. App consulta `badge_registry` → obtiene badge data.
4. Valida:
   - `trusted_issuers` tiene firma root válida (con public_key_root embebida en verifier).
   - Issuer (key_id) existe en `trusted_issuers` y está active.
   - Consulta `badge_ledger_<key_id>` → obtiene evento de la badge.
   - Firma del evento valida contra payload (public_key del issuer).
   - Vencimiento (no expirada).
   - Estado en registry (no revocada, no superseded, no invalid_key_revoked).
   - (Opcional) Hash chain coincide con checkpoint firmado.
5. Resultado: **VALIDA** / **VENCIDA** / **REVOCADA** / **REEMPLAZADA** / **FIRMA_INVALIDA** / **ISSUER_NO_CONFIABLE** / **REGISTRY_ALTERADO** / **LEGACY_UNSIGNED**.

## Seguridad: qué está protegido

| Ataque | Defensa |
|--------|---------|
| Editar payload de badge | Firma ECDSA → payload no coincide → FIRMA_INVALIDA |
| Fabricar badge a nombre de otro issuer | No tienes esa private key → no puedes firmar |
| Agregar issuer falso a trusted_issuers | Root signature se rompe → ISSUER_NO_CONFIABLE |
| Editar badge en registry sin ledger | Verifier compara registry con evento en ledger → inconsistencia → (futura validación) |
| Revocar badge falsa en ledger | Signature en evento revoked es del issuer real → revocación válida |
| Issuer reescribe su propio ledger (entre checkpoints) | Checkpoint firmado por root ancla el último hash → reescrituras post-checkpoint detectadas |
| Issuer emite badges con key revocada | Verifier valida que key_id esté active en trusted_issuers firmado por root → rechazo |
| Compromiso de passphrase de issuer | Admin revoca con políticasuspected_compromise → todas sus badges quedan invalid_key_revoked |

## Limitaciones conocidas (Grid-only)

1. **Issuer con permiso editor puede reescribir su ledger entre checkpoints.** Contenido: aislamiento por `badge_ledger_<key_id>` no afecta a otros issuers. Detección: checkpoints firmados por root. Resolución: revocación inmediata de key con política suspected_compromise.

2. **Passphrase no se recupera.** Reset requiere intervención admin.

3. **Checkpoint no es automático 24/7.** Se genera cuando admin abre la app y pide la passphrase. Ventana de exposición = tiempo entre checkpoints.

## Despliegue a Grid

1. **Obtén 3 doc IDs nuevos en Grid** (o reutiliza uno para todas con 3 apps en el mismo doc):
   - Recomendado: un doc para las 3 apps (simplifica estado compartido).

2. **En device-badge-admin.html, device-badge-issuer.html, device-badge-verifier.html**, reemplaza:
   ```javascript
   window.GRID.docId = "01KWJ24WNJEXCH6CE59ZW152EK";  // ← cambiar a tu doc ID
   ```

3. **Sube los 3 archivos HTML** a Grid como documentos (cada uno es autónomo, con `CryptoLib`/`GridAPI` inline — no hay archivos JS separados que subir).

4. **Permisos recomendados:**
   - **device-badge-admin.html**: editor = admins solo.
   - **device-badge-issuer.html**: editor = emitores.
   - **device-badge-verifier.html**: viewer = guardias/verificadores.
   - State buckets: admin = editor, issuers = editor + issuer sobre su ledger, viewer = público (lectura solo).

5. **Initialize en admin:** Abre admin app, genera root key.

## Next steps (no incluidos en v0)

- [ ] Integración con QR scanner (Zxing.js u otro).
- [ ] Botón "Revocar" en issuer app.
- [ ] Full hash chain validation en verifier.
- [ ] UI de revocación de issuer desde issuer app.
- [ ] Migración de CSV actual a `badge_registry` con legacy_unsigned.
- [ ] Almacenamiento de IMEI cifrado (actualmente solo hash + últimos 4).
- [ ] PDF/PNG generador de badge física.
- [ ] Watermarks/LSB en PNG.
- [ ] Audit log por evento.

## Testing

Vía browser devtools (F12 → Console):
```javascript
// Verificar estado buckets
await GridAPI.readState('trusted_issuers');
await GridAPI.readState('issuer_keys');
await GridAPI.readState('badge_registry');

// Verificar criptografía
CryptoLib.generatePassphrase();
CryptoLib.sha256('test');
```

## Referencias

- Especificación: `77c61fe2-device_badge_grid_flow.md` (sección 1-19, v0.1)
- Commit: `a7281a3` (rama `claude/markdown-security-core-ydbszf`)
- Algoritmos: WebCrypto estándar, sin librerías externas.
