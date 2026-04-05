export type FieldType =
  | 'texto'
  | 'texto-expandible'
  | 'email'
  | 'telefono'
  | 'checkbox'
  | 'radio'
  | 'select'
  | 'fecha'
  | 'firma-digital'
  | 'firma-texto'

export interface FieldValidation {
  minLength?: number
  maxLength?: number
  pattern?: string
  mensajeError?: string
}

export interface Field {
  id: string
  tipo: FieldType
  label: string
  placeholder?: string
  obligatorio: boolean
  validacion?: FieldValidation
  opciones?: string[]
}

export interface LayoutRow {
  id: string
  campos: string[] // field IDs in display order
}

export type SectionLayout = LayoutRow[]

export interface Section {
  id: string
  nombre: string
  campos: Field[]
  layout?: SectionLayout // if absent, default is one field per row
}

export interface PdfConfig {
  template: string
  colorTema: string
  logoUrl?: string
  encabezado?: string
  piePagina?: string
}

export interface Template {
  id: string
  nombre: string
  descripcion: string
  version: string
  schemaVersion: number
  pdfConfig: PdfConfig
  secciones: Section[]
}
