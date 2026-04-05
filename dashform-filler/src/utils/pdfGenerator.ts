import { createElement } from 'react'
import { pdf } from '@react-pdf/renderer'
import { saveAs } from 'file-saver'
import type { Template } from '@/types/template'
import { ModernTemplate } from './pdfTemplates/ModernTemplate'
import { CorporateTemplate } from './pdfTemplates/CorporateTemplate'
import { CompactTemplate } from './pdfTemplates/CompactTemplate'

// ── Types ─────────────────────────────────────────────────────────────────────

export type PdfTemplateName = 'modern' | 'corporate' | 'compact'

export const PDF_TEMPLATE_LABELS: Record<PdfTemplateName, string> = {
  modern: 'Moderno',
  corporate: 'Corporativo',
  compact: 'Compacto',
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Maps the pdfConfig.template string from a Template (set by the creator app)
 * to the closest PdfTemplateName. Falls back to 'modern'.
 */
export function resolvePdfTemplate(configTemplate: string | undefined): PdfTemplateName {
  if (configTemplate === 'corporate' || configTemplate === 'compact') return configTemplate
  return 'modern'
}

const COMPONENTS = {
  modern: ModernTemplate,
  corporate: CorporateTemplate,
  compact: CompactTemplate,
}

function safeName(template: Template): string {
  return (
    template.nombre
      .trim()
      .replace(/[^a-zA-Z0-9áéíóúüñÁÉÍÓÚÜÑ\s_-]/g, '')
      .replace(/\s+/g, '_')
      .slice(0, 60) || 'formulario'
  )
}

// ── generatePDF ───────────────────────────────────────────────────────────────

/**
 * Renders the requested template component to a PDF blob and triggers download.
 *
 * @param template      - The form template (structure + pdfConfig)
 * @param datos         - Filled field values keyed by field ID
 * @param pdfTemplate   - Which visual template to use ('modern' | 'corporate' | 'compact')
 */
export async function generatePDF(
  template: Template,
  datos: Record<string, unknown>,
  pdfTemplate: PdfTemplateName = 'modern',
): Promise<void> {
  const Component = COMPONENTS[pdfTemplate]
  const props = { template, datos }

  // createElement produces ReactElement; pdf() accepts ReactElement<DocumentProps>.
  // The cast is safe because all template components return a <Document />.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const blob = await pdf(createElement(Component, props) as any).toBlob()

  saveAs(blob, `${safeName(template)}_${pdfTemplate}.pdf`)
}
