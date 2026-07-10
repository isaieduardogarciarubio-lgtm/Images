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

Cada bucket de Grid guarda un objeto JSON; los que son conceptualmente arrays (`issuer_keys`,
`badge_ledger_<key_id>`) se guardan envueltos como `{ list: [...] }` — `GridAPI.readList`/`writeList`
hacen el envolver/desenvolver de forma transparente.

```
trusted_issuers          → { issuers: [ { key_id, ldap, public_key_jwk, status, ledger_doc_id } ],
                              signature, signed_by_root_at }
issuer_keys              → { list: [ { ldap, key_id, public_key_jwk, encrypted_private_key_jwk,
                              salt, iv, status, ledger_doc_id, ... } ] }
pending_issuers          → { ldap: { status, approved_by, approved_at, role } }
badge_registry           → { badge_id: { device_id, status, issued_at, expires_at, key_id, ... } }
badge_ledger_<key_id>    → { list: [ { payload, signature, event_hash, previous_event_hash } ] }
checkpoints              → { key_id: { key_id, ldap, ledger_doc_id, latest_event_hash, event_count,
                              status, new_events_count, previous_checkpoint, ledger_snapshot,
                              history, signature } } (firmado por root)
public_config            → { root_key_id, root_public_key,
                              root_key_wraps: [ { admin_ldap, encrypted_private_key, salt, iv, created_at } ] }
```

**`root_key_wraps`** reemplaza los campos planos `root_encrypted_private_key/root_salt/root_iv` de
versiones anteriores: la MISMA root private key queda cifrada varias veces, una por cada admin con
su propia passphrase (ver "Múltiples admins" más abajo).

**`ledger_doc_id`** (en `issuer_keys` y espejado en `trusted_issuers`) es opcional: si el admin creó
un documento Grid dedicado para el ledger de ese issuer, aquí vive su `docId`. Si se deja vacío, el
ledger de ese issuer vive en el documento compartido (`window.GRID.docId`).

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
1. Tab "Emisores" → la nueva key aparece con status="pending_approval" y un botón "Aprobar".
2. Ingresa su root passphrase en el campo de arriba de la tabla → clic en "Aprobar".
3. La app marca la key como "active" en `issuer_keys`, agrega/actualiza su entrada en
   `trusted_issuers.issuers` (incluyendo `ledger_doc_id` si ya se configuró), y re-firma
   `trusted_issuers` completo con la root key.

**Verifier ahora lo reconoce como issuer confiable.**

**(Opcional) Aislar su ledger:** antes o después de aprobar, en la misma fila puedes pegar un
`docId` de un documento Grid dedicado (creado y compartido manualmente por ti con ese issuer) en
el campo "Ledger Doc ID" → "Guardar". Esto limita el radio de daño: ese issuer solo puede reescribir
su propio historial, nunca el de otro. Ver "Separación de documentos" más abajo.

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
1. Tab "Emisores" → "Revocar" → motivo="forgotten_passphrase" → ingresa tu root passphrase → confirmar.
2. App marca la vieja key como "revoked" en `issuer_keys` Y en `trusted_issuers` (re-firmando con
   root) — sin este segundo paso, el verifier seguiría confiando en la llave vieja.
3. Issuer vuelve a `pending_onboarding` (TODO: automatizar esta transición).
4. Issuer abre **device-badge-issuer.html** de nuevo, genera nueva passphrase, nuevo key pair.
5. Admin aprueba la nueva key (ver paso 2 del onboarding).

**Badges de la llave anterior siguen siendo válidas hasta expirar** (política: forgotten_passphrase).
Si es suspected_compromise, todas las badges de esa llave quedan invalid_key_revoked inmediatamente.

### 6.1. Admin olvida su propia passphrase (root key)

Ver "Múltiples admins y root key" más abajo — **no requiere rotar la root key** si hay otro admin
activo: ese otro admin genera un acceso nuevo (nueva passphrase) para el que la olvidó, usando la
misma root private key. Solo se rota la root key de verdad si TODOS los admins pierden acceso a la
vez, o hay sospecha de compromiso.

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

## Múltiples admins y root key (key-wrapping)

La root key es **una sola** key pair, pero la private key queda cifrada varias veces — una vez por
cada admin, con su propia passphrase (`public_config.root_key_wraps`). Es como una caja fuerte con
varias combinaciones distintas que abren la misma cerradura.

