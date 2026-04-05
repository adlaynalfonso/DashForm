import { Document, Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer'
import type { PdfTemplateProps } from './ModernTemplate'
import {
  formatFieldValue,
  isBase64Signature,
  isTextSignature,
  needsFullWidth,
  todayLabel,
} from './pdfHelpers'

// ── Component ─────────────────────────────────────────────────────────────────

const MARGIN = 30
const DEFAULT_THEME = '#1e3a8a'

export function CorporateTemplate({ template, datos }: PdfTemplateProps) {
  const theme = template.pdfConfig?.colorTema ?? DEFAULT_THEME
  const logoUrl = template.pdfConfig?.logoUrl
  const hasLogo = !!logoUrl && logoUrl.startsWith('http')

  // Content width: A4 595pt − 2×30pt margins = 535pt; two cols with 8pt gap → 263.5pt each
  const colWidth = (535 - 8) / 2

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
      marginBottom: 16,
    },
    sectionHeader: {
      backgroundColor: theme,
      paddingHorizontal: 8,
      paddingVertical: 4,
      marginBottom: 0,
    },
    sectionTitle: {
      fontFamily: 'Helvetica-Bold',
      fontSize: 9,
      color: '#ffffff',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    // ── Two-column layout ─────────────────────────────────────────────────────
    fieldsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      borderWidth: 0.5,
      borderColor: '#d1d5db',
      borderStyle: 'solid',
      borderTopWidth: 0,
    },
    fieldCell: {
      width: colWidth,
      paddingHorizontal: 8,
      paddingVertical: 6,
      borderRightWidth: 0.5,
      borderRightColor: '#d1d5db',
      borderRightStyle: 'solid',
      borderBottomWidth: 0.5,
      borderBottomColor: '#d1d5db',
      borderBottomStyle: 'solid',
    },
    fieldCellFull: {
      width: '100%',
      paddingHorizontal: 8,
      paddingVertical: 6,
      borderBottomWidth: 0.5,
      borderBottomColor: '#d1d5db',
      borderBottomStyle: 'solid',
    },
    fieldLabel: {
      fontFamily: 'Helvetica-Bold',
      fontSize: 7,
      color: '#6b7280',
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
    <Document>
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
          {/* Spacer balances the logo on the right */}
          {hasLogo && <View style={{ width: 68 }} />}
        </View>

        {/* ── Body ───────────────────────────────────────────────────────── */}
        <View style={S.body}>
          {template.secciones.map((section) => (
            <View key={section.id} style={S.section}>
              {/* Section header */}
              <View style={S.sectionHeader}>
                <Text style={S.sectionTitle}>{section.nombre}</Text>
              </View>

              {/* Fields grid */}
              <View style={S.fieldsRow}>
                {section.campos.map((field) => {
                  const value = datos[field.id]
                  const isImg = isBase64Signature(field, value)
                  const isSig = isTextSignature(field)
                  const full = needsFullWidth(field)

                  return (
                    <View key={field.id} style={full ? S.fieldCellFull : S.fieldCell}>
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
                    </View>
                  )
                })}
              </View>
            </View>
          ))}
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
