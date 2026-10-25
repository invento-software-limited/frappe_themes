### Theme Studio

Restyle the Frappe / ERPNext desk with ready-made color themes, developed by Invento Software Limited.

Theme Studio recolors the whole desk (sidebar, buttons, forms, lists, child tables, menus, views and workspace widgets) for every user, without an asset build. It works on Frappe v16: both the classic desk and the redesigned desk introduced in later v16 releases.

### Features

- **10 standard themes** ship with the app: Aurora, Emerald Mint, Mediterranean Green, Mediterranean Green with Blue, Midnight Cyan, Ocean Blue, Royal Purple, Slate Gray, Sunset Coral and Sunset Orange.
- **Theme gallery** in **Theme Settings**: screenshots of every theme across eight desk views (workspace, list, form, report, image, kanban, calendar, gantt).
- **Fixed, ready-made themes**: pick one and you're done. Themes can't be added, edited or deleted, so every site gets the same tested look.
- **Light mode only**: users on Frappe's dark desk theme keep Frappe's dark look.
- **Nothing changes until you choose**: after installing, open **Theme Settings**, pick a theme and enable it.

### Installation

```bash
cd $PATH_TO_YOUR_BENCH
bench get-app $URL_OF_THIS_REPO --branch version-16
bench --site <site> install-app theme_studio
```

When updating an existing site, run `bench --site <site> migrate`.

### Usage

1. Open **Theme Settings**, browse the gallery, pick a theme in **Active Theme**, keep **Enable Custom Theme** ticked and save.
2. Saving reloads the page so the theme applies right away. Other users get it on their next page load.

To go back to Frappe's look, untick **Enable Custom Theme**. Only users with the **System Manager** role can change Theme Settings. The **Theme** list shows each standard theme read-only.

### How it works

- Each standard **Theme** ships with ready-made CSS (in `theme_studio/fixtures/theme.json`): a set of CSS variables (`--ts-*`) scoped to `[data-theme="light"][data-theme-studio="<slug>"]`. Nothing is generated on the site.
- `theme_studio.bundle.css` holds the rules that read those variables, for both the classic and the redesigned v16 desk. Rules for the redesigned desk only apply while `<html>` has `data-theme-studio-ui="espresso"`, which `theme_studio.bundle.js` sets when that desk is detected, so the classic desk is not affected by them.
- On each page load, `theme_studio.api.boot.boot_session` (an `extend_bootinfo` hook) sends the active theme's CSS and slug to the browser; `theme_studio.bundle.js` sets `data-theme-studio` on `<html>`, injects the CSS and switches it off whenever Frappe's `data-theme` is not `light`.
- Themes are only written by the app itself (fixture sync on install and migrate); saving or deleting a Theme from the desk or the API is refused. **Theme Settings** only accepts the standard themes.

### Fixtures

The 10 standard themes (name, CSS and gallery screenshots) are fixtures in `theme_studio/fixtures/theme.json`, and the theme names are listed in the `fixtures` filter in `hooks.py`, which is also where the app reads the list of standard themes from. To change a theme's look, edit its `compiled_css` in `theme.json` (and update its `modified` timestamp so existing sites re-import it on `bench migrate`), then commit.

### Gallery screenshots

`scripts/generate_thumbnails.mjs` captures the eight gallery views for each theme with headless Chrome (`npm i puppeteer-core` in the folder you run it from). The site needs records to show in each view (sales invoices and orders, items, tasks with a Task kanban board, events).

```bash
SITE_URL=http://127.0.0.1:8000 SID=<administrator sid> CHROME=/usr/bin/google-chrome \
  node scripts/generate_thumbnails.mjs ["Theme Name" ...]
# re-capture only some views:
ONLY_VIEWS="Gantt View" node scripts/generate_thumbnails.mjs ...
bench --site <site> execute theme_studio.utils.thumbnails.sync_thumbnails
```

Get a SID with `bench --site <site> browse --user Administrator`.

### Limitations

- Changes apply on the next page load; open browser tabs keep the old theme until reloaded.
- Browsers may cache the app's stylesheet after an update; a hard reload (Ctrl+Shift+R) picks up the new version.
- Only the desk is themed: the website / portal, print formats and Frappe UI apps (such as CRM or Helpdesk) keep their own look.
- Renaming a Theme currently fails because of a Frappe issue in the rename code (an empty `IN ()` query when the only link to the doctype comes from a single doctype). Create a new theme with the new name instead.

### Development

Tests live in `theme_studio/theme_studio/doctype/theme/test_theme.py` and `theme_settings/test_theme_settings.py`:

```bash
bench --site <site> set-config allow_tests true   # once, on a development site
bench --site <site> run-tests --app theme_studio
```

### Contributing

This app uses `pre-commit` for code formatting and linting. Please [install pre-commit](https://pre-commit.com/#installation) and enable it for this repository:

```bash
cd apps/theme_studio
pre-commit install
```

Pre-commit runs ruff (lint, import sorting, formatting), prettier and eslint.

### CI

GitHub Actions workflows:

- **CI**: installs the app on a fresh site and runs its tests on every push to the `version-16` branch and on pull requests.
- **Linters**: runs pre-commit, [Frappe Semgrep Rules](https://github.com/frappe/semgrep-rules) and [pip-audit](https://pypi.org/project/pip-audit/) on every pull request.

### License

MIT
