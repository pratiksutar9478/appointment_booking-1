# Reminder Scheduler Setup

## Quick Start

### 1. Set Environment Variables

Add these to your `.env.local` file:

```bash
# Required: Secret token for securing the cron endpoint
CRON_SECRET=your-super-secret-key-here-change-this

# Optional: Your app's base URL (defaults to http://localhost:3000)
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

### 2. Run Locally

```bash
npm run cron
```

The scheduler will start and run reminder checks every 5 minutes.

### 3. Test Immediately

After booking an appointment, trigger reminders manually:

```bash
curl -X POST "http://localhost:3000/api/reminders?testNow=true" \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

This forces reminder sending now (for testing only), without waiting for the 2-hour window.

---

## Deployment Options

### Option A: Run on Your Server (Recommended)

1. Deploy your app to your server
2. Add a separate process manager (PM2, systemd, etc.) to keep the cron job running:

```bash
# Using PM2 (install globally: npm install -g pm2)
pm2 start "npm run cron" --name reminder-cron

# Make it start on reboot
pm2 startup
pm2 save
```

### Option B: Vercel Cron (If Deployed on Vercel)

Create `src/app/api/crons/reminders/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs"; // Must be nodejs, not edge

export async function GET(request: NextRequest) {
  // Vercel adds a secret header; verify it
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Call your reminders endpoint
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.url;
  const response = await fetch(`${baseUrl}/api/reminders`, {
    method: "POST",
    headers: { "Authorization": authHeader },
  });

  return response;
}
```

Then add to `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/crons/reminders",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

### Option C: GitHub Actions (If Using GitHub)

Create `.github/workflows/reminders.yml`:

```yaml
name: Send Daily Reminders

on:
  schedule:
    - cron: "*/5 * * * *"  # every 5 minutes

jobs:
  send-reminders:
    runs-on: ubuntu-latest
    steps:
      - name: Call reminders API
        run: |
          curl -X POST https://yourdomain.com/api/reminders \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
```

---

## How It Works

1. **node-cron** schedules the job every 5 minutes (`*/5 * * * *`)
2. At that time, it calls your `/api/reminders` endpoint
3. The reminder logic sends reminders only for appointments within the next 2 hours
4. Status is logged to console

## Monitoring

Check logs to verify reminders are running:

```bash
# If using PM2
pm2 logs reminder-cron

# Or check Next.js logs
npm run dev  # Shows logs in development
```

## Security

- Never commit `CRON_SECRET` to version control
- Use a strong, random secret (at least 32 characters)
- Generate one: `node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"`