- **Un admin olvida su passphrase, pero hay otro admin activo:** ese otro admin entra a "Root Key",
  desbloquea con SU passphrase, y en "Agregar administrador" genera un acceso nuevo (nueva
  passphrase) para el que la perdió. **La root key pair no cambia, `PINNED_ROOT_PUBLIC_KEY_JWK` en
  el verificador tampoco — cero redeploy.**
- **Se agrega un admin nuevo:** mismo mecanismo — un admin existente le genera acceso.
- **Se quita un admin** (ej. deja el equipo): "Quitar acceso" en la lista de administradores. Solo
  borra su wrap, no afecta a los demás. No se puede quitar el último acceso restante (protección
  contra bloqueo total).
- **Todos los admins pierden su passphrase, o se sospecha compromiso real:** ahí sí aplica "Rotar
  Root Key" (zona de peligro, en el tab Root Key) — genera una key pair completamente nueva, invalida
  `trusted_issuers` hasta volver a firmarlo, y **requiere actualizar `PINNED_ROOT_PUBLIC_KEY_JWK` en
  `device-badge-verifier.html` y volver a desplegarlo**.

**Reset de emisor (issuer) vs. rotación de root — no es lo mismo:** revocar/re-aprobar la key de un
emisor solo requiere re-firmar `trusted_issuers` con la root key que YA existe (cualquier admin con
acceso puede hacerlo). Nunca toca la root key pair, nunca requiere redeploy del verificador.

## Separación de documentos (código vs. datos vs. ledger por issuer)

Esta app asume, por diseño, que Grid otorga permisos **por documento completo**, no por bucket
individual dentro de un documento. Si un issuer necesita editor sobre un documento para escribir su
ledger, ese mismo permiso le permitiría reescribir cualquier otro bucket — o el código HTML — que
viva en ese documento. Por eso se recomienda:

```
Documento CODE-ADMIN     → admin.html                        editor: admins
Documento CODE-ISSUER    → issuer.html (una sola copia)       editor: admins (issuers solo ejecutan)
Documento CODE-VERIFIER  → verifier.html                      editor: admins (guardias solo ejecutan)
Documento DATA-CORE      → trusted_issuers, pending_issuers,
                            issuer_keys, badge_registry,
                            checkpoints, public_config         editor: admins
Documento DATA-LEDGER-<key_id>  → badge_ledger_<key_id>,
                            uno POR issuer                     editor: {ese issuer, admins}
```

**Límite real:** el código de esta app (`GridAPI`) solo sabe leer/escribir estado dentro de un
`docId` que ya existe — no hay una API documentada aquí para crear documentos ni gestionar quién
tiene acceso a ellos. Crear cada `DATA-LEDGER-<key_id>` y compartirlo con el issuer correspondiente
(+ los admins) es un paso **manual, en la UI nativa de Grid**, fuera de esta app. El `docId`
resultante se pega en el tab "Emisores" de admin (campo "Ledger Doc ID"), y desde ahí issuer.html y
verifier.html lo usan automáticamente.

**Si Grid soporta compartir por grupo** (ej. un grupo "Admins"), compartir cada documento nuevo con
el grupo una sola vez basta — agregar un admin nuevo al grupo le da acceso a todo lo ya compartido.
**Si Grid solo soporta ACL por cuenta individual**, agregar un admin nuevo implica re-compartir cada
documento existente manualmente — no escala bien con muchos issuers. Confirma con soporte/documentación
de Grid cuál aplica antes de escalar.

**Residual conocido:** aunque el issuer solo tenga acceso a su propio `DATA-LEDGER`, nada impide que
manipule el código que corre en SU PROPIO navegador (DevTools, copia local modificada) — eso es una
limitación de cualquier app 100% cliente, no de Grid. Lo que la separación de documentos evita es que
esa manipulación afecte lo que corre en la máquina de OTRAS personas (admin, guardias). Y lo que la
criptografía evita es que esa manipulación local le sirva de algo: solo puede firmar con su propia
llave, nunca a nombre de otro emisor, ni agregarse como emisor nuevo sin romper la firma root.

## Semáforo de checkpoints (detección de manipulación, en lenguaje simple)

El tab "Checkpoints" ya no muestra hashes crudos. Cada vez que se genera un checkpoint nuevo, se
compara contra el checkpoint **anterior** de ese mismo emisor:

- **🟢 Sin alertas** — el hash-ancla del checkpoint anterior sigue apareciendo en la cadena actual;
  solo hubo eventos nuevos agregados encima. Se muestra cuántos.
