/**
 * Programmatic custom-domain onboarding via the Vercel SDK — the kind of internal
 * tool/script the support role calls for. Mirrors the multi-tenant docs example.
 *
 * Usage:  node --experimental-strip-types scripts/add-domain.ts customer-example.com
 * Env:    VERCEL_TOKEN, VERCEL_TEAM_ID, VERCEL_PROJECT (see .env.example)
 *
 * Requires `@vercel/sdk` (install when you wire this up):
 *   npm i -D @vercel/sdk
 *
 * The import is intentionally dynamic so the repo type-checks and builds without
 * the SDK installed; this script is a documented tool, not part of the app bundle.
 */

async function main(): Promise<void> {
  const domain = process.argv[2];
  if (!domain) {
    console.error("usage: add-domain.ts <domain>");
    process.exit(1);
  }

  const token = process.env.VERCEL_TOKEN;
  const teamId = process.env.VERCEL_TEAM_ID;
  const project = process.env.VERCEL_PROJECT ?? "support-reliability-lab";
  if (!token) {
    console.error("error: VERCEL_TOKEN is required (set it in .env.local)");
    process.exit(1);
  }

  // Dynamic import keeps the SDK optional for build/type-check.
  const { VercelCore: Vercel } = await import("@vercel/sdk/core.js");
  const { projectsAddProjectDomain } = await import(
    "@vercel/sdk/funcs/projectsAddProjectDomain.js"
  );

  const vercel = new Vercel({ bearerToken: token });

  const res = await projectsAddProjectDomain(vercel, {
    idOrName: project,
    teamId,
    requestBody: { name: domain },
  });

  // Never log the token; only the result.
  console.log(JSON.stringify(res, null, 2));
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
