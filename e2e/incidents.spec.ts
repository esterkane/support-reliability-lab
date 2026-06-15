import { test, expect } from "@playwright/test";

// Tenants are reached by path here (/s/<subdomain>) so the suite is independent of
// wildcard DNS — the page component is identical to the subdomain-routed one.

test("landing page lists the seed tenants", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Support Reliability Lab" }),
  ).toBeVisible();
  await expect(page.getByText("Slow API Inc")).toBeVisible();
  await expect(page.getByText("Big Upload Co")).toBeVisible();
});

test("serverless-timeout tenant renders a 504 panel", async ({ page }) => {
  await page.goto("/s/slow-api");
  await expect(page.getByText("504 Gateway Timeout")).toBeVisible({
    timeout: 15_000,
  });
});

test("payload-too-large tenant returns 413 for an oversized upload", async ({
  page,
}) => {
  await page.goto("/s/big-upload");
  await page.getByRole("button", { name: /too large/ }).click();
  await expect(page.getByText("HTTP 413")).toBeVisible();
});

test("broken-trace tenant shows an orphaned downstream span", async ({ page }) => {
  await page.goto("/s/missing-trace");
  await expect(page.getByText("dropped: ORPHANED")).toBeVisible();
  await expect(page.getByText("propagated: CONNECTED")).toBeVisible();
});

test("admin incident console loads with controls", async ({ page }) => {
  await page.goto("/admin");
  await expect(
    page.getByRole("heading", { name: "Incident Console" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Publish update" }).first(),
  ).toBeVisible();
});
