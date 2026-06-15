// Capture README screenshots of the key pages using Playwright's Chromium.
//
//   npm run build && PORT=3100 npm run start &   # in one shell
//   node scripts/screenshots.mjs                 # in another
//
// Writes PNGs to docs/screenshots/. Requires `npx playwright install chromium`.
import { chromium } from "@playwright/test";

const BASE = process.env.BASE_URL || "http://127.0.0.1:3100";

const shots = [
  { path: "docs/screenshots/landing.png", url: "/" },
  { path: "docs/screenshots/admin.png", url: "/admin" },
  { path: "docs/screenshots/serverless-timeout.png", url: "/s/slow-api" },
  { path: "docs/screenshots/broken-trace.png", url: "/s/missing-trace" },
  { path: "docs/screenshots/invalid-domain.png", url: "/s/broken-domain" },
];

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 1100, height: 760 },
  colorScheme: "dark",
  deviceScaleFactor: 2,
});

for (const shot of shots) {
  await page.goto(BASE + shot.url, { waitUntil: "networkidle" });
  await page.screenshot({ path: shot.path, fullPage: true });
  console.log("captured", shot.path);
}

await browser.close();
