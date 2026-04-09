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

const MARGIN = 50
const CONTENT_WIDTH = 595 - MARGIN * 2 // 495pt
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
    // ── Header band ──────────────────────────────────────────────────────────
    headerBand: {
      backgroundColor: theme,
      paddingHorizontal: MARGIN,
      paddingVertical: 16,
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 20,
    },
    logo: {
      width: 56,
      height: 28,
      objectFit: 'contain',
      marginRight: 12,
    },
    titleBlock: {
      flex: 1,
      alignItems: 'center',
    },
    title: {
      fontFamily: 'Helvetica-Bold',
      fontSize: 16,
      color: '#ffffff',
      textAlign: 'center',
    },
    description: {
      fontSize: 9,
      color: 'rgba(255,255,255,0.75)',
      textAlign: 'center',
      marginTop: 3,
    },
    // ── Body ─────────────────────────────────────────────────────────────────
    body: {
      paddingHorizontal: MARGIN,
    },
    section: {
      marginBottom: 18,
    },
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
    // ── Table layout ──────────────────────────────────────────────────────────
    tableOuter: {
      borderWidth: 0.5,
      borderColor: '#d1d5db',
      borderStyle: 'solid',
      borderTopWidth: 0,
    },
    tableRow: {
      flexDirection: 'row',
      borderTopWidth: 0.5,
      borderTopColor: '#d1d5db',
      borderTopStyle: 'solid',
    },
    fieldLabel: {
      fontFamily: 'Helvetica-Bold',
      fontSize: 8.5,
      color: '#374151',
      textTransform: 'uppercase',
      letterSpacing: 0.3,
      backgroundColor: '#f9fafb',
      marginBottom: 3,
    },
    fieldValue: {
      fontSize: 10,
      color: '#111827',
      lineHeight: 1.4,
    },
    signatureImage: {
      width: 200,
      height: 60,
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
      author={template.pdfConfig?.encabezado || 'DashForm'}
      subject={template.descripcion || ''}
      creator="DashForm"
      producer="DashForm - react-pdf"
    >
      <Page size="A4" style={S.page}>
        {/* ── Header band ────────────────────────────────────────────────── */}
        <View style={S.headerBand}>
          {hasLogo && <Image style={S.logo} src={logoUrl} />}
          <View style={S.titleBlock}>
            <Text style={S.title}>{template.nombre}</Text>
            {template.descripcion ? (
              <Text style={S.description}>{template.descripcion}</Text>
            ) : null}
          </View>
          {hasLogo && <View style={{ width: 68 }} />}
        </View>

        {/* ── Body ───────────────────────────────────────────────────────── */}
        <View style={S.body}>
          {template.secciones.map((section) => {
            const layout = normalizeLayout(section)
            const fieldMap = new Map(section.campos.map((f) => [f.id, f]))

            return (
              <View key={section.id} style={S.section}>
                {/* Section header */}
                <View style={S.sectionHeader}>
                  <Text style={S.sectionTitle}>{section.nombre}</Text>
                </View>

                {/* Fields as table rows */}
                {layout.length > 0 && (
                  <View style={S.tableOuter}>
                    {layout.map((row) => {
                      const fields = row.campos
                        .map((id) => fieldMap.get(id))
                        .filter(Boolean) as NonNullable<ReturnType<typeof fieldMap.get>>[]

                      if (fields.length === 0) return null

                      // Encabezado rows span full width
                      if (fields.length === 1 && fields[0].tipo === 'encabezado') {
                        const field = fields[0]
                        const nivel = field.nivelEncabezado ?? 2
                        const fontSize = nivel === 1 ? 14 : nivel === 2 ? 12 : 10
                        return (
                          <View key={row.id} style={[S.tableRow, { paddingHorizontal: 8, paddingVertical: 7 }]}>
                            <Text style={{ fontFamily: 'Helvetica-Bold', fontSize, color: '#111827' }}>
                              {field.label}
                            </Text>
                          </View>
                        )
                      }

                      const cellWidth = CONTENT_WIDTH / fields.length

                      return (
                        <View key={row.id} style={S.tableRow}>
                          {fields.map((field, idx) => {
                            const value = datos[field.id]
                            const isImg = isBase64Signature(field, value)
                            const isSig = isTextSignature(field)
                            const isTabla = isTablaField(field)
                            const isLast = idx === fields.length - 1

                            const cellStyle = {
                              width: cellWidth,
                              paddingHorizontal: 8,
                              paddingVertical: 7,
                              borderRightWidth: isLast ? 0 : 0.5,
                              borderRightColor: '#d1d5db',
                              borderRightStyle: 'solid' as const,
                            }

                            if (field.tipo === 'encabezado') {
                              const nivel = field.nivelEncabezado ?? 2
                              const fontSize = nivel === 1 ? 14 : nivel === 2 ? 12 : 10
                              return (
                                <View key={field.id} style={cellStyle}>
                                  <Text style={{ fontFamily: 'Helvetica-Bold', fontSize, color: '#111827' }}>
                                    {field.label}
                                  </Text>
                                </View>
                              )
                            }

                            if (field.tipo === 'checkbox') {
                              const checked = Boolean(value)
                              return (
                                <View key={field.id} style={cellStyle}>
                                  <Text style={S.fieldLabel}>{field.label}</Text>
                                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <View style={{ marginRight: 4 }}>{renderCheckboxMark(checked)}</View>
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
                                <View key={field.id} style={cellStyle}>
                                  <Text style={S.fieldLabel}>{field.label}</Text>
                                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <View style={{ marginRight: 4 }}>{renderCheckboxMark(checked)}</View>
                                    <Text style={S.fieldValue}>{text || '—'}</Text>
                                  </View>
                                </View>
                              )
                            }

                            return (
                              <View key={field.id} style={cellStyle}>
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
                )}
              </View>
            )
          })}
        </View>

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
