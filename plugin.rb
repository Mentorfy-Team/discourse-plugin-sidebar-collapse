# frozen_string_literal: true

# name: discourse-sidebar-collapse
# about: Adds collapse functionality to sidebar categories
# version: 0.1.0
# authors: Your Name
# url: https://github.com/yourusername/discourse-sidebar-collapse
# required_version: 2.7.0

enabled_site_setting :sidebar_collapse_enabled

module ::DiscourseSidebarCollapse
  PLUGIN_NAME = "discourse-sidebar-collapse"
end

after_initialize do
  # Register our assets
  register_asset "stylesheets/sidebar-collapse.scss"
end
