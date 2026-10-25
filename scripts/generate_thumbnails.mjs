// Captures desk screenshots of every Theme into theme_studio/public/images/thumbnails/<slug>/.
//
// Usage (from a folder where `npm i puppeteer-core` has been run):
//   SITE_URL=http://127.0.0.1:8000 SID=<administrator sid> \
//   CHROME=/usr/bin/google-chrome [OUT_DIR=...] node generate_thumbnails.mjs [Theme Name ...]
//
// ONLY_VIEWS="Gantt View,Kanban View" re-captures just those views and leaves the other images.
//
// Get a SID with `bench --site <site> browse --user Administrator`, then run
// `bench --site <site> execute theme_studio.utils.thumbnails.sync_thumbnails` to load
// the images into each Theme's Thumbnails table.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer-core";

const SITE_URL = process.env.SITE_URL || "http://127.0.0.1:8000";
const SID = process.env.SID;
const CHROME = process.env.CHROME || "/usr/bin/google-chrome";
const OUT_DIR =
  process.env.OUT_DIR ||
  path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "../theme_studio/public/images/thumbnails"
  );

// File names are prefixed with their order so the gallery keeps this sequence
const VIEWS = [
  ["01-workspace", "Workspace", ["selling"]],
  ["02-list-view", "List View", ["List", "Sales Invoice"]],
  [
    "03-form-view",
    "Form View",
    ["Form", "Sales Invoice", "@first:Sales Invoice"],
  ],
  ["04-report-view", "Report View", ["List", "Sales Order", "Report"]],
  ["05-image-view", "Image View", ["List", "Item", "Image"]],
  [
    "06-kanban-view",
    "Kanban View",
    ["List", "Task", "Kanban", "@first:Kanban Board"],
  ],
  ["07-calendar-view", "Calendar View", ["List", "Event", "Calendar"]],
  ["08-gantt-view", "Gantt View", ["List", "Task", "Gantt"]],
];

// Mirrors get_theme_slug() in theme.py
const slugify = (name) =>
  name
    .replace(/[ -]/g, "_")
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "_");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ONLY_VIEWS = (process.env.ONLY_VIEWS || "")
  .split(",")
  .map((v) => v.trim())
  .filter(Boolean);

if (!SID) throw new Error("SID is required");

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  defaultViewport: { width: 1440, height: 900 },
});
const page = await browser.newPage();
await page.setCookie({ name: "sid", value: SID, url: SITE_URL });
await page.goto(`${SITE_URL}/app/home`, { waitUntil: "networkidle2" });
await page.waitForFunction(() => window.frappe?.boot?.user && window.cur_page);

const wanted = process.argv.slice(2);
const themes = (
  await page.evaluate(() =>
    frappe.db.get_list("Theme", { fields: ["name", "compiled_css"], limit: 0 })
  )
).filter((t) => !wanted.length || wanted.includes(t.name));

async function resolveRoute(route) {
  return Promise.all(
    route.map(async (part) => {
      if (!part.startsWith("@first:")) return part;
      const doctype = part.slice(7);
      const filters =
        doctype === "Kanban Board" ? { reference_doctype: "Task" } : {};
      const [row] = await page.evaluate(
        (dt, f) =>
          frappe.db.get_list(dt, {
            filters: f,
            limit: 1,
            order_by: "modified desc",
          }),
        doctype,
        filters
      );
      return row.name;
    })
  );
}

for (const theme of themes) {
  const slug = slugify(theme.name);
  const dir = path.join(OUT_DIR, slug);
  fs.mkdirSync(dir, { recursive: true });

  // Swap the boot info so theme_studio.js applies this theme on every page change
  await page.evaluate(
    (slug, css) => {
      const info = {
        enable_theme: 1,
        active_theme: "",
        theme_slug: slug,
        theme_css: css,
      };
      frappe.boot.theme_studio = info;
      document.documentElement.setAttribute("data-theme", "light");
      $(document).trigger("page-change");
    },
    slug,
    theme.compiled_css || ""
  );

  for (const [file, label, route] of VIEWS) {
    if (ONLY_VIEWS.length && !ONLY_VIEWS.includes(label)) continue;
    const resolved = await resolveRoute(route);
    await page.evaluate((r) => frappe.set_route(r), resolved);
    await page
      .waitForNetworkIdle({ idleTime: 600, timeout: 20000 })
      .catch(() => {});
    await sleep(1500);
    if (label === "Gantt View") {
      // The gantt opens at the start of its padded date range, so at Day zoom the bars sit
      // off-screen; Week zoom fits them on screen (Day is restored after the screenshot)
      await page.evaluate(() => {
        const gantt = window.cur_list && cur_list.gantt;
        if (gantt && !gantt.view_is("Week")) gantt.change_view_mode("Week");
      });
      await sleep(1000);
    }
    await page.evaluate(() => {
      $(".modal.show").modal("hide");
      $("#alert-container").empty();
      document.activeElement?.blur();
      window.scrollTo(0, 0);
    });
    await sleep(300);
    await page.screenshot({
      path: path.join(dir, `${file}.webp`),
      type: "webp",
      quality: 78,
    });
    console.log(`${theme.name}: ${label}`);
    if (label === "Gantt View") {
      await page.evaluate(() =>
        window.cur_list?.gantt?.change_view_mode("Day")
      );
      await sleep(300);
    }
  }
}

await browser.close();
