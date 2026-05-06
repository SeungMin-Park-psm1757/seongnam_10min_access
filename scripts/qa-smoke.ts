import { chromium, expect } from "@playwright/test";

const appUrl = process.env.APP_URL ?? "http://127.0.0.1:3100";

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 950 } });
  const errors: string[] = [];

  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));

  await page.goto(appUrl, { waitUntil: "networkidle" });
  await page.waitForSelector(".maplibregl-canvas", { timeout: 20000 });
  await expect(page.locator("h1")).toContainText("10분 생활필수 접근권 격차 지도");
  await expect(page.locator(".maplibregl-canvas")).toHaveCount(5);
  await expect(page.locator("[data-nextjs-dialog], .vite-error-overlay, #webpack-dev-server-client-overlay")).toHaveCount(0);

  for (const href of ["#screen-2", "#screen-3", "#screen-4"]) {
    await page.locator(`nav a[href="${href}"]`).click();
    await expect(page.locator(href)).toBeInViewport();
  }

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(appUrl, { waitUntil: "networkidle" });
  await page.waitForSelector(".maplibregl-canvas", { timeout: 20000 });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  if (overflow > 0) throw new Error(`Mobile horizontal overflow: ${overflow}px`);

  await page.goto(`${appUrl}/?scenario=empty`, { waitUntil: "networkidle" });
  await expect(page.locator(".mapEmptyState").first()).toContainText("표시할 지도 데이터가 없습니다.");
  await expect(page.locator(".emptyChart").first()).toBeVisible();

  await page.goto(`${appUrl}/?scenario=error`, { waitUntil: "networkidle" });
  await expect(page.locator(".dataStateBanner")).toContainText("오류 상태");
  await expect(page.locator(".mapEmptyState").first()).toBeVisible();

  await browser.close();

  if (errors.length > 0) {
    throw new Error(`Browser console errors:\n${errors.join("\n")}`);
  }

  console.log("QA smoke passed: normal, navigation, mobile, empty, and error states verified.");
}

main().catch(async (error) => {
  console.error(error);
  process.exit(1);
});
