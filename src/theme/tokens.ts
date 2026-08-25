export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  pill: 999,
  circle: 28,
} as const;

export const type = {
  display: { fontSize: 40, fontWeight: '600' as const },
  title: { fontSize: 28, fontWeight: '600' as const },
  heading: { fontSize: 22, fontWeight: '600' as const },
  body: { fontSize: 16, fontWeight: '400' as const },
  bodyStrong: { fontSize: 16, fontWeight: '500' as const },
  label: { fontSize: 14, fontWeight: '400' as const },
  caption: { fontSize: 13, fontWeight: '400' as const },
  micro: { fontSize: 12, fontWeight: '400' as const },
} as const;

export const iconSize = {
  sm: 32,
  md: 40,
  lg: 52,
} as const;