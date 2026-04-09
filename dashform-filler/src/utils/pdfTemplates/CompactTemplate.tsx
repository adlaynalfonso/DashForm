import { Document, Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer'
import type { PdfTemplateProps } from './ModernTemplate'
import {
  formatFieldValue,
  isBase64Signature,
  isTextSignature,
  todayLabel,
} from './pdfHelpers'
import { renderCheckboxMark } from './pdfCheckbox'
import { isTablaField, renderTablaField } from './pdfTablaRenderer'
import { normalizeLayout } from '@/utils/layoutHelpers'

// ── Component ─────────────────────────────────────────────────────────────────

const MARGIN = 20
const CONTENT_WIDTH = 595 - MARGIN * 2 // 555pt
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
    title: {
      fontFamily: 'Helvetica-Bold',
      fontSize: 13,
      color: '#000000',
    },
    description: {
      fontSize: 7.5,
      color: '#4b5563',
      marginTop: 2,
    },
    section: {
      marginBottom: 10,
    },
    sectionTitle: {
      fontFamily: 'Helvetica-Bold',
      fontSize: 7.5,
      color: '#000000',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      borderBottomWidth: 0.5,
      borderBottomColor: '#6b7280',
      borderBottomStyle: 'solid',
      paddingBottom: 2,
      marginBottom: 4,
    },
    fieldLabel: {
      fontFamily: 'Helvetica-Bold',
      fontSize: 6.5,
      color: '#6b7280',
      textTransform: 'uppercase',
      letterSpacing: 0.3,
      marginBottom: 1,
    },
    fieldValue: {
      fontSize: 8,
      color: '#000000',
      lineHeight: 1.3,
    },
    signatureImage: {
      width: 140,
      height: 44,
      objectFit: 'contain',
      borderWidth: 0.5,
      borderColor: '#9ca3af',
      borderStyle: 'solid',
    },
    signatureText: {
      fontFamily: 'Helvetica-Oblique',
      fontSize: 11,
      color: '#000000',
    },
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
    <Document>
      <Page size="A4" style={S.page}>
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <View style={S.header}>
          <Text style={S.title}>{template.nombre}</Text>
          {template.descripcion ? (
            <Text style={S.description}>{template.descripcion}</Text>
          ) : null}
        </View>

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
                  const fontSize = nivel === 1 ? 11 : nivel === 2 ? 9.5 : 8
                  return (
                    <View key={row.id} style={{ marginBottom: 4 }}>
                      <Text style={{ fontFamily: 'Helvetica-Bold', fontSize, color: '#000000' }}>
                        {field.label}
                      </Text>
                    </View>
                  )
                }

                const totalGap = CELL_GAP * (fields.length - 1)
                const cellWidth = (CONTENT_WIDTH - totalGap) / fields.length

                return (
                  <View key={row.id} style={{ flexDirection: 'row', gap: CELL_GAP, marginBottom: 4 }}>
                    {fields.map((field) => {
                      const value = datos[field.id]
                      const isImg = isBase64Signature(field, value)
                      const isSig = isTextSignature(field)
                      const isTabla = isTablaField(field)

                      if (field.tipo === 'encabezado') {
                        const nivel = field.nivelEncabezado ?? 2
                        const fontSize = nivel === 1 ? 11 : nivel === 2 ? 9.5 : 8
                        return (
                          <View key={field.id} style={{ width: cellWidth }}>
                            <Text style={{ fontFamily: 'Helvetica-Bold', fontSize, color: '#000000' }}>
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
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                              {renderCheckboxMark(checked, 8)}
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
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                              {renderCheckboxMark(checked, 8)}
                              <Text style={S.fieldValue}>{text || '—'}</Text>
                            </View>
                          </View>
                        )
                      }

                      return (
                        <View key={field.id} style={{ width: cellWidth }}>
                          {isTabla ? (
                            renderTablaField(field, value, { labelStyle: S.fieldLabel, theme: '#000000' })
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
