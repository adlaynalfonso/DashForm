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

// ── Props ─────────────────────────────────────────────────────────────────────

export interface PdfTemplateProps {
  template: Template
  datos: Record<string, unknown>
}

// ── Component ─────────────────────────────────────────────────────────────────

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
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <View style={S.headerRow}>
          {hasLogo && <Image style={S.logo} src={logoUrl} />}
          <View style={S.headerText}>
            <Text style={S.title}>{template.nombre}</Text>
            {template.descripcion ? <Text style={S.description}>{template.descripcion}</Text> : null}
          </View>
        </View>
        <View style={S.rule} />

        {/* ── Sections ───────────────────────────────────────────────────── */}
        {template.secciones.map((section) => {
          const layout = normalizeLayout(section)
          const fieldMap = new Map(section.campos.map((f) => [f.id, f]))
          const KEEP_TOGETHER = 4
          const firstRows = layout.slice(0, Math.min(KEEP_TOGETHER, layout.length))
          const remainingRows = layout.slice(Math.min(KEEP_TOGETHER, layout.length))

          const renderRow = (row: (typeof layout)[number]) => {
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
                <View key={row.id} wrap={false} style={{ marginBottom: 6 }}>
                  <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: fs, color: '#111827' }}>
                    {f.label}
                  </Text>
                </View>
              )
            }

            const totalGap = CELL_GAP * (fields.length - 1)
            const cellWidth = (CONTENT_WIDTH - totalGap) / fields.length
            const hasExpandible = fields.some((f) => f.tipo === 'texto-expandible')

            return (
              <View key={row.id} wrap={hasExpandible ? undefined : false} style={{ flexDirection: 'row', marginBottom: 10, alignItems: 'flex-start' }}>
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

                      // firma-texto — línea siempre visible debajo del valor
                      if (isTextSignature(field)) {
                        const sigText = typeof value === 'string' && value ? value : ' '
                        return (
                          <View key={field.id} style={base}>
                            <Text style={S.fieldLabel}>{field.label}</Text>
                            <View style={{ marginTop: 4 }}>
                              <Text style={S.signatureText}>{sigText}</Text>
                              <View style={{ borderBottomWidth: 0.5, borderBottomColor: '#000000', borderBottomStyle: 'solid' }} />
                            </View>
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

                      // texto, email, telefono, numero, fecha → label + valor sobre línea (siempre visible)
                      const displayVal = formatFieldValue(field, value)
                      const displayText = displayVal !== '—' ? displayVal : ' '
                      return (
                        <View key={field.id} style={{ ...base, flexDirection: 'row', alignItems: 'flex-end' }}>
                          <Text style={[S.fieldLabel, { marginRight: 4 }]}>{field.label}: </Text>
                          <View style={{ flex: 1 }}>
                            <Text style={S.fieldValue}>{displayText}</Text>
                            <View style={{ borderBottomWidth: 0.5, borderBottomColor: '#000000', borderBottomStyle: 'solid' }} />
                          </View>
                        </View>
                      )
                    })}
              </View>
            )
          }

          return (
            <View key={section.id} style={S.section}>
              {/* Header + primeras filas: nunca se parten entre páginas */}
              <View wrap={false}>
                <View minPresenceAhead={120}>
                  <Text style={S.sectionTitle}>{section.nombre}</Text>
                </View>
                {firstRows.map(renderRow)}
              </View>
              {/* Resto de filas: pueden saltar de página normalmente */}
              {remainingRows.map(renderRow)}
            </View>
          )
        })}

        {/* ── Footer ─────────────────────────────────────────────────────── */}
        <View style={S.footer} fixed>
          <Text>{todayLabel()}</Text>
          <Text render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`} />
        </View>
      </Page>
    </Document>
  )
}
