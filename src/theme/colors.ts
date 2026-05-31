export const colors = {

  // ── Backgrounds ─────────────────────────────────────────────────────────
  bgPrimary:  '#0F1117',     // page background
  bgSurface:  '#1F2233',     // cards, panels          ← raised from #1A1D27
  bgElevated: '#272B3F',     // inputs, slider tracks  ← raised from #242838

  // ── Borders ──────────────────────────────────────────────────────────────
  border:       'rgba(255,255,255,0.07)',   // default — replaces hard #2E3347
  borderStrong: 'rgba(255,255,255,0.13)',   // hover / focus ring
  borderFocus:  'rgba(255,255,255,0.22)',   // active text input

  // ── Text ─────────────────────────────────────────────────────────────────
  textPrimary:   '#E8EAF0',
  textSecondary: '#8B8FA8',
  textTertiary:  '#4A4E65',
  textDisabled:  '#363A52',

  // ── Accents — one per UI concern, never reused ────────────────────────────
  accentMovement:    '#4A90D9',   // blue   · D-pad + move buttons ONLY
  accentCalibration: '#E8A838',   // amber  · servo sliders ONLY
  accentHead:        '#4DBDA0',   // teal   · head screen ONLY
  accentSystem:      '#A78BFA',   // violet · settings + connect CTA
  accentDanger:      '#E05C5C',   // red    · destructive actions

  // Tint variants — for active backgrounds and pressed states
  accentMovementTint:    'rgba(74,144,217,0.12)',
  accentCalibrationTint: 'rgba(232,168,56,0.12)',
  accentHeadTint:        'rgba(77,189,160,0.12)',
  accentSystemTint:      'rgba(167,139,250,0.12)',
  accentDangerTint:      'rgba(224,92,92,0.12)',

  // ── Status — intentionally distinct from all accents ─────────────────────
  statusConnected:    '#22C55E',   // green  · unambiguously "good"
  statusDisconnected: '#E05C5C',   // red
  statusConnecting:   '#F59E0B',   // amber  · distinct from accentCalibration
  statusError:        '#E05C5C',

} as const;
