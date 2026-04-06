import type { Field } from '@/types/template'

interface Props {
  field: Field
}

export function EncabezadoField({ field }: Props) {
  const nivel = field.nivelEncabezado ?? 2
  const cls =
    nivel === 1 ? 'text-2xl font-bold text-gray-800' :
    nivel === 2 ? 'text-xl font-semibold text-gray-800' :
                  'text-lg font-medium text-gray-800'

  if (nivel === 1) return <h1 className={cls}>{field.label}</h1>
  if (nivel === 3) return <h3 className={cls}>{field.label}</h3>
  return <h2 className={cls}>{field.label}</h2>
}
