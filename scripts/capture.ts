import { mkdirSync } from "node:fs";
import path from "node:path";
import { chromium } from "@playwright/test";

const appUrl = process.env.APP_URL ?? "http://127.0.0.1:3000";
const outputDir = path.join(process.cwd(), "screenshots");

const viewports = [
  ["1920x1080", 1920, 1080],
  ["1600x900", 1600, 900],
  ["1366x768", 1366, 768],
] as const;

const screens = [
  ["screen-1", "01_first_screen.png"],
  ["screen-1", "02_map_screen.png"],
  ["screen-2", "03_service_screen.png"],
  ["screen-3", "04_scatter_screen.png"],
  ["screen-4", "05_policy_screen.png"],
] as const;

async function verifyPage(page: import("@playwright/test").Page) {
  const result = await page.evaluate(() => {
    const headings = Array.from(document.querySelectorAll("h1, h2"));
    const cards = Array.from(document.querySelectorAll(".kpiPanel, .servicePanel, .profileCard, .policyCard, .methodCard, .scopeCard, .sourceCard, .sensitivityCard"));
    const mapsLoaded = !document.body.innerText.includes("지도 로딩 중");
    const legendVisible = document.body.innerText.includes("우선 점검 필요") && document.body.innerText.includes("대체로 양호");
    const dataSourceVisible = document.body.innerText.includes("점수 산식·출처 확인") || document.body.innerText.includes("데이터 출처");
    const headingLinesOk = headings.every((heading) => heading.getClientRects().length <= 3);
    const cardOverflow = cards.some((card) => card.scrollWidth > card.clientWidth + 2);
    const clippedText = Array.from(document.querySelectorAll("p, span, strong, em, dd, dt, h1, h2, h3")).some((node) => {
      const element = node as HTMLElement;
      const style = getComputedStyle(element);
      const hiddenForA11y = element.classList.contains("srOnly") || element.closest(".srOnly");
      const visible = element.offsetParent !== null;
      const clippedX = element.scrollWidth > element.clientWidth + 3 && style.overflowX === "hidden";
      const clippedY = element.scrollHeight > element.clientHeight + 3 && style.overflowY === "hidden";
      return visible && !hiddenForA11y && (clippedX || clippedY);
    });

    return { mapsLoaded, legendVisible, dataSourceVisible, headingLinesOk, cardOverflow, clippedText };
  });

  if (!result.mapsLoaded) throw new Error("지도 로딩 상태가 남아 있습니다.");
  if (!result.legendVisible) throw new Error("범례와 색상 라벨을 확인할 수 없습니다.");
  if (!result.dataSourceVisible) throw new Error("데이터 출처 확인 진입점이 보이지 않습니다.");
  if (!result.headingLinesOk) throw new Error("제목이 3줄을 초과합니다.");
  if (result.cardOverflow) throw new Error("카드 영역 넘침이 감지되었습니다.");
  if (result.clippedText) throw new Error("텍스트 잘림 가능성이 감지되었습니다.");
}

async function main() {
  mkdirSync(outputDir, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ deviceScaleFactor: 1 });

  for (const [name, width, height] of viewports) {
    const viewportDir = path.join(outputDir, name);
    mkdirSync(viewportDir, { recursive: true });
    await page.setViewportSize({ width, height });
    await page.goto(appUrl, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("load");
    await page.locator(".mapLoading").first().waitFor({ state: "hidden", timeout: 30000 }).catch(() => undefined);
    await page.waitForTimeout(1200);

    for (const [id, fileName] of screens) {
      const locator = page.locator(`#${id}`);
      await locator.evaluate((element) => {
        document.documentElement.style.scrollBehavior = "auto";
        window.scrollTo(0, (element as HTMLElement).offsetTop);
      });
      await page.waitForTimeout(700);
      await verifyPage(page);
      await page.screenshot({ path: path.join(viewportDir, fileName), fullPage: false });
    }

    await page.locator(".methodologyDialogLauncher button").first().click();
    await page.locator("dialog[open]").waitFor({ timeout: 5000 });
    await page.screenshot({ path: path.join(viewportDir, "06_methodology_modal.png"), fullPage: false });
    await page.keyboard.press("Escape");
  }

  await browser.close();
  console.log(`Saved ${(screens.length + 1) * viewports.length} contest presentation screenshots to ${outputDir}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
