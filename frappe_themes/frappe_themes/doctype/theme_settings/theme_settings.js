// Copyright (c) 2026, Nazmul Hossain and contributors
// For license information, please see license.txt

frappe.ui.form.on("Theme Settings", {
	setup(frm) {
		// Themes are fixed: Active Theme only offers the standard themes
		frm.set_query("active_theme", () => ({
			filters: { name: ["in", frm.selectable_themes || []] },
		}));
	},
	refresh(frm) {
		frappe
			.xcall(
				"frappe_themes.frappe_themes.doctype.theme_settings.theme_settings.get_selectable_themes"
			)
			.then((names) => (frm.selectable_themes = names));
		frm.events.render_theme_gallery(frm);
	},
	active_theme(frm) {
		frm.theme_gallery?.show_theme(frm.doc.active_theme);
	},
	after_save(frm) {
		// The theme CSS comes in with the boot info, so reload the page to apply the saved choice
		const message = frm.doc.enable_theme
			? __("Applying {0}...", [frm.doc.active_theme])
			: __("Turning the theme off...");
		frappe.show_alert({ message, indicator: "green" });
		setTimeout(() => window.location.reload(), 600);
	},
	render_theme_gallery(frm) {
		frappe.call({
			method: "frappe_themes.frappe_themes.doctype.theme_settings.theme_settings.get_theme_gallery",
			callback(r) {
				frm.theme_gallery = new ThemeGallery(
					frm,
					frm.fields_dict.theme_gallery.$wrapper,
					r.message || []
				);
			},
		});
	},
});

const AUTOPLAY_SECONDS = 5;

class ThemeGallery {
	constructor(frm, $wrapper, themes) {
		this.frm = frm;
		this.$wrapper = $wrapper;
		// One flat list of slides across all themes, so the slider runs from theme to theme
		this.slides = themes.flatMap((t) =>
			t.thumbnails.map((thumb, i) => ({ ...thumb, theme: t.theme, index_in_theme: i }))
		);
		this.themes = themes;
		this.current = 0;
		this.paused = false;

		inject_gallery_styles();
		if (!this.slides.length) {
			this.$wrapper.html(`<div class="ts-gallery-empty text-muted">
				${__("No theme thumbnails yet. Add images to the Thumbnails table of a Theme.")}
			</div>`);
			return;
		}

		this.render();
		this.bind();
		const start = this.slides.findIndex((s) => s.theme === frm.doc.active_theme);
		this.go(Math.max(start, 0), false);
	}

	render() {
		const esc = frappe.utils.escape_html;
		this.$wrapper.html(`
			<div class="ts-gallery" tabindex="0">
				<div class="ts-themes">
					${this.themes
						.map(
							(t) => `<button class="ts-theme-chip" data-theme="${esc(t.theme)}">
								<img src="${encodeURI(t.thumbnails[0].image)}" alt="">
								<span>${esc(t.theme)}</span>
							</button>`
						)
						.join("")}
				</div>

				<div class="ts-stage">
					<div class="ts-viewport">
						${this.slides
							.map(
								(s, i) => `<div class="ts-slide" data-index="${i}">
									<div class="ts-frame-bar">
										<span class="ts-dot"></span><span class="ts-dot"></span><span class="ts-dot"></span>
										<span class="ts-frame-title">${esc(s.theme)} · ${esc(s.view)}</span>
									</div>
									<img data-src="${encodeURI(s.image)}" alt="${esc(s.theme)} - ${esc(s.view)}" draggable="false">
								</div>`
							)
							.join("")}
					</div>
					<button class="ts-nav ts-prev" title="${__("Previous")}">${frappe.utils.icon(
			"left",
			"md"
		)}</button>
					<button class="ts-nav ts-next" title="${__("Next")}">${frappe.utils.icon("right", "md")}</button>
				</div>
				<div class="ts-progress"><div class="ts-progress-bar"></div></div>

				<div class="ts-caption">
					<div>
						<div class="ts-caption-theme"></div>
						<div class="ts-caption-view"></div>
					</div>
					<div class="ts-caption-actions">
						<span class="ts-counter"></span>
						<button class="btn btn-default btn-sm ts-toggle"></button>
						<button class="btn btn-primary btn-sm ts-apply">${__("Use This Theme")}</button>
					</div>
				</div>

				<div class="ts-filmstrip"></div>
			</div>
		`);

		this.$gallery = this.$wrapper.find(".ts-gallery");
		this.$slides = this.$gallery.find(".ts-slide");
		this.$progress = this.$gallery.find(".ts-progress-bar");
		this.$progress.css("animation-duration", `${AUTOPLAY_SECONDS}s`);
	}

