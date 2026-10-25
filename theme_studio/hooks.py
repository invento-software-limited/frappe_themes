app_name = "theme_studio"
app_title = "Theme Studio"
app_publisher = "Nazmul Hossain"
app_description = (
	"Restyle the ERPNext desk with ready-made color themes, developed by Invento Software Limited"
)
app_email = "nazmul@invento.com.bd"
app_license = "mit"

# Apps
# ------------------

# required_apps = []

# Each item in the list will be shown as an app in the apps page
# add_to_apps_screen = [
# 	{
# 		"name": "theme_studio",
# 		"logo": "/assets/theme_studio/logo.png",
# 		"title": "Theme Studio",
# 		"route": "/theme_studio",
# 		"has_permission": "theme_studio.api.permission.has_app_permission"
# 	}
# ]

# Includes in <head>
# ------------------

# include js, css files in header of desk.html
app_include_css = "theme_studio.bundle.css"
app_include_js = "theme_studio.bundle.js"

extend_bootinfo = "theme_studio.api.boot.boot_session"

fixtures = [
	{
		"dt": "Theme",
		"filters": [
			[
				"name",
				"in",
				[
					"Mediterranean Green",
					"Ocean Blue",
					"Royal Purple",
					"Sunset Orange",
					"Slate Gray",
					"Aurora",
					"Sunset Coral",
					"Midnight Cyan",
					"Emerald Mint",
					"Mediterranean Green with Blue",
				],
			]
		],
	},
]


# include js, css files in header of web template
# web_include_css = "/assets/theme_studio/css/theme_studio.css"
# web_include_js = "/assets/theme_studio/js/theme_studio.js"

# include custom scss in every website theme (without file extension ".scss")
# website_theme_scss = "theme_studio/public/scss/website"

# include js, css files in header of web form
# webform_include_js = {"doctype": "public/js/doctype.js"}
# webform_include_css = {"doctype": "public/css/doctype.css"}

# include js in page
# page_js = {"page" : "public/js/file.js"}

# include js in doctype views
# doctype_js = {"doctype" : "public/js/doctype.js"}
# doctype_list_js = {"doctype" : "public/js/doctype_list.js"}
# doctype_tree_js = {"doctype" : "public/js/doctype_tree.js"}
# doctype_calendar_js = {"doctype" : "public/js/doctype_calendar.js"}

# Svg Icons
# ------------------
# include app icons in desk
# app_include_icons = "theme_studio/public/icons.svg"

# Home Pages
# ----------

# application home page (will override Website Settings)
# home_page = "login"

# website user home page (by Role)
# role_home_page = {
# 	"Role": "home_page"
# }

# Generators
# ----------

# automatically create page for each record of this doctype
# website_generators = ["Web Page"]

# automatically load and sync documents of this doctype from downstream apps
# importable_doctypes = [doctype_1]

# Jinja
# ----------

# add methods and filters to jinja environment
# jinja = {
# 	"methods": "theme_studio.utils.jinja_methods",
# 	"filters": "theme_studio.utils.jinja_filters"
# }

# Installation
# ------------

# before_install = "theme_studio.install.before_install"
# after_install = "theme_studio.install.after_install"

# Keep every theme's generated CSS in step with theme_studio.bundle.css after app updates
# after_migrate = []

# Uninstallation
# ------------

# before_uninstall = "theme_studio.uninstall.before_uninstall"
# after_uninstall = "theme_studio.uninstall.after_uninstall"

# Integration Setup
# ------------------
# To set up dependencies/integrations with other apps
# Name of the app being installed is passed as an argument

# before_app_install = "theme_studio.utils.before_app_install"
# after_app_install = "theme_studio.utils.after_app_install"

# Integration Cleanup
# -------------------
# To clean up dependencies/integrations with other apps
# Name of the app being uninstalled is passed as an argument