- **🔴 ¡HISTORIAL ALTERADO!** — el hash-ancla del checkpoint anterior YA NO aparece en la cadena
  actual. Esto significa que algún evento pasado fue borrado, reescrito o reordenado. Recomendación
  mostrada en pantalla: revisar y considerar revocar esa llave con motivo `suspected_compromise`.
  Ver el bloque anterior sobre por qué esto no se puede prevenir del todo, solo detectar y contener.
- **⚪ Primer checkpoint** — no hay uno anterior con qué comparar todavía.

Cada tarjeta también muestra una línea de tiempo compacta (últimos 20 checkpoints) para ver cuándo
empezó una alerta, y un botón **"Copiar detalle técnico"** que genera un reporte de texto plano con:
LDAP, key_id, docId del ledger, el hash-ancla esperado vs. el actual, cuántos eventos nuevos se
detectaron, y la cadena completa de eventos (hash, previous_hash, tipo, badge_id, fecha) — pensado
para pegarse directamente en un agente de IA y pedirle que investigue cuáles eventos rompen la
continuidad y qué badges quedan bajo sospecha.

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

1. **Crea los documentos Grid separados** (ver "Separación de documentos" arriba):
   - `CODE-ADMIN`, `CODE-ISSUER`, `CODE-VERIFIER` (uno por app), y `DATA-CORE` (buckets compartidos).
   - `DATA-LEDGER-<key_id>` se crea más adelante, por issuer, al aprobarlo (opcional pero recomendado).

2. **En device-badge-admin.html, device-badge-issuer.html, device-badge-verifier.html**, reemplaza:
   ```javascript
   window.GRID.docId = "01KWJ24WNJEXCH6CE59ZW152EK";  // ← docId de DATA-CORE
   ```
   Este es el docId de los buckets compartidos (`trusted_issuers`, `issuer_keys`, `badge_registry`,
   `checkpoints`, `public_config`) — no el docId del documento de código de cada app.

3. **Sube cada HTML a su propio documento de código** (`CODE-ADMIN`, `CODE-ISSUER`, `CODE-VERIFIER`).
   Cada uno es autónomo, con `CryptoLib`/`GridAPI` inline — no hay archivos JS separados que subir.

4. **Permisos recomendados:**
   - `CODE-ADMIN`, `CODE-ISSUER`, `CODE-VERIFIER`: editor = admins solo (issuers/guardias solo
     necesitan poder abrir y ejecutar la app, no editar su código).
   - `DATA-CORE`: editor = admins solo. Nota: `issuer_keys` requiere que el issuer pueda escribir su
     propia entrada durante onboarding — si Grid no permite permisos parciales dentro de un
     documento, este es el trade-off descrito en "Separación de documentos" (el daño posible ahí es
     acotado: no compromete llaves ajenas, solo el campo de estado).
   - `DATA-LEDGER-<key_id>`: editor = {ese issuer, admins}. Se crea y comparte manualmente por
     issuer; el docId resultante se pega en el tab "Emisores" → "Ledger Doc ID".

5. **Initialize en admin:** Abre admin app, genera root key.

6. **Fija la root public key en el verificador (crítico):** copia el JWK que aparece en el tab "Root Key" de admin (campo "Root Public Key (JWK)") y pégalo en `device-badge-verifier.html`, constante `PINNED_ROOT_PUBLIC_KEY_JWK`, cerca del inicio del script de la app:
   ```javascript
   const PINNED_ROOT_PUBLIC_KEY_JWK = {"kty":"EC","crv":"P-256","x":"...","y":"..."};
   ```
   Sin este paso, el verificador confía en lo que diga `public_config` en vivo — cualquiera con permiso de editor sobre ese bucket podría sustituir la root key y fabricar un `trusted_issuers` falso. Con el pin, el verificador rechaza cualquier `public_config.root_public_key` que no coincida (resultado `ROOT KEY ALTERADA`). Vuelve a subir `device-badge-verifier.html` después de pegar el valor.

   **Rotación de root key** (ej. passphrase olvidada, compromiso sospechado): genera una nueva root key en admin, re-firma `trusted_issuers`, actualiza `PINNED_ROOT_PUBLIC_KEY_JWK` en el verificador con el nuevo valor, y vuelve a desplegarlo. Esto **no aplica** a reset de llaves de emisor — esas se re-aprueban re-firmando `trusted_issuers` con la misma root key, sin tocar el verificador.

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
