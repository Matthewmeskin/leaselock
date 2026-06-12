# LeaseLock

Renter protection toolkit. Sign smarter. Move in protected.

## Features

- AI Lease Risk Review
- Move-In Condition Report
- Landlord Message Generator

## Local development

```bash
npm install
cp .env.local.example .env.local
# Add your Anthropic API key to .env.local
npm run dev
```

Open http://localhost:3000

## Deploy to Vercel

1. Push this folder to a GitHub repo
2. Go to vercel.com and click "Add New Project"
3. Import your GitHub repo
4. Under "Environment Variables" add:
   - Name: ANTHROPIC_API_KEY
   - Value: your actual API key from console.anthropic.com
5. Click Deploy

Your app will be live at yourproject.vercel.app in about 60 seconds.

## How the API key works

The API key is stored as an environment variable in Vercel. It never touches the browser. All Claude calls go through /api/claude on the server. This is safe to share publicly.

## Team

Grant Hutton, MJ Sidhu, Matthew Meskin, Claudia Teng
USC Marshall — MOR 531 Applied Product Management
