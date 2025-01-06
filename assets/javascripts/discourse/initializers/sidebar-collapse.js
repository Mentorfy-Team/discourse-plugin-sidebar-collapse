import { withPluginApi } from "discourse/lib/plugin-api";
import { tracked } from "@glimmer/tracking";

export default {
  name: "discourse-sidebar-collapse",
  initialize() {
    withPluginApi("1.2.0", (api) => {
      const expandedCategories = new Set();

      // Load saved states
      const loadSavedStates = () => {
        const saved = localStorage.getItem("discourse-sidebar-expanded-categories");
        if (saved) {
          const states = JSON.parse(saved);
          for (const id of states) {
            expandedCategories.add(id);
          }
        }
      };

      // Save states
      const saveStates = () => {
        localStorage.setItem(
          "discourse-sidebar-expanded-categories",
          JSON.stringify(Array.from(expandedCategories))
        );
      };

      // Toggle category expansion
      const toggleCategory = (categoryId) => {
        if (expandedCategories.has(categoryId)) {
          expandedCategories.delete(categoryId);
        } else {
          expandedCategories.add(categoryId);
        }
        saveStates();
        api.queueRerender();
      };

      // Add expand button to parent categories
      api.modifyClass("component:sidebar-section-link", {
        pluginId: "discourse-sidebar-collapse",
        
        isExpanded: tracked(),

        init() {
          this._super(...arguments);
          this.isExpanded = false;
        },

        didInsertElement() {
          this._super(...arguments);
          
          const categoryId = this.args?.content?.category?.id;
          if (!categoryId) return;

          const hasSubcategories = this.args?.content?.category?.subcategories?.length > 0;
          if (!hasSubcategories) return;

          this.element.dataset.categoryId = categoryId;
          
          const button = document.createElement("button");
          button.className = "category-expand-button";
          button.innerHTML = '<svg class="fa d-icon d-icon-angle-right svg-icon svg-string" xmlns="http://www.w3.org/2000/svg"><use href="#angle-right"></use></svg>';
          
          if (expandedCategories.has(categoryId)) {
            button.classList.add("expanded");
          }

          button.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleCategory(categoryId);
          });

          this.element.appendChild(button);
        },

        willDestroyElement() {
          this._super(...arguments);
          const button = this.element.querySelector(".category-expand-button");
          if (button) {
            button.remove();
          }
        }
      });

      loadSavedStates();
    });
  }
};