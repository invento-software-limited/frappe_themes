// Copyright (c) 2026, Nazmul Hossain and contributors
// For license information, please see license.txt

// Themes are fixed: the form only shows a theme. Choose the active theme in Theme Settings.
frappe.ui.form.on("Theme", {
	refresh(frm) {
		frm.disable_form();
		frm.set_intro(
			__("Standard themes can't be edited. Choose the active theme in Theme Settings."),
			"blue"
		);
		frm.add_custom_button(__("Open Theme Settings"), () =>
			frappe.set_route("Form", "Theme Settings")
		);
	},
});
