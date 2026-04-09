import { View, Text } from '@react-pdf/renderer'

/**
 * Visual checkbox mark for PDF rendering.
 * checked=true → bordered square with blue tint and ✓ inside
 * checked=false → empty bordered square
 */
export function renderCheckboxMark(checked: boolean, size = 12) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderWidth: 1.5,
        borderColor: checked ? '#1e3a8a' : '#9ca3af',
        borderStyle: 'solid',
        backgroundColor: checked ? '#eff6ff' : '#ffffff',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 1,
      }}
    >
      {checked ? (
        <Text style={{ fontSize: size * 0.65, lineHeight: 1, color: '#1e3a8a' }}>✓</Text>
      ) : null}
    </View>
  )
}