	bind() {
		const $g = this.$gallery;
		$g.on("click", ".ts-prev", () => this.go(this.current - 1));
		$g.on("click", ".ts-next", () => this.go(this.current + 1));
		$g.on("click", ".ts-theme-chip", (e) => {
			const theme = $(e.currentTarget).attr("data-theme");
			this.go(this.slides.findIndex((s) => s.theme === theme));
		});
		$g.on("click", ".ts-film-thumb", (e) =>
			this.go(cint($(e.currentTarget).attr("data-index")))
		);
		$g.on("click", ".ts-slide", (e) => {
			const index = cint($(e.currentTarget).attr("data-index"));
			if (index === this.current) {
				window.open($(e.currentTarget).find("img").attr("src"), "_blank");
			} else {
				this.go(index);
			}
		});
		$g.on("click", ".ts-toggle", () => this.set_paused(!this.paused));
		$g.on("click", ".ts-apply", async (e) => {
			const theme = this.slides[this.current].theme;
			$(e.currentTarget).prop("disabled", true);
			this.set_paused(true);
			try {
				await this.frm.set_value({ enable_theme: 1, active_theme: theme });
				await this.frm.save();
			} catch (err) {
				$(e.currentTarget).prop("disabled", false);
				throw err;
			}
			if (this.frm.is_dirty()) {
				// save failed (validation error etc.), the error has already been shown
				$(e.currentTarget).prop("disabled", false);
			}
			// on success the form's after_save reloads the page to apply the theme
		});
		$g.on("keydown", (e) => {
			if (e.key === "ArrowLeft") this.go(this.current - 1);
			if (e.key === "ArrowRight") this.go(this.current + 1);
		});

		// The progress bar's CSS animation is the autoplay timer, so hovering (which pauses
		// the animation) or leaving the form (which hides it) also pauses the slider
		this.$progress.on("animationend", () => this.go(this.current + 1));

		let start_x = null;
		const $viewport = $g.find(".ts-viewport");
		$viewport.on("pointerdown", (e) => (start_x = e.clientX));
		$viewport.on("pointerup pointercancel", (e) => {
			if (start_x === null) return;
			const delta = e.clientX - start_x;
			start_x = null;
			if (Math.abs(delta) > 50) this.go(this.current + (delta < 0 ? 1 : -1));
		});

		this.set_paused(false);
	}

	go(index, animate = true) {
		const total = this.slides.length;
		this.current = ((index % total) + total) % total;
		const slide = this.slides[this.current];

		this.layout_slides(animate);

		const esc = frappe.utils.escape_html;
		const theme_changed = this.$gallery.attr("data-current-theme") !== slide.theme;
		this.$gallery.attr("data-current-theme", slide.theme);
		this.$gallery.find(".ts-caption-view").text(slide.view);
		this.$gallery.find(".ts-counter").text(`${this.current + 1} / ${total}`);
		this.$gallery
			.find(".ts-caption-theme")
			.html(`${esc(slide.theme)}<span class="ts-active-badge">${__("Active")}</span>`);

		if (theme_changed) this.render_filmstrip(slide.theme);
		this.$gallery.find(".ts-film-thumb").removeClass("active");
		const $thumb = this.$gallery
			.find(`.ts-film-thumb[data-index="${this.current}"]`)
			.addClass("active");
		const strip = this.$gallery.find(".ts-filmstrip").get(0);
		if ($thumb.length) {
			strip.scrollTo({
				left: $thumb.get(0).offsetLeft - strip.clientWidth / 2 + $thumb.outerWidth() / 2,
				behavior: animate ? "smooth" : "auto",
			});
		}

		this.$gallery.find(".ts-theme-chip").each((_, el) => {
			$(el).toggleClass("active", $(el).attr("data-theme") === slide.theme);
		});
		this.update_active_theme();
		this.restart_timer();
	}

