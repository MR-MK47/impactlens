# ImpactLens — Complete Project Brief
### Version 1.0 | June 2026

---

## Table of Contents
1. [Project Identity](#1-project-identity)
2. [Tech Stack & Architecture](#2-tech-stack--architecture)
3. [User Roles & Permission Model](#3-user-roles--permission-model)
4. [Complete User Workflow](#4-complete-user-workflow)
5. [All Screens — Design Blueprint (30 screens)](#5-all-screens--design-blueprint)
6. [Single UI Generation Prompt](#6-single-ui-generation-prompt)
7. [User Story — Full Narrative](#7-user-story--full-narrative)
8. [Administrator Operations](#8-administrator-operations)
9. [Future Business Integration Roadmap](#9-future-business-integration-roadmap)

---

## 1. Project Identity

### Name
**ImpactLens**

### Tagline
*"One photo from the field. A verified story for every donor."*

### What It Is
ImpactLens is a **field-to-donor transparency engine** for purpose-driven organizations. It connects field volunteers, organizational directors, and donors through a single intelligent pipeline — where a photo taken by a volunteer in the field automatically becomes verified proof of impact, a tax receipt, a WhatsApp message to a donor, and SEO content on the organization's public website.

### Core Problem It Solves
NGOs do incredible work but fail at three things simultaneously:
- Capturing and managing field media in an organized, credible way
- Communicating impact to donors in real time
- Generating organic growth via SEO without a marketing team

ImpactLens solves all three with **one photo upload**.

### What Makes It Unique
Most tools focus on managing the flow of **money**. ImpactLens manages the flow of **trust**. It uses AI to *verify and articulate real-world action*, not fabricate it — turning field proof directly into donor confidence and organic reach.

---

## 2. Tech Stack & Architecture

| Layer               | Technology                                                                            | Role                                                                                 |
| ------------------- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| **AI Engine**       | Gemini 2.5 Flash Lite                                                                 | Vision analysis, description generation, SEO content writing, donor message drafting |
| **Auth & Database** | Supabase                                                                              | User authentication, role management, metadata storage, multi-org data isolation     |
| **File Storage**    | Supabase Storage (or Cloudflare R2)                                                   | Photo and document storage, CDN delivery                                             |
| **WhatsApp CRM**    | WACRM (`github.com/ArnasDon/wacrm`)                                                   | Donor conversations, broadcast messages, automated receipts and impact updates       |
| **Receipt Engine**  | Universal Billing Platform (`github.com/Shubham-Jana-Dev/Universal-billing-platform`) | Professional receipt generation, PDF export, print support                           |
| **Frontend**        | React + Next.js                                                                       | Web application (multi-tenant, SSR for public pages)                                 |
| **Hosting**         | Vercel / Railway                                                                      | Deployment, edge functions, cron jobs                                                |

### Architecture Flow

```
Volunteer (Mobile Browser)
    │ uploads photo
    ▼
Supabase Storage ──► Gemini 2.5 Flash Lite (Vision AI)
                              │
                              ▼ AI Draft Description
                     Supabase DB (is_approved: false)
                              │
                              ▼
                     Director Dashboard (Approval Queue)
                              │
               ┌──────────────┼──────────────┐
               ▼              ▼              ▼
        Public Trustfeed   WhatsApp     SEO Blog
        (Next.js SSR)      (WACRM)      (Auto-generated)
                              │
                              ▼
                     Receipt Engine (Universal Billing)
```

### Multi-Tenancy Model
Each organization (NGO, business) is an isolated **tenant** in Supabase with:
- Row-Level Security (RLS) policies on all tables
- Organization-scoped storage buckets
- Unique public slug (`/[org-slug]`) for public Trustfeed
- Custom branding (logo, colors, domain)

---

## 3. User Roles & Permission Model

### Role Hierarchy

```
Platform Super Admin
    └── Organization Admin (Director)
            ├── Manager (Senior Staff)
            └── Volunteer (Field Staff)
        
Public (Unauthenticated)
    └── Donor / Site Visitor (public Trustfeed + blog)
```

### Role Capabilities

| Capability                 | Volunteer | Manager | Director/Admin | Super Admin |
| -------------------------- | --------- | ------- | -------------- | ----------- |
| Upload field photos        | ✅         | ✅       | ✅              | —           |
| View own submissions       | ✅         | ✅       | ✅              | —           |
| View all submissions       | ❌         | ✅       | ✅              | —           |
| Approve/Reject media       | ❌         | ✅       | ✅              | —           |
| Manage donors (CRM)        | ❌         | ✅       | ✅              | —           |
| Send WhatsApp broadcasts   | ❌         | ✅       | ✅              | —           |
| Generate receipts          | ❌         | ✅       | ✅              | —           |
| Publish/edit SEO blog      | ❌         | ✅       | ✅              | —           |
| View analytics             | ❌         | Limited | ✅              | ✅           |
| Manage team members        | ❌         | ❌       | ✅              | ✅           |
| Organization settings      | ❌         | ❌       | ✅              | ✅           |
| Manage all organizations   | ❌         | ❌       | ❌              | ✅           |
| Set platform billing plans | ❌         | ❌       | ❌              | ✅           |

---

## 4. Complete User Workflow

### Workflow A — The Full Impact Pipeline (Core Loop)

```
Step 1: Volunteer captures field photo
    └── Opens ImpactLens on mobile browser
    └── Taps "Upload Impact"
    └── Selects photo from camera or gallery
    └── Picks Project Category (Education, Food, Healthcare, etc.)
    └── Optionally adds notes / location tag
    └── Taps Submit
    └── ✅ Photo uploads to Supabase Storage
    └── 🤖 Gemini Vision AI triggers automatically:
         - Analyzes image content
         - Cross-references category metadata
         - Drafts empathetic, contextual description
         - Saves to DB with is_approved: false, status: pending

Step 2: Director reviews in Approval Queue
    └── Director receives notification: "3 new submissions pending"
    └── Opens Approval Queue
    └── Reviews photo + AI-drafted description side by side
    └── Edits description if needed (inline editor)
    └── Taps "Approve" OR "Reject with Notes"
    └── On Approve:
         - is_approved: true written to DB
         - Photo publishes to public Trustfeed
         - Gemini checks donor interest tags → identifies relevant donors
         - WACRM auto-sends WhatsApp: "Your donation in action today, [name]..."
         - Photo queued for weekly SEO blog batch

Step 3: Donor receives WhatsApp impact update
    └── Donor's phone shows WhatsApp notification
    └── Message: "Hi [name]! See how your ₹5,000 to our Education fund made a difference today."
    └── Link to live Trustfeed post
    └── Optional: Donate again CTA

Step 4: Public Trustfeed updates
    └── NGO's public page at impactlens.app/[org-slug] refreshes
    └── New verified photo appears in masonry grid with AI description
    └── Visible to anyone without login
```

---

### Workflow B — Receipt Generation & Delivery

```
Step 1: Admin logs a donation
    └── Opens Donor Management → Select or Create Donor
    └── Fills: Amount, Date, Campaign, Payment Method
    └── Saves donation record to Supabase

Step 2: Generate Receipt
    └── Opens Receipts → "New Receipt"
    └── System pre-fills from donation record
    └── Auto-generates receipt number (e.g., IMP-2026-00142)
    └── Universal Billing Platform renders PDF receipt preview
    └── Admin reviews → confirms

Step 3: Deliver Receipt
    └── "Send via WhatsApp" → WACRM pushes PDF receipt to donor's phone
    └── "Download PDF" → saves to browser / local printer
    └── "Print" → Universal Billing Platform handles physical printing
    └── Receipt stored in Supabase, linked to donor profile
```

---

### Workflow C — AI SEO Blog Generation

```
Step 1: Cron job triggers (weekly, or manually)
    └── System gathers all approved photos from the past 7 days
    └── Groups by category/campaign

Step 2: Gemini generates blog post
    └── Input: 3–5 approved photos + their descriptions + campaign metadata
    └── Output: 
         - SEO-optimized title (e.g., "Education Initiative: October 2026 Field Update")
         - 600–800 word article body
         - Meta title, meta description, focus keywords
         - Schema markup suggestions

Step 3: Director reviews in Blog Editor
    └── Opens SEO Manager → draft appears
    └── Rich text editor with AI-generated content pre-loaded
    └── Edits, adds featured image from Media Library
    └── Sets meta fields
    └── Publishes → appears on public blog at /[org-slug]/blog
```

---

### Workflow D — New Organization Onboarding (Admin)

```
Step 1: Platform Super Admin creates org slot
    └── OR organization signs up directly on landing page

Step 2: Onboarding Wizard (5 steps)
    Step 2a: Choose Organization Type
             (NGO · Real Estate · Construction · Retail · Custom)
    Step 2b: Organization Details
             (Name, logo, mission statement, country, contact email)
    Step 2c: Connect WhatsApp
             (WACRM connection → scan QR / API key entry)
    Step 2d: Customize Trustfeed
             (Choose color theme, grid layout, enable/disable features)
    Step 2e: Invite Team Members
             (Add emails, assign roles: Director / Manager / Volunteer)

Step 3: System generates
    └── Unique org slug (e.g., /create-together-foundation)
    └── Supabase tenant space (RLS policies applied)
    └── Welcome email with dashboard link sent to director
```

---

### Workflow E — Super Admin Platform Operations

```
Daily:
    └── Review new organization sign-ups
    └── Monitor system health (storage usage, API calls)
    └── Check for flagged content or support tickets

Weekly:
    └── Review platform analytics (MAU, feature usage, growth)
    └── Manage plan upgrades / billing

As Needed:
    └── Suspend/Reactivate organizations
    └── Override organization settings if abuse detected
    └── Release new business type templates
    └── Manage pricing plans and feature flags
```

---

## 5. All Screens — Design Blueprint

**Visual Design Direction:**
- Aesthetic: Warm, trust-inspiring modernism. Not cold SaaS. Not charity-kitsch.
- Primary Palette: Deep forest green `#0D6E55` + Warm white `#FAFAF7` + Amber `#F59E0B`
- Typography: Instrument Serif (headings) + DM Sans (body/UI)
- Motion: Subtle fade-ins, approval card flips, trustfeed masonry reveal
- Layout: 12-column grid, card-based content, strong use of imagery

---

### PUBLIC SCREENS (No Authentication Required)

---

#### Screen 1 — Platform Landing Page (`/`)
**Purpose:** Marketing homepage for the ImpactLens platform itself.

**Layout Sections:**
1. **Nav Bar** — Logo (ImpactLens lens icon), links (Features · Pricing · For Businesses · Sign In), CTA button "Get Started Free"
2. **Hero Section** — Large serif headline: *"One Photo from the Field. A Verified Story for Every Donor."* Sub-headline: *"ImpactLens turns field media into donor trust, WhatsApp receipts, and Google rankings — automatically."* Two CTA buttons: "Start for Free" (green) + "See a Live Demo" (outline). Animated loop: photo upload → AI processing → WhatsApp ping → Trustfeed update.
3. **The Pipeline Explainer** — 4-step horizontal flow graphic (Upload → AI → Approve → Amplify) with icons and one-line descriptions.
4. **Feature Cards (3-up grid)**
   - Trustfeed (proof-of-impact masonry wall)
   - WhatsApp CRM (noble donor communications)
   - AI SEO (automated content for Google rankings)
   - Receipt Engine (automated tax receipts)
5. **Live Demo Embed** — Iframe or animated mockup of a public Trustfeed
6. **"Built for NGOs. Scales to Any Business"** — Section with logos/icons: NGO · Real Estate · Construction · Retail. Small paragraph on expansion.
7. **Pricing Table** — Free / Growth / Enterprise tiers
8. **Testimonial Strip** — 2–3 quotes (placeholder until real customers)
9. **Footer** — Links, social, copyright

**Design Note:** Hero has a warm gradient background with a subtle grain texture. The pipeline explainer uses the amber accent color.

---

#### Screen 2 — Organization Public Trustfeed (`/[org-slug]`)
**Purpose:** Public-facing page for each organization's verified impact feed.

**Layout Sections:**
1. **Org Header** — Banner image, organization logo, name, mission statement (2 lines), "Donate / Contact" CTA
2. **Impact Stats Bar** — 3 numbers: "347 Field Reports Published · 1,240 Donors Updated · Since 2022"
3. **Trustfeed Grid** — Masonry grid of approved impact photos. Each card: photo, AI-written description, category tag, date, "Share" icon. Load-more pagination.
4. **Impact by Category** — Horizontal pill filters: All · Education · Food · Healthcare · Environment. Filters the masonry grid.
5. **Footer** — Powered by ImpactLens badge, social links, organization contact

**Design Note:** This page is completely public-facing, no login needed. Cards load with a staggered fade-in for visual polish. Mobile-first because donors may visit from a WhatsApp link on their phones.

---

#### Screen 3 — Public Blog (`/[org-slug]/blog`)
**Purpose:** SEO-generated blog posts from AI.

**Layout:** Editorial blog listing — featured post hero at top, then chronological 2-column grid. Each card: featured image, title, excerpt, date, category, reading time.

---

#### Screen 4 — Blog Post (`/[org-slug]/blog/[post-slug]`)
**Purpose:** Individual SEO blog post rendered from AI content.

**Layout:** Full-width hero image, headline, date + category, body text in readable column (650px max), embedded Trustfeed photos inline, "Related Posts" at bottom, "Share on WhatsApp / Twitter" buttons.

---

### AUTH SCREENS

---

#### Screen 5 — Login (`/login`)
**Layout:** Centered card on a warm off-white background with a subtle mosaic of impact photos. Fields: Email, Password. "Forgot password" link. "Continue with Google" button. "Don't have an account? Create org" link at bottom.

---

#### Screen 6 — Signup (`/signup`)
**Layout:** Two-column layout — form on left, animated feature callout on right. Fields: Full name, Email, Password, Organization Name. Role selector: "I am the Director / I am a Volunteer." Submit → triggers org creation (for Director) or invite check (for Volunteer).

---

#### Screen 7 — Organization Onboarding Wizard (`/onboarding`)
**Layout:** Full-screen step flow with progress indicator at top (5 steps). Clean centered card per step.

- **Step 1 — Org Type:** Large icon cards to select: NGO · Real Estate · Construction · Retail · Other. Selection highlights card in green.
- **Step 2 — Org Details:** Logo upload (drag/drop), Name, Mission (textarea), Country, Website URL, Primary Contact Email.
- **Step 3 — Connect WhatsApp:** Two options: "Scan QR Code (WACRM)" with live QR, or "Enter API Key." Status indicator goes green when connected.
- **Step 4 — Customize Trustfeed:** Color picker (5 presets + custom hex), Grid Layout (2-col, 3-col, masonry), enable/disable features (SEO blog, receipts).
- **Step 5 — Invite Team:** Email input with role dropdown (Director/Manager/Volunteer), "Add Another" link. Can skip.

---

#### Screen 8 — Accept Invite (`/invite/[token]`)
**Layout:** Simple centered card. Shows: "You've been invited to join [Org Name] as a [Volunteer]." Fields: Full Name, Set Password. "Accept Invitation" button. Auto-redirects to volunteer dashboard after accepting.

---

### VOLUNTEER PORTAL (Authenticated)

---

#### Screen 9 — Volunteer Dashboard (`/app/dashboard`)
**Layout:** Mobile-first single column. 

**Components:**
- Warm greeting: "Good afternoon, Arjun 👋"
- **Big Upload Button** — Prominent green card "📷 Upload Impact" 
- **Quick Stats Row** — 3 small cards: "12 Uploads Total · 9 Approved · 3 Pending"
- **Notification Banner** (if any) — "2 new submissions approved! Your work is live."
- **Recent Submissions Grid** — 2-column photo grid showing last 6 submissions with status badge overlay (green: Approved, amber: Pending, red: Rejected)

---

#### Screen 10 — Upload Media (`/app/upload`)
**Layout:** Single-page mobile-optimized upload flow.

**Components:**
- **Photo Picker Zone** — Large dashed rectangle "Tap to take photo or choose from gallery." On selection, shows photo preview.
- **Project / Category Dropdown** — Pulls from Supabase org categories (Education, Food, Healthcare, etc.)
- **Location Tag** — Optional text input or GPS pin button
- **AI Description Toggle** — Toggle "Let AI write the description" (on by default). When on: text box shows "AI is analyzing your photo..." then populates. When off: open text area for manual input.
- **Notes Field** — Optional: "Any notes for the director?"
- **Submit Button** — Green "Submit for Review"
- **Success Screen** — Checkmark animation: "Submitted! Your impact is now in the review queue."

---

#### Screen 11 — My Submissions (`/app/submissions`)
**Layout:** List view with filter tabs at top (All / Pending / Approved / Rejected).

Each submission item shows: thumbnail, AI description preview (truncated), category badge, submission date, status pill, and an expand chevron. Expanded view shows full AI description, any director rejection notes, and the full-size photo.

---

### DIRECTOR / ADMIN PORTAL (Authenticated)

---

#### Screen 12 — Director Dashboard (`/app/dashboard`)
**Layout:** Full dashboard with sidebar navigation. This is the central command view.

**Components:**
- **Top KPI Row** — 4 stat cards: Total Donors · WhatsApp Messages Sent (month) · Trustfeed Posts Live · Pending Approvals (flashing amber badge if > 0)
- **Pending Approvals Alert** — If queue > 0: orange banner "You have 5 submissions waiting for your review." → CTA "Review Now"
- **Donation Activity Chart** — Line chart (Recharts): donations over last 30 days, grouped by campaign
- **Recent Activity Feed** — Right column: timestamped list of events (photo approved, receipt sent, donor added, blog post published)
- **Quick Actions Bar** — Buttons: "Approve Media" · "Add Donor" · "Generate Receipt" · "Broadcast Message"

---

#### Screen 13 — Media Approval Queue (`/app/approvals`)
**Layout:** Grid of approval cards, 2-column on desktop.

Each card:
- Volunteer's profile name + upload timestamp
- Full photo (aspect-ratio preserved)
- AI-generated description in an editable textarea
- Category badge + optional location tag
- Two action buttons: **"Approve & Publish"** (green) and **"Reject"** (outlined red)
- Reject opens a modal with a notes field (fed back to volunteer)

**Top Bar:** Filter by category, date range, volunteer name. "Bulk Approve All" button with confirmation modal.

---

#### Screen 14 — Donor List / CRM (`/app/donors`)
**Layout:** Full-width table with left sidebar showing filters.

**Table Columns:** Name · Phone · Total Donated · Last Contact · Interest Tags · Status (Active / Lapsed) · Actions

**Left Filters:** By Campaign · By Donation Tier (₹1K, ₹5K, ₹10K+) · By Interest Tag · By Last Contact Date

**Top Bar:** Search field, "Import CSV" button, "Export" button, green "Add Donor" button

**Design Note:** Row hover highlights in light green. Clicking a row opens donor profile.

---

#### Screen 15 — Donor Profile (`/app/donors/[id]`)
**Layout:** Two-column detail page.

**Left Column:**
- Contact card: Name, phone, email, city
- Interest Tags (editable pills: Education, Food, etc.)
- Donation Tier badge
- Notes textarea
- Action buttons: "Send WhatsApp Message" · "Generate Receipt"

**Right Column — Tabbed:**
- **Donations Tab** — List of all donations with date, amount, campaign
- **Receipts Tab** — All receipts with download and resend options
- **WhatsApp Tab** — Full WACRM conversation thread (read-only view in app, links to WACRM for composing)
- **Impact Tab** — Grid of approved photos from campaigns this donor supports (auto-matched by interest tags)

---

#### Screen 16 — Add / Edit Donor (`/app/donors/new`)
**Layout:** Clean form modal (slide-in from right on desktop, full screen on mobile).

Fields: Full Name · Phone Number (country code selector) · Email · City · Interest Tags (multi-select pills) · Donation Tier · First Donation Date · Notes. Save button triggers Supabase write + WACRM contact sync.

---

#### Screen 17 — Receipt Manager (`/app/receipts`)
**Layout:** Table view.

Columns: Receipt No. · Donor · Amount · Campaign · Date Generated · Status (Sent/Pending/Failed) · Actions (Download PDF, Resend, View)

Top bar: Date range filter, Donor search, "New Receipt" green button.

Status pill colors: green=Sent, amber=Pending, red=Failed.

---

#### Screen 18 — Generate Receipt (`/app/receipts/new`)
**Layout:** Two-panel side-by-side (form left, live preview right).

**Left — Form:**
- Donor selector (autocomplete: type name or phone)
- Donation Amount (₹ input)
- Date
- Campaign / Project
- Payment Method (Cash/UPI/Bank Transfer/Cheque)
- Receipt Number (auto-generated, editable)
- Notes (for 80G / tax reference)

**Right — Live Preview:**
- Universal Billing Platform renders a live PDF receipt preview
- Updates as form fields are filled

**Bottom Actions:** "Send via WhatsApp" · "Download PDF" · "Print" · "Save Draft"

---

#### Screen 19 — WhatsApp Broadcast Center (`/app/whatsapp`)
**Layout:** Two-panel layout.

**Left Panel — Conversations List:**
- Search bar
- List of individual donor conversations (pulls from WACRM)
- Each item: profile initial, name, last message preview, time

**Right Panel — Broadcast Section:**
- "New Broadcast" button (opens Broadcast Composer)
- Broadcast History table: Target, Message Preview, Sent Date, Delivery Rate
- Message Templates Library: saved templates with "Use" button

---

#### Screen 20 — Broadcast Composer (`/app/whatsapp/broadcast`)
**Layout:** Full-page composer.

**Audience Selector:**
- Radio: All Donors · By Interest Tag (multi-select) · By Tier · Custom Upload
- Live count: "Estimated reach: 142 donors"

**Message Composer:**
- Text area with variable chips: `{{donor_name}}` `{{campaign_name}}` `{{amount}}` `{{impact_link}}`
- Attach: Photo from Trustfeed (opens media picker) or Receipt PDF
- Character count (WhatsApp 1024 char limit)
- Preview rendered message

**Schedule:**
- Send Now button (green)
- Schedule for: date/time picker

---

#### Screen 21 — SEO & Blog Manager (`/app/seo`)
**Layout:** Two-tab page.

**Tab 1 — Blog Posts:**
- Published posts list: Title, Publish Date, AI-generated badge, Views, Edit/View buttons
- Draft posts list
- "Generate This Week's Blog" button (triggers Gemini cron manually)

**Tab 2 — SEO Health Dashboard:**
- Meta tag completeness score (green/amber/red per post)
- Keyword density indicator
- "Sitemap Status" + "robots.txt Status"
- Indexing status (if Google Search Console connected)

---

#### Screen 22 — Blog Post Editor (`/app/seo/[post-id]`)
**Layout:** Full-page editor, similar to Notion/Medium editor style.

**Top Bar:** Back button, Post Title input (large, editable), Publish / Save Draft / Schedule buttons

**Body:** Rich text editor (TipTap or Quill) pre-populated with Gemini content. Supports headings, bold, links, image embeds (from media library).

**Right Sidebar (collapsible):**
- Featured Image picker (from media library)
- Meta Title (editable, character counter)
- Meta Description (editable, 160-char limit with indicator)
- Focus Keywords (tag input)
- Post Slug (editable URL)
- Publish Date

---

#### Screen 23 — Media Library (`/app/media`)
**Layout:** Grid with left filter panel.

**Left Filters:** Status (All/Approved/Pending/Rejected) · Category · Date Range · Uploaded By

**Grid:** Masonry or uniform grid of all uploaded media. Each item: photo thumbnail, status badge, volunteer name, date, category tag. Click opens lightbox with full details (description, metadata, approval status, usage in posts/broadcasts).

Top bar: Search, "Upload Directly" (admin upload), Export all.

---

#### Screen 24 — Analytics & Reports (`/app/analytics`)
**Layout:** Dashboard with filter controls at top (date range, campaign).

**Sections:**
- **Donation Metrics:** Total raised this period, by campaign bar chart, growth vs previous period
- **Trustfeed Metrics:** Posts published, views on public page, most-viewed post
- **WhatsApp Metrics:** Messages sent, delivery rate, open rate (if available from WACRM)
- **SEO Metrics:** Blog posts published, estimated impressions (if GSC connected)
- **Volunteer Activity:** Uploads per volunteer, approval rate

**Bottom:** "Export Full Report (PDF)" button → generates PDF using Universal Billing Platform

---

#### Screen 25 — Organization Settings (`/app/settings`)
**Layout:** Settings page with left nav (Profile · Trustfeed · Integrations · Team · Billing · Danger Zone).

**Profile Tab:** Logo upload, org name, mission (textarea), website, contact email, country, org type.

**Trustfeed Tab:** Theme color picker, grid layout selector, custom domain input, public page preview link.

---

#### Screen 26 — Team Management (`/app/settings/team`)
**Layout:** Team table + invite form.

**Table:** Avatar initial, Name, Email, Role (dropdown to change), Status (Active/Invited), Last Active, Remove button.

**Invite Section:** Email input, Role selector, "Send Invite" button. Invites appear as "Invited" status until accepted.

---

#### Screen 27 — Integrations (`/app/settings/integrations`)
**Layout:** Cards for each integration.

**Integration Cards:**
- **WhatsApp (WACRM)** — Status: Connected/Disconnected, QR code reconnect button, messages used this month
- **Receipt Printer (Universal Billing Platform)** — Status, test print button, printer settings
- **Custom Webhook** — Endpoint URL input, events selector (photo approved, receipt generated, donation added), test webhook button
- **CSV Import/Export** — Donors, receipts, donations

---

### SUPER ADMIN SCREENS (Platform-level)

---

#### Screen 28 — Platform Admin Dashboard (`/admin`)
**Layout:** Admin-specific dark sidebar, clean data-dense dashboard.

**KPIs:** Total Organizations · Total Users · WhatsApp Messages Sent (platform-wide) · Receipts Generated · Storage Used / Total

**Charts:** New org sign-ups per week, MAU line chart, feature usage breakdown (which modules most used)

**Recent Activity:** Latest org sign-ups, support tickets, flagged content

---

#### Screen 29 — Organization Management (`/admin/organizations`)
**Layout:** Advanced table with powerful filters.

Columns: Org Name · Type (NGO/RE/etc.) · Plan · Users · Status · Created Date · Last Active · Actions

Actions per row: View Dashboard (as org) · Edit · Suspend · Delete

Filters: By Type · By Plan · By Status · By Country

"Create New Org" button (for manually provisioning).

---

#### Screen 30 — Org Detail / Platform Admin View (`/admin/organizations/[id]`)
**Layout:** Admin detail view.

**Tabs:**
- **Overview:** Org profile, plan, billing contact, creation date
- **Usage:** Storage used, API calls (Gemini), WhatsApp messages, receipts generated — all against plan limits with progress bars
- **Members:** Team list with admin override (force role change, deactivate user)
- **Activity Logs:** Full event log with timestamps
- **Billing:** Plan selector, billing contact, invoice history
- **Settings:** Override org config, force-connect integrations

**Top Actions:** Suspend Org / Reactivate / Upgrade Plan / Delete (with confirmation)

---

## 6. Single UI Generation Prompt

**Use this prompt with v0.dev, Claude Artifacts, or any AI frontend generation tool:**

---

```
Build a complete multi-screen web application called "ImpactLens" — an Impact Transparency Engine for NGOs and purpose-driven organizations.

DESIGN AESTHETIC:
- Warm, trust-inspiring modern design. NOT cold SaaS. NOT charity-kitsch.
- Color palette: Primary: Deep forest green #0D6E55, Background: Warm off-white #FAFAF7, Accent: Amber #F59E0B, Text: Slate #1E293B, Muted: #94A3B8
- Typography: Instrument Serif for display headings, DM Sans for all UI/body text
- Style: Cards with soft shadows (0 4px 24px rgba(0,0,0,0.06)), rounded corners (12px), generous whitespace, subtle grain texture on landing page hero
- Motion: Staggered card reveal animations, smooth tab transitions, pulse animation on pending-approval badges
- Icons: Lucide React icon set throughout

RENDER ALL SCREENS as a tabbed prototype. Add a fixed top tab bar showing: Landing | Public Trustfeed | Login | Onboarding | Volunteer Upload | Director Dashboard | Approval Queue | Donors | Receipt Generator | Broadcast Center | SEO Manager | Media Library | Analytics | Settings | Super Admin

---

SCREEN 1 — LANDING PAGE ("/"):
Nav: Logo (lens icon + "ImpactLens"), links (Features, Pricing, For Businesses), "Get Started Free" green button
Hero: Large serif headline "One Photo from the Field. A Verified Story for Every Donor." Subtext: "ImpactLens turns field media into donor trust, WhatsApp receipts, and Google rankings — automatically." Two CTAs: green "Start for Free" and outlined "See Demo". Right side: Animated 4-step pipeline diagram (Upload → AI Process → Approve → Amplify)
Pipeline Section: 4 icon cards in a row with amber icons, dark labels, one-line descriptions
Feature Grid: 4 cards — Trustfeed, WhatsApp CRM, AI SEO, Receipt Engine. Each has icon, title, 2-sentence description
Business Expansion Banner: "Built for NGOs. Scales to Any Business" with 4 icons: NGO, Real Estate, Construction, Retail
Pricing: 3 cards — Free, Growth (₹2,999/mo, highlighted), Enterprise
Footer: Links grid, social icons, "Powered by ImpactLens" tagline

---

SCREEN 2 — PUBLIC TRUSTFEED ("/create-together-foundation"):
Org header: Banner image with green overlay, logo circle, "Create Together Foundation", mission text, "Donate Now" amber button
Stats bar: "347 Impact Reports · 1,240 Donors Updated · Active since 2022"
Category pill filters: All · Education · Food · Healthcare · Environment
Masonry grid: 6 mock impact photo cards. Each card: colored placeholder image, AI description text, green category tag, date, share icon. Cards have subtle hover lift effect.
Footer: "Powered by ImpactLens" badge

---

SCREEN 3 — LOGIN:
Centered card on warm background with blurred impact photo mosaic behind. Email and password fields, "Forgot password" link, "Continue with Google" button (outlined), "Create organization" link.

---

SCREEN 4 — ONBOARDING WIZARD:
Progress steps at top (1 of 5 active). 
Step 1: 4 large icon selection cards for org type (NGO, Real Estate, Construction, Retail) — selected state shows green border and checkmark.
Navigation: Back and "Continue" buttons.

---

SCREEN 5 — VOLUNTEER DASHBOARD (Mobile-first, max 430px wide):
Warm greeting "Good afternoon, Arjun 👋"
Large prominent green "📷 Upload Impact" button card
3 stat pills: 12 Total · 9 Approved · 3 Pending
Amber notification banner: "2 submissions approved! Your work is live."
2-column grid of recent photo cards with status badge overlays

---

SCREEN 6 — UPLOAD MEDIA:
Large dashed photo picker zone with camera icon
Category dropdown (Education, Food, Healthcare, Environment)
AI Description Toggle (on by default) with text: "AI is analyzing your photo..."
Notes textarea
Green "Submit for Review" button

---

SCREEN 7 — DIRECTOR DASHBOARD:
Left sidebar nav with icons: Dashboard, Approvals (badge: 5), Donors, Receipts, WhatsApp, SEO, Media, Analytics, Settings
Main content:
Top KPI row: 4 cards (Total Donors: 1,247 / Messages Sent: 3,891 / Posts Live: 84 / Pending: 5 with pulsing amber badge)
Orange alert banner: "5 submissions awaiting your review" with "Review Now" button
Recharts line chart: Donations over 30 days (2 lines: Education, Food campaigns)
Right column: Recent Activity feed with icons and timestamps

---

SCREEN 8 — APPROVAL QUEUE:
2-column grid of approval cards. Each card:
Volunteer name + timestamp at top
Photo placeholder (2:3 ratio)
Editable textarea with AI description pre-filled
Category badge
Two buttons: "Approve & Publish" (green, full width) and "Reject" (outlined red)
Top bar: Category filter, "Bulk Approve 5" button

---

SCREEN 9 — DONOR LIST:
Left filter sidebar: By Campaign, By Tier, By Tag, By Date
Table: Name, Phone, Total Donated, Last Contact, Tags (pill badges), Status (green=Active, amber=Lapsed), Actions
Search bar + Import CSV + Add Donor button at top

---

SCREEN 10 — RECEIPT GENERATOR:
Two-panel layout. Left: form (Donor autocomplete, Amount, Date, Campaign, Payment Method, Receipt Number). Right: White receipt preview card showing formatted receipt with logo, organization details, donation info, signature line, "80G Eligible" green badge. Bottom: "Send via WhatsApp", "Download PDF", "Print" buttons.

---

SCREEN 11 — BROADCAST CENTER:
Left panel: conversation list with avatar initials, name, last message, time
Right panel: Audience selector radio buttons, message textarea with {{variable}} chips, estimated reach counter ("Reach: 142 donors"), photo attach button, "Send Now" green button

---

SCREEN 12 — SEO MANAGER:
Two tabs: Blog Posts / SEO Health
Blog Posts tab: List of posts with AI-badge label, publish date, view count, Edit button
"Generate This Week's Blog" green button at top
Mock blog post editor below with: title, rich text body with formatted paragraphs, sidebar with Meta Title, Meta Description, Keywords fields

---

SCREEN 13 — ANALYTICS:
Date range filter at top
4 KPI cards: ₹4.2L Raised · 312 Donors Active · 891 WA Messages · 12 Blog Posts
Bar chart: Donations by Campaign
Line chart: Donor growth
Volunteer Activity table: Name, Uploads, Approved, Approval Rate %

---

SCREEN 14 — SUPER ADMIN:
Darker, more data-dense design. 
KPI bar: 47 Organizations · 2,134 Users · 18,490 WA Messages · 94.2 GB Storage
Organizations table: Org Name, Type, Plan, Users, Status pill, Actions
New Org button. Suspend/View buttons per row.

---

GLOBAL UI REQUIREMENTS:
- Sidebar navigation on all authenticated screens (collapsible on mobile)
- Consistent header: org logo, page title, notification bell, user avatar
- All buttons use rounded-lg and consistent sizing
- Empty states: friendly illustrations and CTA for empty lists
- Loading states: skeleton loaders on cards and tables
- Toast notifications for all actions (success/error)
- Fully responsive (mobile, tablet, desktop)

Use React with Tailwind CSS. Include realistic placeholder data throughout. Make it feel like a real, polished product.
```

---

## 7. User Story — Full Narrative

### Story: A Week at Create Together Foundation

---

**Monday, 9:00 AM — Meera, the Field Volunteer**

Meera is 23. She volunteers three mornings a week at the Create Together Foundation, an NGO that distributes school supplies to government school students in Bengaluru. Her "job" on Monday is to manage a distribution drive at Rajiv Gandhi Government School.

She has the ImpactLens app open on her phone. The dashboard greets her: *"Good morning, Meera 👋"* Her stats show 28 total uploads, 24 approved. She feels good about that.

At 11:15 AM, she has a crowd of 35 students holding their new stationery kits. She taps the big green **"Upload Impact"** button. Her phone camera opens. She clicks a photo — kids smiling, kits in hand, a classroom in the background.

She selects **"Education"** from the category dropdown. The AI description toggle is on. Within eight seconds, a description populates the text box:

*"Distributed essential stationery kits — including notebooks, pencils, and geometry sets — to 35 students at Rajiv Gandhi Government School today, directly supporting their academic year ahead."*

Meera reads it, adds a quick note to the director: *"Kids were so happy, brought extra erasers too!"* She taps **Submit for Review**. The green checkmark animation plays. Total time: 45 seconds. She's already walking to help pack the remaining kits.

---

**Monday, 2:00 PM — Priya, the Director**

Priya runs the foundation. She has 14 unread messages on her personal WhatsApp and a grant report due Friday. She opens the ImpactLens dashboard on her laptop.

A pulsing amber badge on the sidebar reads **"8"**. She clicks **Approvals**.

Eight field submissions appear as cards — photos from three different volunteers across two drives today. Meera's school photo is third in the queue.

Priya opens Meera's card. She reads the AI description. It's 90% there. She changes *"stationery kits"* to *"learning kits"* and adds one sentence at the end. She clicks **Approve & Publish**.

Instantly:
- The photo appears on the foundation's public Trustfeed at `impactlens.app/create-together-foundation`
- The system checks the donor database — 23 donors have tagged "Education" as their interest
- WACRM queues an automated WhatsApp to those 23 donors: *"Hi [name]! Your contribution is making a difference right now — 35 students at Rajiv Gandhi Government School received their learning kits today. See the impact: [link]"*

Priya approves six more photos. One she rejects with a note: *"Photo is blurry, please take another."* The volunteer gets an in-app notification with her note.

Total time spent on approvals: 12 minutes. Last week it took two hours of sorting through WhatsApp groups.

---

**Monday, 4:30 PM — Suresh, the Donor**

Suresh donated ₹8,000 to the Education campaign three months ago. He's a software engineer in Pune. He never heard from the NGO after the receipt.

At 4:31 PM, his WhatsApp buzzes. *"Hi Suresh! Your contribution is making a difference right now..."* He almost scrolls past it — but the photo catches his eye. Real kids, real school, real smiles. He taps the link.

He lands on the Trustfeed page. The photo Meera took two hours ago is right at the top. He scrolls through 84 other verified photos going back to 2022. He spends four minutes on the page, something he's never done on a charity website before.

He taps **"Donate Again."** He gives ₹5,000 more.

---

**Tuesday, 10:00 AM — Priya generates a receipt**

Suresh's new donation comes in. Priya opens the donor management screen, finds Suresh's profile. She can see his full donation history, his interest tags, and the WhatsApp conversation history.

She taps **"Generate Receipt."** The form pre-fills with Suresh's details and the ₹5,000 amount. Receipt number `IMP-2026-00311` auto-generates. The Universal Billing Platform renders a clean PDF preview on the right side — organization letterhead, 80G exemption notice, signature line, all formatted.

Priya clicks **"Send via WhatsApp."** WACRM delivers the PDF receipt to Suresh's phone within 30 seconds.

Suresh receives it. He saves it to his Google Drive. He forwards it to his accountant.

---

**Friday, 8:00 AM — The AI Blog Post**

Every Friday at 7 AM, ImpactLens runs a cron job. It gathers all approved photos from the week — 23 this week. It groups them by campaign and sends them to Gemini 2.5 Flash Lite with a prompt to generate an SEO-optimized weekly impact report.

Priya logs in Friday morning. Under **SEO Manager**, there's a new draft: *"Creating Tomorrow's Leaders: Education Outreach Week of June 2, 2026."*

It's 720 words. It weaves in the school distributions, names the locations (with proper SEO geo-tags), uses phrases like "school supply distribution Bengaluru" and "NGO education program Karnataka." It has a suggested meta description: *"Create Together Foundation distributed learning kits to 142 students across 4 schools in Bengaluru this week. See the verified impact photos."*

Priya reads it, makes two small edits, adds the hero photo from Meera's Monday shoot, and clicks **Publish.** The blog post is live. It will be indexed by Google within 48 hours.

---

**Six Months Later — The Compound Effect**

The foundation now has 31 published blog posts. Three of them rank on Google's first page for terms like *"NGO school supplies Bengaluru"* and *"education support Karnataka 2026."* Monthly donor inquiries from organic search have tripled.

The Trustfeed has 280 verified photos. The average donor who clicks a WhatsApp link spends 3.8 minutes on the public page. Re-donation rates have increased from 12% to 31%.

Priya has not once had to hire a content writer, graphic designer, or SEO specialist.

---

## 8. Administrator Operations

### Platform Super Admin — Full Responsibility Map

**Onboarding New Organizations:**
- Reviews sign-up form submission
- Verifies organization legitimacy (manual or automated)
- Sets initial plan (Free/Growth/Enterprise)
- Creates org slot in Supabase with proper RLS isolation
- Confirms WACRM and receipt integrations are healthy
- Sends welcome email with setup guide

**Ongoing Monitoring:**
- Daily: Review new sign-ups, system health (Supabase storage, Gemini API quota, WACRM message limits)
- Weekly: MAU/DAU report, plan upgrade candidates, storage-heavy orgs
- Monthly: Billing reconciliation, plan enforcement (orgs on free tier hitting limits get upgrade nudge)

**Abuse & Moderation:**
- Flagged content report: If multiple volunteers from same org submit inappropriate photos, auto-flag system alerts Super Admin
- Ability to review and remove individual Trustfeed posts without org knowledge
- Suspend organization (disables all public pages, pauses WhatsApp sends)
- Data export for any org on request (compliance)

**Business Type Expansion (Admin-gated):**
- Super Admin controls which "Business Type" templates are available
- New business types (e.g., Healthcare, Hospitality) launched via feature flags
- Super Admin can push template updates to existing orgs of a given type

**Billing Operations:**
- Define plan limits: max donors, max WhatsApp sends/month, max storage, max team members
- Generate invoices
- Handle upgrade/downgrade requests
- Manage trial period expirations

**Organization Admin — Responsibility Map:**

- Onboards their own org (via wizard)
- Manages team: invites, role assignments, revocations
- Controls approval workflow settings (auto-approve trusted volunteers?)
- Owns all donor data within their org
- Reviews and publishes all Trustfeed content
- Manages WhatsApp broadcast templates and automation rules
- Accesses org-level analytics
- Sets custom domain for public Trustfeed page
- Manages integrations (WACRM, receipt printer)

---

## 9. Future Business Integration Roadmap

### The Core Principle
ImpactLens is built as a **multi-tenant, business-type-aware platform.** The underlying pipeline (Upload → AI Process → Approve → Publish/Broadcast) is universal. What changes per business type is:

1. The **category taxonomy** (Education/Food → Property Type/Project Stage)
2. The **AI description persona** (empathetic for NGOs, professional for real estate, technical for construction)
3. The **receipt template** (80G tax receipt → property invoice → site progress report)
4. The **WhatsApp message templates** (donor impact update → client property alert → progress notification)
5. The **public page design** (Trustfeed → Property Gallery → Project Portfolio)

### Business Type Expansion Matrix

| Type                     | Upload Use Case         | AI Output                           | Receipt Type                    | WhatsApp Use                   | Public Page       |
| ------------------------ | ----------------------- | ----------------------------------- | ------------------------------- | ------------------------------ | ----------------- |
| **NGO**                  | Field impact photos     | Impact description                  | 80G donation receipt            | Donor impact update            | Trustfeed         |
| **Real Estate**          | Property photos         | Property listing copy               | Booking receipt / token receipt | New listing alert to buyer     | Property gallery  |
| **Construction**         | Site progress photos    | Daily site log                      | Work completion certificate     | Client progress report         | Project portfolio |
| **Retail / Inventory**   | Product / damage photos | Product description / damage report | Sale invoice                    | Stock alert / delivery notice  | Product catalog   |
| **Healthcare (future)**  | Patient camp photos     | Outreach report                     | Medical camp receipt            | Appointment reminder           | Camp gallery      |
| **Hospitality (future)** | Property / event photos | Listing description                 | Booking confirmation            | Booking alert / review request | Venue gallery     |

### Technical Enablement for Expansion

**Business Type Templates (stored in Supabase):**
Each business type has a configuration object:
- `category_options`: The dropdown values shown to field uploaders
- `ai_prompt_persona`: The system prompt given to Gemini for description generation
- `receipt_template_id`: Which Universal Billing Platform template to use
- `whatsapp_trigger_events`: Which events trigger auto-messages
- `public_page_layout`: Which Trustfeed layout variant to use

**Adding a new business type requires:**
1. Super Admin creates a new business type config in the admin panel (no code deploy)
2. Defines 5–8 category options
3. Writes the AI persona prompt
4. Maps to an existing or new receipt template
5. Sets WhatsApp trigger rules
6. New orgs of that type get the custom experience automatically

### Phase Roadmap

**Phase 1 (Now — Hackathon):** NGO-first, full feature set, single business type
**Phase 2 (Month 2–3):** Add Real Estate and Construction business types, onboard 2–3 pilot clients
**Phase 3 (Month 4–6):** Self-serve organization signup, billing, and plan management. Add Retail type.
**Phase 4 (Month 6–12):** White-label mode (orgs can use their own domain + remove ImpactLens branding). API access for enterprise. Mobile app (PWA or React Native).
**Phase 5 (Year 2):** Marketplace of business type templates (community-contributed). AI donation prediction (NGO-specific). Multi-language support (WhatsApp messages in regional languages via Gemini).

---

*ImpactLens Project Brief · Version 1.0 · Prepared June 2026*