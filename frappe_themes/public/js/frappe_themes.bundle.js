// Frappe Themes Client Loader

(function () {
	function applyTheme() {
		const themeInfo = frappe.boot && frappe.boot.frappe_themes;
		if (!themeInfo || !themeInfo.enable_theme || !themeInfo.theme_slug) {
			$("#frappe-themes-dynamic-style, #invento-dynamic-theme-style").remove();
			document.documentElement.removeAttribute("data-invento-theme");
			document.documentElement.removeAttribute("data-frappe-themes");
			document.documentElement.removeAttribute("data-frappe-themes-ui");
			return;
		}

		// Slug comes from the server so it always matches the generated CSS selectors
		const themeSlug = themeInfo.theme_slug;
		document.documentElement.setAttribute("data-invento-theme", themeSlug);
		document.documentElement.setAttribute("data-frappe-themes", themeSlug);
		syncDeskUI();

		if (themeInfo.theme_css) {
			let styleTag = $("#frappe-themes-dynamic-style");
			if (!styleTag.length) {
				styleTag = $('<style id="frappe-themes-dynamic-style"></style>').appendTo("head");
			}
			styleTag.text(themeInfo.theme_css);
			syncWithDeskTheme();
		}
	}

	// The custom theme only applies to Frappe's light mode. Frappe keeps data-theme on <html>
	// set to "light" or "dark" (User > Desk Theme, "Automatic" follows the OS) and updates it
	// live when the user switches, so turn the style tag off whenever it isn't "light".
	function syncWithDeskTheme() {
		const styleTag = document.getElementById("frappe-themes-dynamic-style");
		if (styleTag) {
			styleTag.disabled = document.documentElement.getAttribute("data-theme") !== "light";
		}
	}

	// Frappe v16.51+ redrew the desk on Espresso (dock, new sidebar, es-* components). Its rules in
	// frappe_themes.bundle.css only apply under data-frappe-themes-ui="espresso", so older v16 desks
	// keep exactly the styling they had. The Espresso color tokens only exist in the new desk CSS.
	function syncDeskUI() {
		const isEspresso =
			getComputedStyle(document.documentElement)
				.getPropertyValue("--surface-elevation-3")
				.trim() !== "";
		if (isEspresso) {
			document.documentElement.setAttribute("data-frappe-themes-ui", "espresso");
		} else {
			document.documentElement.removeAttribute("data-frappe-themes-ui");
		}
	}

	new MutationObserver(syncWithDeskTheme).observe(document.documentElement, {
		attributes: true,
		attributeFilter: ["data-theme"],
	});

	if (window.frappe && frappe.boot) {
		applyTheme();
	}

	$(document).ready(applyTheme);
	$(document).on("app_ready page-change toolbar_setup", applyTheme);
})();
