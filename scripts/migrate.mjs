import { execSync } from "child_process";

if (!process.env.DATABASE_URL) {
  console.log("⚠ DATABASE_URL not set — skipping migrations.");
  console.log("  Set DATABASE_URL in Vercel → Settings → Environment Variables");
  console.log("  and enable it for the Build step.");
  process.exit(0);
}

try {
  // Try prisma migrate deploy first (normal flow)
  execSync("npx prisma migrate deploy", { stdio: "inherit" });
} catch {
  console.log("migrate deploy failed (P3009 or fresh DB) — falling back to db push...");
  try {
    // Fallback: push schema directly (works on fresh or conflicted DBs)
    execSync("npx prisma db push --accept-data-loss", { stdio: "inherit" });
  } catch (pushError) {
    console.error("db push also failed:", pushError);
    console.error("Build will continue — fix DB manually.");
  }
}
