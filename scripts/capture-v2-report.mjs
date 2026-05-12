import { mkdirSync, writeFileSync } from "node:fs";
import { execSync } from "node:child_process";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { chromium } from "playwright";

const appUrl = process.env.APP_URL ?? "http://127.0.0.1:3000/v2/";
const projectRoot = path.resolve(process.env.REPORT_ROOT ?? process.cwd());
const outputDir = path.resolve(process.env.REPORT_SCREENSHOT_DIR ?? "public/reports/v2-actual-data-captures");
const pdfPath = path.resolve(process.env.REPORT_PDF ?? "public/reports/seongnam_10min_access_v2_actual_data_capture.pdf");
const manifestPath = path.join(outputDir, "capture_manifest.json");

const screens = [
  { id: "screen-1", file: "screen-1.png", title: "화면 1. 한눈에 보기" },
  { id: "screen-2", file: "screen-2.png", title: "화면 2. 무엇이 부족한가" },
  { id: "screen-3", file: "screen-3.png", title: "화면 3. 어디가 우선인가" },
  { id: "screen-4", file: "screen-4.png", title: "화면 4. 어떻게 보완할까" },
];

mkdirSync(outputDir, { recursive: true });
mkdirSync(path.dirname(pdfPath), { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
await page.goto(appUrl, { waitUntil: "networkidle", timeout: 60000 });
await page.locator(".mapLoading").first().waitFor({ state: "hidden", timeout: 30000 }).catch(() => undefined);
await page.waitForTimeout(1600);

for (const screen of screens) {
  await page.locator(`#${screen.id}`).evaluate((element) => {
    document.documentElement.style.scrollBehavior = "auto";
    window.scrollTo(0, element.offsetTop);
  });
  await page.waitForTimeout(900);
  await page.screenshot({ path: path.join(outputDir, screen.file), fullPage: false });
}

const html = `<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8" />
  <title>성남 10분 생활필수 접근권 격차 지도 최종 캡처</title>
  <style>
    @page { size: 16in 9in; margin: 0; }
    html, body { margin: 0; padding: 0; background: #f8f6f1; font-family: "Malgun Gothic", sans-serif; }
    .page { width: 16in; height: 9in; page-break-after: always; position: relative; overflow: hidden; background: #f8f6f1; }
    .page:last-child { page-break-after: auto; }
    img { width: 16in; height: 9in; object-fit: cover; display: block; }
    .caption {
      position: absolute; left: 0.28in; bottom: 0.18in;
      padding: 0.08in 0.14in; background: rgba(248, 246, 241, 0.86);
      color: #18303f; font-size: 10pt; border: 1px solid rgba(24, 48, 63, 0.16);
    }
  </style>
</head>
<body>
${screens.map((screen) => {
  const imageUrl = pathToFileURL(path.join(outputDir, screen.file)).href;
  return `<section class="page"><img src="${imageUrl}" alt="${screen.title}" /><div class="caption">${screen.title}</div></section>`;
}).join("\n")}
</body>
</html>`;

const htmlPath = path.join(outputDir, "capture-report.html");
writeFileSync(htmlPath, html, "utf-8");

const pdfPage = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
await pdfPage.goto(pathToFileURL(htmlPath).href, { waitUntil: "load" });
await pdfPage.pdf({
  path: pdfPath,
  printBackground: true,
  width: "16in",
  height: "9in",
  margin: { top: "0", right: "0", bottom: "0", left: "0" },
});

const gitCommit = process.env.GIT_COMMIT ?? (() => {
  try {
    return execSync("git rev-parse --short HEAD", { encoding: "utf8" }).trim();
  } catch {
    return "unknown";
  }
})();

writeFileSync(manifestPath, JSON.stringify({
  title: "성남 10분 생활필수 접근권 격차 지도 최종 캡처",
  appUrl,
  capturedAt: new Date().toISOString(),
  gitCommit,
  viewport: { width: 1920, height: 1080 },
  pdf: path.relative(projectRoot, pdfPath).replaceAll("\\", "/"),
  screens: screens.map((screen) => ({
    id: screen.id,
    title: screen.title,
    file: path.relative(projectRoot, path.join(outputDir, screen.file)).replaceAll("\\", "/"),
  })),
}, null, 2), "utf-8");

await browser.close();
console.log(`screenshots: ${outputDir}`);
console.log(`pdf: ${pdfPath}`);
console.log(`manifest: ${manifestPath}`);
