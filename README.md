# Thaqaful • Donation Sponsor Tracker & WhatsApp Dispatcher

A full-stack donation sponsor tracking and receipt automation web application built with **Next.js 15 (App Router)**, **TypeScript**, **Tailwind CSS**, and **Supabase**.

---

## 🌟 Key Features

### 1. Automated Receipt Dispatch (Matching Your Mockup)
* **Receipt Form**: Capture Payer Full Name, WhatsApp Number (with international country code selector), Currency, Amount, Purpose/Category, and Payment Method.
* **Live Dynamic Preview**: Displays real-time receipt card with sequential `TH-XXXXX` receipt IDs, payer name, category, mode, and total formatted amount.
* **Recent Receipts**: Live history feed with sponsor initials avatars, receipt codes, amounts, and status tags (`Sent`, `Draft`, `Paid`).
* **Direct WhatsApp Dispatch**: Generates localized, pre-filled WhatsApp click-to-chat links (`wa.me`) with celebration confetti and copy fallback.
* **Printable / PDF Receipt**: Clean printable official donation voucher with digital seal and signatory.

### 2. Consolidated Excel-Style Directory
* **Multi-column Filtering**: Filter by Sponsor Status (`Active`, `Overdue`, `Paused`), Language (`English`, `Malayalam`, `Arabic`, `Hindi`, `Urdu`), Reminder Frequency (`Monthly`, `Quarterly`, `Annual`), and Category.
* **Fuzzy Search**: Instant search across sponsor names, international phone numbers, categories, and internal remarks.
* **Sortable Columns**: Sort ascending/descending by Name, Pledged Amount, Next Due Date, or Status.
* **Export to Excel (.csv)**: One-click formatted spreadsheet export with UTF-8 BOM encoding for international Malayalam and Arabic characters.
* **Batch Selection**: Multi-select sponsors for bulk exports or reminders.
* **Density Switch**: Toggle between Comfortable and Compact spreadsheet rows.

### 3. Multi-Language WhatsApp Reminder Hub
* **Language-Aware Messaging**: Pre-configured templates in 5 languages:
  * 🇬🇧 **English**
  * 🇮🇳 **Malayalam (മലയാളം)**
  * 🇸🇦 **Arabic (العربية)**
  * 🇮🇳 **Hindi (हिंदी)**
  * 🇵🇰 **Urdu (اردو)**
* **Dynamic Placeholders**: Interpolates `{name}`, `{amount}`, `{currency}`, `{category}`, `{due_date}`, `{receipt_no}`, and payment details.
* **Reminder Schedule Tracker**: Identifies sponsors whose pledges are due today, overdue, or scheduled for upcoming dates based on their pledged day of the month (1–31).

### 4. Payment Received Log
* Searchable historical log of all issued receipts and received amounts.
* Summary cards for Total Collections, Total Issued Receipts, and WhatsApp Delivery Rate.
* One-click PDF printing and WhatsApp re-send.

### 5. Four-Tier Role-Based Access Control (RBAC)
* **Super Admin**: Full unrestricted control, user role management, system configurations, audit logs, and record deletion.
* **Admin**: Add/edit/delete sponsors and receipts, trigger WhatsApp messages, download Excel reports.
* **Staff**: Register/edit sponsors, issue receipts, trigger WhatsApp reminders (cannot delete records).
* **Viewer**: Read-only directory access and Excel export (cannot create, edit, delete, or send messages).
* **Interactive Role Switcher**: Built right into the top navigation bar to test each role's permissions live with one click.

---

## 🚀 Getting Started

### 1. Run Development Server
```bash
cd "H:\Web\Sponser app"
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 2. Build for Production
```bash
npm run build
npm run start
```

---

## 🗄️ Supabase Backend Setup (Optional)

The application includes an **Offline-First Hybrid Repository**:
* By default, it operates with rich pre-seeded mock sponsors and local browser storage so you can run and test it immediately.
* When you are ready to link your Supabase database:
  1. Create a project at [supabase.com](https://supabase.com).
  2. Open the **SQL Editor** in your Supabase dashboard and run the entire SQL schema from `supabase/schema.sql`.
  3. Create a `.env.local` file in `H:\Web\Sponser app`:
     ```env
     NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
     ```
  4. Restart your Next.js server (`npm run dev`). The app will automatically connect to your Supabase cloud tables with Row Level Security (RLS) active!

---

## 📁 Project Structure

```
H:\Web\Sponser app
├── src
│   ├── app
│   │   ├── globals.css         # Tailwind CSS v4 design tokens
│   │   ├── layout.tsx          # Root layout with font and metadata
│   │   ├── page.tsx            # Main application coordinator
│   │   └── providers.tsx       # Client-side RoleProvider wrapper
│   ├── components
│   │   ├── Navbar.tsx          # Sticky header with RBAC role switcher & tabs
│   │   ├── IssueReceipt.tsx    # Receipt issuance matching user mockup
│   │   ├── SponsorsTable.tsx   # Excel-style consolidated directory
│   │   ├── RemindersManager.tsx# WhatsApp schedule & 5-language template hub
│   │   ├── PaymentLog.tsx      # Payment received audit & history
│   │   ├── SettingsRBAC.tsx    # RBAC permissions matrix & Supabase guide
│   │   ├── SponsorModal.tsx    # Add / edit sponsor drawer modal
│   │   └── ReceiptPrintModal.tsx# Official printable receipt / PDF voucher
│   ├── context
│   │   └── RoleContext.tsx     # RBAC context and permission checks
│   ├── lib
│   │   ├── constants.ts        # Seed data, currencies, country codes, languages
│   │   ├── storage.ts          # Supabase + LocalStorage hybrid repository
│   │   ├── whatsapp.ts         # International phone formatting & WhatsApp wa.me URLs
│   │   └── supabase
│   │       └── client.ts       # Supabase client initializer
│   └── types
│       └── index.ts            # TypeScript definitions for Sponsor, Receipt, Roles
├── supabase
│   └── schema.sql              # Complete PostgreSQL schema with RLS policies & tables
├── .env.example                # Supabase environment variable template
└── package.json
```
