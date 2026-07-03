import { StyleSheet, Platform } from 'react-native';

/* ── Color Palette ─────────────────────────────────────────────── */
export const C = {
  // Primary
  blue:       '#2563EB',
  blueDark:   '#1E40AF',
  blueLight:  '#DBEAFE',
  blueSoft:   '#EFF6FF',

  // Accent
  orange:     '#F43F5E',
  orangeLight:'#FFF1F2',
  orangeDark: '#E11D48',

  // Semantic
  mint:       '#059669',
  mintLight:  '#D1FAE5',
  gold:       '#D97706',
  goldLight:  '#FEF3C7',
  red:        '#DC2626',
  redLight:   '#FEF2F2',

  // Neutrals
  bg:         '#F1F5F9',
  surface:    '#FFFFFF',
  white:      '#FFFFFF',
  ink:        '#0F172A',
  ink2:       '#1E293B',
  muted:      '#64748B',
  subtle:     '#94A3B8',
  line:       '#E2E8F0',
  border:     '#CBD5E1',
  disabled:   '#F1F5F9',

  // Brand
  momo:       '#A50064',
};

/* ── Spacing (8px grid) ────────────────────────────────────────── */
export const SP = {
  xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48,
};

/* ── Border Radius ─────────────────────────────────────────────── */
export const R = {
  sm: 12, md: 16, lg: 20, xl: 28, full: 999,
};

/* ── Shadows ───────────────────────────────────────────────────── */
const shadow = (opacity = 0.08, radius = 12, offset = 4) => ({
  shadowColor: '#0F172A',
  shadowOpacity: opacity,
  shadowRadius: radius,
  shadowOffset: { width: 0, height: offset },
  ...Platform.select({ android: { elevation: Math.round(radius / 3) } }),
});

export const Shadows = {
  sm:  shadow(0.05, 6, 2),
  md:  shadow(0.08, 12, 4),
  lg:  shadow(0.12, 20, 8),
  xl:  shadow(0.16, 32, 12),
};

