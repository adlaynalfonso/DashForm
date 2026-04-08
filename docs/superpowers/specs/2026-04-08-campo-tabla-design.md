# Campo `tabla` para DashForm

**Fecha:** 2026-04-08  
**Estado:** Aprobado  

---

## Objetivo

Agregar un nuevo tipo de campo `'tabla'` al sistema de formularios DashForm. Permite crear tablas editables con columnas configurables (ej. "Current Medications" con columnas CONT, CHANGE, START, D/C, MEDICATION, COMMENTS). El creador define la estructura de columnas; el filler llena filas.

---

## Modelo de datos

### Cambios en `Field` (ambos `types/template.ts`)

```ts
export type FieldType =
  | 'texto' | 'texto-expandible' | 'email' | 'telefono'
  | 'checkbox' | 'radio' | 'select' | 'fecha'
  | 'firma-digital' | 'firma-texto' | 'numero'
  | 'texto-checkbox' | 'encabezado'
  | 'tabla'   // ← nuevo

export interface TablaColumna {
  id: string
  label: string
  ancho?: number           // porcentaje sin %, ej: 10
  tipo: 'texto' | 'checkbox' | 'fecha' | 'select'
  opciones?: string[]      // solo si tipo === 'select'
}

export interface Field {
  // ... props existentes sin cambio ...
  columnas?: TablaColumna[]
  filasMin?: number        // default 5
  filasMax?: number        // default 20
}
```

### Valor en `datos`

```ts
Record<string, unknown>[]   // array de objetos, key = columna.id
// Ej: [{ cont: true, medication: "Aspirin 100mg", comments: "" }, ...]
```

---

## Archivos a modificar

### 1. `dashform-creator/src/types/template.ts` y `dashform-filler/src/types/template.ts`
- Agregar `'tabla'` al union `FieldType`
- Agregar interface `TablaColumna`
- Agregar `columnas?`, `filasMin?`, `filasMax?` a `Field`

### 2. `dashform-creator/src/components/editor/FieldList.tsx`
- Agregar `'tabla'` a `FIELD_ICON` → `<Table2 className="h-4 w-4" />`
- Agregar `'tabla': 'Tabla'` a `FIELD_TYPE_LABEL`
- Agregar `{ tipo: 'tabla', label: 'Tabla' }` a `FIELD_TYPE_OPTIONS`
- Importar `Table2` de lucide-react

### 3. `dashform-creator/src/hooks/useTemplateEditor.ts`
- Agregar `'tabla': 'Tabla editable'` a `FIELD_LABELS`
- Agregar case en `defaultField()` que retorne:
  ```ts
  {
    ...base,
    columnas: [
      { id: 'col1', label: 'Columna 1', ancho: 40, tipo: 'texto' },
      { id: 'col2', label: 'Columna 2', ancho: 30, tipo: 'texto' },
      { id: 'col3', label: 'Columna 3', ancho: 30, tipo: 'checkbox' },
    ],
    filasMin: 5,
  }
  ```

### 4. `dashform-creator/src/components/editor/FieldConfigurator.tsx`
- Agregar `'tabla'` a `FIELD_META` con `Table2` icon y color `bg-indigo-100 text-indigo-600`
- Agregar `isTabla = field.tipo === 'tabla'`
- Agregar sección de configuración de tabla:
  - Lista de columnas: label (input), tipo (select: texto/checkbox/fecha/select), ancho (número), opciones si tipo=select
  - Botones agregar/eliminar columna
  - Inputs `filasMin` y `filasMax`
- Importar `Table2`, `GripVertical` de lucide-react

### 5. `dashform-creator/src/components/preview/FormPreview.tsx`
- Agregar `'tabla'` a `FIELD_ICON` → `<Table2 className="h-3.5 w-3.5" />`
- Agregar case `'tabla'` en `FieldPreview()`:
  - Renderiza tabla HTML estática `disabled` con las columnas definidas y `filasMin` filas vacías
  - Scroll horizontal en contenedor
  - Headers con `bg-gray-100`, celdas con `bg-gray-50`

