// Theme Studio Client Loader

(function () {
	function applyTheme() {
		const themeInfo = frappe.boot && frappe.boot.theme_studio;
		if (!themeInfo || !themeInfo.enable_theme || !themeInfo.theme_slug) {
			$("#theme-studio-dynamic-style, #invento-dynamic-theme-style").remove();
			document.documentElement.removeAttribute("data-invento-theme");
			document.documentElement.removeAttribute("data-theme-studio");
			document.documentElement.removeAttribute("data-theme-studio-ui");
			return;
		}

		// Slug comes from the server so it always matches the generated CSS selectors
		const themeSlug = themeInfo.theme_slug;
		document.documentElement.setAttribute("data-invento-theme", themeSlug);
		document.documentElement.setAttribute("data-theme-studio", themeSlug);
		syncDeskUI();

		if (themeInfo.theme_css) {
			let styleTag = $("#theme-studio-dynamic-style");
			if (!styleTag.length) {
				styleTag = $('<style id="theme-studio-dynamic-style"></style>').appendTo("head");
			}
			styleTag.text(themeInfo.theme_css);
			syncWithDeskTheme();
		}
	}

	// The custom theme only applies to Frappe's light mode. Frappe keeps data-theme on <html>
	// set to "light" or "dark" (User > Desk Theme, "Automatic" follows the OS) and updates it
	// live when the user switches, so turn the style tag off whenever it isn't "light".
	function syncWithDeskTheme() {
		const styleTag = document.getElementById("theme-studio-dynamic-style");
		if (styleTag) {
			styleTag.disabled = document.documentElement.getAttribute("data-theme") !== "light";
		}
	}

	// Frappe v16.51+ redrew the desk on Espresso (dock, new sidebar, es-* components). Its rules in
	// theme_studio.bundle.css only apply under data-theme-studio-ui="espresso", so older v16 desks
	// keep exactly the styling they had. The Espresso color tokens only exist in the new desk CSS.
	function syncDeskUI() {
		const isEspresso =
			getComputedStyle(document.documentElement)
				.getPropertyValue("--surface-elevation-3")
				.trim() !== "";
		if (isEspresso) {
			document.documentElement.setAttribute("data-theme-studio-ui", "espresso");
		} else {
			document.documentElement.removeAttribute("data-theme-studio-ui");
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
