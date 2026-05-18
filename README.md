# 🤖 AI Influencer Generator & Auto Post Scheduler

An advanced, premium SaaS platform that enables users to design custom AI Influencers (consistent digital personas), auto-generate high-engaging social campaigns (captions + images), and queue/schedule posts across multi-platform networks via an interactive calendar dashboard. 

Built with **Next.js 16 (App Router)**, **React 19**, **Supabase Database & Storage**, **Tailwind CSS v4**, **Stripe Subscription Gateway**, and the **Zernio Social API**.

---

## 🚀 Key Features

*   **🎨 AI Influencer Studio**: Design consistent AI characters with highly granular visual prompts (body type, hair style, skin tone, eye color, and vibe). Uses high-fidelity generation pipelines (powered by **Fal.ai**).
*   **✍️ Intelligent Post Writer**: Automatically draft captions, high-converting hooks, call-to-actions, and trending hashtags aligned with your AI influencer's unique voice.
*   **📅 Interactive Drag-and-Drop Calendar**: View, edit, schedule, and re-arrange drafts. Features instant visual hover previews and a detailed analytics footer showing weekly/monthly post distribution by platform.
*   **🔗 Multi-Platform OAuth Linker**: Seamlessly connect Instagram, LinkedIn, TikTok, YouTube, and Pinterest accounts using the **Zernio API** (includes a mock-OAuth simulator for sandboxed testing).
*   **💳 Stripe Subscription & Credit Gateway**: SaaS billing with standard & pro tiers, credit-based rate limits (50 credits for model creation, 20 credits for post creation), and a beautiful checkout fallback simulator for seamless testing.

---

## 🛠️ The Tech Stack

*   **Framework**: Next.js 16 (App Router) & React 19 (TypeScript)
*   **Styling**: Tailwind CSS v4 & custom Glassmorphic Vanilla CSS
*   **Database & Storage**: Supabase (Auth, Postgres DB, and S3 Storage Buckets)
*   **Generative AI**: Fal.ai API, Hugging Face, & Luma Agents API
*   **Payments**: Stripe API (with inline dynamic pricing & Webhooks)
*   **Social APIs**: Zernio Unified API

---

## 📂 Project Architecture & Key Mappings

```
├── app/
│   ├── (dashboard)/
│   │   └── dashboard/
│   │       ├── calendar/       # Interactive scheduling dashboard & analytics
│   │       └── settings/       # Billing dashboard & Stripe simulation sandbox
│   ├── actions/
│   │   ├── influencers.ts  # AI avatar generator, credit rules & buffer pipelines
│   │   ├── social.ts       # OAuth connectors & Zernio API endpoints
│   │   └── stripe.ts       # checkout sessions & subscription handlers
│   └── api/
│       └── webhooks/stripe # Stripe async webhook processor
├── components/             # Reusable UI elements (Sidebar, Calendar, Badges)
├── utils/
│   └── ensure-profile.ts   # Schema-agnostic fallback & DB safety validator
└── supabase_setup.sql      # Supabase database initialization schemas
```

---

## 📊 Database Schema (Supabase PostgreSQL)

The database is built on a clean relational architecture containing four core tables:

### 1. Users (`public.users`)
Manages subscription states, Stripe customer references, and credit balances.
```sql
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
    email TEXT,
    full_name TEXT,
    avatar_url TEXT,
    credits INTEGER DEFAULT 300,
    subscription_tier TEXT DEFAULT 'free',
    subscription_status TEXT DEFAULT 'inactive',
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    updated_at TIMESTAMP WITH TIME ZONE
);
```

### 2. Models (`public.models`)
Stores custom AI Influencers and their visual characteristic metadata.
```sql
CREATE TABLE public.models (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    gender TEXT,
    body_type TEXT,
    skin_tone TEXT,
    age_range TEXT,
    hair_style TEXT,
    hair_color TEXT,
    eye_color TEXT,
    vibe TEXT,
    prompt TEXT,
    portrait_url TEXT,
    full_body_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
```

### 3. Posts (`public.posts`)
Stores generated visuals, aspect ratios, caption drafts, and calendar scheduled timings.
```sql
CREATE TABLE public.posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    model_id UUID REFERENCES public.models(id) ON DELETE CASCADE,
    prompt TEXT NOT NULL,
    image_url TEXT,
    aspect_ratio TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
```

### 4. Social Accounts (`public.social_accounts`)
Maintains linked social profiles integrated through the Zernio OAuth gateway.
```sql
CREATE TABLE public.social_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    platform TEXT NOT NULL,
    profile_id TEXT NOT NULL,
    account_id TEXT NOT NULL,
    account_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_user_platform_account UNIQUE (user_id, platform, account_id)
);
```

---

## ⚙️ Setup & Installation Guide

### Prerequisites
- Node.js (v18 or higher)
- A Supabase account and database
- API Keys for Stripe, Fal.ai, and Zernio (optional; includes fallback simulation mode)

### 1. Clone the repository
```bash
git clone https://github.com/your-username/ai-influencer-generator.git
cd ai-influencer-generator
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Create a `.env.local` file in the root directory and configure the following variables:
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Stripe API Keys
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

# AI Generation Keys
FAL_KEY=your_fal_ai_api_key

# Social API Keys
ZERNIO_API_KEY=your_zernio_api_key
```

### 4. Setup the Database
Execute the SQL script in [supabase_setup.sql](./supabase_setup.sql) inside the **Supabase SQL Editor** to initialize the database tables, relations, and row-level security parameters.

### 5. Running the Stripe Webhook locally
To process subscription tier upgrades locally, download the **Stripe CLI** and forward events:
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```
Add the returned CLI webhook signing secret as `STRIPE_WEBHOOK_SECRET` to your `.env.local`.

### 6. Spin up the Developer Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view your local AI Influencer Studio!

---

## 🛡️ License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<p align="center">
  🏆 Built with passion by <a href="https://github.com/shrutisania11">Shruti Sania</a>
</p>
