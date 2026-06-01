# ImpactLens — Setup Guide

## Prerequisites
- Node.js 18+
- A [Supabase](https://supabase.com) account (free tier works)
- A [Google AI Studio](https://aistudio.google.com) account for Gemini API
- (Optional) A [Meta Business](https://developers.facebook.com) account for WhatsApp

---

## 1. Supabase Project Setup

### Create the Project
1. Go to [supabase.com](https://supabase.com) → **New Project**
2. Choose a name (e.g. `impactlens`) and set a strong database password
3. Choose your region → **Create Project**

### Run the Database Schema
1. In your Supabase Dashboard, go to **SQL Editor**
2. Click **New Query**
3. Open the file `supabase/schema.sql` from this repo
4. Copy the entire contents and paste into the SQL editor
5. Click **Run** — this creates all tables, RLS policies, and storage buckets

### Configure Authentication
1. Go to **Authentication → Providers**
2. Ensure **Email** is enabled (it is by default)
3. (Optional) Enable **Google** OAuth:
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Create an OAuth 2.0 Client ID
   - Add your Supabase callback URL: `https://<your-project>.supabase.co/auth/v1/callback`
   - Paste Client ID and Secret into Supabase Google provider settings

### Get API Keys
1. Go to **Project Settings → API**
2. Copy:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public** key → `VITE_SUPABASE_ANON_KEY`

### Storage Setup
The SQL migration automatically creates these buckets:
- `media` — for field photo uploads
- `avatars` — for user profile photos
- `org-assets` — for organization logos, banners
- `receipts` — for generated receipt PDFs

Verify they exist under **Storage → Buckets** in your dashboard.

---

## 2. Gemini AI Setup

1. Go to [Google AI Studio](https://aistudio.google.com/apikey)
2. Click **Create API Key**
3. Copy the key → `VITE_GEMINI_API_KEY`

The app uses Gemini for:
- **Image analysis**: Generates descriptions for uploaded field photos
- **Blog generation**: Creates weekly SEO blog posts from approved media

---

## 3. WhatsApp Integration (Optional)

WhatsApp features require a Meta Business API account:

1. Go to [Meta for Developers](https://developers.facebook.com)
2. Create a **Business** app → Add the **WhatsApp** product
3. In the WhatsApp → **API Setup** page:
   - Copy the **Phone Number ID** → `VITE_WHATSAPP_PHONE_NUMBER_ID`
   - Copy the **WhatsApp Business Account ID** → `VITE_WHATSAPP_BUSINESS_ACCOUNT_ID`
4. In **Business Settings → System Users**:
   - Create a system user with `whatsapp_business_messaging` permission
   - Generate a permanent access token → `VITE_WHATSAPP_ACCESS_TOKEN`

> **Note:** Without WhatsApp credentials, the app works fully — WhatsApp features will show as "Not Connected" in the Integrations page.

---

## 4. Environment Variables

```bash
cp .env.example .env
```

Fill in all the values you collected above.

---

## 5. Install & Run

```bash
npm install
npm run dev
```

The app runs at `http://localhost:3001`.

### First-time setup:
1. Visit the landing page → Click **Get Started Free**
2. Sign up as a **Director** — this creates your organization
3. Complete the 5-step onboarding wizard
4. You're now on your Director Dashboard!

---

## 6. Creating Test Data

After onboarding, you can:
- **Upload a photo** → Go to Upload, pick an image, let Gemini describe it
- **Add a donor** → Go to Donors → Add Donor
- **Generate a receipt** → Go to Receipts → New Receipt
- **Check your Trustfeed** → Visit `http://localhost:3001/<your-org-slug>`

---

## Project Structure

```
src/
├── lib/
│   ├── supabase.ts          # Supabase client
│   ├── auth.tsx              # Auth context & hooks
│   ├── database.types.ts     # TypeScript types for DB
│   ├── gemini.ts             # Gemini AI client
│   ├── wacrm.ts              # WhatsApp API client
│   ├── receipt-renderer.tsx   # Receipt PDF generation
│   └── guards.tsx            # Route protection
├── components/
│   └── AppShell.tsx          # Authenticated layout shell
├── routes/
│   ├── index.tsx             # Landing page
│   ├── login.tsx             # Login
│   ├── signup.tsx            # Signup
│   ├── onboarding.tsx        # Onboarding wizard
│   ├── _app.tsx              # Auth layout wrapper
│   ├── app/                  # All authenticated screens
│   ├── _admin.tsx            # Admin layout wrapper
│   ├── _admin/admin/         # Super admin screens
│   └── $orgSlug/             # Public org pages
└── supabase/
    └── schema.sql            # Full database schema
```
