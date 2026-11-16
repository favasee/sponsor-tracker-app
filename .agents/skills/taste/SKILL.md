---
name: taste
description: >-
  Taste & Craft Skill. Guides typographic finesse, tabular number alignment, high-density readability,
  refined spacing scales, and subtle details that distinguish prototype code from high-craft software.
---

# Taste & Craft Guidelines

Taste is the discipline of subtle, intentional decisions that elevate software utility and emotional resonance.

## 1. Typography & Numerics

* **Tabular Numbers (`tabular-nums`)**:
  - Currency amounts, timestamps, receipt numbers, and percentages must always use `tabular-nums` alongside `font-mono`.
  - This prevents jitter and visual hopping during live state updates and guarantees crisp column alignment.
* **Separators & Spacing**:
  - Always separate currency abbreviations from numbers with a non-breaking space (e.g. `INR 10,000` or `₹ 10,000`).
  - Dates should follow localized formatting (e.g., `29 Oct 2026` instead of raw UTC ISO strings).

## 2. Spacing & Density

* **Density Discipline**:
  - High-density data registers (like the donation ledger) require tight padding (`py-3.5 px-4`), clear vertical rhythm, and subtle row hover highlights.
  - Form sections require breathing room (`p-6 sm:p-9 space-y-6`) so user focus is uninterrupted.
* **Border Radii Harmony**:
  - Large container cards: `rounded-3xl`
  - Internal components, buttons, and inputs: `rounded-xl` or `rounded-2xl`
  - Pill badges and counter tags: `rounded-full` or `rounded-lg`

## 3. Feedback & Microcopy

* **Affirmative Feedback**:
  - Feedback should be constructive and clear: tell the user what was accomplished (e.g. *"✅ Receipt #TH0006 generated in 1-click!"*).
* **Empty States**:
  - Empty states must never be blank voids; always offer a friendly illustration or icon with an immediate action CTA.
