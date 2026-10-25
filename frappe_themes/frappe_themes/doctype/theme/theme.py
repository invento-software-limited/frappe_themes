# Copyright (c) 2026, Nazmul Hossain and contributors
# For license information, please see license.txt

import re

import frappe
from frappe import _
from frappe.model.document import Document

# Themes are fixed: each one's CSS ships ready-made in fixtures/theme.json and users only choose one
# in Theme Settings. Scripts that maintain the standard themes (e.g. sync_thumbnails) set this flag.
MAINTENANCE_FLAG = "frappe_themes_maintenance"


class Theme(Document):
	def validate(self):
		check_themes_can_change()

	def on_trash(self):
		check_themes_can_change()

	def on_update(self):
		sync_active_theme_css(self.name, self.compiled_css)


def check_themes_can_change():
	"""Themes are only written by the app itself: fixture sync on install / migrate, patches, tests
	and maintenance scripts that set frappe.flags.frappe_themes_maintenance."""
	flags = frappe.flags
	if (
		flags.in_install
		or flags.in_migrate
		or flags.in_patch
		or flags.in_fixtures
		or flags.in_import
		or flags.in_test
		or flags.get(MAINTENANCE_FLAG)
	):
		return
	frappe.throw(
		_(
			"Themes are fixed and can't be added, changed or deleted. Choose the active theme in Theme Settings."
		),
		frappe.PermissionError,
	)


def get_standard_themes():
	"""Names of the standard themes, taken from the Theme fixture filter in hooks.py."""
	names = []
	for fixture in frappe.get_hooks("fixtures", app_name="frappe_themes") or []:
		if not isinstance(fixture, dict) or fixture.get("dt") != "Theme":
			continue
		for field, operator, value in fixture.get("filters") or []:
			if field == "name" and operator == "in":
				names.extend(value)
	return names


def get_theme_slug(theme_name):
	"""Value of the `data-frappe-themes` attribute set on <html> while the theme is active; each
	theme's CSS is scoped to it."""
	if not theme_name:
		return "default"
	return re.sub(r"[^a-z0-9_]", "_", frappe.scrub(theme_name))


def sync_active_theme_css(theme, css):
	"""Keep Theme Settings' copy of the CSS current when the active theme is updated (e.g. by a
	fixture update)."""
	if not frappe.db.get_single_value("Theme Settings", "enable_theme"):
		return
	if frappe.db.get_single_value("Theme Settings", "active_theme") != theme:
		return
	frappe.db.set_single_value("Theme Settings", "theme_css", css or "")
