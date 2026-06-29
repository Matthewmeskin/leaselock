# Supabase auth + database setup

This app now uses **Supabase** for Google login and to store each renter's data
(profile/quiz answers, calendar, maintenance, rent log, roommate agreement).
Follow these one-time steps.

## 1. Create a Supabase project
1. Go to [supabase.com](https://supabase.com) → **New project**.
2. Pick a name, database password, and region. Wait for it to finish provisioning.

## 2. Create the database tables
1. In the project, open **SQL Editor → New query**.
2. Paste the entire contents of [`supabase/schema.sql`](./supabase/schema.sql) and click **Run**.
   - This creates the tables, row-level-security policies, and a trigger that
     auto-creates a profile row on signup.
3. Then run the shared-lease migration: open a new query, paste the contents of
   [`supabase/02_shared_lease.sql`](./supabase/02_shared_lease.sql), and click **Run**.
   - This adds households + members, the invite-code join flow, and moves the
     shared toolkit data (calendar, maintenance, rent, roommate agreement, lease
     review) to be shared per-household and scoped by membership.

## 3. Set up Google login
You need a Google OAuth client, then connect it to Supabase.

**a) Google Cloud Console**
1. Go to [console.cloud.google.com](https://console.cloud.google.com) → create/select a project.
2. **APIs & Services → OAuth consent screen** → configure (External, add your email as a test user).
3. **APIs & Services → Credentials → Create credentials → OAuth client ID**.
   - Application type: **Web application**.
   - **Authorized redirect URIs**: add your Supabase callback URL:
     ```
     https://YOUR-PROJECT-ref.supabase.co/auth/v1/callback
     ```
     (Find `YOUR-PROJECT-ref` in Supabase → Project Settings → API → Project URL.)
4. Copy the **Client ID** and **Client secret**.

**b) Supabase dashboard**
1. **Authentication → Providers → Google** → enable it.
2. Paste the Google **Client ID** and **Client secret** → Save.
3. **Authentication → URL Configuration**:
   - **Site URL**: `http://localhost:3000` (and your production URL when deployed).
   - **Redirect URLs**: add `http://localhost:3000/**` (and `https://your-domain.com/**`).

## 4. Add environment variables
1. Copy the example file:
   ```bash
   cp .env.local.example .env.local
   ```
2. Fill in from **Supabase → Project Settings → API**:
   - `NEXT_PUBLIC_SUPABASE_URL` → Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` → anon public key
3. Keep your existing `ANTHROPIC_API_KEY` (and `GEOAPIFY_API_KEY` if used).

## 5. Run it
```bash
npm install
npm run dev
```
- Visit `http://localhost:3000` → **Log in** (or open `/app`, which redirects to `/login`).
- Sign in with Google. You'll land on the dashboard, and all your data is now
  saved to your account in Supabase.

## Notes
- The `/app` toolkit and `/report` page require login (enforced in `middleware.js`).
- Marketing pages (`/`, `/guides`, `/tools/*`) stay public.
- Data is per-user via RLS — no user can read another user's rows.
