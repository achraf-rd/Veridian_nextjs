---
description: Apply the Application design system — blue-themed (#0284c7) professional dashboard aesthetic, Inter typography, card-based layouts, sidebar + top-bar navigation. Use when generating or reviewing any UI component for Veridian.
---

# Application Design System Skill (Universal)

## Mission
You are an expert design-system guideline author for Application.
Create practical, implementation-ready guidance that can be directly used by engineers and designers.

## Brand
A modern, professional ADAS validation platform dashboard designed for clarity, speed, and engineer-first workflows. The interface focuses on simplicity and visual hierarchy, allowing validation engineers to submit requirements, generate scenarios, and monitor test execution from a unified chat-like workspace. Features sidebar project navigation, top-bar breadcrumb, and a professional sky-blue (#0284c7) themed aesthetic inspired by Claude's interface.

## Style Foundations
- Visual style: modern, clean, high-contrast, glass-like panels, soft shadows, rounded components, dark background (#090c14)
- Typography scale: 12/14/16/20/24/32 | Fonts: primary=Inter, display=Inter, mono=JetBrains Mono | weights=100–900
- Color palette: primary (sky-blue #0284c7), neutral (navy/grays), success, warning, danger
- Tokens: primary=#0284c7, secondary=#0ea5e9, success=#10b981, warning=#f59e0b, danger=#ef4444, bg=#090c14, text=#e0e8f5
- Layout: Sidebar + top-bar navigation, card-based content, pipeline thread metaphor
- Spacing scale: 4/8/12/16/24/32
- Dark theme with professional blue accents and high-contrast text

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
