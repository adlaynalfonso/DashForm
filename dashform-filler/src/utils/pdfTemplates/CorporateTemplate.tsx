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
    // ── Header band ──────────────────────────────────────────────────────────
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
    // ── Body ─────────────────────────────────────────────────────────────────
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
        {/* ── Header band ────────────────────────────────────────────────── */}
        <View style={S.headerBand}>
          {hasLogo && <Image style={S.logo} src={logoUrl} />}
          <View style={S.titleBlock}>
            <Text style={S.title}>{template.nombre}</Text>
            {template.descripcion ? <Text style={S.description}>{template.descripcion}</Text> : null}
          </View>
          {hasLogo && <View style={{ width: 68 }} />}
        </View>

        {/* ── Body ───────────────────────────────────────────────────────── */}
        <View style={S.body}>
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
                <View key={row.id} wrap={hasExpandible ? undefined : false} style={{ flexDirection: 'row', marginBottom: 9, alignItems: 'flex-start' }}>
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
          }

            return (
              <View key={section.id} style={S.section}>
                {/* Header band + primeras filas: nunca se parten entre páginas */}
                <View wrap={false}>
                  <View style={S.sectionHeader} minPresenceAhead={120}>
                    <Text style={S.sectionTitle}>{section.nombre}</Text>
                  </View>
                  <View style={S.sectionBody}>
                    {firstRows.map(renderRow)}
                  </View>
                </View>
                {/* Resto de filas: pueden saltar de página normalmente */}
                {remainingRows.length > 0 && (
                  <View style={S.sectionBody}>
                    {remainingRows.map(renderRow)}
                  </View>
                )}
              </View>
            )
          })}
        </View>

        {/* ── Footer ─────────────────────────────────────────────────────── */}
        <View style={S.footer} fixed>
          <Text>{todayLabel()}</Text>
          <Text render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`} />
        </View>
      </Page>
    </Document>
  )
}
