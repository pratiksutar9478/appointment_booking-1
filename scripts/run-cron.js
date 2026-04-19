/**
 * Cron Scheduler Runner
 * 
 * Run this script to start the reminder scheduler:
 *   node scripts/run-cron.js
 * 
 * Or add to package.json scripts:
 *   "cron": "node scripts/run-cron.js"
 */

require("ts-node").register();
const { startReminderCron } = require("../src/lib/cron-scheduler");

// Start the cron job
startReminderCron();

// Keep the process alive
console.log("Cron scheduler is running. Press Ctrl+C to stop.");
process.on("SIGINT", () => {
  console.log("\n✓ Cron scheduler stopped.");
  process.exit(0);
});
