import { mkdirSync, readdirSync } from "node:fs";
import path from "node:path";
import { chromium } from "@playwright/test";

const appUrl = process.env.APP_URL ?? "http://127.0.0.1:3000";
const videoDir = path.join(process.cwd(), "artifacts", "demo");

async function main() {
  mkdirSync(videoDir, { recursive: true });
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    recordVideo: { dir: videoDir, size: { width: 1440, height: 900 } },
  });
  const page = await context.newPage();

  await page.goto(appUrl, { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("load");
  await page.locator(".mapLoading").first().waitFor({ state: "hidden", timeout: 30000 }).catch(() => undefined);

  for (const id of ["screen-1", "screen-2", "screen-3", "screen-4"]) {
    await page.locator(`#${id}`).scrollIntoViewIfNeeded();
    await page.waitForTimeout(14000);
  }

  await context.close();
  await browser.close();

  const videos = readdirSync(videoDir).filter((file) => file.endsWith(".webm"));
  console.log(`Saved demo video to ${videoDir}`);
  if (videos.length > 0) console.log(videos[videos.length - 1]);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
