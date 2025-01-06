// Função principal de inicialização
function initializeApp() {
  // Add required CSS
  const existingStyle = document.querySelector('#categories-custom-style');
  if (!existingStyle) {
    const style = document.createElement('style');
    style.id = 'categories-custom-style';
    style.textContent = `
      /* Ensure main categories are always visible */
      .sidebar-section-link-wrapper {
        display: block;
      }

      /* Only hide subcategories */
      .sidebar-section-link-wrapper[data-is-subcategory="true"]:not(.expanded) {
        display: none;
      }
      
      .sidebar-section-link-wrapper[data-is-subcategory="true"] {
        margin-left: 1.5em;
      }
      
      .category-expand-button {
        background: none;
        border: none;
        padding: 2px 4px;
        cursor: pointer;
        transition: transform 0.2s ease;
        position: absolute;
        right: 8px;
        top: 50%;
        transform: translateY(-50%);
      }
      
      .category-expand-button.expanded svg {
        transform: rotate(90deg);
      }

      /* Parent categories need positioning for the expand button */
      .sidebar-section-link-wrapper {
        position: relative;
        padding-right: 32px;
      }

      /* Ensure subcategories state is preserved when main section is collapsed */
      .sidebar-section:not(.sidebar-section--expanded) .sidebar-section-link-wrapper[data-is-subcategory="true"] {
        display: none !important;
      }
    `;
    document.head.appendChild(style);
  }

  initializeCategories();
  setupObserver();
}

function initializeCategories() {
  console.log('[Categories] Script initialized');
  const categoryRelations = new Map();
  const categories = document.querySelectorAll('.sidebar-section-link-wrapper[data-category-id]');
  console.log(`[Categories] Found ${categories.length} total categories`);
  
  // Remove existing expand buttons to prevent duplicates
  for (const button of document.querySelectorAll('.category-expand-button')) {
    button.remove();
  }
  
  // Primeiro passo: mapear relações
  for (const category of categories) {
    try {
      const link = category.querySelector('a');
      if (!link) {
        console.warn('[Categories] Category found without link element');
        continue;
      }
      
      const href = link.getAttribute('href');
      const paths = href.split('/').filter(p => p);
      
      // Verificar se é uma subcategoria (path contém parent/child/id)
      if (paths.length > 3) {
        const parentId = paths[1];
        const subId = paths[2];
        console.log(`[Categories] Processing subcategory with parent ID: ${parentId}, subId: ${subId}, path: ${href}`);
        
        const parentCategory = Array.from(categories).find(cat => {
          const parentLink = cat.querySelector('a');
          const parentHref = parentLink?.getAttribute('href');
          return parentHref?.match(new RegExp(`/c/${parentId}/[^/]+$`));
        });
        
        if (parentCategory) {
          category.dataset.isSubcategory = 'true';
          category.dataset.parentCategory = parentId;
          
          if (!categoryRelations.has(parentId)) {
            categoryRelations.set(parentId, new Set());
          }
          categoryRelations.get(parentId).add(category);
          console.log(`[Categories] Successfully mapped subcategory to parent ${parentId}`);
        } else {
          console.warn(`[Categories] Parent category not found for ID: ${parentId}`);
        }
      }
    } catch (error) {
      console.error('[Categories] Error processing category:', error);
    }
  }
  
  console.log(`[Categories] Mapped ${categoryRelations.size} parent categories with subcategories`);
  
  // Segundo passo: adicionar botões de expansão
  for (const [parentId, subcategories] of categoryRelations.entries()) {
    const parentCategory = Array.from(categories).find(cat => {
      const link = cat.querySelector('a');
      return link?.getAttribute('href')?.includes(`/c/${parentId}/`);
    });
    
    if (parentCategory) {
      console.log(`[Categories] Adding expand button to parent category ${parentId} with ${subcategories.size} subcategories`);
      
      const expandButton = document.createElement('button');
      expandButton.className = 'category-expand-button';
      expandButton.innerHTML = '<svg class="fa d-icon d-icon-angle-right svg-icon svg-string" xmlns="http://www.w3.org/2000/svg"><use href="#angle-right"></use></svg>';
      expandButton.setAttribute('aria-label', 'Expandir categoria');
      
      // Recuperar estado salvo
      const isExpanded = localStorage.getItem(`category-${parentId}-expanded`) === 'true';
      console.log(`[Categories] Category ${parentId} saved state: ${isExpanded ? 'expanded' : 'collapsed'}`);
      
      if (isExpanded) {
        expandButton.classList.add('expanded');
        for (const sub of subcategories) {
          sub.classList.add('expanded');
        }
      }
      
      expandButton.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        const isNowExpanded = !expandButton.classList.contains('expanded');
        console.log(`[Categories] Category ${parentId} ${isNowExpanded ? 'expanded' : 'collapsed'} by user`);
        
        expandButton.classList.toggle('expanded');
        
        for (const sub of subcategories) {
          sub.classList.toggle('expanded');
        }
        
        localStorage.setItem(`category-${parentId}-expanded`, isNowExpanded);
      });
      
      parentCategory.insertBefore(expandButton, parentCategory.firstChild);
      expandButton.style.display = 'block';
    } else {
      console.warn(`[Categories] Could not find parent category element for ID: ${parentId}`);
    }
  }
  
  console.log('[Categories] Script initialization completed');
}

// Setup observer to watch for changes
function setupObserver() {
  const categoriesSection = document.querySelector('div[data-section-name="categories"]');
  if (categoriesSection) {
    console.log('[Categories] Setting up observer for categories section');
    
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        // Verifica se houve mudança na lista de filhos
        if (mutation.type === 'childList') {
          const ulElement = document.getElementById('sidebar-section-content-categories');
          
          // Se o elemento ul foi adicionado
          if (ulElement && Array.from(mutation.addedNodes).some(node => node.id === 'sidebar-section-content-categories')) {
            console.log('[Categories] Categories ul element was recreated, reinitializing...');
            initializeCategories();
            break;
          }
        }
      }
    });

    observer.observe(categoriesSection, {
      childList: true,
      subtree: true,
      attributes: false,
      characterData: false
    });
    
    console.log('[Categories] Observer setup completed');
  } else {
    console.warn('[Categories] Could not find categories section to observe');
  }
}

// Handle main categories toggle
const categoriesToggle = document.querySelector('.sidebar-section-header-collapsable');
if (categoriesToggle) {
  categoriesToggle.addEventListener('click', () => {
    console.log('[Categories] Main categories section toggled');
  });
}

// Inicialização inicial via DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('[Categories] Initial load via DOMContentLoaded');
  initializeApp();
});

// Suporte a navegação SPA
document.addEventListener('turbo:render', () => {
  console.log('[Categories] Turbo navigation detected, reinitializing...');
  initializeApp();
});

// Fallback para outros frameworks SPA
window.addEventListener('popstate', () => {
  console.log('[Categories] SPA navigation detected, reinitializing...');
  initializeApp();
});

// Para quando o tema do Discourse é alterado dinamicamente
document.addEventListener('discourse-theme-changed', () => {
  console.log('[Categories] Theme change detected, reinitializing...');
  initializeApp();
});

// Para quando componentes do Discourse são atualizados via AJAX
document.addEventListener('discourse-ajax-complete', () => {
  console.log('[Categories] Discourse AJAX update detected, reinitializing...');
  initializeApp();
});

// Para quando a sidebar é recolhida/expandida
document.addEventListener('sidebar-toggle', () => {
  console.log('[Categories] Sidebar toggle detected, reinitializing...');
  initializeApp();
});