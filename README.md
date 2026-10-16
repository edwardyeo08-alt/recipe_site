# 🍽️ MealPlan - Recipe & Shopping Planner (PWA)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Platform](https://img.shields.io/badge/Platform-Progressive%20Web%20App-orange.svg)](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
[![Hosting](https://img.shields.io/badge/Deploy-Cloudflare%20Workers%20Static%20Assets-F38020?logo=cloudflare&logoColor=white)](https://developers.cloudflare.com/workers/)
[![Recipes](https://img.shields.io/badge/Recipes-247%20Dishes-2A7E4F.svg)](#dataset-and-data-structures)
[![Offline Ready](https://img.shields.io/badge/Offline%20Mode-Service%20Worker%20Active-blue.svg)](#offline-and-pwa-architecture)

**MealPlan** is a mobile-first, high-performance Progressive Web Application (PWA) designed for weekly meal planning, dynamic portion scaling, aggregated supermarket grocery lists organized by store aisle, and kitchen cooking mode with screen wake-lock support.

Built with **Vanilla JavaScript (ES6+)**, **semantic HTML5**, and **pure CSS3**, MealPlan runs entirely on the client with zero external runtime dependencies, full offline support, and local storage persistence.

---

## 📑 Table of Contents

- [Key Features](#-key-features)
- [Architecture & Tech Stack](#-architecture--tech-stack)
- [Project Directory Structure](#-project-directory-structure)
- [Dataset & Data Structures](#-dataset--data-structures)
  - [Recipe Schema (`all_recipes.json`)](#recipe-schema-all_recipesjson)
  - [Nutritional Database (`ingredients_nutrition.json` & `.csv`)](#nutritional-database-ingredients_nutritionjson--csv)
  - [Client State (`localStorage`)](#client-state-localstorage)
- [Getting Started & Local Development](#-getting-started--local-development)
  - [Prerequisites](#prerequisites)
  - [Running the Dev Server](#running-the-dev-server)
  - [Running Tests & Audits](#running-tests--audits)
- [Deployment (Cloudflare Workers)](#-deployment-cloudflare-workers)
- [Maintenance & Data Tooling](#-maintenance--data-tooling)
- [Codebase Audit & Discovered Flaws](#-codebase-audit--discovered-flaws)
  - [1. Protein Classification Regex Ordering & `fillet` Capture](#1-protein-classification-regex-ordering--fillet-capture)
  - [2. Missing Word Boundaries Causing False Meat Matches](#2-missing-word-boundaries-causing-false-meat-matches)
  - [3. Screen Wake Lock State Drop on Visibility Change](#3-screen-wake-lock-state-drop-on-visibility-change)
  - [4. Print Stylesheet Desynchronization with Lazy Render](#4-print-stylesheet-desynchronization-with-lazy-render)
  - [5. Singular vs. Plural Duplication in Shopping List](#5-singular-vs-plural-duplication-in-shopping-list)
  - [6. Service Worker Pre-Caching Gaps & SWR Undefined Fallback](#6-service-worker-pre-caching-gaps--swr-undefined-fallback)
  - [7. Wrangler Static Asset Upload Scope](#7-wrangler-static-asset-upload-scope)
- [License](#-license)

---

## ✨ Key Features

### 🍲 1. Recipe Catalog & Instant Search
- **247 Chef-Crafted Recipes:** Complete with dish photography, prep/cook times, chef tips, allergens, and nutritional profiles per 100g.
- **Client-Side Search Corpus:** Sub-millisecond full-text search indexing title, subtitle, chef, category, protein classification, and all ingredient names.
- **Multi-Dimensional Filtering:**
  - **Protein / Diet Filter Chips:** All, Beef, Chicken, Lamb, Pork, Fish & Seafood, Game, Vegetarian.
  - **Cooking Time Quick-Filters:** $\le$ 30 mins, $\le$ 45 mins.
  - **Category Pills:** Carb Conscious, Easy Peasy, Fan Faves, Health Nut.
- **Sort Options:** Default order, Quickest first, Longest first, Alphabetical (A-Z).
- **Interactive Recipe Modal:** Detailed ingredients breakdown, step-by-step instructions, allergens, and nutrition cards.

### 📅 2. Active Weekly Meal Planner
- **Custom Servings Stepper:** Increment or decrement portions (from 1 up to 12 servings) independently for every planned dish.
- **Proportional Ingredient Scaling:** Automatically adjusts raw ingredient quantities based on the ratio:
  $$\text{Scaling Factor} = \frac{\text{Selected Portions}}{\text{Recipe Base Servings}}$$
- **⚡ 1-Tap 3-Meal Dinner Plan:** Algorithmic planner that automatically selects 3 distinct dishes balancing different protein types.
- **🎲 "Surprise Me":** One-click random dish adder to discover new recipes.

### 🛒 3. Aggregated Supermarket Shopping List
- **Cross-Recipe Ingredient Combining:** Sums identical ingredients across all planned meals with portion scaling applied.
- **Automatic Unit Normalization:** Automatically converts mass units (e.g. `kg` to `g`), merges totals, and formats readable consumer units (e.g. `1800 g` $\rightarrow$ `1.8 kg`, `1500 ml` $\rightarrow$ `1.5 L`).
- **12 Grocery Aisle Departments:** Categorizes combined items into logical supermarket aisles:
  1. 🥦 Fresh Produce
  2. 🥩 Meat & Poultry
  3. 🐟 Fish & Seafood
  4. 🧀 Dairy & Chilled
  5. 🥖 Bakery, Pasta & Grains
  6. 🥫 Canned Goods & Legumes
  7. 🥜 Nuts & Seeds
  8. 🫒 Oils & Vinegars
  9. 🥣 Sauces, Pastes & Condiments
  10. 🧂 Spices & Seasonings
  11. 📦 Pantry & Dry Goods
  12. 🏠 Pantry Staples (Check at Home)
- **Check-off Tracking:** Interactive checklist with progress bar, completion percentage, and remaining item badges.
- **"Hide Checked" Mode:** Clean up the screen while walking through supermarket aisles.
- **Clipboard Export:** 1-tap formatted text export (`[x]` and `[ ]` markdown checklists) for messaging apps or printing.

### 🍳 4. Cook & Print Kitchen Mode
- **Cooking View:** Clean layout showing scaled ingredients lists alongside ordered, numbered cooking steps.
- **🎙️ AI Voice Cooking Assistant Prompt:** 1-tap clipboard generator on each recipe card that produces a structured prompt for Gemini, ChatGPT, or Claude with full scaled quantities, pantry staples, instructions, and interactive hands-free voice guidance rules.
- **Screen Wake Lock API:** Native browser integration (`navigator.wakeLock.request('screen')`) with automatic re-acquisition on tab visibility changes to keep device screens awake while cooking.
- **Print & PDF Generation:** Responsive `@media print` stylesheet supporting both physical recipe cards (Cook tab) and supermarket checklists (Shopping tab) with clean page breaks.

### 📡 5. Offline Grocery PWA
- **Service Worker (`sw.js`):** Offline-first architecture with cache-first strategy for dish images and stale-while-revalidate for the application shell and dataset.
- **PWA Manifest:** Installable to mobile and desktop home screens with custom maskable icons and brand theme colors.
- **Offline Grocery Mode Banner:** Live detection of network status with automatic banner alerting user when working offline.
- **Full State Persistence:** Planner selections, portion counts, checked shopping items, filter preferences, and theme choices are preserved in `localStorage`.

### 🌓 6. Mobile-First Theming
- Native dark and light theme toggle with system preference detection (`prefers-color-scheme`).
- Complete HSL and hex variable design system with high-contrast text and accessible touch targets ($\ge 44\text{px}$).

---

## 🏗 Architecture & Tech Stack

```
┌─────────────────────────────────────────────────────────────┐
│                       Client Browser                        │
│                                                             │
│   ┌──────────────┐   ┌──────────────┐   ┌───────────────┐   │
│   │  index.html  │   │  style.css   │   │    app.js     │   │
│   │ (Semantic UI)│   │ (Design Sys) │   │ (State & DOM) │   │
│   └──────────────┘   └──────────────┘   └───────┬───────┘   │
│                                                 │           │
│                         ┌───────────────────────┴──────┐    │
│                         │        LocalStorage          │    │
│                         │   (mealplan_state_v1)        │    │
│                         └──────────────────────────────┘    │
│                                                             │
│   ┌─────────────────────────────────────────────────────┐   │
│   │             Service Worker (sw.js)                  │   │
│   │  - Cache-first for images (*.jpg, *.png)            │   │
│   │  - Stale-while-revalidate for app shell & dataset   │   │
│   └──────────────────────────┬──────────────────────────┘   │
└──────────────────────────────┼──────────────────────────────┘
                               │ Fetch / HTTP
                               ▼
┌─────────────────────────────────────────────────────────────┐
│            Cloudflare Workers Static Assets                 │
│         (or scripts/server.js local development)            │
│                                                             │
│  - all_recipes.json (192 dishes, ~1 MB)                     │
│  - recipe_XX_dish.jpg (Optimized 640px JPEG images)         │
│  - manifest.webmanifest & PWA Icons                         │
└─────────────────────────────────────────────────────────────┘
```

| Layer | Technology | Rationale |
|---|---|---|
| **Structure** | Semantic HTML5 | Fast initial render, accessible landmarks, zero compile step. |
| **Styling** | Vanilla CSS3 (Custom Properties) | Ultra-lightweight, native dark mode support, zero build overhead. |
| **Logic** | Vanilla ES6+ JavaScript | Strict IIFE module, zero client frameworks, instantaneous reactivity. |
| **Persistence** | Web Storage API (`localStorage`) | Persistent offline state across page reloads and sessions. |
| **Offline / PWA** | Service Worker Cache API & Manifest | 100% functional grocery planning and shopping without an active internet connection. |
| **Screen Management** | Screen Wake Lock API | Keeps smartphone screens active on kitchen countertops. |
| **Deployment** | Cloudflare Workers Static Assets | Global edge delivery, zero cold start latency for static assets. |

---

## 📁 Project Directory Structure

```text
├── .assetsignore                    # Static asset ignore rules for Wrangler deployments
├── .gitignore                       # Git ignore list (node_modules, .wrangler, test files)
├── LICENSE                          # MIT open-source license
├── README.md                        # Project documentation and specifications
├── app.js                           # Core frontend application logic and state controller
├── index.html                       # Single-page application markup and semantic views
├── manifest.webmanifest             # Web application manifest for PWA installation
├── style.css                        # Mobile-first stylesheet, design tokens, and dark theme
├── sw.js                            # Service Worker offline cache controller
├── wrangler.jsonc                   # Cloudflare Workers configuration file
│
├── extracted recipes/               # Comprehensive recipe and nutritional dataset
│   ├── all_recipes.json             # Master database of all 192 recipes (consolidated)
│   ├── ingredients_nutrition.csv    # Tabular nutritional database of 509 ingredients
│   ├── ingredients_nutrition.json   # Machine-readable nutritional database
│   ├── recipes_summary.csv          # Metadata summary of the 192 recipes
│   ├── recipe_01.json ... 192.json  # Individual raw recipe JSON extractions
│   └── recipe_01_dish.jpg ... 192   # High-resolution 640px optimized dish photography
│
├── icons/                           # PWA Application icons
│   ├── icon.svg                     # Vector app icon (plate & cloche motif)
│   ├── icon-192.png                 # 192x192 PNG icon for mobile home screen
│   └── icon-512.png                 # 512x512 PNG splash screen icon
│
└── scripts/                         # Testing, auditing, and data processing tooling
    ├── all_ingredients.json         # Raw inventory of extracted ingredient occurrences
    ├── audit_dom.js                 # DOM reference auditor (verifies element ID binding)
    ├── fix_obscured_recipes.js      # Nutrition repair tool for obscured recipe cards
    ├── generate_icons.ps1           # PowerShell icon generator (System.Drawing)
    ├── generate_nutrition_sheet.js  # USDA nutritional profile compiler (509 ingredients)
    ├── resize_all_images.ps1        # Batch image optimization script (640px JPEG 75%)
    ├── server.js                    # Zero-dependency local Node.js HTTP server (port 8085)
    ├── test_app_logic.js            # Unit test suite verifying dataset integrity and math
    ├── test_http_endpoints.js       # HTTP endpoint availability tester
    ├── test_quick_plan.js           # Unit test for 1-tap 3-meal plan generation
    ├── test_resize_one.ps1          # Image compression test script
    └── test_shopping_full.js        # Unit test for ingredient aggregation and unit scaling
```

---

## 📊 Dataset & Data Structures

### Recipe Schema (`all_recipes.json`)
The application consumes a master JSON object containing an array of 192 recipe entries under `recipes`:

```json
{
  "recipe_number": 1,
  "title": "Vibey Durban Lamb Curry",
  "subtitle": "with basmati rice, crispy poppadoms & a fresh tomato sambal",
  "chef": "Chef Name",
  "category": "Curry",
  "servings": 4,
  "overall_time_minutes": 45,
  "allergens": ["Gluten", "Dairy"],
  "ingredients": [
    {
      "name": "Free-Range Deboned Lamb Leg",
      "quantity": 640,
      "unit": "g",
      "prep": "cut into bite-sized pieces"
    },
    {
      "name": "Baby Potatoes",
      "quantity": 1,
      "unit": "kg",
      "prep": "rinsed & quartered"
    }
  ],
  "from_your_kitchen": [
    "Cooking Oil",
    "Salt & Black Pepper",
    "Water"
  ],
  "instructions": [
    {
      "step": 1,
      "title": "Prep the veg",
      "text": "Place a pot of salted water on high heat for the potatoes..."
    }
  ],
  "chef_tip": "For extra depth of flavour, toast the whole spices before grinding.",
  "nutrition_per_100g": {
    "energy_kcal": 142.5,
    "energy_kj": 596.2,
    "protein_g": 9.4,
    "fat_g": 6.8,
    "carbs_g": 11.2,
    "sugars_g": 2.1,
    "fibre_g": 1.8,
    "sodium_mg": 280
  },
  "card_obscured_flag": false
}
```

### Nutritional Database (`ingredients_nutrition.json` & `.csv`)
Maintains comprehensive nutritional data across **509 unique ingredients**, mapped against USDA FoodData Central profiles:
- `name` & `category`
- `energy_kcal` and `energy_kj` per 100g
- `protein_g`, `fat_g`, `saturated_fat_g`, `carbs_g`, `sugars_g`, `fibre_g`, `sodium_mg`
- `density_g_per_ml` (for volume-to-mass conversions of liquids)
- `piece_weight_g` (for single-item estimations when quantity is count-based)

### Client State (`localStorage`)
The state is stored in `mealplan_state_v1`:

```json
{
  "plan": [
    { "id": 1, "portions": 4 },
    { "id": 42, "portions": 2 }
  ],
  "checkedShopping": {
    "baby potatoes_g": true,
    "staple_cooking oil": false
  },
  "hideChecked": false,
  "activeTab": "recipes",
  "theme": "light"
}
```

---

## 🚀 Getting Started & Local Development

### Prerequisites
- Node.js (version 16 or newer recommended)
- Modern web browser (Chrome, Edge, Safari, Firefox)
- PowerShell (optional, required only for running `.ps1` asset generation scripts)

### Running the Dev Server
The project includes a built-in zero-dependency local HTTP development server:

```bash
node scripts/server.js
```

Open your browser at:
```
http://127.0.0.1:8085/
```

### Running Tests & Audits
The project includes automated validation suites for logic, DOM binding, and HTTP endpoints:

```bash
# 1. Dataset integrity, protein classification, and portion scaling math
node scripts/test_app_logic.js

# 2. Shopping list ingredient aggregation and unit conversion
node scripts/test_shopping_full.js

# 3. Quick 3-meal plan generation algorithm
node scripts/test_quick_plan.js

# 4. DOM element binding audit (verifies all app.js IDs exist in index.html)
node scripts/audit_dom.js

# 5. HTTP endpoints availability test (requires dev server running on port 8085)
node scripts/test_http_endpoints.js
```

---

## ☁️ Deployment (Cloudflare Workers)

The site is configured for zero-cold-start edge hosting via **Cloudflare Workers Static Assets** (`wrangler.jsonc`):

```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "recipe-site",
  "compatibility_date": "2026-10-01",
  "observability": {
    "enabled": true
  },
  "assets": {
    "directory": "."
  }
}
```

### Deploy with Wrangler:
```bash
npx wrangler deploy
```

Static asset upload rules are governed by `.assetsignore`, ensuring dev scripts, documentation, and source control metadata are omitted from production assets.

---

## 🛠 Maintenance & Data Tooling

| Script | Language | Purpose |
|---|---|---|
| `scripts/resize_all_images.ps1` | PowerShell | Batch resizes raw dish photos to max 640px with 75% JPEG quality, reducing asset payload by over 60%. |
| `scripts/generate_icons.ps1` | PowerShell | Renders 192px and 512px PWA icons using .NET `System.Drawing`. |
| `scripts/generate_nutrition_sheet.js` | Node.js | Compiles and exports the 509-ingredient USDA nutritional database to JSON and CSV. |
| `scripts/fix_obscured_recipes.js` | Node.js | Reconstructs missing macronutrient values on obscured recipe cards using ingredient mass weighting and Atwater caloric balance. |

---

## 🔍 Codebase Audit & Implemented Fixes

During a comprehensive code and architecture audit of the repository, the following issues were identified and have now been fully resolved:

---

### 1. Protein Classification Regex Ordering & `fillet` Capture ✅ (FIXED)
- **Location:** [`app.js`](file:///c:/Users/edward.yeo/OneDrive%20-%20MK%20Aerospace%20%28Pty%29%20Ltd/Desktop/personal/recipe%20site/app.js#L204-L245) (`enrichRecipe`)
- **Previous Issue:** Generic `fillet` in the beef regex ran first, causing 26 Fish & Seafood dishes (Hake, Trout), 8 Chicken dishes, and Pork/Ostrich Fillets to be misclassified as Beef.
- **Resolution:** Implemented title-first protein inspection followed by ingredient matching that excludes broths and stocks. Specific proteins (Fish & Seafood, Chicken, Lamb, Pork, Game) are evaluated before generic beef terms.

---

### 2. Missing Word Boundaries on Meat Tokens ✅ (FIXED)
- **Location:** [`app.js`](file:///c:/Users/edward.yeo/OneDrive%20-%20MK%20Aerospace%20%28Pty%29%20Ltd/Desktop/personal/recipe%20site/app.js#L215) (`enrichRecipe`)
- **Previous Issue:** Substring match on `ham` caused Recipe 147 (*"Vibrant Vegetable Crumble"*) to be classified as Pork due to `"DIY béchamel"`.
- **Resolution:** Added word boundaries (`\bham\b`) and explicit category precedence for vegetarian recipes.

---

### 3. Screen Wake Lock State Drop on Visibility Change ✅ (FIXED)
- **Location:** [`app.js`](file:///c:/Users/edward.yeo/OneDrive%20-%20MK%20Aerospace%20%28Pty%29%20Ltd/Desktop/personal/recipe%20site/app.js#L396-L408) & [`app.js`](file:///c:/Users/edward.yeo/OneDrive%20-%20MK%20Aerospace%20%28Pty%29%20Ltd/Desktop/personal/recipe%20site/app.js#L1318-L1355)
- **Previous Issue:** When tabs minimized, browser auto-released the lock and cleared sentinel, permanently dropping wake-lock state on tab return.
- **Resolution:** Introduced `isWakeLockRequested` state flag and automated re-acquisition handler on `visibilitychange` when returning to the tab.

---

### 4. Print Stylesheet Desynchronization with Lazy Render ✅ (FIXED)
- **Location:** [`style.css`](file:///c:/Users/edward.yeo/OneDrive%20-%20MK%20Aerospace%20%28Pty%29%20Ltd/Desktop/personal/recipe%20site/style.css#L1455-L1485) & [`app.js`](file:///c:/Users/edward.yeo/OneDrive%20-%20MK%20Aerospace%20%28Pty%29%20Ltd/Desktop/personal/recipe%20site/app.js#L410-L425)
- **Previous Issue:** Printing from non-cook views resulted in an empty page because `#cookView` was only rendered upon tab click. In addition, the shopping list could not be printed.
- **Resolution:** Added `beforeprint` and `afterprint` event hooks to populate the cook view on demand or print the shopping checklist directly when active.

---

### 5. Singular vs. Plural Duplication in Shopping List ✅ (FIXED)
- **Location:** [`app.js`](file:///c:/Users/edward.yeo/OneDrive%20-%20MK%20Aerospace%20%28Pty%29%20Ltd/Desktop/personal/recipe%20site/app.js#L890-L925) (`normalizeIngredientName`)
- **Previous Issue:** Items like "Onion" and "Onions" produced separate grocery lines.
- **Resolution:** Added canonical `PLURAL_MAP` normalization dictionary consolidating common count-based singular/plural pairs.

---

### 6. Service Worker Pre-Caching Gaps & SWR Undefined Fallback ✅ (FIXED)
- **Location:** [`sw.js`](file:///c:/Users/edward.yeo/OneDrive%20-%20MK%20Aerospace%20%28Pty%29%20Ltd/Desktop/personal/recipe%20site/sw.js#L3-L95)
- **Previous Issue:** Missing PNG icons in `CORE_ASSETS`, duplicate encoded/unencoded asset paths, and unhandled `undefined` response on offline fetch failures.
- **Resolution:** Added PNG icons, removed duplicate paths, and provided clean 503 fallback Response on offline network failures.

---

### 7. Wrangler Static Asset Upload Scope ✅ (FIXED)
- **Location:** [`.assetsignore`](file:///c:/Users/edward.yeo/OneDrive%20-%20MK%20Aerospace%20%28Pty%29%20Ltd/Desktop/personal/recipe%20site/.assetsignore)
- **Previous Issue:** 192 individual raw `recipe_*.json` files and CSVs were being bundled into static assets unnecessarily.
- **Resolution:** Configured `.assetsignore` to exclude redundant individual JSONs and CSVs from Cloudflare deployments.

---

## 📜 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

Copyright (c) 2026 edwardyeo08-alt.
