# Sky Reservation AI

A production-ready SaaS platform for AI-powered business automation — voice calls, WhatsApp, reservations, CRM, and analytics.

## Tech Stack

- **Next.js 15** — App Router, Server Actions
- **TypeScript** — Strict mode
- **TailwindCSS 3.4** — Dark-first design system
- **Framer Motion 11** — Animations
- **Supabase** — Auth + PostgreSQL database
- **ShadCN UI** — Component primitives
- **Recharts** — Analytics charts
- **Zod + React Hook Form** — Form validation

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Set up environment variables

```bash
cp .env.example .env.local
```

Fill in your Supabase and other API keys in `.env.local`.

### 3. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Run the migration in `supabase/migrations/001_initial_schema.sql` in the Supabase SQL Editor
3. Enable Google OAuth in Authentication > Providers > Google
4. Set your Site URL and Redirect URLs in Authentication > URL Configuration

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
sky-reservation-ai/
├── app/
│   ├── (auth)/           # Login, Register pages
│   ├── (dashboard)/      # Protected dashboard pages
│   ├── (marketing)/      # Landing page
│   ├── api/              # API routes
│   └── auth/callback/    # OAuth callback
├── components/
│   ├── ui/               # ShadCN UI components
│   ├── dashboard/        # Sidebar, Header
│   └── shared/           # Theme provider
├── lib/
│   ├── supabase/         # Client, Server, Middleware
│   ├── utils/            # cn, format utilities
│   └── validations/      # Zod schemas
├── hooks/                # Custom React hooks
├── types/                # TypeScript types
└── supabase/
    └── migrations/       # SQL migrations
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server only) |
| `NEXT_PUBLIC_APP_URL` | App URL (http://localhost:3000 in dev) |
| `OPENAI_API_KEY` | OpenAI API key for AI features |
| `VAPI_API_KEY` | VAPI key for voice AI |
| `META_WHATSAPP_TOKEN` | Meta WhatsApp Business API token |
| `STRIPE_SECRET_KEY` | Stripe key for payments |
