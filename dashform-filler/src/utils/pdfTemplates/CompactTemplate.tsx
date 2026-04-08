import { Document, Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer'
import type { PdfTemplateProps } from './ModernTemplate'
import {
  formatFieldValue,
  isBase64Signature,
  isTextSignature,
  needsFullWidth,
  todayLabel,
} from './pdfHelpers'
import { isTablaField, renderTablaField } from './pdfTablaRenderer'

// ── Component ─────────────────────────────────────────────────────────────────

const MARGIN = 20

export function CompactTemplate({ template, datos }: PdfTemplateProps) {
  // Content width: 595 − 2×20 = 555pt; two cols with 6pt gap → 274.5pt each
  const colWidth = (555 - 6) / 2

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
    fieldsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
    },
    fieldCell: {
      width: colWidth,
      marginBottom: 4,
    },
    fieldCellFull: {
      width: '100%',
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
        {template.secciones.map((section) => (
          <View key={section.id} style={S.section}>
            <Text style={S.sectionTitle}>{section.nombre}</Text>

            <View style={S.fieldsRow}>
              {section.campos.map((field) => {
                const value = datos[field.id]
                const isImg = isBase64Signature(field, value)
                const isSig = isTextSignature(field)
                const isTabla = isTablaField(field)
                const full = needsFullWidth(field)

                return (
                  <View key={field.id} style={full ? S.fieldCellFull : S.fieldCell}>
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
          </View>
        ))}

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
