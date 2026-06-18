# Planeación — Formulario público de visitantes → Interfaz Grid

> Documento de arquitectura para conectar el **formulario externo** (visitantes, sin VPN)
> con la **interfaz interna de Grid** (gestores de accesos, con VPN).
> Estado: **planeación**. La UI de gestión ya existe (`gestion-accesos.html`, con placeholders).

---

## 1. Problema

- **Grid solo vive dentro de la red de Meli** (identidad por VPN / `X-User-Email`). Un visitante
  externo NO puede abrir un HTML de Grid ni llamar a `/api/v1/*`.
- El **formulario** lo llenan **visitantes externos**; esos datos son los que luego ven los
  gestores en la interfaz como solicitudes "Pendientes".
- Los visitantes **suben documentos** (Foto, INE, Pasaporte).

## 2. Idea central

No exponer Grid. Hacer que **los datos** crucen desde una superficie pública (Google) a un almacén
que Grid pueda **leer desde adentro** (pull). El puente es un **Google Sheet** que Grid lee en vivo
con `Grid.sheets.get()`. La captura pública se hace con un **Google Form**.

```
[Visitante] --> [Google Form] --> [Sheet de respuestas + Drive (archivos)] --> [Grid lee en vivo] --> [Gestores]
   con cuenta      público            puente neutral (Google)                    red Meli (VPN)
   Google
```

## 3. Decisiones tomadas

| Tema | Decisión |
|---|---|
| Documentos (Foto/INE/Pasaporte) | **Los sube el visitante** desde el formulario |
| Herramienta del formulario | **Google Forms** (nativo) |
| Login del visitante | **Sí, requiere cuenta Google** (necesario para que Forms permita subir archivos) |
| Puente de datos | **Grid lee el Google Sheet de respuestas en vivo** (`Grid.sheets.get()`), sin job de sync |
| Estado de decisiones | Se guarda en el **lado Grid** (`accesos.csv`/dataset), NO se escribe de vuelta al Sheet |

> Nota: Google Forms exige que el visitante inicie sesión con cuenta Google para poder subir
> archivos (limitación de Google, no configurable). Se aceptó esta condición. Si en el futuro se
> necesita captura 100% anónima, la alternativa es un formulario propio sobre Apps Script Web App
> (ver §10).

## 4. Componentes

### 4.1 Google Form (captura pública)
- Configuración:
  - **Requiere iniciar sesión** (necesario para preguntas de tipo *Subida de archivos*).
  - "Recopilar direcciones de correo" = activado (queda registrado el email del visitante).
  - Una respuesta por persona: opcional según política.
- Tipos de pregunta:
  - Texto corto: nombre, ap. paterno, ap. materno, empresa, puesto, CURP, nacionalidad,
    correo del líder que justifica, pasaporte (número, si aplica).
  - **Lista desplegable** para `sitio` con los ENUM de la interfaz: `MEX01, GDL02, MTY03, QRO04`
    (CRÍTICO: el valor debe coincidir con el filtro por sitio de la interfaz).
  - Opción única (Sí/No) para `¿Eres driver?`.
  - **Subida de archivos** para `Foto`, `INE`, `Pasaporte` (tipos permitidos jpg/png/pdf, tamaño máx).
- Las **respuestas se vinculan a un Google Sheet** (Respuestas → "Vincular a Hojas de cálculo").
- Los archivos subidos se guardan automáticamente en una carpeta Drive
  ("[Nombre del Form] (File responses)") y el Sheet guarda el **enlace Drive** de cada archivo.

### 4.2 Google Sheet de respuestas (inbox)
- Lo crea/alimenta Google Forms automáticamente (una fila por respuesta). Los gestores NO lo editan.
- Columnas que genera Forms: `Marca temporal`, `Dirección de correo`, y una columna por pregunta
  (las de archivo contienen enlaces Drive).
- **`uniqueid`**: Forms no genera un id propio. Recomendado: agregar un **trigger `onFormSubmit`**
  (Apps Script ligero adjunto al Sheet) que escriba un `uniqueid` (`AC-` + timestamp + random) en
  una columna extra. Alternativa sin script: usar `Marca temporal + correo` como clave compuesta.

### 4.3 Almacén de decisiones (lado Grid)
- `accesos.csv` (o dataset JSON) **keyed por `uniqueid`**. Lo escriben los gestores desde la
  interfaz. Guarda: `uniqueid, estatus, fecha_vencimiento, motivo_rechazo, qr, gestor_ldap,
  fecha_decision`.
- Escritura con el patrón confirmado de la Biblia: leer → combinar → `POST /versions`.

### 4.4 Interfaz Grid (ya construida)
- En `fetchAccesos(activeSite)`:
  1. Leer filas del Sheet (`Grid.sheets.get(sheetId)`), mapear a objetos `solicitud`.
  2. Leer decisiones (`accesos.csv`).
  3. **Join por `uniqueid`**: si no hay decisión → `estatus = "pendiente"`; si la hay, aplicar la
     decisión (aceptado/rechazado + vencimiento/motivo/QR).
  4. Filtrar por `activeSite`.
