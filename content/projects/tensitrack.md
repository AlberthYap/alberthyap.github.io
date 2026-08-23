---
title: Tensi Track
slug: tensitrack
description: Indonesian daily blood pressure tracker built on Next.js 14 + Supabase, with AHA classification, voice input, QR doctor sharing, and hardened Row Level Security.
role: Solo Developer
client: Personal Project
year: 2026
status: shipped
featured: true
tags:
  - Health
  - Dashboard
  - Analytics
  - PWA
technologies:
  - name: Next.js
    purpose: App Router, React Server Components, Server Actions
  - name: TypeScript
    purpose: Full type safety across the stack
  - name: Tailwind CSS
    purpose: Glass-morphism design system, dark mode, mobile-first
  - name: Supabase
    purpose: PostgreSQL, Auth, Row Level Security, stored procedures
  - name: Recharts
    purpose: 7/30-day charts, category distribution, trend comparison
  - name: shadcn/ui
    purpose: Accessible UI primitives and components
  - name: Zod + React Hook Form
    purpose: Client- and server-side form validation
  - name: Vitest + Testing Library
    purpose: 217 test cases across validation, parsers, and security
  - name: date-fns
    purpose: Indonesian locale, consistent Asia/Jakarta timezone
thumbnail: /projects/tensitrack/cover.webp
# Dark-mode screenshot variant — swapped in automatically by ThemeImage
# when the site theme is dark. Placeholder generated from the light shot;
# replace with a real dark-mode capture from the app.
thumbnailDark: /projects/tensitrack/cover-dark.webp
images: []
liveUrl: https://tensi-track.vercel.app/
repoUrl: https://github.com/AlberthYap/TensiTrack
metrics:
  - label: Test cases
    value: "217"
  - label: SQL migrations
    value: "11"
  - label: Technologies
    value: "9"
relatedProjects: []
---

Tensi Harian is an Indonesian-language web app for recording and monitoring daily blood pressure, built on Next.js 14 (App Router) and Supabase. Every reading is classified automatically against AHA guidelines into five categories (Low, Normal, Elevated, Hypertension Stage 1 & 2), and the whole app is installable as a PWA.

### Key Features

- **Auth & accounts:** register, login, logout, and forgot/reset password via Supabase Auth with SSR sessions. Middleware-protected routes with auto-redirect, plus a one-click demo account capped at 100 records by an atomic database RPC.
- **Blood pressure logging:** Zod + React Hook Form validation on client and server, automatic classification into 5 AHA categories, lifestyle tags per record, soft delete, and a consistent Asia/Jakarta timezone.
- **Voice input:** quick-add modal with a Web Speech API parser tuned for Indonesian transcription quirks, like "120 delapan" and word-by-word numbers.
- **Dashboard & analytics:** latest readings, 7-day and 30-day charts, category distribution, monthly stats, trend comparison with toned insights, diurnal analysis, lifestyle-tag correlation, risk gauge, and crisis alerts.
- **Medication tracking:** medication list with dosages, daily intake log, and a personal blood pressure target.
- **Doctor sharing:** token-based read-only link with QR code and view counter, an ISR-cached share page (30s revalidate), and export straight from the share page.
- **Export & import:** Excel (.xlsx) and branded PDF, a print-friendly layout, and CSV import with automatic validation for historical data.
- **PWA & landing page:** manifest, service worker, and offline fallback, alongside an interactive BP-check widget, dashboard preview, FAQ, robots.ts, and sitemap.ts.

### Security & Architecture

Server-side first: React Server Components and Server Actions handle nearly everything, so API routes and the client bundle stay small.

- Row Level Security on every table
- Sliding-window rate limiting on auth and share endpoints as atomic PostgreSQL RPCs
- Hardening migration: REVOKE public access to internal tables, pin `search_path` on all `SECURITY DEFINER` functions
- 11 versioned SQL migrations, atomic stored procedures for race-prone operations

### Testing & UI

217 test cases across 13 files with Vitest + Testing Library, covering validation, classification, the voice parser, rate limiting, server actions, and trend insights.

Mobile-first glass-morphism design system with dark mode, skip-link, and loading states throughout.
