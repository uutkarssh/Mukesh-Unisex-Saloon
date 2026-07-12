# Mukesh Unisex Salon — Deployment Guide

Premium salon website with online booking + admin panel. Next.js 16 + Turso (libSQL) + Firebase Auth.

---

## Quick Start (Local)

```bash
bun install
cp .env.example .env.local   # fill in your Turso + session secret
bun run dev                  # → http://localhost:3000
```

---

## Deploy to Vercel (from GitHub)

### Prerequisites
- A GitHub account (free)
- A Vercel account (free) — sign up at vercel.com **with your GitHub account**
- Your Turso database credentials (already in `.env.local`)

### Step 1 — Get the code onto GitHub

**Option A: Termux (recommended for Android — full control)**

1. Install **Termux** from [F-Droid](https://f-droid.org/packages/com.termux/) (NOT Google Play — it's outdated)
2. Open Termux and run:
   ```bash
   termux-setup-storage
   pkg update && pkg upgrade -y
   pkg install git zip unzip -y
   git config --global user.name "Your Name"
   git config --global user.email "you@example.com"
   ```
3. Download the project ZIP (from the preview → `/mukesh-salon-project.zip`) into your phone's Downloads folder
4. In Termux:
   ```bash
   cd ~/storage/downloads
   unzip mukesh-salon-project.zip -d mukesh-salon
   cd mukesh-salon
   ```
5. Create an empty repo on GitHub:
   - Go to https://github.com/new (in your phone browser)
   - Name it `mukesh-unisex-salon`
   - **Don't** add README/license (keep it empty)
   - Copy the repo URL (e.g. `https://github.com/yourname/mukesh-unisex-salon.git`)
6. Push from Termux:
   ```bash
   git init
   git add .
   git commit -m "Initial commit — Mukesh Unisex Salon"
   git branch -M main
   git remote add origin https://github.com/YOURNAME/mukesh-unisex-salon.git
   git push -u origin main
   ```
   - Termux will prompt for your GitHub username + password
   - **Password = a Personal Access Token**, NOT your GitHub password
   - Create one: GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic) → Generate new token → check `repo` scope → copy token → paste in Termux

**Option B: GitHub Web (simpler, no Terminal)**

1. Download the project ZIP to your phone
2. Go to https://github.com/new → create `mukesh-unisex-salon` (empty)
3. On the repo page, click **"uploading an existing file"**
4. Unzip the project on your phone (use a file manager like **Files by Google** or **ZArchiver**)
5. Select ALL files and drag them into the GitHub upload area
   - ⚠️ GitHub web can't upload folders directly — you may need to upload in batches or use Option A
6. Commit with message "Initial commit"

### Step 2 — Deploy on Vercel

1. Go to https://vercel.com/new
2. Click **"Import Git Repository"**
3. Find `mukesh-unisex-salon` and click **Import**
4. Vercel auto-detects Next.js — leave defaults
5. **CRITICAL — Add Environment Variables** before clicking Deploy:
   - Expand **"Environment Variables"**
   - Add these 3 variables:

   | Name | Value |
   |------|-------|
   | `TURSO_DATABASE_URL` | `libsql://saloon-uutkarssh.aws-ap-south-1.turso.io` |
   | `TURSO_AUTH_TOKEN` | (your Turso token from .env.local) |
   | `SESSION_SECRET` | (any random 32+ char string — type random characters) |

   - Mark all 3 as **Production, Preview, and Development**
6. Click **Deploy** → wait ~2 minutes
7. Vercel gives you a URL like `mukesh-unisex-salon-xyz.vercel.app`

### Step 3 — Test the live site

1. Visit your Vercel URL
2. The public site should load (services, gallery, booking)
3. Go to `/#login` → login with:
   - **Developer:** `utkarshmaurya917027@gmail.com` / `pass@123`
   - **Barber:** `barber@mukeshsalon.com` / `barberpass123`
4. Book an appointment on the public site → confirm it appears in admin

---

## (Optional) Custom Domain

1. Vercel dashboard → your project → **Settings → Domains**
2. Add your domain (e.g. `mukeshunisexsalon.com`)
3. Follow DNS instructions (add CNAME/A record at your domain registrar)
4. Vercel auto-provisions HTTPS

---

## Admin Credentials

| Role | Email | Password | Access |
|------|-------|----------|--------|
| Developer | utkarshmaurya917027@gmail.com | pass@123 | Full (services, pricing, stylists, gallery, offers, settings) |
| Barber | barber@mukeshsalon.com | barberpass123 | Today's + upcoming appointments only |

**To add more admins:** insert a row into the `AdminUser` table in Turso (password = scrypt hash in `salt:hash` format), or create the Firebase user with matching email.

---

## Tech Stack

- **Framework:** Next.js 16 (App Router, Turbopack)
- **Database:** Turso (libSQL) — parameterized queries via `@libsql/client`
- **Auth:** Firebase Auth + signed session token (localStorage, iframe-safe)
- **Styling:** Tailwind CSS 4 + shadcn/ui (New York)
- **Fonts:** Clash Display + General Sans (Fontshare)

---

## Project Structure

```
src/
├── app/
│   ├── api/              # 21 API routes (auth, bookings, services, etc.)
│   ├── layout.tsx        # Root layout + Sonner toaster
│   ├── page.tsx          # Single-page app entry
│   └── globals.css       # Design system
├── components/
│   ├── shell/            # Sidebar, Topbar, SiteShell
│   └── views/
│       ├── public/       # Home, Services, Booking, Gallery, About, Contact
│       ├── admin/        # Dashboard, Appointments, Services, Stylists, Gallery, Offers, Settings
│       └── LoginView.tsx
├── lib/
│   ├── db.ts             # Single Turso client
│   ├── queries.ts        # Parameterized SQL layer
│   ├── slots.ts          # Slot generation (per-stylist, 15min buffer)
│   ├── session.ts        # Multi-channel auth (cookie + Bearer)
│   ├── firebase-client.ts # Firebase browser SDK
│   ├── firebase-admin.ts  # Firebase token verification (jose)
│   ├── auth-client.ts    # Auth manager + authedFetch
│   ├── cache.ts          # 60s TTL in-memory cache
│   └── constants.ts      # Salon hours, buffers
└── store/useAppStore.ts  # Zustand SPA state
```
