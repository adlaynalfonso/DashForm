import { View, Text } from '@react-pdf/renderer'
import type { ReactNode } from 'react'

/**
 * Inline checkbox square with optional X mark.
 * Use for: checkbox fields, radio/select options, texto-checkbox.
 */
export function InlineCheckbox({
  checked,
  label,
  fontSize = 10,
  color = '#000000',
  boxColor = '#000000',
  size = 9,
}: {
  checked: boolean
  label: string
  fontSize?: number
  color?: string
  boxColor?: string
  /** Box side length in pt. Default 9. Use 8 for compact templates. */
  size?: number
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 8 }}>
      <View
        style={{
          width: size,
          height: size,
          borderWidth: 0.8,
          borderColor: boxColor,
          borderStyle: 'solid',
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 2,
        }}
      >
        {checked && (
          <Text
            style={{
              fontSize: Math.round(size * 0.75),
              fontFamily: 'Helvetica-Bold',
              color: boxColor,
              lineHeight: 1,
            }}
          >
            X
          </Text>
        )}
      </View>
      <Text style={{ fontSize, color }}>{label}</Text>
    </View>
  )
}

/**
 * Horizontal line for handwriting.
 * Pass a number for fixed width, any string for flex: 1 (fills remaining space).
 */
export function WriteLine({ width = 100 }: { width?: number | string }) {
  return (
    <View
      style={{
        flex: typeof width === 'string' ? 1 : undefined,
        width: typeof width === 'number' ? width : undefined,
        borderBottomWidth: 0.5,
        borderBottomColor: '#000000',
        borderBottomStyle: 'solid',
        minHeight: 14,
      }}
    />
  )
}

/**
 * Bordered rectangle for expandable text fields.
 */
export function WriteBox({
  height = 50,
  children,
}: {
  height?: number
  children?: ReactNode
}) {
  return (
    <View
      style={{
        borderWidth: 0.5,
        borderColor: '#000000',
        borderStyle: 'solid',
        minHeight: height,
        padding: 4,
      }}
    >
      {children}
    </View>
  )
}
