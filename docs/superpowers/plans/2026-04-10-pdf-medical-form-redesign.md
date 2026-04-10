# PDF Medical Form Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rewrite the 3 PDF templates so they look like a real paper medical form — checkboxes as small squares with X, radio/select showing ALL options inline, empty text fields with a handwriting line, and expandable fields with a bordered write box.

**Architecture:** Create a new `pdfComponents.tsx` with three shared components (`InlineCheckbox`, `WriteLine`, `WriteBox`), then rewrite the field-rendering logic in all three templates to use them. No changes to helpers, types, or layout utilities.

**Tech Stack:** `@react-pdf/renderer`, TypeScript, React JSX transform (no explicit React import needed in templates)

---

## File Map

| Action | File | Purpose |
|--------|------|---------|
| Create | `src/utils/pdfTemplates/pdfComponents.tsx` | Shared visual primitives: InlineCheckbox, WriteLine, WriteBox |
| Rewrite | `src/utils/pdfTemplates/ModernTemplate.tsx` | New field rendering — clean form with color accent |
| Rewrite | `src/utils/pdfTemplates/CorporateTemplate.tsx` | New field rendering — remove table cells, keep color bands |
| Rewrite | `src/utils/pdfTemplates/CompactTemplate.tsx` | New field rendering — compact B&W clinical form |
| No change | `src/utils/pdfTemplates/pdfHelpers.ts` | Already correct (`encabezado` already in `needsFullWidth`) |
| No change | `src/utils/pdfTemplates/pdfCheckbox.tsx` | Keep; no longer imported by templates but do not delete |
| No change | `src/utils/pdfTemplates/pdfTablaRenderer.tsx` | Unchanged |

---

## Task 1: Create `pdfComponents.tsx`

**Files:**
- Create: `dashform-filler/src/utils/pdfTemplates/pdfComponents.tsx`

- [ ] **Step 1: Create the file with the three components**

```tsx
// dashform-filler/src/utils/pdfTemplates/pdfComponents.tsx
import { View, Text } from '@react-pdf/renderer'
import type { ReactNode } from 'react'

/**
 * Inline checkbox square with optional X mark.
 * Use for: checkbox fields, radio/select options, texto-checkbox.
 */
export function InlineCheckbox({
  checked,
  label,
  fontSize = 10,
  color = '#000000',
  boxColor = '#000000',
  size = 9,
}: {
  checked: boolean
  label: string
  fontSize?: number
  color?: string
  boxColor?: string
  /** Box side length in pt. Default 9. Use 8 for compact templates. */
  size?: number
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 8 }}>
      <View
        style={{
          width: size,
          height: size,
          borderWidth: 0.8,
          borderColor: boxColor,
          borderStyle: 'solid',
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 2,
        }}
      >
        {checked && (
          <Text
            style={{
              fontSize: Math.round(size * 0.75),
              fontFamily: 'Helvetica-Bold',
              color: boxColor,
              lineHeight: 1,
            }}
          >
            X
          </Text>
        )}
      </View>
      <Text style={{ fontSize, color }}>{label}</Text>
    </View>
  )
}

/**
 * Horizontal line for handwriting.
 * Pass a number for fixed width, any string for flex: 1 (fills remaining space).
 */
export function WriteLine({ width = 100 }: { width?: number | string }) {
  return (
    <View
      style={{
        flex: typeof width === 'string' ? 1 : undefined,
        width: typeof width === 'number' ? width : undefined,
        borderBottomWidth: 0.5,
        borderBottomColor: '#000000',
        borderBottomStyle: 'solid',
        minHeight: 14,
      }}
    />
  )
}

/**
 * Bordered rectangle for expandable text fields.
 */
export function WriteBox({
  height = 50,
  children,
}: {
  height?: number
  children?: ReactNode
}) {
  return (
    <View
      style={{
        borderWidth: 0.5,
        borderColor: '#000000',
        borderStyle: 'solid',
        minHeight: height,
        padding: 4,
      }}
    >
      {children}
    </View>
  )
}
```

- [ ] **Step 2: Verify build compiles with 0 TypeScript errors**

```bash
cd /Users/claude_agent/Desktop/DashForm/dashform-filler && npm run build 2>&1 | tail -20
```

Expected: `✓` or `vite build` completes with 0 errors.

- [ ] **Step 3: Commit**

