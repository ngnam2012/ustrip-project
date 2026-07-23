import { StyleSheet, Platform } from 'react-native';

/* ── Color Palette (Material Design 3 Inspired) ──────────────── */
export const C = {
  // Primary
  blue:       '#0058be', // primary
  blueDark:   '#004395', // on-primary-fixed-variant
  blueLight:  '#d8e2ff', // primary-fixed
  blueSoft:   '#e6f0ff', // custom soft primary
  
  // Secondary / Accent
  orange:     '#855316', // secondary
  orangeLight:'#ffdcbd', // secondary-fixed
  orangeDark: '#683c00', // on-secondary-fixed-variant

  // Semantic
  mint:       '#059669', // kept for success
  mintLight:  '#D1FAE5',
  gold:       '#D97706', // kept for warning
  goldLight:  '#FEF3C7',
  red:        '#ba1a1a', // error
  redLight:   '#ffdad6', // error-container

  // Neutrals
  bg:         '#f7f9fb', // background
  surface:    '#ffffff', // surface-container-lowest
  surfaceContainer: '#eceef0',
  surfaceVariant: '#e0e3e5',
  white:      '#ffffff',
  ink:        '#191c1e', // on-surface
  ink2:       '#111c2d', // on-tertiary-fixed
  muted:      '#424754', // on-surface-variant
  subtle:     '#727785', // outline
  line:       '#e0e3e5', // surface-variant
  border:     '#c2c6d6', // outline-variant
  disabled:   '#eceef0', // surface-container

  // Brand
  momo:       '#A50064',
};

/* ── Spacing (8px grid) ────────────────────────────────────────── */
export const SP = {
  xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48,
};

/* ── Border Radius ─────────────────────────────────────────────── */
export const R = {
  sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, full: 9999,
};

/* ── Shadows ───────────────────────────────────────────────────── */
const shadow = (opacity = 0.04, radius = 20, offset = 4) => ({
  shadowColor: '#000000',
  shadowOpacity: opacity,
  shadowRadius: radius,
  shadowOffset: { width: 0, height: offset },
  ...Platform.select({ android: { elevation: Math.round(radius / 4) } }),
});

export const Shadows = {
  sm:  shadow(0.04, 10, 2),
  md:  shadow(0.04, 20, 4),
  lg:  shadow(0.08, 24, 8),
  xl:  shadow(0.12, 32, 12),
  ambient: shadow(0.04, 20, 4),
  kinetic: {
    shadowColor: C.blue,
    shadowOpacity: 0.25,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  }
};

