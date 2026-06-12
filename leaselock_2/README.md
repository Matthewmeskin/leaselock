# LeaseLock

Renter protection platform. Sign smarter. Move in protected. Get your deposit back.

## Pages
- `/` marketing landing page
- `/app` the toolkit: dashboard, lease review, move-in photo report, landlord messages, lease calendar, maintenance tracker, rent log
- `/guides` know your rights content hub + articles
- `/tools/deposit-calculator` free deposit deadline calculator

## Local dev
```bash
npm install
cp .env.local.example .env.local   # add your Anthropic API key
npm run dev
```

## Deploy
Set environment variable `ANTHROPIC_API_KEY` in Vercel. The key stays server side via /api/claude.

## Notes
- Calendar, maintenance, and rent data persist in the browser (localStorage). For multi device sync, add Supabase later.
- Move-in photos are analyzed by Claude vision in session.

USC Marshall MOR 531 — Grant, MJ, Matthew, Claudia