/* ── StyleSheet ────────────────────────────────────────────────── */
export const S = StyleSheet.create({
  /* Layout */
  screen:   { flex: 1, backgroundColor: C.bg },
  content:  { padding: SP.lg, paddingBottom: SP.xxl + SP.md },

  /* Typography */
  display:  { fontSize: 30, fontFamily: 'Inter_900Black', color: C.ink, letterSpacing: -0.8 },
  title:    { fontSize: 26, fontFamily: 'Inter_800ExtraBold', color: C.ink, letterSpacing: -0.5 },
  h2:       { fontSize: 17, fontFamily: 'Inter_700Bold', color: C.ink, letterSpacing: -0.2 },
  h3:       { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: C.ink2 },
  body:     { fontSize: 15, fontFamily: 'Inter_400Regular', color: C.ink2, lineHeight: 22 },
  subtitle: { fontSize: 14, fontFamily: 'Inter_400Regular', color: C.muted, marginTop: SP.xs, lineHeight: 21 },
  caption:  { fontSize: 12, fontFamily: 'Inter_500Medium', color: C.subtle, lineHeight: 18 },

  /* Cards */
  card: {
    backgroundColor: C.surface,
    borderRadius: R.lg,
    padding: SP.lg - 4,
    marginBottom: SP.md - 2,
    borderWidth: 1,
    borderColor: C.line,
    ...shadow(0.06, 10, 3),
  },
  cardElevated: {
    backgroundColor: C.surface,
    borderRadius: R.lg,
    padding: SP.lg,
    marginBottom: SP.md,
    borderWidth: 0,
    ...shadow(0.12, 20, 8),
  },
  cardHero: {
    backgroundColor: C.blue,
    borderRadius: R.xl,
    padding: SP.lg,
    marginBottom: SP.md,
    ...shadow(0.2, 20, 8),
  },

  /* Rows */
  row:      { flexDirection: 'row', alignItems: 'center' },
  between:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  center:   { alignItems: 'center', justifyContent: 'center' },

  /* Inputs */
  label: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    color: C.muted,
    marginBottom: SP.sm,
    marginTop: SP.md + SP.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  input: {
    borderWidth: 1.5,
    borderColor: C.line,
    borderRadius: R.md,
    backgroundColor: C.surface,
    paddingHorizontal: SP.md,
    paddingVertical: SP.md - 2,
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
    color: C.ink,
  },
  inputFocused: {
    borderColor: C.blue,
    backgroundColor: C.blueSoft,
  },

  /* Buttons */
  button: {
    backgroundColor: C.blue,
    borderRadius: R.md,
    paddingVertical: SP.md,
    paddingHorizontal: SP.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SP.lg - 4,
    minHeight: 52,
    ...shadow(0.15, 12, 4),
  },
  orangeButton: {
    backgroundColor: C.orange,
    ...shadow(0.15, 12, 4),
  },
  buttonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: C.blue,
    borderRadius: R.md,
    paddingVertical: SP.md - 2,
    paddingHorizontal: SP.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SP.lg - 4,
    minHeight: 52,
  },
  buttonText: {
    color: C.white,
    fontFamily: 'Inter_700Bold',
    fontSize: 15,
    letterSpacing: -0.1,
  },
  buttonSecondaryText: {
    color: C.blue,
    fontFamily: 'Inter_700Bold',
    fontSize: 15,
    letterSpacing: -0.1,
  },

  /* Pills / Badges */
  pill: {
    alignSelf: 'flex-start',
    borderRadius: R.full,
    paddingHorizontal: SP.md - 4,
    paddingVertical: SP.xs + 1,
    backgroundColor: C.blueSoft,
    color: C.blue,
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
    overflow: 'hidden',
  },
  pillSuccess: {
    backgroundColor: C.mintLight,
    color: C.mint,
  },
  pillWarning: {
    backgroundColor: C.goldLight,
    color: C.gold,
  },
  pillDanger: {
    backgroundColor: C.redLight,
    color: C.red,
  },

  /* Data */
  amount: {
    fontSize: 24,
    fontFamily: 'Inter_800ExtraBold',
    color: C.blue,
    letterSpacing: -0.5,
  },

  /* Dividers */
  separator: {
    height: 1,
    backgroundColor: C.line,
    marginVertical: SP.md,
  },

  /* Error */
  error: {
    backgroundColor: C.redLight,
    color: C.red,
    padding: SP.md,
    borderRadius: R.md,
    marginVertical: SP.md - 4,
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#FECACA',
  },

  /* Empty State */
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SP.xxl,
    paddingHorizontal: SP.lg,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: SP.md,
  },
  emptyText: {
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
    color: C.muted,
    textAlign: 'center',
    lineHeight: 22,
  },

  /* List Items */
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.surface,
    borderRadius: R.lg,
    padding: SP.md,
    marginBottom: SP.sm + 2,
    borderWidth: 1,
    borderColor: C.line,
    ...shadow(0.04, 6, 2),
  },
  listItemIcon: {
    width: 44,
    height: 44,
    borderRadius: R.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SP.md - 4,
  },
  listItemContent: {
    flex: 1,
  },
  listItemChevron: {
    color: C.subtle,
    fontSize: 20,
    fontFamily: 'Inter_600SemiBold',
    marginLeft: SP.sm,
  },

  /* Bottom Sheet */
  sheetOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(15,23,42,0.5)',
  },
  sheetContainer: {
    backgroundColor: C.surface,
    borderTopLeftRadius: R.xl,
    borderTopRightRadius: R.xl,
    padding: SP.lg,
    paddingBottom: SP.xxl,
    ...shadow(0.2, 32, -8),
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: R.full,
    backgroundColor: C.line,
    alignSelf: 'center',
    marginBottom: SP.lg,
  },

  /* Metric Grid */
  metricCard: {
    flex: 1,
    backgroundColor: C.surface,
    borderRadius: R.md,
    padding: SP.md,
    margin: SP.xs,
    borderWidth: 1,
    borderColor: C.line,
    ...shadow(0.04, 6, 2),
  },
  metricLabel: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    color: C.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: SP.xs,
  },
  metricValue: {
    fontSize: 18,
    fontFamily: 'Inter_800ExtraBold',
    letterSpacing: -0.3,
  },

  /* Selection Card */
  selectionCard: {
    backgroundColor: C.surface,
    borderRadius: R.md,
    padding: SP.md,
    marginBottom: SP.sm + 2,
    borderWidth: 2,
    borderColor: C.line,
  },
  selectionCardActive: {
    borderColor: C.blue,
    backgroundColor: C.blueSoft,
  },

  /* Tab bar */
  tabBar: {
    height: 78,
    paddingTop: SP.sm,
    paddingBottom: Platform.OS === 'ios' ? SP.lg : SP.md - 2,
    borderTopWidth: 0,
    backgroundColor: C.surface,
    ...shadow(0.08, 16, -4),
  },
  tabLabel: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: -0.1,
  },
});