/* ── StyleSheet ────────────────────────────────────────────────── */
export const S = StyleSheet.create({
  /* Layout */
  screen:   { flex: 1, backgroundColor: C.bg },
  content:  { padding: SP.lg, paddingBottom: SP.xxl + SP.xl },

  /* Typography */
  display:  { fontSize: 40, fontFamily: 'Inter_700Bold', color: C.ink, letterSpacing: -0.8, lineHeight: 48 },
  title:    { fontSize: 24, fontFamily: 'Inter_700Bold', color: C.ink, letterSpacing: 0, lineHeight: 32 },
  h2:       { fontSize: 20, fontFamily: 'Inter_600SemiBold', color: C.ink, lineHeight: 28 },
  h3:       { fontSize: 16, fontFamily: 'Inter_400Regular', color: C.ink2, lineHeight: 24 },
  body:     { fontSize: 14, fontFamily: 'Inter_400Regular', color: C.ink2, lineHeight: 20 },
  subtitle: { fontSize: 14, fontFamily: 'Inter_400Regular', color: C.muted, marginTop: SP.xs, lineHeight: 20 },
  caption:  { fontSize: 11, fontFamily: 'Inter_500Medium', color: C.subtle, lineHeight: 14 },

  /* Cards */
  card: {
    backgroundColor: C.surface,
    borderRadius: R.xl,
    padding: SP.md,
    marginBottom: SP.md,
    borderWidth: 0,
    ...shadow(0.04, 20, 4), // Matching the shadow-[0px_4px_20px_rgba(0,0,0,0.04)]
  },
  cardElevated: {
    backgroundColor: C.surface,
    borderRadius: R.xl,
    padding: SP.lg,
    marginBottom: SP.md,
    borderWidth: 0,
    ...shadow(0.08, 24, 8),
  },
  cardHero: {
    backgroundColor: C.blue,
    borderRadius: R.xl,
    padding: SP.lg,
    marginBottom: SP.md,
    ...shadow(0.1, 24, 8),
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
    marginBottom: SP.xs,
    marginTop: SP.md,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#e0e3e5',
    borderRadius: R.md,
    backgroundColor: C.surface,
    paddingHorizontal: SP.md,
    paddingVertical: SP.md + 2,
    fontSize: 16,
    fontFamily: 'Inter_500Medium',
    color: C.ink,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  inputFocused: {
    // Focus styles are usually handled via component state, but we provide this for consistency
    backgroundColor: C.blueSoft,
  },

  /* Buttons */
  button: {
    backgroundColor: C.blue,
    borderRadius: R.lg,
    paddingVertical: SP.md,
    paddingHorizontal: SP.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SP.lg,
    minHeight: 56,
    ...shadow(0.1, 16, 4),
  },
  orangeButton: {
    backgroundColor: C.orange,
    ...shadow(0.1, 16, 4),
  },
  buttonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: C.blue,
    borderRadius: R.lg,
    paddingVertical: SP.md - 2,
    paddingHorizontal: SP.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SP.md,
    minHeight: 56,
  },
  buttonText: {
    color: C.white,
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
    letterSpacing: -0.1,
  },
  buttonSecondaryText: {
    color: C.blue,
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
    letterSpacing: -0.1,
  },

  /* Pills / Badges */
  pill: {
    alignSelf: 'flex-start',
    borderRadius: R.full,
    paddingHorizontal: SP.md,
    paddingVertical: SP.xs + 2,
    backgroundColor: C.blueLight,
    color: C.blueDark,
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
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
    fontFamily: 'Inter_700Bold',
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
    marginVertical: SP.md,
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
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
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    color: C.muted,
    textAlign: 'center',
    lineHeight: 24,
  },

  /* List Items */
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.surface,
    borderRadius: R.xl,
    padding: SP.md,
    marginBottom: SP.sm,
    borderWidth: 0,
    ...shadow(0.04, 10, 2),
  },
  listItemIcon: {
    width: 48,
    height: 48,
    borderRadius: R.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SP.md,
  },
  listItemContent: {
    flex: 1,
  },
  listItemChevron: {
    color: C.subtle,
    fontSize: 24,
    fontFamily: 'Inter_600SemiBold',
    marginLeft: SP.sm,
  },

  /* Bottom Sheet */
  sheetOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(25, 28, 30, 0.5)', // slightly warmer overlay
  },
  sheetContainer: {
    backgroundColor: C.surface,
    borderTopLeftRadius: R.xl,
    borderTopRightRadius: R.xl,
    padding: SP.lg,
    paddingBottom: SP.xxl,
    ...shadow(0.1, 32, -8),
  },
  sheetHandle: {
    width: 40,
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
    borderRadius: R.lg,
    padding: SP.md,
    margin: SP.xs,
    borderWidth: 0,
    ...shadow(0.04, 10, 2),
  },
  metricLabel: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    color: C.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: SP.xs,
  },
  metricValue: {
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
    letterSpacing: -0.3,
  },

  /* Selection Card */
  selectionCard: {
    backgroundColor: C.surface,
    borderRadius: R.lg,
    padding: SP.md,
    marginBottom: SP.sm + 2,
    borderWidth: 2,
    borderColor: 'transparent',
    ...shadow(0.04, 10, 2),
  },
  selectionCardActive: {
    borderColor: C.blue,
    backgroundColor: C.blueSoft,
  },

  /* Tab bar */
  tabBar: {
    height: 80,
    paddingTop: SP.sm,
    paddingBottom: Platform.OS === 'ios' ? SP.lg : SP.md,
    borderTopWidth: 0,
    backgroundColor: C.surface,
    ...shadow(0.08, 16, -4),
    // Material 3 style: floating look or rounded top
    borderTopLeftRadius: R.xl,
    borderTopRightRadius: R.xl,
    position: 'absolute',
  },
  tabLabel: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
    letterSpacing: -0.1,
  },
});

