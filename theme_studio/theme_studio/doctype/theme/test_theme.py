# Copyright (c) 2026, Nazmul Hossain and Contributors
# See license.txt

import frappe
from frappe.tests import IntegrationTestCase

from theme_studio.api.boot import boot_session
from theme_studio.theme_studio.doctype.theme.theme import (
	MAINTENANCE_FLAG,
	get_standard_themes,
	get_theme_slug,
)
from theme_studio.theme_studio.doctype.theme_settings.theme_settings import (
	get_selectable_themes,
	get_theme_gallery,
)

# On IntegrationTestCase, the doctype test records and all
# link-field test record dependencies are recursively loaded
# Use these module variables to add/remove to/from that list
EXTRA_TEST_RECORD_DEPENDENCIES = []  # eg. ["User"]
IGNORE_TEST_RECORD_DEPENDENCIES = []  # eg. ["User"]

CSS = '[data-theme="light"][data-theme-studio="{slug}"] {{\n  --ts-primary: {color};\n}}\n'


def make_theme(theme_name, color="#111111", thumbnails=0):
	return frappe.get_doc(
		{
			"doctype": "Theme",
			"theme_name": theme_name,
			"compiled_css": CSS.format(slug=get_theme_slug(theme_name), color=color),
			"thumbnails": [
				{"view": f"View {i}", "image": f"/assets/x/{i}.webp"} for i in range(1, thumbnails + 1)
			],
		}
	).insert()


def set_active(theme_name, enable=1):
	# Set directly: these tests use their own _Test themes, which Theme Settings won't accept on save
	frappe.db.set_single_value("Theme Settings", {"enable_theme": enable, "active_theme": theme_name})


def get_boot():
	bootinfo = frappe._dict()
	boot_session(bootinfo)
	return bootinfo["theme_studio"]


class as_user_outside_install:
	"""Run a block as a regular desk request would: none of the install / migrate / test flags."""

	FLAGS = ("in_install", "in_migrate", "in_patch", "in_fixtures", "in_import", "in_test", MAINTENANCE_FLAG)

	def __enter__(self):
		self.saved = {flag: frappe.flags.get(flag) for flag in self.FLAGS}
		for flag in self.FLAGS:
			frappe.flags[flag] = False

	def __exit__(self, *exc):
		frappe.flags.update(self.saved)


class IntegrationTestTheme(IntegrationTestCase):
	@classmethod
	def setUpClass(cls):
		# These tests change Theme Settings; the database is rolled back afterwards, but a cached copy
		# of the changed values must not outlive the tests (the next save in the desk would write it
		# back). Class cleanups run last-in first-out, so registering this before IntegrationTestCase
		# registers its rollback makes it run after the rollback.
		cls.addClassCleanup(frappe.clear_cache, doctype="Theme Settings")
		super().setUpClass()

	def test_standard_themes_come_from_the_fixture_filter(self):
		standard = get_standard_themes()
		self.assertEqual(len(standard), 10)
		self.assertIn("Mediterranean Green", standard)
		self.assertIn("Mediterranean Green with Blue", standard)

	def test_standard_themes_are_installed_with_css_and_previews(self):
		# The fixture installs every standard theme, ready to use, on any site the app is installed on
		for name in get_standard_themes():
			self.assertTrue(frappe.db.exists("Theme", name), f"{name} is not installed")
			theme = frappe.get_doc("Theme", name)
			self.assertIn(f'[data-theme-studio="{get_theme_slug(name)}"]', theme.compiled_css)
			self.assertIn("--ts-primary:", theme.compiled_css)
			self.assertEqual(len(theme.thumbnails), 8, f"{name} should have 8 previews")

	def test_users_cannot_add_themes(self):
		with as_user_outside_install(), self.assertRaises(frappe.PermissionError):
			make_theme("_Test Not Allowed")

	def test_users_cannot_change_or_delete_themes(self):
		theme = make_theme("_Test Fixed")
		with as_user_outside_install():
			theme.compiled_css = "body { color: red; }"
			with self.assertRaises(frappe.PermissionError):
				theme.save()
			with self.assertRaises(frappe.PermissionError):
				theme.delete()

	def test_maintenance_scripts_can_update_themes(self):
		theme = make_theme("_Test Maintained")
		with as_user_outside_install():
			frappe.flags[MAINTENANCE_FLAG] = True
			theme.append("thumbnails", {"view": "Workspace", "image": "/assets/x/1.webp"})
			theme.save()
		self.assertEqual(len(theme.thumbnails), 1)

	def test_settings_rejects_a_theme_that_is_not_standard(self):
		make_theme("_Test Custom")
		settings = frappe.get_single("Theme Settings")
		settings.enable_theme = 1
		settings.active_theme = "_Test Custom"
		with self.assertRaises(frappe.ValidationError):
			settings.save()

	def test_settings_accepts_a_standard_theme_and_copies_its_css(self):
		theme = next((name for name in get_standard_themes() if frappe.db.exists("Theme", name)), None)
		if not theme:
			self.skipTest("standard themes are not installed on this site")
		settings = frappe.get_single("Theme Settings")
		settings.enable_theme = 1
		settings.active_theme = theme
		settings.save()
		self.assertEqual(settings.theme_css, frappe.db.get_value("Theme", theme, "compiled_css"))

	def test_picker_and_gallery_only_offer_standard_themes(self):
		make_theme("_Test Gallery Custom", thumbnails=2)
		self.assertNotIn("_Test Gallery Custom", get_selectable_themes())
		self.assertNotIn("_Test Gallery Custom", [row["theme"] for row in get_theme_gallery()])
		for name in get_selectable_themes():
			self.assertIn(name, get_standard_themes())

	def test_updating_the_active_theme_updates_settings(self):
		theme = make_theme("_Test Active", color="#111111")
		set_active(theme.name)
		theme.compiled_css = CSS.format(slug=get_theme_slug(theme.name), color="#222222")
		theme.save()
		self.assertEqual(frappe.db.get_single_value("Theme Settings", "theme_css"), theme.compiled_css)

	def test_updating_another_theme_leaves_settings_alone(self):
		active = make_theme("_Test Active Two", color="#111111")
		other = make_theme("_Test Other", color="#333333")
		set_active(active.name)
		frappe.db.set_single_value("Theme Settings", "theme_css", active.compiled_css)
		other.compiled_css = CSS.format(slug=get_theme_slug(other.name), color="#444444")
		other.save()
		self.assertEqual(frappe.db.get_single_value("Theme Settings", "theme_css"), active.compiled_css)

	def test_boot_sends_active_theme_css_and_slug(self):
		theme = make_theme("_Test Boot Theme")
		set_active(theme.name)
		info = get_boot()
		self.assertEqual(info["theme_slug"], "_test_boot_theme")
		self.assertEqual(info["theme_css"], theme.compiled_css)

	def test_boot_sends_nothing_when_disabled(self):
		theme = make_theme("_Test Disabled")
		set_active(theme.name, enable=0)
		info = get_boot()
		self.assertEqual(info["theme_css"], "")
		self.assertEqual(info["theme_slug"], "")

	def test_slug_is_safe_for_attribute_selectors(self):
		self.assertEqual(get_theme_slug("Ocean-Blue Dark"), "ocean_blue_dark")
		self.assertEqual(get_theme_slug('Bad"]{x}'), "bad___x_")
		self.assertEqual(get_theme_slug(""), "default")
