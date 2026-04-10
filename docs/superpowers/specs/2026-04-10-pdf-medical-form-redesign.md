# Spec: Rediseño de plantillas PDF — Formulario médico de papel

**Fecha:** 2026-04-10  
**Archivos afectados:** `dashform-filler/src/utils/pdfTemplates/`

---

## Objetivo

Las 3 plantillas PDF deben generar documentos que se parezcan a un formulario médico real de papel, no a un reporte corporativo. Los cambios clave son:

- Checkboxes como cuadraditos □ / ☒, sin texto "Sí"/"No"
- Radio/Select: TODAS las opciones visibles como cuadraditos inline, la seleccionada con X
- Campos de texto vacíos con línea de escritura `___________`
- texto-expandible con caja de escritura (rectángulo con borde)
- texto-checkbox: `□ Label   valor_o_línea` — todo en la misma fila
- encabezado como título visual, no como par label/valor

---

## Componentes reutilizables a agregar en `pdfHelpers.ts`

### `InlineCheckbox`
```tsx
InlineCheckbox({ checked, label, fontSize?, color?, boxColor? })
```
- Cuadradito 9×9pt con borde `borderWidth: 0.8`
- Si marcado: letra "X" bold 7pt adentro (NO usar ✓ ni ✗ — Helvetica no los tiene)
- Label a la derecha del cuadradito, `marginRight: 2` entre box y label, `marginRight: 8` tras el componente

### `WriteLine`
```tsx
WriteLine({ width? })
```
- Línea `borderBottomWidth: 0.5`, `minHeight: 14`
- Si `width` es string → `flex: 1`; si es número → `width: n`

### `WriteBox`
```tsx
WriteBox({ height?, children? })
```
- Rectángulo con `borderWidth: 0.5`, `minHeight: height` (default 50), `padding: 4`

---

## Lógica de renderizado de campos (aplica a las 3 plantillas)

### `checkbox`
```
[□/☒]  Label
```
- InlineCheckbox con el label del campo
- Sin "Sí" ni "No"

### `radio` y `select` (con `field.opciones`)
```
Label:  □Opción1  ☒Opción2  □Opción3
```
- Label en bold + ":" 
- Luego todas las opciones como InlineCheckbox en fila
- La opción cuyo valor === `datos[field.id]` se marca con X

### `texto`, `email`, `telefono`, `numero`, `fecha`
```
Label:  valor   (si hay valor)
Label:  ___     (si está vacío → WriteLine con flex: 1)
```
- Label + ":" en bold, luego valor o WriteLine en la misma fila

### `texto-expandible`
- Label en bold con ":"
- Debajo: WriteBox (minHeight 50) con el texto dentro o vacío

### `texto-checkbox`
```
[□/☒]  Label   valor_o_línea
```
- InlineCheckbox (con el label del campo como label del checkbox)
- Luego el valor de texto, o WriteLine con flex: 1 si vacío
- Todo en la misma fila

### `encabezado`
- Nivel 1: 14pt bold  
- Nivel 2: 12pt bold  
- Nivel 3: 10pt bold  
- Siempre ancho completo (ya cubierto por normalizeLayout row de 1 campo)
- Agregar `'encabezado'` a `needsFullWidth()` en pdfHelpers.ts

### `firma-digital` y `firma-texto`
- Sin cambios — siguen igual que hoy

### `tabla`
- Sin cambios — sigue usando `renderTablaField`

---

## Identidad visual por plantilla

### ModernTemplate
- Márgenes: 54pt (sin cambio)
- Header: título 18pt bold + descripción 10pt + línea de color debajo
- Secciones: título en `colorTema`, 13pt bold, línea fina gris debajo
- Labels: 9pt bold, `#4b5563`, uppercase
- Valores: 10pt, `#111827`
- InlineCheckbox: `boxColor = '#000000'`, `color = '#111827'`
- Espaciado por fila: `marginBottom: 10`

### CorporateTemplate
- Márgenes: 50pt (sin cambio)
- Header: banda de `colorTema` con título blanco centrado (mantener)
- Secciones: banda de `colorTema` con título blanco (mantener) — pero los campos debajo ya NO son tabla de celdas, son formulario libre
- Labels: 8.5pt bold, `#374151`, uppercase
- Valores: 10pt, `#111827`
- InlineCheckbox: `boxColor = colorTema`, `color = '#111827'`
- Espaciado por fila: `marginBottom: 9`

### CompactTemplate
- Márgenes: 40pt (sin cambio)
- Header: título 13pt bold alineado a izquierda + línea negra debajo
- Secciones: título 9pt bold uppercase + línea negra fina debajo
- Labels: 8pt bold, `#4b5563`, uppercase
- Valores: 8pt, `#000000`
- InlineCheckbox: `boxColor = '#000000'`, `color = '#000000'`, `fontSize = 8`, box 8×8pt
- Espaciado por fila: `marginBottom: 5`
- Ignora colorTema — blanco y negro puro

---

## Notas técnicas

1. `normalizeLayout(section)` ya se usa en las 3 plantillas — mantener
2. `@react-pdf/renderer` no soporta `gap` — usar `marginRight`/`marginBottom`
3. Anchos: `cellWidth = (CONTENT_WIDTH - CELL_GAP * (n-1)) / n`
4. CorporateTemplate elimina `tableOuter`/`tableRow` styles (ya no hay tabla de celdas), pero mantiene las bandas de color en header y section headers
5. `pdfCheckbox.tsx` puede quedar como está pero ya no se importará desde las 3 plantillas principales — las nuevas plantillas usan `InlineCheckbox` de `pdfHelpers.ts`
6. Footer con fecha + paginación — mantener en las 3 plantillas
7. Metadatos `<Document>`: `title`, `author="DashForm"`, `subject` — ya están, mantener
8. Al finalizar: `npm run build` en `dashform-filler` para verificar 0 errores TypeScript

---

## Lo que NO cambia

- `layoutHelpers.ts` — no modificar
- `template.ts` — no modificar  
- `FormPreview.tsx` — no modificar
- `pdfTablaRenderer.tsx` — no modificar
- `pdfCheckbox.tsx` — no modificar (puede quedar aunque ya no se use)
- Lógica de firmas (firma-digital, firma-texto)
- Metadatos del Document