	// Current slide large in the middle, its neighbours smaller on either side, the rest hidden
	// just beyond them so they slide in from the edge
	layout_slides(animate) {
		const total = this.slides.length;
		this.$slides.each((i, el) => {
			let offset = i - this.current;
			// Shortest way round, so the last slide sits to the left of the first
			if (offset > total / 2) offset -= total;
			if (offset < -total / 2) offset += total;

			const distance = Math.abs(offset);
			const position = ["center", "near", "far"][Math.min(distance, 2)];
			const was_hidden = el.dataset.position === "far" || !el.dataset.position;
			el.dataset.position = position;
			el.dataset.side = offset < 0 ? "left" : "right";
			// Hidden slides jumping from one side to the other must not visibly fly across
			el.classList.toggle("no-transition", !animate || (distance >= 2 && was_hidden));

			if (distance <= 2) {
				const img = el.querySelector("img");
				if (!img.getAttribute("src")) img.setAttribute("src", img.dataset.src);
			}
		});
	}

	render_filmstrip(theme) {
		const esc = frappe.utils.escape_html;
		const first = this.slides.findIndex((s) => s.theme === theme);
		this.$gallery.find(".ts-filmstrip").html(
			this.slides
				.filter((s) => s.theme === theme)
				.map(
					(s, i) => `<button class="ts-film-thumb" data-index="${first + i}">
						<img src="${encodeURI(s.image)}" alt="" loading="lazy">
						<span>${esc(s.view)}</span>
					</button>`
				)
				.join("")
		);
	}

	show_theme(theme) {
		if (!this.slides.length) return;
		// "Use This Theme" sets the field from the current slide, so stay on that slide
		if (this.slides[this.current].theme !== theme) {
			const index = this.slides.findIndex((s) => s.theme === theme);
			if (index !== -1) return this.go(index);
		}
		this.update_active_theme();
	}

	update_active_theme() {
		const is_active = this.slides[this.current].theme === this.frm.doc.active_theme;
		this.$gallery.toggleClass("is-active-theme", is_active);
		this.$gallery.find(".ts-theme-chip").each((_, el) => {
			$(el).toggleClass(
				"is-active-theme",
				$(el).attr("data-theme") === this.frm.doc.active_theme
			);
		});
	}

	restart_timer() {
		const bar = this.$progress.get(0);
		bar.classList.remove("running");
		void bar.offsetWidth; // restart the CSS animation
		bar.classList.add("running");
	}

	set_paused(paused) {
		this.paused = paused;
		this.$gallery.toggleClass("paused", paused);
		this.$gallery
			.find(".ts-toggle")
			.html(paused ? `▶ ${__("Play")}` : `❚❚ ${__("Pause")}`)
			.attr("title", paused ? __("Resume slideshow") : __("Pause slideshow"));
	}
}

