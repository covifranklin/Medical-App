import { execSync } from "child_process";

if (!process.env.DATABASE_URL) {
  console.log("⚠ DATABASE_URL not set — skipping migrations.");
  console.log("  Set DATABASE_URL in Vercel → Settings → Environment Variables");
  console.log("  and enable it for the Build step.");
  process.exit(0);
}

try {
  execSync("npx prisma migrate deploy", { stdio: "inherit" });
} catch {
  console.error("Migration failed — build will continue. Run manually:");
  console.error("  npx prisma migrate deploy");
  process.exit(0);
}