```bash
cd /Users/claude_agent/Desktop/DashForm && git add dashform-filler/src/utils/pdfTemplates/pdfComponents.tsx && git commit -m "feat: add InlineCheckbox, WriteLine, WriteBox PDF primitives"
```

---

## Task 2: Rewrite `ModernTemplate.tsx`

**Files:**
- Rewrite: `dashform-filler/src/utils/pdfTemplates/ModernTemplate.tsx`

**Design identity:** Color accent from `colorTema`. Labels 9pt bold gray. Values 10pt black. InlineCheckbox with black box. Generous spacing (marginBottom 10).

- [ ] **Step 1: Replace the file with the new implementation**

```tsx
// dashform-filler/src/utils/pdfTemplates/ModernTemplate.tsx
import { Document, Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer'
import type { Template } from '@/types/template'
import {
  formatFieldValue,
  isBase64Signature,
  isTextSignature,
  todayLabel,
} from './pdfHelpers'
import { isTablaField, renderTablaField } from './pdfTablaRenderer'
import { InlineCheckbox, WriteLine, WriteBox } from './pdfComponents'
import { normalizeLayout } from '@/utils/layoutHelpers'

export interface PdfTemplateProps {
  template: Template
  datos: Record<string, unknown>
}

const MARGIN = 54
const CONTENT_WIDTH = 595 - MARGIN * 2 // 487pt
const CELL_GAP = 8
const DEFAULT_THEME = '#3b82f6'

export function ModernTemplate({ template, datos }: PdfTemplateProps) {
  const theme = template.pdfConfig?.colorTema ?? DEFAULT_THEME
  const logoUrl = template.pdfConfig?.logoUrl
  const hasLogo = !!logoUrl && logoUrl.startsWith('http')

  const S = StyleSheet.create({
    page: {
      fontFamily: 'Helvetica',
      fontSize: 10,
      color: '#111827',
      paddingTop: MARGIN,
      paddingBottom: MARGIN + 20,
      paddingHorizontal: MARGIN,
    },
    headerRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
    logo: { width: 56, height: 28, objectFit: 'contain', marginRight: 12 },
    headerText: { flex: 1 },
    title: { fontFamily: 'Helvetica-Bold', fontSize: 18, color: '#111827' },
    description: { fontSize: 10, color: '#6b7280', marginTop: 3 },
    rule: { height: 2, backgroundColor: theme, marginBottom: 20 },
    section: { marginBottom: 20, marginTop: 8 },
    sectionTitle: {
      fontFamily: 'Helvetica-Bold',
      fontSize: 13,
      color: theme,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
      marginBottom: 8,
      paddingBottom: 6,
      borderBottomWidth: 1,
      borderBottomColor: '#e5e7eb',
      borderBottomStyle: 'solid',
    },
    fieldLabel: {
      fontFamily: 'Helvetica-Bold',
      fontSize: 9,
      color: '#4b5563',
      textTransform: 'uppercase',
      letterSpacing: 0.4,
    },
    fieldValue: { fontSize: 10, color: '#111827', lineHeight: 1.4 },
    signatureImage: {
      width: 200,
      height: 64,
      objectFit: 'contain',
      borderWidth: 0.5,
      borderColor: '#e5e7eb',
      borderStyle: 'solid',
    },
    signatureText: { fontFamily: 'Helvetica-Oblique', fontSize: 14, color: '#111827' },
    footer: {
      position: 'absolute',
      bottom: 20,
      left: MARGIN,
      right: MARGIN,
      flexDirection: 'row',
      justifyContent: 'space-between',
      fontSize: 8,
      color: '#9ca3af',
    },
  })

  return (
    <Document
      title={template.nombre}
      author="DashForm"
      subject={template.descripcion ?? ''}
      creator="DashForm"
      producer="DashForm - react-pdf"
    >
      <Page size="A4" style={S.page}>
        {/* Header */}
        <View style={S.headerRow}>
          {hasLogo && <Image style={S.logo} src={logoUrl} />}
          <View style={S.headerText}>
            <Text style={S.title}>{template.nombre}</Text>
            {template.descripcion ? <Text style={S.description}>{template.descripcion}</Text> : null}
          </View>
        </View>
        <View style={S.rule} />

        {/* Sections */}
        {template.secciones.map((section) => {
          const layout = normalizeLayout(section)
          const fieldMap = new Map(section.campos.map((f) => [f.id, f]))

          return (
            <View key={section.id} style={S.section}>
              <Text style={S.sectionTitle}>{section.nombre}</Text>

              {layout.map((row) => {
                const fields = row.campos
                  .map((id) => fieldMap.get(id))
                  .filter(Boolean) as NonNullable<ReturnType<typeof fieldMap.get>>[]

                if (fields.length === 0) return null

                // Encabezado solo en la fila → ancho completo
                if (fields.length === 1 && fields[0].tipo === 'encabezado') {
                  const f = fields[0]
                  const nivel = f.nivelEncabezado ?? 2
                  const fs = nivel === 1 ? 14 : nivel === 2 ? 12 : 10
                  return (
                    <View key={row.id} style={{ marginBottom: 6 }}>
                      <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: fs, color: '#111827' }}>
                        {f.label}
                      </Text>
                    </View>
                  )
                }

                const totalGap = CELL_GAP * (fields.length - 1)
                const cellWidth = (CONTENT_WIDTH - totalGap) / fields.length

                return (
                  <View key={row.id} style={{ flexDirection: 'row', marginBottom: 10, alignItems: 'flex-start' }}>
                    {fields.map((field, idx) => {
                      const value = datos[field.id]
                      const isLast = idx === fields.length - 1
                      const base = {
                        width: cellWidth,
                        ...(isLast ? {} : { marginRight: CELL_GAP }),
                      }

                      // encabezado en fila mixta
                      if (field.tipo === 'encabezado') {
                        const nivel = field.nivelEncabezado ?? 2
                        const fs = nivel === 1 ? 14 : nivel === 2 ? 12 : 10
                        return (
                          <View key={field.id} style={base}>
                            <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: fs }}>{field.label}</Text>
                          </View>
                        )
                      }

                      // checkbox
                      if (field.tipo === 'checkbox') {
                        return (
                          <View key={field.id} style={{ ...base, flexDirection: 'row', alignItems: 'center' }}>
                            <InlineCheckbox checked={Boolean(value)} label={field.label} fontSize={10} />
                          </View>
                        )
                      }

                      // texto-checkbox: [□] Label:   valor o línea — todo en la misma fila
                      if (field.tipo === 'texto-checkbox') {
                        const tcVal = value as { checked?: boolean; text?: string } | undefined
                        const checked = Boolean(tcVal?.checked)
                        const text = tcVal?.text ?? ''
                        return (
                          <View key={field.id} style={{ ...base, flexDirection: 'row', alignItems: 'center' }}>
                            <InlineCheckbox checked={checked} label={field.label + ':'} fontSize={9} />
                            {text
                              ? <Text style={S.fieldValue}>{text}</Text>
                              : <WriteLine width="flex" />
                            }
                          </View>
                        )
                      }

                      // radio / select: TODAS las opciones como cuadraditos inline
                      if ((field.tipo === 'radio' || field.tipo === 'select') && field.opciones?.length) {
                        const selectedVal = typeof value === 'string' ? value : undefined
                        return (
                          <View key={field.id} style={base}>
                            <Text style={S.fieldLabel}>{field.label}:</Text>
                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 3 }}>
                              {field.opciones.map((opt) => (
                                <InlineCheckbox
                                  key={opt}
                                  checked={selectedVal === opt}
                                  label={opt}
                                  fontSize={10}
                                />
                              ))}
                            </View>
                          </View>
                        )
                      }

                      // firma-digital
                      if (isBase64Signature(field, value)) {
                        return (
                          <View key={field.id} style={base}>
                            <Text style={S.fieldLabel}>{field.label}</Text>
                            <Image style={S.signatureImage} src={value} />
                          </View>
                        )
                      }

                      // firma-texto
                      if (isTextSignature(field)) {
                        return (
                          <View key={field.id} style={base}>
                            <Text style={S.fieldLabel}>{field.label}</Text>
                            <Text style={S.signatureText}>
                              {typeof value === 'string' && value ? value : '—'}
                            </Text>
                          </View>
                        )
                      }

                      // tabla
                      if (isTablaField(field)) {
                        return (
                          <View key={field.id} style={base}>
                            {renderTablaField(field, value, { labelStyle: S.fieldLabel, theme })}
                          </View>
                        )
                      }

                      // texto-expandible
                      if (field.tipo === 'texto-expandible') {
                        return (
                          <View key={field.id} style={base}>
                            <Text style={[S.fieldLabel, { marginBottom: 3 }]}>{field.label}:</Text>
                            <WriteBox height={50}>
                              {typeof value === 'string' && value.trim()
                                ? <Text style={S.fieldValue}>{value}</Text>
                                : null
                              }
                            </WriteBox>
                          </View>
                        )
                      }

                      // texto, email, telefono, numero, fecha → label + valor o línea
                      const displayVal = formatFieldValue(field, value)
                      const isEmpty = displayVal === '—' || !displayVal
                      return (
                        <View key={field.id} style={{ ...base, flexDirection: 'row', alignItems: 'center' }}>
                          <Text style={[S.fieldLabel, { marginRight: 4 }]}>{field.label}: </Text>
                          {isEmpty
                            ? <WriteLine width="flex" />
                            : <Text style={S.fieldValue}>{displayVal}</Text>
                          }
                        </View>
                      )
                    })}
                  </View>
                )
              })}
            </View>
          )
        })}

        {/* Footer */}
        <View style={S.footer} fixed>
          <Text>{todayLabel()}</Text>
          <Text render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`} />
        </View>
      </Page>
    </Document>
  )
}
```

- [ ] **Step 2: Verify build**

```bash
cd /Users/claude_agent/Desktop/DashForm/dashform-filler && npm run build 2>&1 | tail -20
```

Expected: 0 TypeScript errors.

- [ ] **Step 3: Commit**

```bash
cd /Users/claude_agent/Desktop/DashForm && git add dashform-filler/src/utils/pdfTemplates/ModernTemplate.tsx && git commit -m "feat: rewrite ModernTemplate as medical paper form"
```

---

## Task 3: Rewrite `CorporateTemplate.tsx`

**Files:**
- Rewrite: `dashform-filler/src/utils/pdfTemplates/CorporateTemplate.tsx`

**Design identity:** Color bands for header + section titles (keep). Fields below section header are free-form — NO table cell borders. InlineCheckbox uses `boxColor = theme`. Labels 8.5pt bold gray. Values 10pt black.

- [ ] **Step 1: Replace the file**

```tsx
// dashform-filler/src/utils/pdfTemplates/CorporateTemplate.tsx
import { Document, Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer'
import type { PdfTemplateProps } from './ModernTemplate'
import {
  formatFieldValue,
  isBase64Signature,
  isTextSignature,
  todayLabel,
} from './pdfHelpers'
import { isTablaField, renderTablaField } from './pdfTablaRenderer'
import { InlineCheckbox, WriteLine, WriteBox } from './pdfComponents'
import { normalizeLayout } from '@/utils/layoutHelpers'

const MARGIN = 50
const CONTENT_WIDTH = 595 - MARGIN * 2 // 495pt
const CELL_GAP = 8
const DEFAULT_THEME = '#1e3a8a'

export function CorporateTemplate({ template, datos }: PdfTemplateProps) {
  const theme = template.pdfConfig?.colorTema ?? DEFAULT_THEME
  const logoUrl = template.pdfConfig?.logoUrl
  const hasLogo = !!logoUrl && logoUrl.startsWith('http')

  const S = StyleSheet.create({
    page: {
      fontFamily: 'Helvetica',
      fontSize: 10,
      color: '#111827',
      paddingBottom: MARGIN + 20,
    },
    headerBand: {
      backgroundColor: theme,
      paddingHorizontal: MARGIN,
      paddingVertical: 16,
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 20,
    },
    logo: { width: 56, height: 28, objectFit: 'contain', marginRight: 12 },
    titleBlock: { flex: 1, alignItems: 'center' },
    title: { fontFamily: 'Helvetica-Bold', fontSize: 16, color: '#ffffff', textAlign: 'center' },
    description: { fontSize: 9, color: 'rgba(255,255,255,0.75)', textAlign: 'center', marginTop: 3 },
    body: { paddingHorizontal: MARGIN },
    section: { marginBottom: 18 },
    sectionHeader: {
      backgroundColor: theme,
      paddingHorizontal: 8,
      paddingVertical: 6,
      marginBottom: 0,
    },
    sectionTitle: {
      fontFamily: 'Helvetica-Bold',
      fontSize: 10,
      color: '#ffffff',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    sectionBody: { paddingHorizontal: 8, paddingTop: 6 },
    fieldLabel: {
      fontFamily: 'Helvetica-Bold',
      fontSize: 8.5,
      color: '#374151',
      textTransform: 'uppercase',
      letterSpacing: 0.3,
    },
    fieldValue: { fontSize: 10, color: '#111827', lineHeight: 1.4 },
    signatureImage: {
      width: 200,
      height: 60,
      objectFit: 'contain',
      borderWidth: 0.5,
      borderColor: '#e5e7eb',
      borderStyle: 'solid',
    },
    signatureText: { fontFamily: 'Helvetica-Oblique', fontSize: 14, color: '#111827' },
    footer: {
      position: 'absolute',
      bottom: 16,
      left: MARGIN,
      right: MARGIN,
      flexDirection: 'row',
      justifyContent: 'space-between',
      fontSize: 8,
      color: '#9ca3af',
      borderTopWidth: 0.5,
      borderTopColor: '#e5e7eb',
      borderTopStyle: 'solid',
      paddingTop: 4,
    },
  })

  return (
    <Document
      title={template.nombre}
      author="DashForm"
      subject={template.descripcion ?? ''}
      creator="DashForm"
      producer="DashForm - react-pdf"
    >
      <Page size="A4" style={S.page}>
        {/* Header band */}
        <View style={S.headerBand}>
          {hasLogo && <Image style={S.logo} src={logoUrl} />}
          <View style={S.titleBlock}>
            <Text style={S.title}>{template.nombre}</Text>
            {template.descripcion ? <Text style={S.description}>{template.descripcion}</Text> : null}
          </View>
          {hasLogo && <View style={{ width: 68 }} />}
        </View>

        {/* Body */}
        <View style={S.body}>
          {template.secciones.map((section) => {
            const layout = normalizeLayout(section)
            const fieldMap = new Map(section.campos.map((f) => [f.id, f]))

            return (
              <View key={section.id} style={S.section}>
                <View style={S.sectionHeader}>
                  <Text style={S.sectionTitle}>{section.nombre}</Text>
                </View>

                <View style={S.sectionBody}>
                  {layout.map((row) => {
                    const fields = row.campos
                      .map((id) => fieldMap.get(id))
                      .filter(Boolean) as NonNullable<ReturnType<typeof fieldMap.get>>[]

                    if (fields.length === 0) return null

                    // Encabezado solo en la fila → ancho completo
                    if (fields.length === 1 && fields[0].tipo === 'encabezado') {
                      const f = fields[0]
                      const nivel = f.nivelEncabezado ?? 2
                      const fs = nivel === 1 ? 14 : nivel === 2 ? 12 : 10
                      return (
                        <View key={row.id} style={{ marginBottom: 6 }}>
                          <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: fs, color: '#111827' }}>
                            {f.label}
                          </Text>
                        </View>
                      )
                    }

                    const totalGap = CELL_GAP * (fields.length - 1)
                    const cellWidth = (CONTENT_WIDTH - totalGap) / fields.length

                    return (
                      <View key={row.id} style={{ flexDirection: 'row', marginBottom: 9, alignItems: 'flex-start' }}>
                        {fields.map((field, idx) => {
                          const value = datos[field.id]
                          const isLast = idx === fields.length - 1
                          const base = {
                            width: cellWidth,
                            ...(isLast ? {} : { marginRight: CELL_GAP }),
                          }

                          if (field.tipo === 'encabezado') {
                            const nivel = field.nivelEncabezado ?? 2
                            const fs = nivel === 1 ? 14 : nivel === 2 ? 12 : 10
                            return (
                              <View key={field.id} style={base}>
                                <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: fs }}>{field.label}</Text>
                              </View>
                            )
                          }

                          if (field.tipo === 'checkbox') {
                            return (
                              <View key={field.id} style={{ ...base, flexDirection: 'row', alignItems: 'center' }}>
                                <InlineCheckbox
                                  checked={Boolean(value)}
                                  label={field.label}
                                  fontSize={10}
                                  boxColor={theme}
                                />
                              </View>
                            )
                          }

                          if (field.tipo === 'texto-checkbox') {
                            const tcVal = value as { checked?: boolean; text?: string } | undefined
                            const checked = Boolean(tcVal?.checked)
                            const text = tcVal?.text ?? ''
                            return (
                              <View key={field.id} style={{ ...base, flexDirection: 'row', alignItems: 'center' }}>
                                <InlineCheckbox
                                  checked={checked}
                                  label={field.label + ':'}
                                  fontSize={8.5}
                                  boxColor={theme}
                                />
                                {text
                                  ? <Text style={S.fieldValue}>{text}</Text>
                                  : <WriteLine width="flex" />
                                }
                              </View>
                            )
                          }

                          if ((field.tipo === 'radio' || field.tipo === 'select') && field.opciones?.length) {
                            const selectedVal = typeof value === 'string' ? value : undefined
                            return (
                              <View key={field.id} style={base}>
                                <Text style={S.fieldLabel}>{field.label}:</Text>
                                <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 3 }}>
                                  {field.opciones.map((opt) => (
                                    <InlineCheckbox
                                      key={opt}
                                      checked={selectedVal === opt}
                                      label={opt}
                                      fontSize={10}
                                      boxColor={theme}
                                    />
                                  ))}
                                </View>
                              </View>
                            )
                          }

                          if (isBase64Signature(field, value)) {
                            return (
                              <View key={field.id} style={base}>
                                <Text style={S.fieldLabel}>{field.label}</Text>
                                <Image style={S.signatureImage} src={value} />
                              </View>
                            )
                          }

                          if (isTextSignature(field)) {
                            return (
                              <View key={field.id} style={base}>
                                <Text style={S.fieldLabel}>{field.label}</Text>
                                <Text style={S.signatureText}>
                                  {typeof value === 'string' && value ? value : '—'}
                                </Text>
                              </View>
                            )
                          }

                          if (isTablaField(field)) {
                            return (
                              <View key={field.id} style={base}>
                                {renderTablaField(field, value, { labelStyle: S.fieldLabel, theme })}
                              </View>
                            )
                          }

                          if (field.tipo === 'texto-expandible') {
                            return (
                              <View key={field.id} style={base}>
                                <Text style={[S.fieldLabel, { marginBottom: 3 }]}>{field.label}:</Text>
                                <WriteBox height={50}>
                                  {typeof value === 'string' && value.trim()
                                    ? <Text style={S.fieldValue}>{value}</Text>
                                    : null
                                  }
                                </WriteBox>
                              </View>
                            )
                          }

                          const displayVal = formatFieldValue(field, value)
                          const isEmpty = displayVal === '—' || !displayVal
                          return (
                            <View key={field.id} style={{ ...base, flexDirection: 'row', alignItems: 'center' }}>
                              <Text style={[S.fieldLabel, { marginRight: 4 }]}>{field.label}: </Text>
                              {isEmpty
                                ? <WriteLine width="flex" />
                                : <Text style={S.fieldValue}>{displayVal}</Text>
                              }
                            </View>
                          )
                        })}
                      </View>
                    )
                  })}
                </View>
              </View>
            )
          })}
        </View>

        {/* Footer */}
        <View style={S.footer} fixed>
          <Text>{todayLabel()}</Text>
          <Text render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`} />
        </View>
      </Page>
    </Document>
  )
}
```

