---
title: Tensi Track
slug: tensitrack
description: A modern blood pressure tracking web app with glass-morphism UI, real-time analytics, QR code sharing, and secure data management.
role: Solo Developer
client: Personal Project
year: 2024
status: shipped
featured: true
tags:
  - Health
  - Dashboard
  - Analytics
technologies:
  - name: Next.js
    purpose: App Router, React Server Components, Server Actions
  - name: TypeScript
    purpose: Full type safety across the stack
  - name: Tailwind CSS
    purpose: Custom design system with glass-morphism and animations
  - name: Supabase
    purpose: PostgreSQL database, authentication, Row Level Security
  - name: Recharts
    purpose: 30-day blood pressure charts and trend comparison
  - name: shadcn/ui
    purpose: Accessible UI primitives and components
  - name: Zod
    purpose: Form validation and runtime type checking
  - name: date-fns
    purpose: Date formatting with Indonesian locale
thumbnail: /projects/tensitrack/cover.webp
images: []
liveUrl: https://tensi-track.vercel.app/
repoUrl: https://github.com/AlberthYap/TensiTrack
metrics:
  - label: Features
    value: 50+
  - label: Tech Stack
    value: 8 technologies
relatedProjects: []
---

A full-featured health tracking app built with Next.js 14 and Supabase. Automatically classifies blood pressure readings using AHA guidelines (5 categories from Normal to Hypertensive Crisis), with real-time visual feedback through interactive charts.

### Key Features

- **Dashboard** — Latest reading snapshot, weekly trends, quick stats with sparkline mini-charts
- **Analytics** — 30-day chart, category distribution pie chart, trend comparison vs previous period
- **Secure Sharing** — QR code generation, expiring share links with view count controls, revocable tokens
- **Export & Import** — Excel (.xlsx), PDF with branded header, CSV import with preview & validation
- **12+ settings & preferences** — Profile management, password change, soft delete account, dark mode

### Architecture

Next.js 14 App Router frontend with Supabase backend. Server Actions handle all mutations, Row Level Security enforces data isolation at the database level — no application-level authorization guards needed.
