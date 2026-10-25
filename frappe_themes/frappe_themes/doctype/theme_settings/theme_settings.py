# Copyright (c) 2026, Nazmul Hossain and contributors
# For license information, please see license.txt

import frappe
from frappe import _
from frappe.model.document import Document

from frappe_themes.frappe_themes.doctype.theme.theme import get_standard_themes


class ThemeSettings(Document):
	def validate(self):
		if self.active_theme and self.active_theme not in get_standard_themes():
			frappe.throw(
				_("{0} is not one of the standard themes. Choose a theme from the gallery.").format(
					frappe.bold(self.active_theme)
				)
			)
		if self.enable_theme and self.active_theme:
			self.theme_css = frappe.db.get_value("Theme", self.active_theme, "compiled_css") or ""
		else:
			self.theme_css = ""


def get_selectable_theme_names():
	"""Standard themes present on this site, in the order they were installed."""
	standard = set(get_standard_themes())
	return [
		name for name in frappe.get_all("Theme", pluck="name", order_by="creation asc") if name in standard
	]


@frappe.whitelist()
def get_selectable_themes():
	"""The themes Active Theme may be set to."""
	frappe.only_for("System Manager")
	return get_selectable_theme_names()


@frappe.whitelist()
def get_theme_gallery():
	"""Standard themes with their thumbnails, in install order, for the Theme Settings slider."""
	frappe.only_for("System Manager")
	themes = get_selectable_theme_names()
	rows = frappe.get_all(
		"Theme Thumbnail",
		filters={"parenttype": "Theme", "parent": ["in", themes or [""]]},
		fields=["parent", "view", "image"],
		order_by="idx asc",
	)

	thumbnails = {}
	for row in rows:
		thumbnails.setdefault(row.parent, []).append({"view": row.view, "image": row.image})

	return [{"theme": theme, "thumbnails": thumbnails[theme]} for theme in themes if theme in thumbnails]
