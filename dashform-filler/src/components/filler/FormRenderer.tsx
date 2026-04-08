import type { Field, Section } from '@/types/template'
import type { FillerAction } from '@/hooks/useFormFiller'
import { normalizeLayout } from '@/utils/layoutHelpers'
import { TextField } from './fields/TextField'
import { TextExpandibleField } from './fields/TextExpandibleField'
import { EmailField } from './fields/EmailField'
import { PhoneField } from './fields/PhoneField'
import { CheckboxField } from './fields/CheckboxField'
import { RadioField } from './fields/RadioField'
import { SelectField } from './fields/SelectField'
import { DateField } from './fields/DateField'
import { SignatureTextField } from './fields/SignatureTextField'
import { SignatureField } from './fields/SignatureField'
import { NumeroField } from './fields/NumeroField'
import { TextoCheckboxField } from './fields/TextoCheckboxField'
import { EncabezadoField } from './fields/EncabezadoField'
import { TablaField } from './fields/TablaField'

interface Props {
  section: Section
  datos: Record<string, unknown>
  errores: Record<string, string>
  dispatch: React.Dispatch<FillerAction>
}

function renderField(
  field: Field,
  commonProps: { field: Field; value: unknown; error: string | undefined },
  handleChange: (val: unknown) => void,
  handleBlur: () => void,
): React.ReactNode {
  switch (field.tipo) {
    case 'texto':
      return <div onBlur={handleBlur}><TextField {...commonProps} onChange={handleChange} /></div>
    case 'texto-expandible':
      return <div onBlur={handleBlur}><TextExpandibleField {...commonProps} onChange={handleChange} /></div>
    case 'email':
      return <div onBlur={handleBlur}><EmailField {...commonProps} onChange={handleChange} /></div>
    case 'telefono':
      return <div onBlur={handleBlur}><PhoneField {...commonProps} onChange={handleChange} /></div>
    case 'checkbox':
      return <CheckboxField {...commonProps} onChange={handleChange} />
    case 'radio':
      return <RadioField {...commonProps} onChange={handleChange} />
    case 'select':
      return <div onBlur={handleBlur}><SelectField {...commonProps} onChange={handleChange} /></div>
    case 'fecha':
      return <div onBlur={handleBlur}><DateField {...commonProps} onChange={handleChange} /></div>
    case 'firma-texto':
      return <div onBlur={handleBlur}><SignatureTextField {...commonProps} onChange={handleChange} /></div>
    case 'firma-digital':
      return <SignatureField {...commonProps} onChange={handleChange} />
    case 'numero':
      return (
        <div onBlur={handleBlur}>
          <NumeroField {...commonProps} onChange={handleChange as (v: number | '') => void} />
        </div>
      )
    case 'texto-checkbox':
      return <TextoCheckboxField {...commonProps} onChange={handleChange} />
    case 'encabezado':
      return <EncabezadoField field={field} />
    case 'tabla':
      return <TablaField {...commonProps} onChange={handleChange as (v: Record<string, unknown>[]) => void} />
  }
}

export function FormRenderer({ section, datos, errores, dispatch }: Props) {
  if (section.campos.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-gray-400 italic">
        Esta sección no tiene campos.
      </p>
    )
  }

  const fieldMap = new Map(section.campos.map((f) => [f.id, f]))
  const layout = normalizeLayout(section)

  return (
    <div className="space-y-6">
      {layout.map((row) => {
        const rowFields = row.campos.map((id) => fieldMap.get(id)).filter(Boolean) as Field[]
        if (rowFields.length === 0) return null
        return (
          <div key={row.id} className="flex flex-col gap-4 sm:flex-row sm:items-end">
            {rowFields.map((field) => {
              const value = datos[field.id]
              const error = errores[field.id]
              const commonProps = { field, value, error }

              function handleChange(val: unknown) {
                dispatch({ type: 'SET_FIELD_VALUE', fieldId: field.id, value: val })
              }

              function handleBlur() {
                dispatch({ type: 'VALIDATE_FIELD', field })
              }

              return (
                <div key={field.id} className="min-w-0 flex-1">
                  {renderField(field, commonProps, handleChange, handleBlur)}
                </div>
              )
            })}
          </div>
        )
      })}
    </div>
  )
}