# before_app_uninstall = "theme_studio.utils.before_app_uninstall"
# after_app_uninstall = "theme_studio.utils.after_app_uninstall"

# Build
# ------------------
# To hook into the build process

# after_build = "theme_studio.build.after_build"

# Desk Notifications
# ------------------
# See frappe.core.notifications.get_notification_config

# notification_config = "theme_studio.notifications.get_notification_config"

# Awesome Bar
# -----------
# Extra search results: list of dicts with label, description, route, index.
# route: ["List", "ToDo"], "/desk/docs/some/page", or "https://example.com"
# awesomebar_search = ["theme_studio.search.awesomebar_results"]

# Permissions
# -----------
# Permissions evaluated in scripted ways

# permission_query_conditions = {
# 	"Event": "frappe.desk.doctype.event.event.get_permission_query_conditions",
# }
#
# has_permission = {
# 	"Event": "frappe.desk.doctype.event.event.has_permission",
# }

# Document Events
# ---------------
# Hook on document methods and events

# doc_events = {
# 	"*": {
# 		"on_update": "method",
# 		"on_cancel": "method",
# 		"on_trash": "method"
# 	}
# }

# Scheduled Tasks
# ---------------

# scheduler_events = {
# 	"all": [
# 		"theme_studio.tasks.all"
# 	],
# 	"daily": [
# 		"theme_studio.tasks.daily"
# 	],
# 	"hourly": [
# 		"theme_studio.tasks.hourly"
# 	],
# 	"weekly": [
# 		"theme_studio.tasks.weekly"
# 	],
# 	"monthly": [
# 		"theme_studio.tasks.monthly"
# 	],
# }

# Testing
# -------

# before_tests = "theme_studio.install.before_tests"

# Extend DocType Class
# ------------------------------
#
# Specify custom mixins to extend the standard doctype controller.
# extend_doctype_class = {
# 	"Task": "theme_studio.custom.task.CustomTaskMixin"
# }

# Overriding Methods
# ------------------------------
#
# override_whitelisted_methods = {
# 	"frappe.desk.doctype.event.event.get_events": "theme_studio.event.get_events"
# }
#
# each overriding function accepts a `data` argument;
# generated from the base implementation of the doctype dashboard,
# along with any modifications made in other Frappe apps
# override_doctype_dashboards = {
# 	"Task": "theme_studio.task.get_dashboard_data"
# }

# exempt linked doctypes from being automatically cancelled
#
# auto_cancel_exempted_doctypes = ["Auto Repeat"]

# Ignore links to specified DocTypes when deleting documents
# -----------------------------------------------------------

# ignore_links_on_delete = ["Communication", "ToDo"]

# Request Events
# ----------------
# before_request = ["theme_studio.utils.before_request"]
# after_request = ["theme_studio.utils.after_request"]

# Job Events
# ----------
# before_job = ["theme_studio.utils.before_job"]
# after_job = ["theme_studio.utils.after_job"]

# User Data Protection
# --------------------

# user_data_fields = [
# 	{
# 		"doctype": "{doctype_1}",
# 		"filter_by": "{filter_by}",
# 		"redact_fields": ["{field_1}", "{field_2}"],
# 		"partial": 1,
# 	},
# 	{
# 		"doctype": "{doctype_2}",
# 		"filter_by": "{filter_by}",
# 		"partial": 1,
# 	},
# 	{
# 		"doctype": "{doctype_3}",
# 		"strict": False,
# 	},
# 	{
# 		"doctype": "{doctype_4}"
# 	}
# ]

# Authentication and authorization
# --------------------------------

# auth_hooks = [
# 	"theme_studio.auth.validate"
# ]

# Automatically update python controller files with type annotations for this app.
# export_python_type_annotations = True

# default_log_clearing_doctypes = {
# 	"Logging DocType Name": 30  # days to retain logs
# }

# Translation
# ------------
# List of apps whose translatable strings should be excluded from this app's translations.
# ignore_translatable_strings_from = []
