import type { Section } from '@/types/template'
import type { FillerAction } from '@/hooks/useFormFiller'
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

interface Props {
  section: Section
  datos: Record<string, unknown>
  errores: Record<string, string>
  dispatch: React.Dispatch<FillerAction>
}

export function FormRenderer({ section, datos, errores, dispatch }: Props) {
  if (section.campos.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-gray-400 italic">
        Esta sección no tiene campos.
      </p>
    )
  }

  return (
    <div className="space-y-6">
      {section.campos.map((field) => {
        const value = datos[field.id]
        const error = errores[field.id]

        function handleChange(val: unknown) {
          dispatch({ type: 'SET_FIELD_VALUE', fieldId: field.id, value: val })
        }

        function handleBlur() {
          dispatch({ type: 'VALIDATE_FIELD', field })
        }

        const commonProps = { field, value, error }

        switch (field.tipo) {
          case 'texto':
            return (
              <div key={field.id} onBlur={handleBlur}>
                <TextField {...commonProps} onChange={handleChange} />
              </div>
            )
          case 'texto-expandible':
            return (
              <div key={field.id} onBlur={handleBlur}>
                <TextExpandibleField {...commonProps} onChange={handleChange} />
              </div>
            )
          case 'email':
            return (
              <div key={field.id} onBlur={handleBlur}>
                <EmailField {...commonProps} onChange={handleChange} />
              </div>
            )
          case 'telefono':
            return (
              <div key={field.id} onBlur={handleBlur}>
                <PhoneField {...commonProps} onChange={handleChange} />
              </div>
            )
          case 'checkbox':
            return (
              <div key={field.id}>
                <CheckboxField {...commonProps} onChange={handleChange} />
              </div>
            )
          case 'radio':
            return (
              <div key={field.id}>
                <RadioField {...commonProps} onChange={handleChange} />
              </div>
            )
          case 'select':
            return (
              <div key={field.id} onBlur={handleBlur}>
                <SelectField {...commonProps} onChange={handleChange} />
              </div>
            )
          case 'fecha':
            return (
              <div key={field.id} onBlur={handleBlur}>
                <DateField {...commonProps} onChange={handleChange} />
              </div>
            )
          case 'firma-texto':
            return (
              <div key={field.id} onBlur={handleBlur}>
                <SignatureTextField {...commonProps} onChange={handleChange} />
              </div>
            )
          case 'firma-digital':
            return (
              <div key={field.id}>
                <SignatureField {...commonProps} onChange={handleChange} />
              </div>
            )
        }
      })}
    </div>
  )
}
