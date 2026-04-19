import cron from "node-cron";

/**
 * Schedules the reminder API to run every 5 minutes
 * Calls POST /api/reminders with CRON_SECRET authorization
 */
export function startReminderCron() {
  const cronSecret = process.env.CRON_SECRET;
  
  if (!cronSecret) {
    console.warn("⚠️  CRON_SECRET not set. Reminders will not be scheduled.");
    return;
  }

  // Schedule every 5 minutes (*/5 * * * *)
  const task = cron.schedule("*/5 * * * *", async () => {
    console.log("🔔 Running scheduled reminder check...");
    
    try {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      const response = await fetch(`${baseUrl}/api/reminders`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${cronSecret}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      
      if (response.ok) {
        console.log("✅ Reminders sent successfully:", data);
      } else {
        console.error("❌ Reminder request failed:", data);
      }
    } catch (err) {
      console.error("❌ Error running scheduled reminders:", err);
    }
  });

  console.log("✓ Reminder scheduler started (every 5 minutes)");
  return task;
}