- [ ] **Step 2: Verify build**

```bash
cd /Users/claude_agent/Desktop/DashForm/dashform-filler && npm run build 2>&1 | tail -20
```

Expected: 0 TypeScript errors.

- [ ] **Step 3: Commit**

```bash
cd /Users/claude_agent/Desktop/DashForm && git add dashform-filler/src/utils/pdfTemplates/CorporateTemplate.tsx && git commit -m "feat: rewrite CorporateTemplate as medical paper form"
```

---

## Task 4: Rewrite `CompactTemplate.tsx`

**Files:**
- Rewrite: `dashform-filler/src/utils/pdfTemplates/CompactTemplate.tsx`

**Design identity:** Pure B&W — ignores `colorTema`. Labels 8pt bold gray. Values 8pt black. InlineCheckbox size 8pt. Reduced spacing (marginBottom 5). Most content per page.

- [ ] **Step 1: Replace the file**

```tsx
// dashform-filler/src/utils/pdfTemplates/CompactTemplate.tsx
import { Document, Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer'
import type { PdfTemplateProps } from './ModernTemplate'
import {
  formatFieldValue,
  isBase64Signature,
  isTextSignature,
  todayLabel,
} from './pdfHelpers'
import { isTablaField, renderTablaField } from './pdfTablaRenderer'
import { InlineCheckbox, WriteLine, WriteBox } from './pdfComponents'
import { normalizeLayout } from '@/utils/layoutHelpers'

const MARGIN = 40
const CONTENT_WIDTH = 595 - MARGIN * 2 // 515pt
const CELL_GAP = 6

export function CompactTemplate({ template, datos }: PdfTemplateProps) {
  const S = StyleSheet.create({
    page: {
      fontFamily: 'Helvetica',
      fontSize: 8,
      color: '#000000',
      paddingTop: MARGIN,
      paddingBottom: MARGIN + 16,
      paddingHorizontal: MARGIN,
    },
    header: {
      marginBottom: 8,
      borderBottomWidth: 1,
      borderBottomColor: '#000000',
      borderBottomStyle: 'solid',
      paddingBottom: 6,
    },
    title: { fontFamily: 'Helvetica-Bold', fontSize: 13, color: '#000000' },
    description: { fontSize: 8.5, color: '#4b5563', marginTop: 2 },
    section: { marginBottom: 12 },
    sectionTitle: {
      fontFamily: 'Helvetica-Bold',
      fontSize: 9,
      color: '#000000',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      borderBottomWidth: 1,
      borderBottomColor: '#6b7280',
      borderBottomStyle: 'solid',
      paddingBottom: 2,
      marginBottom: 4,
    },
    fieldLabel: {
      fontFamily: 'Helvetica-Bold',
      fontSize: 8,
      color: '#4b5563',
      textTransform: 'uppercase',
      letterSpacing: 0.3,
    },
    fieldValue: { fontSize: 8, color: '#000000', lineHeight: 1.3 },
    signatureImage: {
      width: 140,
      height: 44,
      objectFit: 'contain',
      borderWidth: 0.5,
      borderColor: '#9ca3af',
      borderStyle: 'solid',
    },
    signatureText: { fontFamily: 'Helvetica-Oblique', fontSize: 11, color: '#000000' },
    footer: {
      position: 'absolute',
      bottom: 12,
      left: MARGIN,
      right: MARGIN,
      flexDirection: 'row',
      justifyContent: 'space-between',
      fontSize: 6.5,
      color: '#9ca3af',
    },
  })

  return (
    <Document
      title={template.nombre}
      author="DashForm"
      subject={template.descripcion ?? ''}
      creator="DashForm"
      producer="DashForm - react-pdf"
    >
      <Page size="A4" style={S.page}>
        {/* Header */}
        <View style={S.header}>
          <Text style={S.title}>{template.nombre}</Text>
          {template.descripcion ? <Text style={S.description}>{template.descripcion}</Text> : null}
        </View>

        {/* Sections */}
        {template.secciones.map((section) => {
          const layout = normalizeLayout(section)
          const fieldMap = new Map(section.campos.map((f) => [f.id, f]))

          return (
            <View key={section.id} style={S.section}>
              <Text style={S.sectionTitle}>{section.nombre}</Text>

              {layout.map((row) => {
                const fields = row.campos
                  .map((id) => fieldMap.get(id))
                  .filter(Boolean) as NonNullable<ReturnType<typeof fieldMap.get>>[]

                if (fields.length === 0) return null

                // Encabezado solo en la fila → ancho completo
                if (fields.length === 1 && fields[0].tipo === 'encabezado') {
                  const f = fields[0]
                  const nivel = f.nivelEncabezado ?? 2
                  const fs = nivel === 1 ? 11 : nivel === 2 ? 9.5 : 8
                  return (
                    <View key={row.id} style={{ marginBottom: 4 }}>
                      <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: fs, color: '#000000' }}>
                        {f.label}
                      </Text>
                    </View>
                  )
                }

                const totalGap = CELL_GAP * (fields.length - 1)
                const cellWidth = (CONTENT_WIDTH - totalGap) / fields.length

                return (
                  <View key={row.id} style={{ flexDirection: 'row', marginBottom: 5, alignItems: 'flex-start' }}>
                    {fields.map((field, idx) => {
                      const value = datos[field.id]
                      const isLast = idx === fields.length - 1
                      const base = {
                        width: cellWidth,
                        ...(isLast ? {} : { marginRight: CELL_GAP }),
                      }

                      if (field.tipo === 'encabezado') {
                        const nivel = field.nivelEncabezado ?? 2
                        const fs = nivel === 1 ? 11 : nivel === 2 ? 9.5 : 8
                        return (
                          <View key={field.id} style={base}>
                            <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: fs }}>{field.label}</Text>
                          </View>
                        )
                      }

                      if (field.tipo === 'checkbox') {
                        return (
                          <View key={field.id} style={{ ...base, flexDirection: 'row', alignItems: 'center' }}>
                            <InlineCheckbox
                              checked={Boolean(value)}
                              label={field.label}
                              fontSize={8}
                              size={8}
                            />
                          </View>
                        )
                      }

                      if (field.tipo === 'texto-checkbox') {
                        const tcVal = value as { checked?: boolean; text?: string } | undefined
                        const checked = Boolean(tcVal?.checked)
                        const text = tcVal?.text ?? ''
                        return (
                          <View key={field.id} style={{ ...base, flexDirection: 'row', alignItems: 'center' }}>
                            <InlineCheckbox
                              checked={checked}
                              label={field.label + ':'}
                              fontSize={8}
                              size={8}
                            />
                            {text
                              ? <Text style={S.fieldValue}>{text}</Text>
                              : <WriteLine width="flex" />
                            }
                          </View>
                        )
                      }

                      if ((field.tipo === 'radio' || field.tipo === 'select') && field.opciones?.length) {
                        const selectedVal = typeof value === 'string' ? value : undefined
                        return (
                          <View key={field.id} style={base}>
                            <Text style={S.fieldLabel}>{field.label}:</Text>
                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 2 }}>
                              {field.opciones.map((opt) => (
                                <InlineCheckbox
                                  key={opt}
                                  checked={selectedVal === opt}
                                  label={opt}
                                  fontSize={8}
                                  size={8}
                                />
                              ))}
                            </View>
                          </View>
                        )
                      }

                      if (isBase64Signature(field, value)) {
                        return (
                          <View key={field.id} style={base}>
                            <Text style={S.fieldLabel}>{field.label}</Text>
                            <Image style={S.signatureImage} src={value} />
                          </View>
                        )
                      }

                      if (isTextSignature(field)) {
                        return (
                          <View key={field.id} style={base}>
                            <Text style={S.fieldLabel}>{field.label}</Text>
                            <Text style={S.signatureText}>
                              {typeof value === 'string' && value ? value : '—'}
                            </Text>
                          </View>
                        )
                      }

                      if (isTablaField(field)) {
                        return (
                          <View key={field.id} style={base}>
                            {renderTablaField(field, value, { labelStyle: S.fieldLabel, theme: '#000000' })}
                          </View>
                        )
                      }

                      if (field.tipo === 'texto-expandible') {
                        return (
                          <View key={field.id} style={base}>
                            <Text style={[S.fieldLabel, { marginBottom: 2 }]}>{field.label}:</Text>
                            <WriteBox height={40}>
                              {typeof value === 'string' && value.trim()
                                ? <Text style={S.fieldValue}>{value}</Text>
                                : null
                              }
                            </WriteBox>
                          </View>
                        )
                      }

                      const displayVal = formatFieldValue(field, value)
                      const isEmpty = displayVal === '—' || !displayVal
                      return (
                        <View key={field.id} style={{ ...base, flexDirection: 'row', alignItems: 'center' }}>
                          <Text style={[S.fieldLabel, { marginRight: 3 }]}>{field.label}: </Text>
                          {isEmpty
                            ? <WriteLine width="flex" />
                            : <Text style={S.fieldValue}>{displayVal}</Text>
                          }
                        </View>
                      )
                    })}
                  </View>
                )
              })}
            </View>
          )
        })}

        {/* Footer */}
        <View style={S.footer} fixed>
          <Text>{todayLabel()}</Text>
          <Text render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`} />
        </View>
      </Page>
    </Document>
  )
}
```

- [ ] **Step 2: Verify build**

```bash
cd /Users/claude_agent/Desktop/DashForm/dashform-filler && npm run build 2>&1 | tail -20
```

Expected: 0 TypeScript errors.

- [ ] **Step 3: Commit**

```bash
cd /Users/claude_agent/Desktop/DashForm && git add dashform-filler/src/utils/pdfTemplates/CompactTemplate.tsx && git commit -m "feat: rewrite CompactTemplate as compact B&W clinical form"
```

---

## Task 5: Final verification

- [ ] **Step 1: Full clean build**

```bash
cd /Users/claude_agent/Desktop/DashForm/dashform-filler && npm run build 2>&1
```

Expected: build completes, 0 TypeScript errors, no warnings about missing imports.

- [ ] **Step 2: Confirm all 4 template files are present**

```bash
ls /Users/claude_agent/Desktop/DashForm/dashform-filler/src/utils/pdfTemplates/
```

Expected: `pdfComponents.tsx`, `ModernTemplate.tsx`, `CorporateTemplate.tsx`, `CompactTemplate.tsx`, `pdfHelpers.ts`, `pdfCheckbox.tsx`, `pdfTablaRenderer.tsx`

- [ ] **Step 3: Final commit if any stragglers**

```bash
cd /Users/claude_agent/Desktop/DashForm && git status
```

If clean: done. If not: `git add -p` and commit remaining changes.
