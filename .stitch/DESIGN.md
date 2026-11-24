---
name: Dastavej Sanctuary
colors:
  surface: '#0c1322'
  surface-dim: '#0c1322'
  surface-bright: '#323949'
  surface-container-lowest: '#070e1d'
  surface-container-low: '#141b2b'
  surface-container: '#191f2f'
  surface-container-high: '#232a3a'
  surface-container-highest: '#2e3545'
  on-surface: '#dce2f7'
  on-surface-variant: '#bbcabf'
  inverse-surface: '#dce2f7'
  inverse-on-surface: '#293040'
  outline: '#86948a'
  outline-variant: '#3c4a42'
  surface-tint: '#4edea3'
  primary: '#4edea3'
  on-primary: '#003824'
  primary-container: '#10b981'
  on-primary-container: '#00422b'
  inverse-primary: '#006c49'
  secondary: '#45dfa4'
  on-secondary: '#003825'
  secondary-container: '#00bd85'
  on-secondary-container: '#00452e'
  tertiary: '#6bd8cb'
  on-tertiary: '#003732'
  tertiary-container: '#42b4a7'
  on-tertiary-container: '#00413b'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#6ffbbe'
  primary-fixed-dim: '#4edea3'
  on-primary-fixed: '#002113'
  on-primary-fixed-variant: '#005236'
  secondary-fixed: '#68fcbf'
  secondary-fixed-dim: '#45dfa4'
  on-secondary-fixed: '#002114'
  on-secondary-fixed-variant: '#005137'
  tertiary-fixed: '#89f5e7'
  tertiary-fixed-dim: '#6bd8cb'
  on-tertiary-fixed: '#00201d'
  on-tertiary-fixed-variant: '#005049'
  background: '#0c1322'
  on-background: '#dce2f7'
  surface-variant: '#2e3545'
typography:
  display-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 40px
    fontWeight: '600'
    lineHeight: 48px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 30px
    fontWeight: '600'
    lineHeight: 38px
    letterSpacing: -0.015em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 30px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '500'
    lineHeight: 26px
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 17px
    fontWeight: '400'
    lineHeight: 26px
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 20px
  label-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 14px
    letterSpacing: 0.04em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-desktop: 1.5rem
  margin: 1.25rem
  margin-desktop: 2.5rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

# Dastavej Sanctuary Design System

## Brand & Style
This design system embodies the calm, unhurried security of an ancestral repository translated into contemporary digital craft. Rooted in minimalist elegance with conversational AI interfaces (reminiscent of Gemini and ChatGPT mobile and desktop surfaces), the interface eliminates cognitive clutter, visual debt, and decorative noise.

The emotional signature is absolute peace of mind: solemn trust, discretion, and intuitive access tailored across multi-generational households—from tech-savvy adult children to elderly matriarchs and patriarchs. Layouts prioritize generous spatial rhythm, high legibility, whispered surface separations, and bilingual English-Hindi harmony. Tactile, soft-edged cards rest calmly against deeply saturated slate fields, punctuated strictly by an authoritative yet restorative emerald green for verification and primary navigation targets.

## Colors
- **Canvas (`#0c1322`)**: Deep navy-slate background.
- **Card Containers (`#191f2f`, `#232a3a`, `#2e3545`)**: Gentle, tinted dark-slate containers providing organic figure-ground separation without aggressive contrast shifts.
- **Primary Emerald Accent (`#10b981` / `#4edea3`)**: Actionable targets, verified document status badges, biometric confirmations, and crucial security indicators.
- **Secondary Mint Highlight (`#45dfa4`)**: Active tags, micro-indicators, and subtle contextual infographics.
- **Text (`#dce2f7` primary, `#bbcabf` muted)**: High-contrast crisp typography with bilingual support.

## Layout & Architecture (Desktop Widescreen)
- **Top Header Bar**: Vault navigation, 256-bit AES Zero-Knowledge trust badge, and active session identity.
- **Quick Document Preset Row**: 1-click presets for Aadhaar, PAN, Vehicle RC/DL, Medical/Parchi, Property Deed, and Passport.
- **2-Column Split Workspace (1440px wide max-w-7xl)**:
  - **Left Column (~52%)**: Visual Document Ingestion & Live AI OCR Inspector (dropzone, scanner capture, simulated government ID card with verified holographic badge, masked UID, and real-time OCR telemetry).
  - **Right Column (~48%)**: Metadata, Family Member Assignment Carousel (Papa, Mummy, Self, Dadi, Beta, + Add), Extracted Government Attributes, Household Access Governance, and Primary Vault Save CTA.