function inject_gallery_styles() {
	if (document.getElementById("theme-gallery-styles")) return;
	$(`<style id="theme-gallery-styles">
		.ts-gallery { outline: none; }
		.ts-gallery-empty {
			padding: var(--padding-xl); text-align: center;
			border: 1px dashed var(--border-color); border-radius: var(--border-radius-lg);
		}

		/* Theme chips are hidden for now; change display to flex to show them again */
		.ts-themes { display: none; flex-wrap: wrap; gap: 8px; margin-bottom: 18px; }
		.ts-theme-chip {
			display: inline-flex; align-items: center; gap: 8px;
			padding: 4px 12px 4px 4px; border-radius: 999px;
			border: 1px solid var(--border-color); background: var(--card-bg);
			color: var(--text-color); font-size: var(--text-sm); font-weight: 500;
			transition: border-color .2s, box-shadow .2s, background .2s;
		}
		.ts-theme-chip img {
			width: 22px; height: 22px; border-radius: 50%;
			object-fit: cover; object-position: 0 50%;
			box-shadow: 0 0 0 1px var(--border-color);
		}
		.ts-theme-chip:hover { border-color: var(--gray-400); }
		.ts-theme-chip.active {
			border-color: var(--primary); background: var(--control-bg);
			box-shadow: 0 0 0 2px color-mix(in srgb, var(--primary) 25%, transparent);
		}
		.ts-theme-chip.is-active-theme span::after { content: " ✓"; color: var(--green-600); }

		/* Peek carousel: the current slide in the middle, cropped previews of its neighbours at the sides */
		.ts-stage { position: relative; container-type: inline-size; }
		.ts-viewport {
			position: relative; overflow: hidden; touch-action: pan-y;
			height: calc(58cqw * 900 / 1440 + 34px + 28px); /* centre slide + frame bar + shadow room */
		}
		.ts-slide {
			position: absolute; display: flex; flex-direction: column;
			border-radius: 14px; overflow: hidden; background: var(--card-bg);
			border: 1px solid var(--border-color); cursor: pointer;
			transition: left .6s, top .6s, width .6s, height .6s, opacity .6s, box-shadow .6s;
			transition-timing-function: cubic-bezier(.22,.61,.36,1);
		}
		.ts-slide.no-transition { transition: none; }
		.ts-slide[data-position="center"] {
			left: 21%; width: 58%; top: 4px; height: calc(100% - 28px); z-index: 2; cursor: zoom-in;
			box-shadow: 0 1px 2px rgba(0,0,0,.04), 0 14px 32px -10px rgba(0,0,0,.22);
		}
		.ts-slide[data-position="near"] { top: 13%; height: 68%; width: 17.5%; opacity: .6; z-index: 1; }
		.ts-slide[data-position="near"][data-side="left"] { left: 1%; }
		.ts-slide[data-position="near"][data-side="right"] { left: 81.5%; }
		.ts-slide[data-position="near"]:hover { opacity: .9; }
		.ts-slide[data-position="far"] { top: 13%; height: 68%; width: 17.5%; opacity: 0; pointer-events: none; }
		.ts-slide[data-position="far"][data-side="left"] { left: -20%; }
		.ts-slide[data-position="far"][data-side="right"] { left: 102.5%; }
		.ts-slide:not([data-position]) { display: none; }

		.ts-frame-bar {
			flex: none; display: flex; align-items: center; gap: 6px; padding: 9px 14px;
			background: var(--subtle-fg); border-bottom: 1px solid var(--border-color);
			white-space: nowrap; overflow: hidden;
		}
		.ts-dot { flex: none; width: 10px; height: 10px; border-radius: 50%; background: #ff5f57; }
		.ts-dot:nth-child(2) { background: #febc2e; }
		.ts-dot:nth-child(3) { background: #28c840; }
		.ts-frame-title {
			flex: 1; text-align: center; margin-right: 46px; overflow: hidden; text-overflow: ellipsis;
			font-size: var(--text-xs); color: var(--text-muted);
		}
		.ts-slide:not([data-position="center"]) .ts-frame-title { visibility: hidden; }
		.ts-slide img {
			flex: 1; min-height: 0; width: 100%; display: block;
			object-fit: cover; object-position: left top; user-select: none;
			background: var(--subtle-fg);
		}

		.ts-progress { height: 3px; width: 58%; margin: 0 auto; border-radius: 3px; overflow: hidden; background: var(--subtle-fg); }
		.ts-progress-bar { height: 100%; width: 0; background: var(--primary); }
		.ts-progress-bar.running { animation: ts-progress linear forwards; }
		.ts-gallery.paused .ts-progress-bar, .ts-gallery:has(.ts-stage:hover) .ts-progress-bar { animation-play-state: paused; }
		@keyframes ts-progress { from { width: 0; } to { width: 100%; } }

		.ts-nav {
			position: absolute; top: calc(50% - 12px); transform: translateY(-50%); z-index: 3;
			width: 40px; height: 40px; border-radius: 50%;
			display: flex; align-items: center; justify-content: center;
			border: 1px solid var(--border-color); background: var(--card-bg); color: var(--text-color);
			box-shadow: var(--shadow-md); opacity: .9; transition: opacity .2s, transform .2s;
		}
		.ts-nav:hover { opacity: 1; transform: translateY(-50%) scale(1.06); }
		.ts-prev { left: calc(21% - 20px); }
		.ts-next { right: calc(21% - 20px); }

		.ts-caption {
			display: flex; justify-content: space-between; align-items: center;
			flex-wrap: wrap; gap: 12px; margin-top: 16px;
		}
		.ts-caption-theme { font-size: var(--text-lg); font-weight: 600; color: var(--heading-color); }
		.ts-caption-view { font-size: var(--text-sm); color: var(--text-muted); margin-top: 2px; }
		.ts-active-badge {
			display: none; margin-left: 8px; padding: 2px 8px; border-radius: 999px; vertical-align: middle;
			font-size: var(--text-xs); font-weight: 500;
			background: var(--bg-green); color: var(--text-on-green);
		}
		.ts-gallery.is-active-theme .ts-active-badge { display: inline-block; }
		.ts-gallery.is-active-theme .ts-apply { display: none; }
		.ts-caption-actions { display: flex; align-items: center; gap: 8px; }
		.ts-counter { font-size: var(--text-sm); color: var(--text-muted); font-variant-numeric: tabular-nums; margin-right: 4px; }

		.ts-filmstrip {
			display: flex; gap: 10px; margin-top: 16px; padding: 4px 2px 8px;
			overflow-x: auto; scrollbar-width: thin;
		}
		.ts-film-thumb {
			flex: 0 0 150px; padding: 0; border: none; background: none; text-align: left;
			opacity: .65; transition: opacity .2s;
		}
		.ts-film-thumb img {
			width: 100%; aspect-ratio: 1440 / 900; object-fit: cover; display: block;
			border-radius: 8px; border: 2px solid transparent;
			box-shadow: 0 0 0 1px var(--border-color); transition: border-color .2s;
		}
		.ts-film-thumb span { display: block; margin-top: 5px; font-size: var(--text-xs); color: var(--text-muted); }
		.ts-film-thumb:hover { opacity: 1; }
		.ts-film-thumb.active { opacity: 1; }
		.ts-film-thumb.active img { border-color: var(--primary); }
		.ts-film-thumb.active span { color: var(--text-color); font-weight: 500; }

		@media (max-width: 768px) {
			.ts-viewport { height: calc(80cqw * 900 / 1440 + 34px + 28px); }
			.ts-slide[data-position="center"] { left: 10%; width: 80%; }
			.ts-slide[data-position="near"] { width: 7%; }
			.ts-slide[data-position="near"][data-side="left"] { left: 1.5%; }
			.ts-slide[data-position="near"][data-side="right"] { left: 91.5%; }
			.ts-progress { width: 80%; }
			.ts-prev { left: calc(10% - 20px); }
			.ts-next { right: calc(10% - 20px); }
			.ts-film-thumb { flex-basis: 110px; }
		}
	</style>`).appendTo("head");
}
