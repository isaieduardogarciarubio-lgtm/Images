# ECOS · Tablero entre sitios

Dashboard Grid-only (un HTML, sin backend ni recursos remotos) con la identidad visual de ECOS.

## Fuente de datos (la misma que escribe ECOS captura)

| Libro | Rango | Uso |
|---|---|---|
| `reportsSheetId` | `CAPTURAS!A:P` | Hechos: una fila por incidencia |
| `sitesSheetId` | `SITIOS!A:E` | `SITIO_ID → NOMBRE` (+ ACTIVO, PUEDE_REPORTAR, PUEDE_SER_ANTERIOR) |
| `sitesSheetId` | `INCIDENCIAS!A:C` | `INCIDENCIA_ID → NOMBRE` |

`CAPTURAS.SITIO_ANTERIOR` / `SITIO_REPORTA` guardan el **SITIO_ID**; el tablero siempre muestra el **NOMBRE** del catálogo.
Un ID que no está en SITIOS se muestra con su código y se reporta en el aviso de calidad de datos.

## Puesta en marcha

1. Subir `ECOS-Tablero.html` a Grid como **documento nuevo** (uno por app, Biblia §16.25.5) y compartirlo con la audiencia del tablero.
2. El dueño abre el documento: si aparece el 403, pulsar **"Soy dueño: registrar acceso de solo lectura"**
   (`PUT /api/v1/sheets/{id}/link` con `capability: read_only` para ambos libros).
3. `doc_id` se toma de `window.GRID.docId`; como respaldo se puede escribir en `grid-config.docId`.

Fuera de Grid (o con `?demo=1`) se muestran datos sintéticos marcados como demostración.

## Presupuesto de lecturas (Biblia §16.24 / §16.25.6)

- Arranque: 3 lecturas (SITIOS, INCIDENCIAS, CAPTURAS). Refresh: 1 lectura (solo CAPTURAS); catálogos cada 30 min.
- TTL local de 60 s entre refresh; auto-refresh cada 5 min solo con la pestaña visible.
- 429: cooldown 4→8→16→30 s ±25 %, máx. 2 reintentos, se conserva el último snapshot.
- Filtros, búsqueda, rankings y matriz se calculan en memoria (0 lecturas).

## Sin validar en runtime Grid

- Descarga CSV por `blob:` + `<a download>` dentro del viewer de Grid.
- Tamaño máximo de `CAPTURAS!A:P` en una sola lectura.
