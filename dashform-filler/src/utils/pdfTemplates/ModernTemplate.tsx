import { Document, Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer'
import type { Template } from '@/types/template'
import {
  formatFieldValue,
  isBase64Signature,
  isTextSignature,
  todayLabel,
} from './pdfHelpers'
import { renderCheckboxMark } from './pdfCheckbox'
import { isTablaField, renderTablaField } from './pdfTablaRenderer'
import { normalizeLayout } from '@/utils/layoutHelpers'

// ── Props ─────────────────────────────────────────────────────────────────────

export interface PdfTemplateProps {
  template: Template
  datos: Record<string, unknown>
}

// ── Component ─────────────────────────────────────────────────────────────────

const MARGIN = 30
const CONTENT_WIDTH = 595 - MARGIN * 2 // 535pt
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
    headerRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 10,
      gap: 12,
    },
    logo: {
      width: 56,
      height: 28,
      objectFit: 'contain',
    },
    headerText: {
      flex: 1,
    },
    title: {
      fontFamily: 'Helvetica-Bold',
      fontSize: 18,
      color: '#111827',
    },
    description: {
      fontSize: 9,
      color: '#6b7280',
      marginTop: 3,
    },
    rule: {
      height: 2,
      backgroundColor: theme,
      marginBottom: 20,
    },
    section: {
      marginBottom: 18,
    },
    sectionTitle: {
      fontFamily: 'Helvetica-Bold',
      fontSize: 10,
      color: theme,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
      marginBottom: 8,
      paddingBottom: 4,
      borderBottomWidth: 0.5,
      borderBottomColor: '#e5e7eb',
      borderBottomStyle: 'solid',
    },
    fieldLabel: {
      fontFamily: 'Helvetica-Bold',
      fontSize: 7.5,
      color: '#9ca3af',
      textTransform: 'uppercase',
      letterSpacing: 0.4,
      marginBottom: 2,
    },
    fieldValue: {
      fontSize: 10,
      color: '#111827',
      lineHeight: 1.4,
    },
    signatureImage: {
      width: 200,
      height: 64,
      objectFit: 'contain',
      borderWidth: 0.5,
      borderColor: '#e5e7eb',
      borderStyle: 'solid',
    },
    signatureText: {
      fontFamily: 'Helvetica-Oblique',
      fontSize: 14,
      color: '#111827',
    },
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
    <Document>
      <Page size="A4" style={S.page}>
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <View style={S.headerRow}>
          {hasLogo && <Image style={S.logo} src={logoUrl} />}
          <View style={S.headerText}>
            <Text style={S.title}>{template.nombre}</Text>
            {template.descripcion ? (
              <Text style={S.description}>{template.descripcion}</Text>
            ) : null}
          </View>
        </View>
        <View style={S.rule} />

        {/* ── Sections ───────────────────────────────────────────────────── */}
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

                // Encabezado solo ocupa el ancho completo
                if (fields.length === 1 && fields[0].tipo === 'encabezado') {
                  const field = fields[0]
                  const nivel = field.nivelEncabezado ?? 2
                  const fontSize = nivel === 1 ? 14 : nivel === 2 ? 12 : 10
                  return (
                    <View key={row.id} style={{ marginBottom: 6 }}>
                      <Text style={{ fontFamily: 'Helvetica-Bold', fontSize, color: '#111827' }}>
                        {field.label}
                      </Text>
                    </View>
                  )
                }

                const totalGap = CELL_GAP * (fields.length - 1)
                const cellWidth = (CONTENT_WIDTH - totalGap) / fields.length

                return (
                  <View key={row.id} style={{ flexDirection: 'row', gap: CELL_GAP, marginBottom: 9 }}>
                    {fields.map((field) => {
                      const value = datos[field.id]
                      const isImg = isBase64Signature(field, value)
                      const isSig = isTextSignature(field)
                      const isTabla = isTablaField(field)

                      if (field.tipo === 'encabezado') {
                        const nivel = field.nivelEncabezado ?? 2
                        const fontSize = nivel === 1 ? 14 : nivel === 2 ? 12 : 10
                        return (
                          <View key={field.id} style={{ width: cellWidth }}>
                            <Text style={{ fontFamily: 'Helvetica-Bold', fontSize, color: '#111827' }}>
                              {field.label}
                            </Text>
                          </View>
                        )
                      }

                      if (field.tipo === 'checkbox') {
                        const checked = Boolean(value)
                        return (
                          <View key={field.id} style={{ width: cellWidth }}>
                            <Text style={S.fieldLabel}>{field.label}</Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                              {renderCheckboxMark(checked)}
                              <Text style={S.fieldValue}>{checked ? 'Sí' : 'No'}</Text>
                            </View>
                          </View>
                        )
                      }

                      if (field.tipo === 'texto-checkbox') {
                        const tcValue = value as { checked?: boolean; text?: string } | undefined
                        const checked = Boolean(tcValue?.checked)
                        const text = tcValue?.text ?? ''
                        return (
                          <View key={field.id} style={{ width: cellWidth }}>
                            <Text style={S.fieldLabel}>{field.label}</Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                              {renderCheckboxMark(checked)}
                              <Text style={S.fieldValue}>{text || '—'}</Text>
                            </View>
                          </View>
                        )
                      }

                      return (
                        <View key={field.id} style={{ width: cellWidth }}>
                          {isTabla ? (
                            renderTablaField(field, value, { labelStyle: S.fieldLabel, theme })
                          ) : (
                            <>
                              <Text style={S.fieldLabel}>{field.label}</Text>
                              {isImg ? (
                                <Image style={S.signatureImage} src={value} />
                              ) : isSig ? (
                                <Text style={S.signatureText}>
                                  {typeof value === 'string' && value ? value : '—'}
                                </Text>
                              ) : (
                                <Text style={S.fieldValue}>
                                  {formatFieldValue(field, value) || '—'}
                                </Text>
                              )}
                            </>
                          )}
                        </View>
                      )
                    })}
                  </View>
                )
              })}
            </View>
          )
        })}

        {/* ── Footer ─────────────────────────────────────────────────────── */}
        <View style={S.footer} fixed>
          <Text>{todayLabel()}</Text>
          <Text
            render={({ pageNumber, totalPages }) =>
              `Página ${pageNumber} de ${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  )
}
