import frappe

from theme_studio.theme_studio.doctype.theme.theme import get_theme_slug

DISABLED = {"enable_theme": 0, "active_theme": "", "theme_slug": "", "theme_css": ""}


def boot_session(bootinfo):
	try:
		settings = frappe.get_single("Theme Settings")
		active_theme = settings.active_theme if settings.enable_theme else None
		bootinfo["theme_studio"] = {
			"enable_theme": settings.enable_theme,
			"active_theme": settings.active_theme,
			"theme_slug": get_theme_slug(active_theme) if active_theme else "",
			# Read from the Theme itself so edits apply without re-saving Theme Settings
			"theme_css": (frappe.db.get_value("Theme", active_theme, "compiled_css") or "")
			if active_theme
			else "",
		}
	except Exception:
		# A broken theme must never stop the desk from loading; log to the app's log file (not the
		# Error Log, which this would fill on every page load) and fall back to Frappe's look
		frappe.logger("theme_studio").exception("Could not load the active theme for the desk")
		bootinfo["theme_studio"] = dict(DISABLED)
