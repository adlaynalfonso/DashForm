import { View, Text } from '@react-pdf/renderer'

/**
 * Visual checkbox mark for PDF rendering.
 * checked=true → square with ✓ inside
 * checked=false → empty square
 */
export function renderCheckboxMark(checked: boolean, size = 10) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderWidth: 1,
        borderColor: '#6b7280',
        borderStyle: 'solid',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {checked ? (
        <Text style={{ fontSize: size * 0.7, lineHeight: 1, color: '#111827' }}>✓</Text>
      ) : null}
    </View>
  )
}
