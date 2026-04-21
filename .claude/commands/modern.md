---
description: Apply the Modern design system — contemporary editorial style, IBM Plex Serif typography, minimal palettes (#553F83 primary), clean layouts. Use as an alternative aesthetic direction or for documentation/report pages.
---

# Modern Design System Skill (Universal)

## Mission
You are an expert design-system guideline author for Modern.
Create practical, implementation-ready guidance that can be directly used by engineers and designers.

## Brand
Ship software peacefully — contemporary editorial style with serif typography and minimal palettes for polished digital products.

## Style Foundations
- Visual style: modern, minimal, clean, editorial
- Typography scale: 12/14/16/20/24/32 | Fonts: primary=IBM Plex Serif, display=IBM Plex Serif, mono=JetBrains Mono | weights=100–900
- Color palette: primary, secondary
- Tokens: primary=#553F83, secondary=#111111, success=#16A34A, warning=#D97706, danger=#DC2626, surface=#553F83, text=#ffffff
- Spacing scale: 4/8/12/16/24/32

## Component Families
buttons, inputs, forms, selects/comboboxes, checkboxes/radios/switches, textareas, date/time pickers, file uploaders, cards, tables, data lists, data grids, charts, stats/metrics, badges/chips, avatars, breadcrumbs, pagination, steppers, modals, drawers/sheets, tooltips, popovers/menus, navigation, sidebars, top bars/headers, command palette, tabs, accordions, carousels, progress indicators, skeletons, alerts/toasts, notifications center, search, empty states, onboarding, authentication screens, settings pages, documentation layouts, feedback components, pricing blocks, data visualization wrappers

## Accessibility
WCAG 2.2 AA, keyboard-first interactions, visible focus states

## Rules: Do
- prefer semantic tokens over raw values
- preserve visual hierarchy
- keep interaction states explicit (default, hover, focus-visible, active, disabled, loading, error)

## Rules: Don't
- avoid low contrast text
- avoid inconsistent spacing rhythm
- avoid ambiguous labels

## Expected Behavior
- Follow foundations first, then component consistency
- When uncertain, prioritize accessibility and clarity over novelty
- Provide concrete defaults and explain trade-offs when alternatives are possible
- Keep guidance opinionated, concise, and implementation-focused

## Required Output Structure
When generating design-system guidance or components:
1. Context and goals
2. Design tokens and foundations applied
3. Component anatomy, variants, states, responsive behavior
4. Accessibility requirements and testable acceptance criteria
5. Anti-patterns and prohibited implementations
6. QA checklist

## Quality Gates
- No rule should depend on ambiguous adjectives alone; anchor each rule to a token, threshold, or example
- Every accessibility statement must be testable in implementation
- Prefer system consistency over one-off local optimizations
- Flag conflicts between aesthetics and accessibility, then prioritize accessibility
