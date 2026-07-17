const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const CATALOG_PATH = "/var/www/biblioteca/backend/data/catalog-books.json";
const COVERS_DIR = "/var/www/biblioteca/backend/public/covers";
const TMPDIR = "/tmp/pdf-covers-playwright";
fs.mkdirSync(TMPDIR, { recursive: true });

async function getRemaining() {
  const raw = JSON.parse(fs.readFileSync(CATALOG_PATH, "utf8"));
  const books = raw.results || raw.books || raw;
  const existing = new Set(fs.readdirSync(COVERS_DIR));
  const downloaded = new Set(
    [...existing]
      .filter((f) => f.endsWith(".jpg"))
      .map((f) => f.replace(".jpg", ""))
  );
  const seen = new Set();
  const remaining = [];
  books.forEach((b) => {
    if (!b.fileId || seen.has(b.fileId)) return;
    seen.add(b.fileId);
    if (!downloaded.has(b.fileId)) {
      remaining.push({ fileId: b.fileId, id: b.id, title: (b.title || "").slice(0, 50) });
    }
  });
  return { books, remaining, raw };
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function captureDriveCover(page, fileId, outputPath) {
  // Try the viewer URL that shows the document preview
  const urls = [
    `https://drive.google.com/file/d/${fileId}/preview`,
    `https://docs.google.com/viewer?srcid=${fileId}&embedded=true&hl=pt_BR`,
  ];

  for (const url of urls) {
    try {
      await page.goto(url, { waitUntil: "networkidle", timeout: 15000 }).catch(() => {});
      await sleep(2000);

      // Find the preview image
      const images = await page.$$("img");
      for (const img of images) {
        const src = await img.getAttribute("src");
        if (src && (src.includes("lh3") || src.includes("googleusercontent"))) {
          // This is the direct CDN URL for the preview
          return await downloadImage(src, outputPath);
        }
      }

      // If no direct image URL found, screenshot the viewer area
      const viewer = await page.$("#drive-preview, .drive-viewer-panel, .ndfHFb-c4YZDc");
      if (viewer) {
        const box = await viewer.boundingBox();
        if (box && box.width > 100) {
          await page.screenshot({
            path: outputPath,
            clip: {
              x: box.x,
              y: box.y,
              width: Math.min(box.width, 600),
              height: Math.min(box.height, 400),
            },
          });
          const stat = fs.statSync(outputPath);
          if (stat.size > 2000) return true;
        }
      }

      // Full page screenshot as last resort
      await page.screenshot({ path: outputPath });
      const stat = fs.statSync(outputPath);
      if (stat.size > 5000) return true;
    } catch (e) {
      continue;
    }
  }
  return false;
}

function downloadImage(url, outputPath) {
  return new Promise((resolve) => {
    const client = url.startsWith("https") ? require("https") : require("http");
    const file = fs.createWriteStream(outputPath);
    client.get(
      url,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36",
          Referer: "https://drive.google.com/",
        },
        timeout: 10000,
      },
      (res) => {
        if (res.statusCode !== 200) {
          file.close();
          fs.unlinkSync(outputPath);
          resolve(false);
          return;
        }
        const ct = res.headers["content-type"] || "";
        if (!ct.startsWith("image/")) {
          file.close();
          fs.unlinkSync(outputPath);
          resolve(false);
          return;
        }
        res.pipe(file);
        file.on("finish", () => {
          file.close();
          const stat = fs.statSync(outputPath);
          resolve(stat.size > 500);
        });
      }
    );
    req.on("error", () => {
      file.close();
      fs.unlinkSync(outputPath);
      resolve(false);
    });
  });
}

async function main() {
  console.log("🎬 Playwright Drive Cover Hunter");
  console.log("================================");
  console.log("");

  const { books, remaining, raw } = await getRemaining();
  console.log(`🎯 Remaining: ${remaining.length} fileIds`);
  console.log("");

  if (remaining.length === 0) {
    console.log("✅ All done!");
    return;
  }

  // Launch browser
  const browser = await chromium.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
    ],
  });

  // Create a reusable page with persistence
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.setExtraHTTPHeaders({
    "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
  });

  // First visit Google Drive to establish session
  await page.goto("https://drive.google.com", { waitUntil: "networkidle", timeout: 15000 }).catch(() => {});
  await sleep(2000);
  console.log("🌐 Google Drive session initialized");
  console.log("");

  let success = 0;
  let fail = 0;

  for (let i = 0; i < remaining.length; i++) {
    const { fileId, id, title } = remaining[i];
    const outputPath = path.join(TMPDIR, `${fileId}.png`);
    const finalPath = path.join(COVERS_DIR, `${fileId}.jpg`);

    process.stdout.write(`  [${i + 1}/${remaining.length}] ${id.slice(0, 30).padEnd(32)}... `);

    const ok = await captureDriveCover(page, fileId, outputPath);

    if (ok) {
      // Convert PNG to JPG with sharp or convert
      try {
        execSync(
          `convert "${outputPath}" -resize "300x450>" -gravity center -background white -extent 300x450 -quality 82 "${finalPath}"`,
          { timeout: 5000 }
        );
        if (fs.existsSync(finalPath) && fs.statSync(finalPath).size > 500) {
          success++;
          console.log("✅");
        } else {
          fail++;
          console.log("❌ (resize)");
        }
      } catch {
        fail++;
        console.log("❌ (convert)");
      }
      try { fs.unlinkSync(outputPath); } catch {}
    } else {
      fail++;
      console.log("❌");
    }

    // Progress report
    if ((i + 1) % 10 === 0) {
      const elapsed = Math.floor(process.uptime());
      console.log(`    📊 ${i + 1}/${remaining.length} | ✅ ${success} ❌ ${fail} | ${elapsed}s`);
      console.log("");
    }

    // Save catalog progress
    if ((i + 1) % 20 === 0) {
      const existing = new Set(fs.readdirSync(COVERS_DIR));
      let updates = 0;
      books.forEach((b) => {
        if (!b.fileId) return;
        const fn = b.fileId + ".jpg";
        if (existing.has(fn) && b.cover !== "/covers/" + fn) {
          b.cover = "/covers/" + fn;
          updates++;
        }
      });
      if (raw.results) raw.results = books;
      else if (raw.books) raw.books = books;
      fs.writeFileSync(CATALOG_PATH, JSON.stringify(raw, null, 2));
      console.log(`    💾 Catalog saved (${updates} updated so far)`);
    }
  }

  await browser.close();

  // Final update
  const existing = new Set(fs.readdirSync(COVERS_DIR));
  let updates = 0;
  books.forEach((b) => {
    if (!b.fileId) return;
    const fn = b.fileId + ".jpg";
    if (existing.has(fn) && b.cover !== "/covers/" + fn) {
      b.cover = "/covers/" + fn;
      updates++;
    }
  });
  if (raw.results) raw.results = books;
  else if (raw.books) raw.books = books;
  fs.writeFileSync(CATALOG_PATH, JSON.stringify(raw, null, 2));

  const finalJpg = [...existing].filter((f) => f.endsWith(".jpg")).length;
  const finalPng = [...existing].filter((f) => f.endsWith(".png")).length;

  console.log("");
  console.log("========================================");
  console.log("✅ FINAL RESULT:");
  console.log(`   Downloaded: ${success}`);
  console.log(`   Failed: ${fail}`);
  console.log(`   Total JPG: ${finalJpg}`);
  console.log(`   Total PNG: ${finalPng}`);
  console.log(`   Total covers: ${existing.size}`);
  console.log(`   Catalog updates: ${updates}`);
  console.log("========================================");
}

main().catch(console.error);
