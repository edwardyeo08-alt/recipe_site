/**
 * MealPlan - Progressive Web App Logic
 * Features:
 * - Recipe Search & Meat / Diet Filter
 * - Meal Plan with Portion Scaling
 * - Combined Supermarket Shopping List with Aisle Categorization & Persistence
 * - Printout & Cooking Mode with Screen Wake Lock API
 * - Offline PWA Support & LocalStorage Persistence
 */

(() => {
  'use strict';

  // --- APPLICATION STATE ---
  const STORAGE_KEY = 'mealplan_state_v1';
  let recipes = [];
  let state = {
    plan: [], // Array of { id: number, portions: number }
    checkedShopping: {}, // Map of itemKey -> boolean
    hideChecked: false,
    activeTab: 'recipes',
    selectedMeatFilter: 'all',
    selectedTimeFilter: null,
    selectedCategoryFilter: null,
    searchQuery: '',
    sortBy: 'default',
    theme: 'light'
  };

  let wakeLockSentinel = null;
  let isWakeLockRequested = false;

  // --- DOM ELEMENT REFERENCES ---
  const elements = {
    // Header & Navigation
    themeToggleBtn: document.getElementById('themeToggleBtn'),
    quickPlanBtn: document.getElementById('quickPlanBtn'),
    headerPlanCount: document.getElementById('headerPlanCount'),
    navPlanBadge: document.getElementById('navPlanBadge'),
    navShoppingBadge: document.getElementById('navShoppingBadge'),
    offlineBanner: document.getElementById('offlineBanner'),
    bottomNav: document.querySelector('.bottom-nav'),
    navItems: document.querySelectorAll('.nav-item'),
    toast: document.getElementById('toast'),

    // Search & Filters
    searchFilterBar: document.getElementById('searchFilterBar'),
    searchInput: document.getElementById('searchInput'),
    clearSearchBtn: document.getElementById('clearSearchBtn'),
    meatFilterChips: document.getElementById('meatFilterChips'),
    secondaryFilters: document.getElementById('secondaryFilters'),
    resetAllFiltersBtn: document.getElementById('resetAllFiltersBtn'),
    recipeSortSelect: document.getElementById('recipeSortSelect'),

    // Views
    recipesView: document.getElementById('recipesView'),
    planView: document.getElementById('planView'),
    shoppingView: document.getElementById('shoppingView'),
    cookView: document.getElementById('cookView'),

    // Recipes View Elements
    recipesGrid: document.getElementById('recipesGrid'),
    recipesResultCount: document.getElementById('recipesResultCount'),
    recipesEmptyState: document.getElementById('recipesEmptyState'),
    emptyStateResetBtn: document.getElementById('emptyStateResetBtn'),

    // Plan View Elements
    planSummaryCard: document.getElementById('planSummaryCard'),
    planTotalMeals: document.getElementById('planTotalMeals'),
    planTotalPortions: document.getElementById('planTotalPortions'),
    planItemsList: document.getElementById('planItemsList'),
    planEmptyState: document.getElementById('planEmptyState'),
    planBrowseBtn: document.getElementById('planBrowseBtn'),
    planQuickPlanBtn: document.getElementById('planQuickPlanBtn'),
    quick3MealPlanBtn: document.getElementById('quick3MealPlanBtn'),
    addRandomMealBtn: document.getElementById('addRandomMealBtn'),
    clearPlanBtn: document.getElementById('clearPlanBtn'),
    goToShoppingBtn: document.getElementById('goToShoppingBtn'),

    // Shopping List Elements
    shoppingProgressWrapper: document.getElementById('shoppingProgressWrapper'),
    shoppingProgressSummary: document.getElementById('shoppingProgressSummary'),
    shoppingProgressBarFill: document.getElementById('shoppingProgressBarFill'),
    shoppingCheckedCount: document.getElementById('shoppingCheckedCount'),
    hideCheckedToggle: document.getElementById('hideCheckedToggle'),
    shoppingAislesContainer: document.getElementById('shoppingAislesContainer'),
    shoppingEmptyState: document.getElementById('shoppingEmptyState'),
    shoppingBrowseBtn: document.getElementById('shoppingBrowseBtn'),
    shoppingQuickPlanBtn: document.getElementById('shoppingQuickPlanBtn'),
    copyShoppingBtn: document.getElementById('copyShoppingBtn'),
    uncheckAllBtn: document.getElementById('uncheckAllBtn'),

    // Cook & Print Elements
    printableArea: document.getElementById('printableArea'),
    cookEmptyState: document.getElementById('cookEmptyState'),
    cookBrowseBtn: document.getElementById('cookBrowseBtn'),
    wakeLockBtn: document.getElementById('wakeLockBtn'),
    wakeLockIcon: document.getElementById('wakeLockIcon'),
    wakeLockText: document.getElementById('wakeLockText'),
    printBtn: document.getElementById('printBtn'),

    // Modal
    recipeModal: document.getElementById('recipeModal'),
    modalContent: document.getElementById('modalContent'),
    modalCloseBtn: document.getElementById('modalCloseBtn')
  };

  // --- INITIALIZATION ---
  async function init() {
    loadSavedState();
    setupTheme();
    setupEventListeners();
    setupPwaAndNetwork();

    try {
      await loadRecipesData();
      renderAll();
    } catch (err) {
      console.error('Failed to load recipes data:', err);
      elements.recipesResultCount.textContent = 'Error loading recipes. Please refresh.';
      showToast('Could not load recipe database.');
    }
  }

  // --- STATE PERSISTENCE ---
  function loadSavedState() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed.plan)) {
          state.plan = parsed.plan
            .map(p => ({
              id: Number(p.id),
              portions: Math.max(1, Math.min(12, Number(p.portions) || 4))
            }))
            .filter(p => !isNaN(p.id) && p.id > 0);
        }
        if (parsed.checkedShopping && typeof parsed.checkedShopping === 'object') {
          state.checkedShopping = parsed.checkedShopping;
        }
        if (typeof parsed.hideChecked === 'boolean') state.hideChecked = parsed.hideChecked;
        if (parsed.theme) state.theme = parsed.theme;
        if (parsed.activeTab) state.activeTab = parsed.activeTab;
      }
    } catch (e) {
      console.warn('Could not read from localStorage:', e);
    }
  }

  function saveState() {
    try {
      const payload = {
        plan: state.plan,
        checkedShopping: state.checkedShopping,
        hideChecked: state.hideChecked,
        activeTab: state.activeTab,
        theme: state.theme
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (e) {
      console.warn('Could not save to localStorage:', e);
    }
  }

  // --- THEME MANAGEMENT ---
  function setupTheme() {
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = state.theme || (prefersDark ? 'dark' : 'light');
    setTheme(initialTheme);
  }

  function setTheme(theme) {
    state.theme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    elements.themeToggleBtn.querySelector('.theme-icon').textContent = theme === 'dark' ? '☀️' : '🌙';
    saveState();
  }

  function toggleTheme() {
    setTheme(state.theme === 'dark' ? 'light' : 'dark');
  }

  // --- DATA LOADING & PROTEIN CLASSIFICATION ---
  async function loadRecipesData() {
    elements.recipesResultCount.textContent = 'Fetching recipes...';
    
    // Attempt standard and URI-encoded endpoints
    let response;
    try {
      response = await fetch('extracted recipes/all_recipes.json');
    } catch (e) {
      response = await fetch('extracted%20recipes/all_recipes.json');
    }

    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }

    const data = await response.json();
    recipes = (data.recipes || []).map(enrichRecipe);
    console.log(`Loaded and enriched ${recipes.length} recipes.`);
  }

  function enrichRecipe(r) {
    if (r.category === 'Vegetarian' || r.category === 'Veggie') {
      return buildEnrichedRecipe(r, 'Vegetarian');
    }

    const titleText = (r.title + ' ' + (r.subtitle || '')).toLowerCase();

    // Check title & subtitle first for definitive protein indicators
    if (/fish|hake|trout|salmon|tuna|yellowtail|dorado|basa|squid|calamari|prawn|seafood|mussel/.test(titleText)) {
      return buildEnrichedRecipe(r, 'Fish & Seafood');
    }
    if (/chicken|poultry/.test(titleText)) {
      return buildEnrichedRecipe(r, 'Chicken');
    }
    if (/lamb|mutton/.test(titleText)) {
      return buildEnrichedRecipe(r, 'Lamb');
    }
    if (/pork|bacon|\bham\b|kassler|chorizo/.test(titleText)) {
      return buildEnrichedRecipe(r, 'Pork');
    }
    if (/ostrich|venison|duck|turkey/.test(titleText)) {
      return buildEnrichedRecipe(r, 'Game');
    }
    if (/beef|steak|rump|sirloin|brisket|bobotie/.test(titleText)) {
      return buildEnrichedRecipe(r, 'Beef');
    }

    // Next check primary ingredients (excluding stocks/broths that might be secondary flavoring)
    const ingNames = (r.ingredients || [])
      .map(i => i.name.toLowerCase())
      .filter(n => !n.includes('stock') && !n.includes('broth'))
      .join(' ');

    if (/fish|hake|trout|salmon|tuna|yellowtail|dorado|basa|squid|calamari|prawn|seafood|mussel/.test(ingNames)) {
      return buildEnrichedRecipe(r, 'Fish & Seafood');
    }
    if (/chicken|poultry/.test(ingNames)) {
      return buildEnrichedRecipe(r, 'Chicken');
    }
    if (/lamb|mutton/.test(ingNames)) {
      return buildEnrichedRecipe(r, 'Lamb');
    }
    if (/pork|bacon|\bham\b|kassler|chorizo/.test(ingNames)) {
      return buildEnrichedRecipe(r, 'Pork');
    }
    if (/ostrich|venison|duck|turkey/.test(ingNames)) {
      return buildEnrichedRecipe(r, 'Game');
    }
    if (/beef|rump|sirloin|brisket|mince|biltong|fillet/.test(ingNames)) {
      return buildEnrichedRecipe(r, 'Beef');
    }

    return buildEnrichedRecipe(r, 'Vegetarian');
  }

  function buildEnrichedRecipe(r, protein) {
    const ingText = (r.ingredients || []).map(i => i.name).join(' ').toLowerCase();
    const numStr = String(r.recipe_number).padStart(2, '0');
    const imagePath = `extracted recipes/recipe_${numStr}_dish.jpg`;

    return {
      ...r,
      protein,
      imagePath,
      searchCorpus: `${r.title} ${r.subtitle || ''} ${r.chef || ''} ${r.category || ''} ${protein} ${ingText}`.toLowerCase()
    };
  }

  // --- SERVICE WORKER & OFFLINE DETECTION ---
  function setupPwaAndNetwork() {
    // Register Service Worker
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js')
          .then(reg => console.log('[PWA] Service Worker registered with scope:', reg.scope))
          .catch(err => console.warn('[PWA] Service Worker registration failed:', err));
      });
    }

    // Online / Offline Events
    function updateNetworkStatus() {
      if (!navigator.onLine) {
        elements.offlineBanner.hidden = false;
      } else {
        elements.offlineBanner.hidden = true;
      }
    }

    window.addEventListener('online', updateNetworkStatus);
    window.addEventListener('offline', updateNetworkStatus);
    updateNetworkStatus();
  }

  // --- EVENT LISTENERS ---
  function setupEventListeners() {
    // Theme toggle
    elements.themeToggleBtn.addEventListener('click', toggleTheme);

    // Header plan badge click
    elements.quickPlanBtn.addEventListener('click', () => switchTab('plan'));

    // Navigation Tabs
    elements.navItems.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetTab = btn.getAttribute('data-tab');
        switchTab(targetTab);
      });
    });

    // Search Input
    elements.searchInput.addEventListener('input', e => {
      state.searchQuery = e.target.value.trim().toLowerCase();
      elements.clearSearchBtn.hidden = !state.searchQuery;
      renderRecipes();
    });

    elements.clearSearchBtn.addEventListener('click', () => {
      elements.searchInput.value = '';
      state.searchQuery = '';
      elements.clearSearchBtn.hidden = true;
      renderRecipes();
      elements.searchInput.focus();
    });

    // Protein Filter Chips
    elements.meatFilterChips.addEventListener('click', e => {
      const chip = e.target.closest('.chip');
      if (!chip) return;
      elements.meatFilterChips.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      state.selectedMeatFilter = chip.getAttribute('data-filter');
      updateResetButtonVisibility();
      renderRecipes();
    });

    // Secondary Filters (Time & Category)
    elements.secondaryFilters.addEventListener('click', e => {
      const pill = e.target.closest('.filter-pill');
      if (!pill || pill.id === 'resetAllFiltersBtn') return;

      if (pill.hasAttribute('data-time')) {
        const timeVal = parseInt(pill.getAttribute('data-time'), 10);
        if (state.selectedTimeFilter === timeVal) {
          state.selectedTimeFilter = null;
          pill.classList.remove('active');
        } else {
          elements.secondaryFilters.querySelectorAll('[data-time]').forEach(p => p.classList.remove('active'));
          pill.classList.add('active');
          state.selectedTimeFilter = timeVal;
        }
      } else if (pill.hasAttribute('data-category')) {
        const catVal = pill.getAttribute('data-category');
        if (state.selectedCategoryFilter === catVal) {
          state.selectedCategoryFilter = null;
          pill.classList.remove('active');
        } else {
          elements.secondaryFilters.querySelectorAll('[data-category]').forEach(p => p.classList.remove('active'));
          pill.classList.add('active');
          state.selectedCategoryFilter = catVal;
        }
      }

      updateResetButtonVisibility();
      renderRecipes();
    });

    // Reset Filters Buttons
    elements.resetAllFiltersBtn.addEventListener('click', resetAllFilters);
    elements.emptyStateResetBtn.addEventListener('click', resetAllFilters);

    // Sorting
    elements.recipeSortSelect.addEventListener('change', e => {
      state.sortBy = e.target.value;
      renderRecipes();
    });

    // Meal Plan Actions
    elements.planBrowseBtn.addEventListener('click', () => switchTab('recipes'));
    elements.shoppingBrowseBtn.addEventListener('click', () => switchTab('recipes'));
    elements.cookBrowseBtn.addEventListener('click', () => switchTab('recipes'));

    // Quick 3-Meal Plan triggers
    if (elements.quick3MealPlanBtn) {
      elements.quick3MealPlanBtn.addEventListener('click', () => generateQuickPlan(3));
    }
    if (elements.planQuickPlanBtn) {
      elements.planQuickPlanBtn.addEventListener('click', () => generateQuickPlan(3));
    }
    if (elements.shoppingQuickPlanBtn) {
      elements.shoppingQuickPlanBtn.addEventListener('click', () => generateQuickPlan(3));
    }

    elements.goToShoppingBtn.addEventListener('click', () => {
      if (state.plan.length === 0) {
        generateQuickPlan(3);
      } else {
        switchTab('shopping');
      }
    });

    elements.addRandomMealBtn.addEventListener('click', addRandomMealToPlan);
    elements.clearPlanBtn.addEventListener('click', confirmClearPlan);

    // Shopping List Actions
    elements.copyShoppingBtn.addEventListener('click', copyShoppingListToClipboard);
    elements.uncheckAllBtn.addEventListener('click', uncheckAllShoppingItems);
    elements.hideCheckedToggle.addEventListener('change', e => {
      state.hideChecked = e.target.checked;
      saveState();
      renderShoppingList();
    });

    // Print & Screen Wake Lock
    elements.printBtn.addEventListener('click', () => window.print());
    elements.wakeLockBtn.addEventListener('click', toggleScreenWakeLock);

    // Modal Close
    elements.modalCloseBtn.addEventListener('click', closeModal);
    elements.recipeModal.addEventListener('click', e => {
      if (e.target === elements.recipeModal) closeModal();
    });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && !elements.recipeModal.hidden) closeModal();
    });

    // Listen for tab visibility changes for Wake Lock
    document.addEventListener('visibilitychange', async () => {
      if (isWakeLockRequested && document.visibilityState === 'visible' && 'wakeLock' in navigator) {
        try {
          wakeLockSentinel = await navigator.wakeLock.request('screen');
          updateWakeLockUI(true);
          wakeLockSentinel.addEventListener('release', () => {
            wakeLockSentinel = null;
            if (!isWakeLockRequested) {
              updateWakeLockUI(false);
            }
          });
        } catch (e) {
          console.warn('Wake Lock re-acquire failed:', e);
        }
      }
    });

    // Handle beforeprint and afterprint to ensure cook/shopping views are ready for printing
    window.addEventListener('beforeprint', () => {
      if (state.activeTab === 'shopping') {
        document.body.classList.add('printing-shopping');
      } else {
        document.body.classList.remove('printing-shopping');
        renderCookView();
      }
    });

    window.addEventListener('afterprint', () => {
      document.body.classList.remove('printing-shopping');
    });
  }

  // --- TAB NAVIGATION ---
  function switchTab(tabName) {
    state.activeTab = tabName;
    saveState();

    // Toggle active section
    elements.recipesView.classList.toggle('active', tabName === 'recipes');
    elements.recipesView.hidden = tabName !== 'recipes';

    elements.planView.classList.toggle('active', tabName === 'plan');
    elements.planView.hidden = tabName !== 'plan';

    elements.shoppingView.classList.toggle('active', tabName === 'shopping');
    elements.shoppingView.hidden = tabName !== 'shopping';

    elements.cookView.classList.toggle('active', tabName === 'cook');
    elements.cookView.hidden = tabName !== 'cook';

    // Show/hide search & filter bar (only relevant on recipes tab)
    elements.searchFilterBar.style.display = tabName === 'recipes' ? 'block' : 'none';

    // Update bottom nav
    elements.navItems.forEach(item => {
      item.classList.toggle('active', item.getAttribute('data-tab') === tabName);
    });

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'instant' });

    // Refresh view data
    if (tabName === 'plan') renderPlan();
    if (tabName === 'shopping') renderShoppingList();
    if (tabName === 'cook') renderCookView();
  }

  function updateBadgeCounts() {
    const mealCount = state.plan.length;
    elements.headerPlanCount.textContent = mealCount;

    if (mealCount > 0) {
      elements.navPlanBadge.textContent = mealCount;
      elements.navPlanBadge.hidden = false;
    } else {
      elements.navPlanBadge.hidden = true;
    }

    // Shopping items count
    const shoppingItems = calculateAggregatedShopping();
    const remainingCount = shoppingItems.filter(i => !state.checkedShopping[i.key]).length;

    if (remainingCount > 0 && mealCount > 0) {
      elements.navShoppingBadge.textContent = remainingCount;
      elements.navShoppingBadge.hidden = false;
    } else {
      elements.navShoppingBadge.hidden = true;
    }
  }

  // --- FILTER & SORT LOGIC ---
  function resetAllFilters() {
    state.searchQuery = '';
    state.selectedMeatFilter = 'all';
    state.selectedTimeFilter = null;
    state.selectedCategoryFilter = null;
    state.sortBy = 'default';

    elements.searchInput.value = '';
    elements.clearSearchBtn.hidden = true;
    elements.recipeSortSelect.value = 'default';

    elements.meatFilterChips.querySelectorAll('.chip').forEach(c => {
      c.classList.toggle('active', c.getAttribute('data-filter') === 'all');
    });

    elements.secondaryFilters.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
    elements.resetAllFiltersBtn.hidden = true;

    renderRecipes();
  }

  function updateResetButtonVisibility() {
    const hasActiveFilters = state.selectedMeatFilter !== 'all' ||
      state.selectedTimeFilter !== null ||
      state.selectedCategoryFilter !== null ||
      state.searchQuery !== '';
    elements.resetAllFiltersBtn.hidden = !hasActiveFilters;
  }

  function getFilteredRecipes() {
    let result = recipes.slice();

    // 1. Meat filter
    if (state.selectedMeatFilter !== 'all') {
      result = result.filter(r => r.protein === state.selectedMeatFilter);
    }

    // 2. Cooking time filter
    if (state.selectedTimeFilter) {
      result = result.filter(r => (r.overall_time_minutes || 60) <= state.selectedTimeFilter);
    }

    // 3. Category filter
    if (state.selectedCategoryFilter) {
      result = result.filter(r => r.category === state.selectedCategoryFilter);
    }

    // 4. Keyword search query
    if (state.searchQuery) {
      const q = state.searchQuery;
      result = result.filter(r => r.searchCorpus.includes(q));
    }

    // 5. Sorting
    if (state.sortBy === 'time-asc') {
      result.sort((a, b) => (a.overall_time_minutes || 0) - (b.overall_time_minutes || 0));
    } else if (state.sortBy === 'time-desc') {
      result.sort((a, b) => (b.overall_time_minutes || 0) - (a.overall_time_minutes || 0));
    } else if (state.sortBy === 'title-asc') {
      result.sort((a, b) => a.title.localeCompare(b.title));
    } else {
      // Default: recipe_number asc
      result.sort((a, b) => a.recipe_number - b.recipe_number);
    }

    return result;
  }

  // --- RENDER RECIPES VIEW ---
  function renderRecipes() {
    const filtered = getFilteredRecipes();
    elements.recipesGrid.innerHTML = '';

    if (filtered.length === 0) {
      elements.recipesEmptyState.hidden = false;
      elements.recipesResultCount.textContent = '0 recipes found';
      return;
    }

    elements.recipesEmptyState.hidden = true;
    elements.recipesResultCount.textContent = `Showing ${filtered.length} of ${recipes.length} recipes`;

    const fragment = document.createDocumentFragment();

    filtered.forEach(r => {
      const recipeId = Number(r.recipe_number);
      const isPlanned = state.plan.some(p => Number(p.id) === recipeId);
      const card = document.createElement('article');
      card.className = 'recipe-card';
      card.setAttribute('data-id', recipeId);

      const isVeg = r.protein === 'Vegetarian';

      card.innerHTML = `
        <div class="recipe-card-media">
          <img 
            src="${r.imagePath}" 
            alt="${escapeHtml(r.title)}" 
            class="recipe-card-img" 
            loading="lazy" 
            decoding="async"
            onerror="this.style.opacity='0.4'"
          >
          <div class="recipe-badges">
            <span class="badge badge-time">⏱ ${r.overall_time_minutes || 45}m</span>
            <span class="badge badge-protein ${isVeg ? 'badge-veg' : ''}">${escapeHtml(r.protein)}</span>
          </div>
        </div>
        <div class="recipe-card-body">
          <h3 class="recipe-card-title">${escapeHtml(r.title)}</h3>
          <p class="recipe-card-subtitle">${escapeHtml(r.subtitle || r.description || '')}</p>
          <div class="recipe-card-meta">
            <span>By ${escapeHtml(r.chef || 'Chef')}</span>
            <span>${r.category || 'Dinner'}</span>
          </div>
        </div>
        <div class="recipe-card-footer">
          <button class="btn-add-plan ${isPlanned ? 'in-plan' : ''}" data-action="toggle-plan" data-id="${recipeId}">
            ${isPlanned ? '✓ In Plan' : '+ Add to Plan'}
          </button>
        </div>
      `;

      // Separate event listeners for button vs card click
      const addBtn = card.querySelector('[data-action="toggle-plan"]');
      if (addBtn) {
        addBtn.addEventListener('click', e => {
          e.stopPropagation();
          toggleRecipeInPlan(recipeId);
        });
      }

      card.addEventListener('click', e => {
        if (!e.target.closest('[data-action="toggle-plan"]')) {
          openRecipeModal(r);
        }
      });

      fragment.appendChild(card);
    });

    elements.recipesGrid.appendChild(fragment);
  }

  // --- PLAN MANAGEMENT ---
  function toggleRecipeInPlan(recipeId) {
    const numId = Number(recipeId);
    const existingIndex = state.plan.findIndex(p => Number(p.id) === numId);
    const recipe = recipes.find(r => Number(r.recipe_number) === numId);

    if (existingIndex > -1) {
      state.plan.splice(existingIndex, 1);
      showToast(`Removed "${recipe ? recipe.title : 'Meal'}" from plan`);
    } else {
      const defaultPortions = recipe ? (Number(recipe.servings) || 4) : 4;
      state.plan.push({ id: numId, portions: defaultPortions });
      showToast(`Added "${recipe ? recipe.title : 'Meal'}" (${defaultPortions} portions)`);
    }

    saveState();
    updateBadgeCounts();
    renderRecipes();
    if (state.activeTab === 'plan') renderPlan();
    if (state.activeTab === 'shopping') renderShoppingList();
    if (state.activeTab === 'cook') renderCookView();
  }

  function setPlanPortions(recipeId, newPortions) {
    const numId = Number(recipeId);
    const item = state.plan.find(p => Number(p.id) === numId);
    if (!item) return;

    item.portions = Math.max(1, Math.min(12, Number(newPortions) || 4));
    saveState();
    updateBadgeCounts();
    renderPlan();
    if (state.activeTab === 'shopping') renderShoppingList();
    if (state.activeTab === 'cook') renderCookView();
  }

  function removeRecipeFromPlan(recipeId) {
    const numId = Number(recipeId);
    const recipe = recipes.find(r => Number(r.recipe_number) === numId);
    state.plan = state.plan.filter(p => Number(p.id) !== numId);
    saveState();
    updateBadgeCounts();
    showToast(`Removed "${recipe ? recipe.title : 'Meal'}" from plan`);
    renderPlan();
    renderRecipes();
    if (state.activeTab === 'shopping') renderShoppingList();
    if (state.activeTab === 'cook') renderCookView();
  }

  function addRandomMealToPlan() {
    const unselected = recipes.filter(r => !state.plan.some(p => Number(p.id) === Number(r.recipe_number)));
    if (unselected.length === 0) {
      showToast('All recipes are already in your plan!');
      return;
    }
    const randomPick = unselected[Math.floor(Math.random() * unselected.length)];
    state.plan.push({ id: Number(randomPick.recipe_number), portions: Number(randomPick.servings) || 4 });
    saveState();
    updateBadgeCounts();
    showToast(`Added random dish: "${randomPick.title}"`);
    renderPlan();
    renderRecipes();
    if (state.activeTab === 'shopping') renderShoppingList();
    if (state.activeTab === 'cook') renderCookView();
  }

  function generateQuickPlan(count = 3) {
    if (!recipes || recipes.length === 0) return;

    const desiredProteins = ['Chicken', 'Beef', 'Vegetarian', 'Fish & Seafood', 'Pork', 'Lamb'];
    const chosen = [];
    const usedIds = new Set();

    for (const prot of desiredProteins) {
      if (chosen.length >= count) break;
      const candidates = recipes.filter(r => r.protein === prot && !usedIds.has(Number(r.recipe_number)));
      if (candidates.length > 0) {
        const pick = candidates[Math.floor(Math.random() * candidates.length)];
        chosen.push(pick);
        usedIds.add(Number(pick.recipe_number));
      }
    }

    while (chosen.length < count && chosen.length < recipes.length) {
      const candidates = recipes.filter(r => !usedIds.has(Number(r.recipe_number)));
      if (candidates.length === 0) break;
      const pick = candidates[Math.floor(Math.random() * candidates.length)];
      chosen.push(pick);
      usedIds.add(Number(pick.recipe_number));
    }

    state.plan = chosen.map(r => ({
      id: Number(r.recipe_number),
      portions: Number(r.servings) || 4
    }));
    state.checkedShopping = {};
    saveState();
    updateBadgeCounts();
    renderRecipes();
    renderPlan();
    switchTab('shopping');
    showToast(`⚡ Generated a 3-meal plan & full shopping list!`);
  }

  function confirmClearPlan() {
    if (state.plan.length === 0) return;
    if (confirm('Are you sure you want to clear your entire weekly meal plan?')) {
      state.plan = [];
      state.checkedShopping = {};
      saveState();
      updateBadgeCounts();
      showToast('Meal plan cleared.');
      renderPlan();
      renderRecipes();
    }
  }

  // --- RENDER MEAL PLAN VIEW ---
  function renderPlan() {
    const planItems = state.plan;
    elements.planItemsList.innerHTML = '';

    if (planItems.length === 0) {
      elements.planEmptyState.hidden = false;
      if (elements.planSummaryCard) elements.planSummaryCard.hidden = true;
      elements.planTotalMeals.textContent = '0';
      elements.planTotalPortions.textContent = '0';
      elements.goToShoppingBtn.disabled = true;
      return;
    }

    elements.planEmptyState.hidden = true;
    if (elements.planSummaryCard) elements.planSummaryCard.hidden = false;
    elements.goToShoppingBtn.disabled = false;

    let totalPortions = 0;
    const fragment = document.createDocumentFragment();

    planItems.forEach(item => {
      const planId = Number(item.id);
      const recipe = recipes.find(r => Number(r.recipe_number) === planId);
      if (!recipe) return;

      totalPortions += item.portions;

      const card = document.createElement('div');
      card.className = 'plan-item-card';
      card.innerHTML = `
        <img src="${recipe.imagePath}" alt="${escapeHtml(recipe.title)}" class="plan-item-img" loading="lazy">
        <div class="plan-item-info">
          <h4 class="plan-item-title">${escapeHtml(recipe.title)}</h4>
          <span class="plan-item-meta">Default: ${recipe.servings} servings | ⏱ ${recipe.overall_time_minutes || 45}m</span>
        </div>
        <div class="portion-stepper" aria-label="Portion stepper">
          <button class="stepper-btn" data-action="decrement" aria-label="Decrease portions">-</button>
          <span class="stepper-val">${item.portions} portions</span>
          <button class="stepper-btn" data-action="increment" aria-label="Increase portions">+</button>
        </div>
        <button class="plan-item-remove-btn" title="Remove meal from plan" aria-label="Remove meal">
          🗑️
        </button>
      `;

      // Stepper button events
      card.querySelector('[data-action="decrement"]').addEventListener('click', () => {
        setPlanPortions(planId, item.portions - 1);
      });
      card.querySelector('[data-action="increment"]').addEventListener('click', () => {
        setPlanPortions(planId, item.portions + 1);
      });
      card.querySelector('.plan-item-remove-btn').addEventListener('click', () => {
        removeRecipeFromPlan(planId);
      });

      fragment.appendChild(card);
    });

    elements.planTotalMeals.textContent = planItems.length;
    elements.planTotalPortions.textContent = totalPortions;
    elements.planItemsList.appendChild(fragment);

    const shoppingItems = calculateAggregatedShopping();
    elements.goToShoppingBtn.innerHTML = `<span>🛒</span> View Shopping List (${shoppingItems.length} items)`;
  }

  // --- SHOPPING LIST AGGREGATION ALGORITHM ---
  function calculateAggregatedShopping() {
    if (!state.plan || state.plan.length === 0) return [];

    const aggregated = new Map(); // key -> { name, quantity, unit, category, recipesUsed: Set }

    state.plan.forEach(planItem => {
      const planId = Number(planItem.id);
      const recipe = recipes.find(r => Number(r.recipe_number) === planId);
      if (!recipe) return;

      const factor = (Number(planItem.portions) || 4) / (recipe.servings || 4);

      // 1. Ingredients
      (recipe.ingredients || []).forEach(ing => {
        if (!ing || !ing.name) return;
        const rawName = ing.name.trim();
        const baseName = normalizeIngredientName(rawName);
        const unit = ing.unit || null;
        let qty = ing.quantity !== null && ing.quantity !== undefined && !isNaN(ing.quantity)
          ? ing.quantity * factor
          : null;

        // Normalize mass (kg to g)
        let normalizedUnit = unit;
        if (unit === 'kg' && qty !== null) {
          qty = qty * 1000;
          normalizedUnit = 'g';
        }

        const mapKey = `${baseName.toLowerCase()}_${normalizedUnit || 'count'}`;

        if (!aggregated.has(mapKey)) {
          aggregated.set(mapKey, {
            key: mapKey,
            name: baseName,
            quantity: qty,
            unit: normalizedUnit,
            category: categorizeGroceryAisle(baseName),
            recipesUsed: new Set([recipe.title])
          });
        } else {
          const entry = aggregated.get(mapKey);
          if (qty !== null) {
            entry.quantity = (entry.quantity || 0) + qty;
          }
          entry.recipesUsed.add(recipe.title);
        }
      });

      // 2. Kitchen staples ("from_your_kitchen")
      (recipe.from_your_kitchen || []).forEach(staple => {
        if (!staple) return;
        const cleanName = staple.trim();
        const mapKey = `staple_${cleanName.toLowerCase()}`;

        if (!aggregated.has(mapKey)) {
          aggregated.set(mapKey, {
            key: mapKey,
            name: cleanName,
            quantity: null,
            unit: null,
            category: 'Pantry Staples (Check at Home)',
            recipesUsed: new Set([recipe.title])
          });
        } else {
          aggregated.get(mapKey).recipesUsed.add(recipe.title);
        }
      });
    });

    // Format quantities back into user friendly units (e.g. 1500g -> 1.5 kg)
    const result = Array.from(aggregated.values()).map(item => {
      let displayQty = '';
      if (item.quantity !== null) {
        if (item.unit === 'g' && item.quantity >= 1000) {
          const kg = item.quantity / 1000;
          displayQty = `${roundNumber(kg, 1)} kg`;
        } else if (item.unit === 'ml' && item.quantity >= 1000) {
          const L = item.quantity / 1000;
          displayQty = `${roundNumber(L, 1)} L`;
        } else if (item.unit) {
          displayQty = `${roundNumber(item.quantity, 1)} ${item.unit}`;
        } else {
          displayQty = `${roundNumber(item.quantity, 1)}`;
        }
      }

      return {
        ...item,
        displayQty,
        recipesUsedList: Array.from(item.recipesUsed)
      };
    });

    // Sort alphabetically within categories
    result.sort((a, b) => a.name.localeCompare(b.name));
    return result;
  }

  const PLURAL_MAP = {
    'apples': 'Apple',
    'avocados': 'Avocado',
    'basa fillets': 'Basa Fillet',
    'carrots': 'Carrot',
    'cashew nuts': 'Cashew Nut',
    'cooked chopped tomatoes': 'Cooked Chopped Tomatoes',
    'corn tortillas': 'Corn Tortilla',
    'fresh chillies': 'Fresh Chilli',
    'garlic cloves': 'Garlic Clove',
    'lemons': 'Lemon',
    'limes': 'Lime',
    'line-caught hake fillets': 'Line-Caught Hake Fillet',
    'onions': 'Onion',
    'pickled jalapeños': 'Pickled Jalapeño',
    'poppadoms': 'Poppadom',
    'rainbow trout fillets': 'Rainbow Trout Fillet',
    'red onions': 'Red Onion',
    'spring onions': 'Spring Onion',
    'tomatoes': 'Tomato',
    'whole wheat rotis': 'Whole Wheat Roti'
  };

  function normalizeIngredientName(name) {
    // Strip common prep prefixes/suffixes while preserving the food noun
    const cleaned = name
      .replace(/\s*\([^)]*\)/g, '') // remove parenthetical notes
      .trim();
    const lower = cleaned.toLowerCase();
    return PLURAL_MAP[lower] || cleaned;
  }

  function categorizeGroceryAisle(name) {
    const l = name.toLowerCase();

    // 1. Meat & Poultry
    if (/beef|steak|fillet|rump|sirloin|mince|schnitzel|biltong|lamb|mutton|pork|bacon|ham|kassler|chorizo|ostrich|venison|duck/.test(l)) {
      return 'Meat & Poultry';
    }
    if (/chicken/.test(l)) {
      return 'Meat & Poultry';
    }

    // 2. Fish & Seafood
    if (/fish|hake|trout|salmon|tuna|yellowtail|dorado|basa|squid|calamari|prawn|seafood|mussel/.test(l)) {
      return 'Fish & Seafood';
    }

    // 3. Dairy & Chilled
    if (/cheese|cheddar|mozzarella|parmesan|feta|halloumi|ricotta|yoghurt|yogurt|cream|crème|butter|milk|egg/.test(l)) {
      return 'Dairy & Chilled';
    }

    // 4. Fresh Produce
    if (/onion|garlic|ginger|chilli|carrot|potato|potatoes|butternut|tomato|tomatoes|spinach|kale|mushroom|pepper|cucumber|avocado|lemon|lime|apple|peas|corn|beans|broccoli|cauliflower|cabbage|slaw|salad|rocket|coriander|parsley|mint|basil|rosemary|thyme|sage|oregano/.test(l)) {
      return 'Fresh Produce';
    }

    // 5. Bakery, Pasta & Grains
    if (/roti|pita|tortilla|wrap|bread|baguette|gnocchi|pasta|spaghetti|tagliatelle|fettuccine|rice|quinoa|couscous|bulgur|noodle/.test(l)) {
      return 'Bakery, Pasta & Grains';
    }

    // 6. Canned Goods & Legumes
    if (/canned|chopped tomatoes|black beans|chickpeas|cannellini|lentils|coconut milk|coconut cream/.test(l)) {
      return 'Canned Goods & Legumes';
    }

    // 7. Nuts & Seeds
    if (/almond|cashew|walnut|peanut|seed|sesame|sunflower|pumpkin/.test(l)) {
      return 'Nuts & Seeds';
    }

    // 8. Oils & Vinegars
    if (/oil|vinegar/.test(l)) {
      return 'Oils & Vinegars';
    }

    // 9. Sauces, Pastes & Condiments
    if (/paste|curry paste|pesto|sauce|marinade|glaze|dressing|mayo|mustard|honey|syrup|tahini|hummus|olives|capers/.test(l)) {
      return 'Sauces, Pastes & Condiments';
    }

    // 10. Spices & Seasonings
    if (/rub|spice|seasoning|powder|masala|cumin|paprika|turmeric|salt|pepper|stock/.test(l)) {
      return 'Spices & Seasonings';
    }

    return 'Pantry & Dry Goods';
  }

  // --- RENDER SHOPPING LIST VIEW ---
  function renderShoppingList() {
    const items = calculateAggregatedShopping();
    elements.shoppingAislesContainer.innerHTML = '';

    if (items.length === 0) {
      elements.shoppingEmptyState.hidden = false;
      if (elements.shoppingProgressWrapper) elements.shoppingProgressWrapper.hidden = true;
      elements.shoppingProgressSummary.textContent = 'Add meals to your plan to generate a list.';
      return;
    }

    elements.shoppingEmptyState.hidden = true;
    if (elements.shoppingProgressWrapper) elements.shoppingProgressWrapper.hidden = false;

    // Calculate progress
    const totalCount = items.length;
    const checkedCount = items.filter(i => state.checkedShopping[i.key]).length;
    const progressPct = totalCount > 0 ? Math.round((checkedCount / totalCount) * 100) : 0;

    elements.shoppingProgressBarFill.style.width = `${progressPct}%`;
    elements.shoppingCheckedCount.textContent = `${checkedCount} of ${totalCount} items checked (${progressPct}%)`;
    elements.shoppingProgressSummary.textContent = `${totalCount - checkedCount} items remaining across ${state.plan.length} planned meals.`;
    elements.hideCheckedToggle.checked = state.hideChecked;

    // Group items by category / aisle
    const grouped = {};
    const categoryOrder = [
      'Fresh Produce',
      'Meat & Poultry',
      'Fish & Seafood',
      'Dairy & Chilled',
      'Bakery, Pasta & Grains',
      'Canned Goods & Legumes',
      'Nuts & Seeds',
      'Oils & Vinegars',
      'Sauces, Pastes & Condiments',
      'Spices & Seasonings',
      'Pantry & Dry Goods',
      'Pantry Staples (Check at Home)'
    ];

    categoryOrder.forEach(cat => { grouped[cat] = []; });
    items.forEach(item => {
      if (!grouped[item.category]) grouped[item.category] = [];
      grouped[item.category].push(item);
    });

    const categoryIcons = {
      'Fresh Produce': '🥦',
      'Meat & Poultry': '🥩',
      'Fish & Seafood': '🐟',
      'Dairy & Chilled': '🧀',
      'Bakery, Pasta & Grains': '🥖',
      'Canned Goods & Legumes': '🥫',
      'Nuts & Seeds': '🥜',
      'Oils & Vinegars': '🫒',
      'Sauces, Pastes & Condiments': '🥣',
      'Spices & Seasonings': '🧂',
      'Pantry & Dry Goods': '📦',
      'Pantry Staples (Check at Home)': '🏠'
    };

    const fragment = document.createDocumentFragment();

    categoryOrder.forEach(categoryName => {
      const aisleItems = grouped[categoryName] || [];
      if (aisleItems.length === 0) return;

      const card = document.createElement('div');
      card.className = 'shopping-aisle-card';

      const icon = categoryIcons[categoryName] || '🛒';
      const aisleCheckedCount = aisleItems.filter(i => state.checkedShopping[i.key]).length;

      card.innerHTML = `
        <div class="aisle-header">
          <span class="aisle-title">${icon} ${escapeHtml(categoryName)}</span>
          <span class="aisle-count-badge">${aisleCheckedCount}/${aisleItems.length}</span>
        </div>
        <ul class="shopping-items-list"></ul>
      `;

      const listEl = card.querySelector('.shopping-items-list');

      aisleItems.forEach(item => {
        const isChecked = Boolean(state.checkedShopping[item.key]);
        if (state.hideChecked && isChecked) return;

        const li = document.createElement('li');
        li.className = `shopping-item ${isChecked ? 'checked' : ''}`;
        li.setAttribute('data-key', item.key);

        li.innerHTML = `
          <div class="shopping-checkbox" aria-hidden="true"></div>
          <div class="shopping-item-content">
            <span class="shopping-item-name">${escapeHtml(item.name)}</span>
            <div class="shopping-item-used-in">For: ${escapeHtml(item.recipesUsedList.join(', '))}</div>
          </div>
          ${item.displayQty ? `<span class="shopping-item-qty">${escapeHtml(item.displayQty)}</span>` : ''}
        `;

        li.addEventListener('click', () => toggleShoppingItem(item.key));
        listEl.appendChild(li);
      });

      // If all items hidden in this category
      if (listEl.children.length > 0) {
        fragment.appendChild(card);
      }
    });

    elements.shoppingAislesContainer.appendChild(fragment);
  }

  function toggleShoppingItem(key) {
    state.checkedShopping[key] = !state.checkedShopping[key];
    saveState();
    updateBadgeCounts();
    renderShoppingList();
  }

  function uncheckAllShoppingItems() {
    state.checkedShopping = {};
    saveState();
    updateBadgeCounts();
    renderShoppingList();
    showToast('Unchecked all shopping items.');
  }

  async function copyShoppingListToClipboard() {
    const items = calculateAggregatedShopping();
    if (items.length === 0) return;

    let text = `🛒 MEALPLAN GROCERY LIST (${state.plan.length} Planned Meals)\n`;
    text += `=========================================\n\n`;

    // Group by category
    const grouped = {};
    items.forEach(i => {
      if (!grouped[i.category]) grouped[i.category] = [];
      grouped[i.category].push(i);
    });

    for (const [cat, catItems] of Object.entries(grouped)) {
      text += `--- ${cat.toUpperCase()} ---\n`;
      catItems.forEach(i => {
        const mark = state.checkedShopping[i.key] ? '[x]' : '[ ]';
        const qtyStr = i.displayQty ? ` - ${i.displayQty}` : '';
        text += `${mark} ${i.name}${qtyStr}\n`;
      });
      text += `\n`;
    }

    await copyTextToClipboard(text, null, 'Shopping list copied to clipboard!');
  }

  // --- CLIPBOARD & AI VOICE COOK PROMPT GENERATOR ---
  async function copyTextToClipboard(text, feedbackBtn = null, successToast = 'Copied to clipboard!') {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        textarea.style.top = '-9999px';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand('copy');
        textarea.remove();
      }

      if (feedbackBtn) {
        const textEl = feedbackBtn.querySelector('.voice-prompt-text');
        const iconEl = feedbackBtn.querySelector('.voice-prompt-icon');
        const origText = textEl ? textEl.textContent : feedbackBtn.textContent;
        const origIcon = iconEl ? iconEl.textContent : '';

        feedbackBtn.classList.add('copied');
        if (textEl) textEl.textContent = 'Copied to Clipboard!';
        if (iconEl) iconEl.textContent = '✓';

        setTimeout(() => {
          feedbackBtn.classList.remove('copied');
          if (textEl) textEl.textContent = origText;
          if (iconEl) iconEl.textContent = origIcon;
        }, 2500);
      }

      if (successToast) {
        showToast(successToast);
      }
      return true;
    } catch (err) {
      console.warn('Clipboard write failed:', err);
      showToast('Please copy manually (Clipboard blocked)');
      return false;
    }
  }

  function generateAiVoicePrompt(recipe, portions) {
    const baseServings = recipe.servings || 4;
    const factor = (Number(portions) || 4) / baseServings;

    const scaledIngredients = (recipe.ingredients || []).map(ing => {
      let line = '';
      if (ing.quantity !== null && ing.quantity !== undefined && !isNaN(ing.quantity)) {
        const scaled = roundNumber(ing.quantity * factor, 1);
        line = `${scaled} ${ing.unit || ''} ${ing.name}`.trim();
      } else {
        line = ing.name;
      }
      if (ing.prep) line += ` (${ing.prep})`;
      return `- ${line}`;
    }).join('\n');

    const staples = (recipe.from_your_kitchen && recipe.from_your_kitchen.length)
      ? recipe.from_your_kitchen.map(s => `- ${s}`).join('\n')
      : '- Standard kitchen staples (oil, salt, pepper, water)';

    const instructions = (recipe.instructions || []).map(s => {
      const heading = s.title ? ` [${s.title}]` : '';
      return `Step ${s.step}${heading}:\n${s.text || ''}`;
    }).join('\n\n');

    const chefTip = recipe.chef_tip ? `\n\n### CHEF TIP:\n${recipe.chef_tip}` : '';

    return `# Voice Cooking Assistant Prompt: ${recipe.title}

You are my interactive, hands-free voice sous-chef and step-by-step cooking guide. I am about to cook "${recipe.title}" in my kitchen right now using your voice chat mode. My hands will be busy with chopping, stirring, and handling food, so please follow these voice-guidance rules:

### VOICE ASSISTANT INSTRUCTIONS:
1. **Interactive Step-by-Step Pace:** Do NOT recite the entire recipe at once. We will cook together one step at a time.
2. **Start with Mise en Place:** First, briefly tell me what ingredients and cookware/utensils to gather on my countertop. Then ask: "Let me know when you have everything ready, and we will begin Step 1!"
3. **Wait for Confirmation:** Only move to the next cooking step when I say "Next", "Done", "What's next?", or confirm that the current step is completed.
4. **Kitchen-Friendly Speech:** Keep your spoken responses concise, direct, and easy to understand over sizzling pans and kitchen background noise. Avoid long walls of text.
5. **Timers & Heat Cues:** When a step involves cooking time (e.g. simmer for 15 minutes) or a sensory cue (e.g. "until fragrant" or "golden brown"), call it out clearly and offer to help keep track of time.
6. **Substitutions & Help:** If I ask questions or need emergency ingredient substitutions, provide quick, practical culinary advice, then return smoothly to the active step.
7. **Tone:** Keep a warm, encouraging, professional chef demeanor throughout.

---

### RECIPE SPECIFICATIONS:
- **Recipe:** ${recipe.title}
- **Subtitle:** ${recipe.subtitle || 'N/A'}
- **Planned Portions:** ${portions} portions (scaled from base ${baseServings} servings)
- **Total Cooking Time:** ${recipe.overall_time_minutes || 45} minutes
- **Chef / Cuisine:** ${recipe.chef || 'Chef'}

### SCALED INGREDIENTS (${portions} PORTIONS):
${scaledIngredients}

### FROM YOUR KITCHEN (PANTRY STAPLES):
${staples}

### COOKING METHOD:
${instructions}${chefTip}

---
Please start now by greeting me, introducing the dish and portion count, and telling me what key ingredients and equipment to lay out. Then ask if I am ready for Step 1!`;
  }

  // --- RENDER COOK & PRINT VIEW ---
  function renderCookView() {
    elements.printableArea.innerHTML = '';

    if (state.plan.length === 0) {
      elements.cookEmptyState.hidden = false;
      return;
    }

    elements.cookEmptyState.hidden = true;
    const fragment = document.createDocumentFragment();

    state.plan.forEach(planItem => {
      const planId = Number(planItem.id);
      const recipe = recipes.find(r => Number(r.recipe_number) === planId);
      if (!recipe) return;

      const factor = (Number(planItem.portions) || 4) / (recipe.servings || 4);
      const card = document.createElement('article');
      card.className = 'cook-recipe-card';

      // Ingredients list
      const scaledIngredients = (recipe.ingredients || []).map(ing => {
        let display = '';
        if (ing.quantity !== null && ing.quantity !== undefined) {
          const scaled = ing.quantity * factor;
          display = `${roundNumber(scaled, 1)} ${ing.unit || ''} ${ing.name}`;
        } else {
          display = ing.name;
        }
        if (ing.prep) display += ` (${ing.prep})`;
        return display;
      });

      // Steps list
      const stepsHtml = (recipe.instructions || []).map(s => `
        <li class="cook-step-item">
          <span class="step-num">${s.step}</span>
          <div class="step-heading">${escapeHtml(s.title || '')}</div>
          <p class="step-body">${escapeHtml(s.text || '')}</p>
        </li>
      `).join('');

      card.innerHTML = `
        <div class="cook-header-row">
          <img src="${recipe.imagePath}" alt="${escapeHtml(recipe.title)}" class="cook-dish-img" loading="lazy">
          <div>
            <h3 class="cook-title">${escapeHtml(recipe.title)}</h3>
            <p class="cook-subtitle">${escapeHtml(recipe.subtitle || '')}</p>
            <div class="cook-meta-chips">
              <span class="cook-meta-tag">🍽️ Scaled to: <strong>${planItem.portions} portions</strong></span>
              <span class="cook-meta-tag">⏱ Total Time: ${recipe.overall_time_minutes || 45} mins</span>
              <span class="cook-meta-tag">👨‍🍳 By ${escapeHtml(recipe.chef || 'Chef')}</span>
              <button class="btn-voice-prompt print-hide" data-action="copy-ai-prompt" data-id="${planId}" title="Copy hands-free AI voice cooking prompt for Gemini or ChatGPT">
                <span class="voice-prompt-icon">🎙️</span>
                <span class="voice-prompt-text">Copy AI Voice Cooking Prompt</span>
              </button>
            </div>
          </div>
        </div>

        <div class="cook-columns">
          <div class="cook-ingredients-box">
            <h4 class="cook-box-title">Ingredients (${planItem.portions} portions)</h4>
            <ul class="cook-ingredients-list">
              ${scaledIngredients.map(ing => `<li>${escapeHtml(ing)}</li>`).join('')}
            </ul>

            ${(recipe.from_your_kitchen && recipe.from_your_kitchen.length) ? `
              <h4 class="cook-box-title" style="margin-top: 14px;">From Your Kitchen</h4>
              <ul class="cook-ingredients-list">
                ${recipe.from_your_kitchen.map(k => `<li>${escapeHtml(k)}</li>`).join('')}
              </ul>
            ` : ''}
          </div>

          <div class="cook-instructions-box">
            <h4 class="cook-box-title">Cooking Instructions</h4>
            <ol class="cook-steps-list">
              ${stepsHtml}
            </ol>
            ${recipe.chef_tip ? `
              <div class="cook-chef-tip">
                <strong>💡 Chef's Tip:</strong> ${escapeHtml(recipe.chef_tip)}
              </div>
            ` : ''}
          </div>
        </div>
      `;

      // Voice prompt button event
      const voiceBtn = card.querySelector('[data-action="copy-ai-prompt"]');
      if (voiceBtn) {
        voiceBtn.addEventListener('click', () => {
          const promptText = generateAiVoicePrompt(recipe, planItem.portions);
          copyTextToClipboard(
            promptText,
            voiceBtn,
            `Copied AI voice prompt for "${recipe.title}"! Paste into Gemini or ChatGPT.`
          );
        });
      }

      fragment.appendChild(card);
    });

    elements.printableArea.appendChild(fragment);
  }

  // --- SCREEN WAKE LOCK API ---
  async function toggleScreenWakeLock() {
    if (!('wakeLock' in navigator)) {
      showToast('Screen Wake Lock is not supported on this browser.');
      return;
    }

    if (isWakeLockRequested && wakeLockSentinel !== null) {
      // Release
      try {
        isWakeLockRequested = false;
        await wakeLockSentinel.release();
        wakeLockSentinel = null;
        updateWakeLockUI(false);
        showToast('Screen Wake Lock disabled');
      } catch (e) {
        console.warn('Error releasing wake lock:', e);
      }
    } else {
      // Acquire
      try {
        isWakeLockRequested = true;
        wakeLockSentinel = await navigator.wakeLock.request('screen');
        updateWakeLockUI(true);
        showToast('Screen will stay awake while cooking!');
        wakeLockSentinel.addEventListener('release', () => {
          wakeLockSentinel = null;
          if (!isWakeLockRequested) {
            updateWakeLockUI(false);
          }
        });
      } catch (err) {
        isWakeLockRequested = false;
        console.warn('Wake Lock request failed:', err);
        showToast('Could not activate screen wake lock.');
      }
    }
  }

  function updateWakeLockUI(active) {
    if (active) {
      elements.wakeLockIcon.textContent = '🔆';
      elements.wakeLockText.textContent = 'Screen Awake: ACTIVE';
      elements.wakeLockBtn.classList.add('active-wake-lock');
    } else {
      elements.wakeLockIcon.textContent = '💡';
      elements.wakeLockText.textContent = 'Keep Screen Awake';
      elements.wakeLockBtn.classList.remove('active-wake-lock');
    }
  }

  // --- RECIPE DETAIL MODAL ---
  function openRecipeModal(recipe) {
    const recipeId = Number(recipe.recipe_number);
    const isPlanned = state.plan.some(p => Number(p.id) === recipeId);
    const planItem = state.plan.find(p => Number(p.id) === recipeId);
    const portions = planItem ? planItem.portions : (Number(recipe.servings) || 4);

    const n = recipe.nutrition_per_100g || {};

    elements.modalContent.innerHTML = `
      <div class="modal-hero">
        <img src="${recipe.imagePath}" alt="${escapeHtml(recipe.title)}" class="modal-hero-img">
      </div>
      <div class="modal-body">
        <h2 id="modalTitle" class="modal-title">${escapeHtml(recipe.title)}</h2>
        <p class="modal-subtitle">${escapeHtml(recipe.subtitle || recipe.description || '')}</p>

        <div style="display: flex; gap: 8px; margin-bottom: 14px; flex-wrap: wrap;">
          <span class="badge badge-protein">${escapeHtml(recipe.protein)}</span>
          <span class="badge badge-time">⏱ ${recipe.overall_time_minutes || 45} mins</span>
          <span class="badge" style="background: var(--bg-subtle); color: var(--text);">👨‍🍳 ${escapeHtml(recipe.chef || 'Chef')}</span>
        </div>

        <!-- Nutrition Grid per 100g -->
        <h4 style="font-size: 0.85rem; text-transform: uppercase; color: var(--text-muted); margin-bottom: 6px;">Nutrition per 100g</h4>
        <div class="modal-nutrition-grid">
          <div class="nutr-item">
            <span class="nutr-val">${n.energy_kcal || 0}</span>
            <span class="nutr-name">kcal</span>
          </div>
          <div class="nutr-item">
            <span class="nutr-val">${n.protein_g || 0}g</span>
            <span class="nutr-name">Protein</span>
          </div>
          <div class="nutr-item">
            <span class="nutr-val">${n.carbs_g || 0}g</span>
            <span class="nutr-name">Carbs</span>
          </div>
          <div class="nutr-item">
            <span class="nutr-val">${n.fat_g || 0}g</span>
            <span class="nutr-name">Fat</span>
          </div>
        </div>

        ${recipe.allergens && recipe.allergens.length ? `
          <div style="margin-bottom: 16px; font-size: 0.82rem; color: var(--text-muted);">
            <strong>Allergens:</strong> ${escapeHtml(recipe.allergens.join(', '))}
          </div>
        ` : ''}

        <div style="margin-bottom: 20px;">
          <button id="modalPlanToggleBtn" class="primary-btn" style="width: 100%;">
            ${isPlanned ? '✓ In Meal Plan (Tap to Remove)' : '+ Add to Active Meal Plan'}
          </button>
        </div>

        <h3 style="font-size: 1.1rem; font-weight: 700; margin-bottom: 8px; color: var(--primary);">Ingredients (${recipe.servings} Servings)</h3>
        <ul style="list-style: none; margin-bottom: 20px; font-size: 0.9rem;">
          ${(recipe.ingredients || []).map(i => `
            <li style="padding: 6px 0; border-bottom: 1px solid var(--border-subtle); display: flex; justify-content: space-between;">
              <span>${escapeHtml(i.name)} ${i.prep ? `<em style="color: var(--text-light);">(${escapeHtml(i.prep)})</em>` : ''}</span>
              <strong style="color: var(--primary);">${i.quantity !== null ? i.quantity : ''} ${i.unit || ''}</strong>
            </li>
          `).join('')}
        </ul>

        <h3 style="font-size: 1.1rem; font-weight: 700; margin-bottom: 8px; color: var(--primary);">Method</h3>
        <ol class="cook-steps-list">
          ${(recipe.instructions || []).map(s => `
            <li class="cook-step-item">
              <span class="step-num">${s.step}</span>
              <div class="step-heading">${escapeHtml(s.title || '')}</div>
              <p class="step-body">${escapeHtml(s.text || '')}</p>
            </li>
          `).join('')}
        </ol>

        ${recipe.chef_tip ? `
          <div class="cook-chef-tip" style="margin-top: 18px;">
            <strong>💡 Chef Tip:</strong> ${escapeHtml(recipe.chef_tip)}
          </div>
        ` : ''}
      </div>
    `;

    const modalBtn = document.getElementById('modalPlanToggleBtn');
    if (modalBtn) {
      modalBtn.onclick = () => {
        toggleRecipeInPlan(recipeId);
        closeModal();
      };
    }

    elements.recipeModal.hidden = false;
    elements.recipeModal.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    elements.recipeModal.hidden = true;
    elements.recipeModal.classList.remove('open');
    document.body.style.overflow = '';
  }

  // --- HELPERS ---
  function renderAll() {
    updateBadgeCounts();
    switchTab(state.activeTab || 'recipes');
    renderRecipes();
  }

  function roundNumber(num, decimals = 1) {
    if (num === null || num === undefined) return '';
    const mult = Math.pow(10, decimals);
    return Math.round(num * mult) / mult;
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  let toastTimer = null;
  function showToast(message) {
    if (toastTimer) clearTimeout(toastTimer);
    elements.toast.textContent = message;
    elements.toast.hidden = false;
    toastTimer = setTimeout(() => {
      elements.toast.hidden = true;
    }, 2800);
  }

  // --- START THE APP ---
  document.addEventListener('DOMContentLoaded', init);
})();