- Documentos: los thumbnails (Foto/INE/Pasaporte) usan los enlaces Drive del Sheet (abren con
  `target="_blank"`, soportado desde 3.6.0). Para preview inline usar la thumbnail URL de Drive.

## 5. La pieza clave: separar "entradas" de "decisiones"

Grid puede **leer** Sheets en vivo, pero **escribir** de vuelta al Sheet no es confiable. Por eso el
estado se separa en dos almacenes (sin write-back al Sheet):

| Almacén | Quién escribe | Qué guarda |
|---|---|---|
| **Sheet de respuestas** | Google Forms (externo) | datos crudos del visitante + enlaces Drive. Append-only. |
| **`accesos.csv`/dataset (Grid)** | gestores (interno) | decisión: estatus, vencimiento, motivo, QR, gestor, fecha. |

La interfaz = **join por `uniqueid`**: fila del Sheet sin decisión → **Pendiente**; con decisión →
Aceptado/Rechazado. Nunca tocamos el Sheet.

## 6. Flujo de datos (end to end)

1. Visitante abre el link/QR del Google Form → inicia sesión Google → llena datos + sube documentos.
2. Forms guarda los archivos en Drive y **append** una fila al Sheet (con enlaces Drive).
3. (Opcional) trigger `onFormSubmit` estampa el `uniqueid`.
4. Gestor (VPN) abre la interfaz de Grid → `Grid.sheets.get()` trae las filas nuevas.
5. Join con decisiones → las sin decisión aparecen en **Pendientes** del sitio del gestor.
6. Gestor Acepta (fecha venc. → genera QR) o Rechaza (motivo) → se escribe en `accesos.csv`.
7. En la próxima lectura, esa solicitud ya aparece en Aceptados/Rechazados.

## 7. Requisitos técnicos de Grid (Biblia)
- Lectura Sheets en vivo: `Grid.configure({docId})` + `Grid.sheets.get(sheetId)` + **OAuth Google
  del owner** (autorización única).
- Escritura CSV: `POST /api/v1/documents/{id}/versions` (FormData), flujo leer→combinar→subir.
- Identidad del gestor: `GET /api/v1/me` (ya implementado).
- Sin CDNs externos, sin localStorage/sessionStorage/cookie, sin alert/confirm/prompt en el HTML de Grid.

## 8. Seguridad y privacidad (PII)
- CURP, INE, Pasaporte y Foto son **datos personales sensibles**.
- La carpeta Drive de "File responses" y el Sheet deben tener **acceso restringido** (solo
  owner/gestores), nunca públicos.
- El formulario debe incluir **aviso de privacidad** y consentimiento de tratamiento de datos.
- Con login Google, queda registrado el correo verificado del visitante (trazabilidad).
- Considerar retención/borrado de documentos de accesos vencidos.

## 9. Limitaciones y cuidados
- **El visitante necesita cuenta Google** para subir archivos (condición aceptada).
- El `sitio` del formulario debe coincidir con los ENUM de la interfaz → usar lista desplegable.
- Latencia: la interfaz lee el Sheet en cada carga/refresh; usar polling moderado (30–60 s).
- Permisos de Drive: los enlaces a documentos solo abrirán para usuarios con acceso a la carpeta.
- Notificar al visitante (p. ej. QR al aceptar) requiere un canal de salida (email vía Apps Script
  disparado por cambio de estado) — fuera del alcance inicial.

## 10. Alternativa (si se requiere captura anónima en el futuro)
- **Apps Script Web App**: formulario propio (HTML + `doPost`) desplegado con acceso "cualquiera,
  incluso anónimo". Corre como el owner, así escribe a Drive y al Sheet sin que el visitante tenga
  cuenta Google. Mismo puente (Sheet) y mismo lado Grid. Más trabajo de construcción/mantenimiento.

## 11. Próximos pasos sugeridos
1. Crear el **Google Form** con las preguntas de §4.1 (sitio como desplegable, 3 subidas de archivo).
2. Vincular respuestas a un **Google Sheet**; restringir acceso del Sheet y de la carpeta Drive.
3. (Opcional) agregar trigger `onFormSubmit` para estampar `uniqueid`.
4. En la interfaz de Grid, implementar `fetchAccesos()` con **lectura del Sheet + join de decisiones**.
5. Conectar la escritura de decisiones a `accesos.csv` (`POST /versions`).
6. Aviso de privacidad + pruebas end-to-end.

---

### Apéndice: mapeo Sheet (Forms) → objeto `solicitud` de la interfaz

| Columna Sheet (pregunta del Form) | Campo en la UI (`solicitudes[]`) |
|---|---|
| Marca temporal | fechaSolicitud |
| Dirección de correo / correo | correo |
| Nombre / Apellido paterno / Apellido materno | nombre / apPaterno / apMaterno |
| Empresa / Puesto / Sitio | empresa / puesto / sitio |
| CURP / Nacionalidad | curp / nacionalidad |
| Foto / INE / Pasaporte (enlaces Drive) | foto / ine / pasaporte |
| Correo líder que justifica | liderJustifica |
| ¿Eres driver? | esDriver |
| uniqueid (trigger o clave compuesta) | id |
| (decisión, lado Grid) | estatus / fechaVencimiento / motivoRechazo / qr |
