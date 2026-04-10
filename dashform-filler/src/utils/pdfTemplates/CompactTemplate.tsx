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

// ── Component ─────────────────────────────────────────────────────────────────

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
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <View style={S.header}>
          <Text style={S.title}>{template.nombre}</Text>
          {template.descripcion ? <Text style={S.description}>{template.descripcion}</Text> : null}
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

        {/* ── Footer ─────────────────────────────────────────────────────── */}
        <View style={S.footer} fixed>
          <Text>{todayLabel()}</Text>
          <Text render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`} />
        </View>
      </Page>
    </Document>
  )
}
