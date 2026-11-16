---
name: web-interface-guidelines
description: >-
  Web Interface Guidelines for UI/UX, Accessibility (a11y), responsive design, and semantic HTML.
  Use when designing, writing, or auditing frontend interfaces to guarantee WCAG 2.1 AA compliance,
  keyboard navigation, mobile ergonomics, and consistent microcopy.
---

# Web Interface Guidelines

Guidelines for building accessible, responsive, and robust modern web interfaces.

## 1. Accessibility (WCAG 2.1 AA)

* **Semantic Elements**:
  - Prefer native `<button>`, `<input>`, `<select>`, `<nav>`, `<main>`, `<header>` over `<div>` with `onClick`.
  - Icon-only buttons must have `aria-label="Action description"`.
* **Focus Visibility**:
  - Never remove focus outlines without providing a visible replacement.
  - Standard focus ring: `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#07080C]`.
* **Screen Reader Announcers**:
  - Dynamic status messages and alerts must use `role="status"` or `role="alert"` with `aria-live="polite"`.

## 2. Touch & Mobile Ergonomics

* **Hit Targets**:
  - All interactive elements on mobile must have a minimum hit area of 44×44px (either directly or via padding).
* **Safe Areas & Viewport Overflows**:
  - Inputs must use `font-size: 16px` on mobile Safari/Chrome to prevent automatic viewport zoom on focus (`text-base sm:text-xs`).
  - Tables must have horizontal scroll containers (`overflow-x-auto`) to avoid breaking screen width.

## 3. Form Validation & Microcopy

* **Inline Error Guidance**:
  - Errors must explain what is required rather than merely stating "Invalid input".
* **Consistency in Terminology**:
  - Standardize terminology across views: "Receipt" (not mixed with "Ticket" or "Invoice"), "Ledger" (not mixed with "Log"), "Settings".