### 6. `dashform-filler/src/components/filler/fields/TablaField.tsx` (NUEVO)
```
Props: { field: Field; value: unknown; onChange: (v: unknown) => void; error?: string }
```
- Parsea `value` como `Record<string, unknown>[]`; inicializa con `filasMin` (default 5) filas vacías
- Renderiza `<table>` con `<thead>` (labels de columnas) y `<tbody>` (filas editables)
- Por columna, renderiza input según `tipo`: `text`, `checkbox`, `date`, o `select`
- Botón "Agregar fila" (deshabilitado si se alcanza `filasMax`)
- Botón eliminar fila por fila (icono `Trash2`, aparece al hover)
- Filas alternas: `bg-white` / `bg-gray-50`
- Scroll horizontal en contenedor: `overflow-x-auto`
- Muestra `error` con `AlertCircle` si presente

### 7. `dashform-filler/src/components/filler/FormRenderer.tsx`
- Importar `TablaField`
- Agregar case `'tabla'` en `renderField()`:
  ```tsx
  case 'tabla':
    return <TablaField {...commonProps} onChange={handleChange} />
  ```

### 8. `dashform-filler/src/utils/schemaValidator.ts`
- Agregar `'tabla'` al array `VALID_FIELD_TYPES`
- Agregar `'tabla': 'Tabla editable'` a `FIELD_TYPE_LABELS`

### 9. `dashform-filler/src/hooks/useValidation.ts`
- Agregar case para `'tabla'` en `validateField()`:
  ```ts
  if (field.tipo === 'tabla') {
    if (!field.obligatorio) return null
    const rows = Array.isArray(value) ? value : []
    const hasData = rows.some((row) =>
      Object.values(row as Record<string, unknown>).some(
        (v) => v !== '' && v !== null && v !== undefined && v !== false
      )
    )
    if (!hasData) return 'Esta tabla debe tener al menos una fila con datos.'
    return null
  }
  ```

### 10. `dashform-filler/src/utils/pdfTemplates/pdfHelpers.ts`
- Agregar case `'tabla'` en `formatFieldValue()`: retorna string tabulado de filas
- Actualizar `needsFullWidth()` para retornar `true` para `'tabla'`

### 11. `ModernTemplate.tsx`, `CorporateTemplate.tsx`, `CompactTemplate.tsx`
- Detectar `field.tipo === 'tabla'` antes del render genérico
- Renderizar tabla PDF con `View`/`Text` usando bordes:
  - Header row: `flexDirection: 'row'`, celdas con `backgroundColor: '#f3f4f6'`, border
  - Data rows: `flexDirection: 'row'`, celdas con valor o `—`, border
  - Columnas: ancho proporcional basado en `col.ancho` (o distribuido equitativamente)
- Encapsular lógica de tabla PDF en función `renderTablaField(field, value, theme)` reutilizable entre templates (en `pdfHelpers.ts` o archivo nuevo `pdfTablaRenderer.tsx`)

---

## Estilo

- **Filler**: Tailwind, tabla responsive con scroll horizontal, filas alternas, headers grises, inputs nativos del navegador
- **Creator preview**: tabla estática `disabled`, misma estructura visual
- **PDF**: `@react-pdf/renderer` con `View`/`Text`, bordes de 0.5pt, header con fondo gris claro

---

## Restricciones / decisiones

- El `ancho` de columna es un porcentaje orientativo; en la tabla HTML se usa como `style={{ width: col.ancho + '%' }}`. En PDF se convierte a proporción de page width.
- Si `columnas` está vacío, el TablaField muestra mensaje "Sin columnas definidas".
- El valor `filasMin` define las filas que se pre-renderizan al cargar (nunca menos de 1). No bloquea eliminar filas — el usuario puede bajar hasta 0.
- `filasMax` desactiva el botón "Agregar fila" cuando se alcanza. Default: 20.
- Para PDF, la función de renderizado de tabla se comparte en `pdfHelpers.ts` para evitar triplicar código.
