const fs = require('fs');
const path = require('path');

// Load all recipes
const allRecipesPath = path.join(__dirname, '..', 'extracted recipes', 'all_recipes.json');
const allRecipesData = JSON.parse(fs.readFileSync(allRecipesPath, 'utf8'));

// Extract all unique ingredients
const ingredientsMap = new Map();
allRecipesData.recipes.forEach(r => {
  r.ingredients.forEach(i => {
    const name = i.name.trim();
    if (!ingredientsMap.has(name)) {
      ingredientsMap.set(name, {
        name,
        units: new Set(),
        preps: new Set(),
        recipes: []
      });
    }
    const item = ingredientsMap.get(name);
    if (i.unit) item.units.add(i.unit);
    if (i.prep) item.preps.add(i.prep);
    item.recipes.push({ recipeNumber: r.recipe_number, qty: i.quantity, unit: i.unit });
  });
});

console.log(`Found ${ingredientsMap.size} unique ingredients across ${allRecipesData.recipes.length} recipes.`);

// Comprehensive USDA / FoodData Central based nutritional profiles (per 100g)
// and piece weights (for unit: null items)
const SPECIFIC_PROFILES = {
  // --- MEATS (BEEF, LAMB, PORK, GAME) ---
  'Free-range Beef Fillet': { cat: 'Meat', kcal: 180, p: 26.0, f: 8.5, sf: 3.5, c: 0, sug: 0, fib: 0, na: 55 },
  'Free-Range Beef Fillet': { cat: 'Meat', kcal: 180, p: 26.0, f: 8.5, sf: 3.5, c: 0, sug: 0, fib: 0, na: 55 },
  'Free-range Beef Sirloin': { cat: 'Meat', kcal: 205, p: 25.0, f: 11.5, sf: 4.8, c: 0, sug: 0, fib: 0, na: 60 },
  'Free-range Beef Rump': { cat: 'Meat', kcal: 195, p: 26.5, f: 9.8, sf: 4.0, c: 0, sug: 0, fib: 0, na: 58 },
  'Free-Range Beef Rump': { cat: 'Meat', kcal: 195, p: 26.5, f: 9.8, sf: 4.0, c: 0, sug: 0, fib: 0, na: 58 },
  'Free-range Beef Rump Strips': { cat: 'Meat', kcal: 195, p: 26.5, f: 9.8, sf: 4.0, c: 0, sug: 0, fib: 0, na: 58 },
  'Free-range Beef Strips': { cat: 'Meat', kcal: 195, p: 26.5, f: 9.8, sf: 4.0, c: 0, sug: 0, fib: 0, na: 58 },
  'Free-Range Beef Strips': { cat: 'Meat', kcal: 195, p: 26.5, f: 9.8, sf: 4.0, c: 0, sug: 0, fib: 0, na: 58 },
  'Beef Mince': { cat: 'Meat', kcal: 215, p: 24.0, f: 13.0, sf: 5.2, c: 0, sug: 0, fib: 0, na: 70 },
  'Free-Range Beef Mince': { cat: 'Meat', kcal: 215, p: 24.0, f: 13.0, sf: 5.2, c: 0, sug: 0, fib: 0, na: 70 },
  'Free-range Beef Mince': { cat: 'Meat', kcal: 215, p: 24.0, f: 13.0, sf: 5.2, c: 0, sug: 0, fib: 0, na: 70 },
  'Beef Schnitzel': { cat: 'Meat', kcal: 210, p: 25.0, f: 12.0, sf: 4.5, c: 0, sug: 0, fib: 0, na: 75 },
  'Free-range Beef Schnitzel': { cat: 'Meat', kcal: 210, p: 25.0, f: 12.0, sf: 4.5, c: 0, sug: 0, fib: 0, na: 75 },
  'Beef Schnitzel (without crumb)': { cat: 'Meat', kcal: 190, p: 26.0, f: 9.0, sf: 3.8, c: 0, sug: 0, fib: 0, na: 65 },
  'Free-Range Beef Biltong': { cat: 'Meat', kcal: 280, p: 52.0, f: 7.0, sf: 3.0, c: 2.0, sug: 1.0, fib: 0, na: 1800 },
  'Beef Stock': { cat: 'Soups & Stocks', kcal: 15, p: 2.5, f: 0.5, sf: 0.1, c: 0.5, sug: 0.2, fib: 0, na: 750, density: 1.0 },

  'Free-Range Deboned Lamb Leg': { cat: 'Meat', kcal: 210, p: 24.5, f: 12.0, sf: 5.0, c: 0, sug: 0, fib: 0, na: 65 },
  'Deboned Lamb Leg': { cat: 'Meat', kcal: 210, p: 24.5, f: 12.0, sf: 5.0, c: 0, sug: 0, fib: 0, na: 65 },
  'Free-range Lamb Leg': { cat: 'Meat', kcal: 210, p: 24.5, f: 12.0, sf: 5.0, c: 0, sug: 0, fib: 0, na: 65 },
  'Karoo Lamb Rib Chops': { cat: 'Meat', kcal: 260, p: 21.0, f: 19.5, sf: 8.5, c: 0, sug: 0, fib: 0, na: 70 },
  'Free-range Lamb': { cat: 'Meat', kcal: 220, p: 23.5, f: 13.8, sf: 5.8, c: 0, sug: 0, fib: 0, na: 68 },
  'Lamb Shoulder': { cat: 'Meat', kcal: 245, p: 22.0, f: 17.0, sf: 7.2, c: 0, sug: 0, fib: 0, na: 70 },
  'Free-range Lamb Shoulder': { cat: 'Meat', kcal: 245, p: 22.0, f: 17.0, sf: 7.2, c: 0, sug: 0, fib: 0, na: 70 },
  'Free-Range Lamb Shoulder': { cat: 'Meat', kcal: 245, p: 22.0, f: 17.0, sf: 7.2, c: 0, sug: 0, fib: 0, na: 70 },
  'Free-range Lamb Shoulder Cubes': { cat: 'Meat', kcal: 245, p: 22.0, f: 17.0, sf: 7.2, c: 0, sug: 0, fib: 0, na: 70 },
  'Free-range Lamb Goulash': { cat: 'Meat', kcal: 230, p: 23.0, f: 15.0, sf: 6.5, c: 0, sug: 0, fib: 0, na: 68 },
  'Free-range Lamb Chunks': { cat: 'Meat', kcal: 230, p: 23.0, f: 15.0, sf: 6.5, c: 0, sug: 0, fib: 0, na: 68 },
  'Lamb Rump': { cat: 'Meat', kcal: 215, p: 24.0, f: 13.0, sf: 5.5, c: 0, sug: 0, fib: 0, na: 65 },
  'Free-range Lamb Rump': { cat: 'Meat', kcal: 215, p: 24.0, f: 13.0, sf: 5.5, c: 0, sug: 0, fib: 0, na: 65 },
  'Free-range Lamb Rump Steak': { cat: 'Meat', kcal: 215, p: 24.0, f: 13.0, sf: 5.5, c: 0, sug: 0, fib: 0, na: 65 },
  'Lamb Mince': { cat: 'Meat', kcal: 250, p: 21.0, f: 18.0, sf: 7.8, c: 0, sug: 0, fib: 0, na: 75 },
  'Free-range Lamb Mince': { cat: 'Meat', kcal: 250, p: 21.0, f: 18.0, sf: 7.8, c: 0, sug: 0, fib: 0, na: 75 },

  'Pork Fillet': { cat: 'Meat', kcal: 145, p: 26.0, f: 4.0, sf: 1.4, c: 0, sug: 0, fib: 0, na: 55 },
  'Pork Mince': { cat: 'Meat', kcal: 210, p: 22.0, f: 13.5, sf: 5.0, c: 0, sug: 0, fib: 0, na: 70 },
  'Pork Schnitzel': { cat: 'Meat', kcal: 200, p: 24.0, f: 11.0, sf: 3.8, c: 0, sug: 0, fib: 0, na: 75 },
  'Pork Kassler Loin Steak': { cat: 'Meat', kcal: 180, p: 23.0, f: 9.5, sf: 3.5, c: 1.0, sug: 0.5, fib: 0, na: 850 },
  'Pork Belly': { cat: 'Meat', kcal: 390, p: 16.0, f: 36.0, sf: 13.0, c: 0, sug: 0, fib: 0, na: 60 },
  'Pork Belly Pieces': { cat: 'Meat', kcal: 390, p: 16.0, f: 36.0, sf: 13.0, c: 0, sug: 0, fib: 0, na: 60 },
  'Pork Belly Sauce': { cat: 'Sauces & Condiments', kcal: 180, p: 2.0, f: 3.0, sf: 0.5, c: 36.0, sug: 30.0, fib: 0.5, na: 950 },
  'Streaky Pork Bacon': { cat: 'Meat', kcal: 420, p: 14.0, f: 40.0, sf: 14.0, c: 1.0, sug: 0.5, fib: 0, na: 1400, piece_weight: 15 },
  'Streaky Bacon': { cat: 'Meat', kcal: 420, p: 14.0, f: 40.0, sf: 14.0, c: 1.0, sug: 0.5, fib: 0, na: 1400, piece_weight: 15 },
  'Sliced Chorizo': { cat: 'Meat', kcal: 380, p: 21.0, f: 32.0, sf: 12.0, c: 2.0, sug: 1.0, fib: 0, na: 1500 },

  'Venison Strips': { cat: 'Meat', kcal: 150, p: 30.0, f: 3.2, sf: 1.2, c: 0, sug: 0, fib: 0, na: 50 },
  'Venison Steak': { cat: 'Meat', kcal: 150, p: 30.0, f: 3.2, sf: 1.2, c: 0, sug: 0, fib: 0, na: 50 },
  'Free-Range Ostrich Fillet': { cat: 'Meat', kcal: 140, p: 28.0, f: 2.8, sf: 1.0, c: 0, sug: 0, fib: 0, na: 60 },
  'Ostrich Steak': { cat: 'Meat', kcal: 140, p: 28.0, f: 2.8, sf: 1.0, c: 0, sug: 0, fib: 0, na: 60 },
  'Free-Range Ostrich Mince': { cat: 'Meat', kcal: 155, p: 26.0, f: 5.5, sf: 2.0, c: 0, sug: 0, fib: 0, na: 65 },
  'Free-range Duck Breasts': { cat: 'Meat', kcal: 230, p: 20.0, f: 16.5, sf: 5.5, c: 0, sug: 0, fib: 0, na: 65 },

  // --- POULTRY ---
  'Free-Range Chicken Breasts': { cat: 'Poultry', kcal: 120, p: 26.0, f: 1.8, sf: 0.5, c: 0, sug: 0, fib: 0, na: 65 },
  'Free-range Chicken Breasts': { cat: 'Poultry', kcal: 120, p: 26.0, f: 1.8, sf: 0.5, c: 0, sug: 0, fib: 0, na: 65 },
  'Free-Range Chicken Mini Fillets': { cat: 'Poultry', kcal: 120, p: 26.0, f: 1.8, sf: 0.5, c: 0, sug: 0, fib: 0, na: 65 },
  'Free-range Chicken Mini Fillets': { cat: 'Poultry', kcal: 120, p: 26.0, f: 1.8, sf: 0.5, c: 0, sug: 0, fib: 0, na: 65 },
  'Free-Range Chicken Pieces': { cat: 'Poultry', kcal: 180, p: 22.0, f: 10.0, sf: 2.8, c: 0, sug: 0, fib: 0, na: 75 },
  'Free-range Chicken Pieces': { cat: 'Poultry', kcal: 180, p: 22.0, f: 10.0, sf: 2.8, c: 0, sug: 0, fib: 0, na: 75 },
  'Free-range Chicken Mince': { cat: 'Poultry', kcal: 170, p: 21.0, f: 9.5, sf: 2.6, c: 0, sug: 0, fib: 0, na: 70 },
  'Chicken Stock': { cat: 'Soups & Stocks', kcal: 15, p: 2.5, f: 0.4, sf: 0.1, c: 0.4, sug: 0.2, fib: 0, na: 750, density: 1.0 },

  // --- FISH & SEAFOOD ---
  'Hake Fillets': { cat: 'Fish & Seafood', kcal: 90, p: 19.5, f: 1.2, sf: 0.3, c: 0, sug: 0, fib: 0, na: 85 },
  'Line-Caught Hake Fillet': { cat: 'Fish & Seafood', kcal: 90, p: 19.5, f: 1.2, sf: 0.3, c: 0, sug: 0, fib: 0, na: 85 },
  'Line-caught Hake Fillets': { cat: 'Fish & Seafood', kcal: 90, p: 19.5, f: 1.2, sf: 0.3, c: 0, sug: 0, fib: 0, na: 85 },
  'Rainbow Trout Fillet': { cat: 'Fish & Seafood', kcal: 145, p: 21.0, f: 6.5, sf: 1.5, c: 0, sug: 0, fib: 0, na: 60 },
  'Rainbow Trout Fillets': { cat: 'Fish & Seafood', kcal: 145, p: 21.0, f: 6.5, sf: 1.5, c: 0, sug: 0, fib: 0, na: 60 },
  'Hot Smoked Trout Fillets': { cat: 'Fish & Seafood', kcal: 170, p: 24.0, f: 8.0, sf: 1.8, c: 0, sug: 0, fib: 0, na: 750 },
  'Smoked Trout Ribbons': { cat: 'Fish & Seafood', kcal: 170, p: 24.0, f: 8.0, sf: 1.8, c: 0, sug: 0, fib: 0, na: 750 },
  'Trout smoked (ribbon sliced)': { cat: 'Fish & Seafood', kcal: 170, p: 24.0, f: 8.0, sf: 1.8, c: 0, sug: 0, fib: 0, na: 750 },
  'Line-caught Yellowtail Fillets': { cat: 'Fish & Seafood', kcal: 130, p: 23.0, f: 4.2, sf: 1.1, c: 0, sug: 0, fib: 0, na: 55 },
  'Yellowtail Fillet': { cat: 'Fish & Seafood', kcal: 130, p: 23.0, f: 4.2, sf: 1.1, c: 0, sug: 0, fib: 0, na: 55 },
  'Line-caught Tuna Fillets': { cat: 'Fish & Seafood', kcal: 135, p: 28.0, f: 2.5, sf: 0.6, c: 0, sug: 0, fib: 0, na: 50 },
  'Dorado Fillets': { cat: 'Fish & Seafood', kcal: 110, p: 22.0, f: 2.0, sf: 0.5, c: 0, sug: 0, fib: 0, na: 65 },
  'Basa Fillet': { cat: 'Fish & Seafood', kcal: 95, p: 18.0, f: 2.5, sf: 0.8, c: 0, sug: 0, fib: 0, na: 70 },
  'Basa Fillets': { cat: 'Fish & Seafood', kcal: 95, p: 18.0, f: 2.5, sf: 0.8, c: 0, sug: 0, fib: 0, na: 70 },
  'Squid Heads & Tubes': { cat: 'Fish & Seafood', kcal: 92, p: 16.0, f: 1.4, sf: 0.4, c: 3.0, sug: 0, fib: 0, na: 110 },
  'Anchovy Pieces': { cat: 'Fish & Seafood', kcal: 210, p: 29.0, f: 10.0, sf: 2.5, c: 0, sug: 0, fib: 0, na: 3600 },

  // --- DAIRY & CHEESES ---
  'Crème Fraîche': { cat: 'Dairy', kcal: 300, p: 2.4, f: 30.0, sf: 19.0, c: 3.5, sug: 2.5, fib: 0, na: 45, density: 1.0 },
  'Cream': { cat: 'Dairy', kcal: 340, p: 2.1, f: 36.0, sf: 23.0, c: 2.8, sug: 2.8, fib: 0, na: 40, density: 1.0 },
  'Butter': { cat: 'Dairy', kcal: 717, p: 0.9, f: 81.0, sf: 51.0, c: 0.1, sug: 0.1, fib: 0, na: 580 },
  'Grated Cheddar Cheese': { cat: 'Dairy', kcal: 405, p: 25.0, f: 33.0, sf: 21.0, c: 1.3, sug: 0.5, fib: 0, na: 650 },
  'Grated Mozzarella Cheese': { cat: 'Dairy', kcal: 300, p: 22.0, f: 22.0, sf: 14.0, c: 2.5, sug: 1.0, fib: 0, na: 600 },
  'Mozzarella Balls': { cat: 'Dairy', kcal: 280, p: 20.0, f: 21.0, sf: 13.0, c: 2.0, sug: 1.0, fib: 0, na: 500 },
  'Feta Cheese': { cat: 'Dairy', kcal: 265, p: 14.0, f: 21.0, sf: 14.0, c: 4.0, sug: 1.0, fib: 0, na: 1100 },
  'Danish Feta': { cat: 'Dairy', kcal: 250, p: 12.0, f: 20.0, sf: 13.0, c: 4.5, sug: 1.5, fib: 0, na: 1200 },
  'Halloumi': { cat: 'Dairy', kcal: 320, p: 21.0, f: 25.0, sf: 16.0, c: 2.0, sug: 1.0, fib: 0, na: 1200 },
  'Goat’s Cheese': { cat: 'Dairy', kcal: 290, p: 20.0, f: 22.0, sf: 15.0, c: 2.5, sug: 1.0, fib: 0, na: 450 },
  "Goat's Cheese": { cat: 'Dairy', kcal: 290, p: 20.0, f: 22.0, sf: 15.0, c: 2.5, sug: 1.0, fib: 0, na: 450 },
  'Camembert': { cat: 'Dairy', kcal: 300, p: 20.0, f: 24.0, sf: 15.0, c: 0.5, sug: 0.5, fib: 0, na: 840 },
  'Ricotta': { cat: 'Dairy', kcal: 150, p: 11.0, f: 10.0, sf: 6.5, c: 4.0, sug: 2.0, fib: 0, na: 100 },
  'Italian-Style Hard Cheese': { cat: 'Dairy', kcal: 395, p: 33.0, f: 28.0, sf: 18.0, c: 3.0, sug: 0, fib: 0, na: 800 },
  'Grated Italian-Style Hard Cheese': { cat: 'Dairy', kcal: 395, p: 33.0, f: 28.0, sf: 18.0, c: 3.0, sug: 0, fib: 0, na: 800 },
  'Plain Yoghurt': { cat: 'Dairy', kcal: 65, p: 4.5, f: 3.5, sf: 2.2, c: 5.0, sug: 5.0, fib: 0, na: 55, density: 1.0 },
  'Double Cream Plain Yoghurt': { cat: 'Dairy', kcal: 125, p: 4.0, f: 10.0, sf: 6.5, c: 5.0, sug: 5.0, fib: 0, na: 50, density: 1.0 },
  'Greek Yoghurt': { cat: 'Dairy', kcal: 95, p: 9.0, f: 5.0, sf: 3.2, c: 4.0, sug: 4.0, fib: 0, na: 45, density: 1.0 },
  'Sour Cream': { cat: 'Dairy', kcal: 195, p: 2.5, f: 19.5, sf: 12.0, c: 4.5, sug: 3.0, fib: 0, na: 60, density: 1.0 },
  'Egg': { cat: 'Dairy & Eggs', kcal: 145, p: 13.0, f: 10.0, sf: 3.1, c: 0.7, sug: 0.4, fib: 0, na: 140, piece_weight: 50 },
  'Free-Range Egg': { cat: 'Dairy & Eggs', kcal: 145, p: 13.0, f: 10.0, sf: 3.1, c: 0.7, sug: 0.4, fib: 0, na: 140, piece_weight: 50 },

  // --- VEGETABLES & AROMATICS ---
  'Onion': { cat: 'Produce', kcal: 40, p: 1.1, f: 0.1, sf: 0, c: 9.3, sug: 4.2, fib: 1.7, na: 4, piece_weight: 150 },
  'Red Onion': { cat: 'Produce', kcal: 40, p: 1.1, f: 0.1, sf: 0, c: 9.3, sug: 4.2, fib: 1.7, na: 4, piece_weight: 140 },
  'Baby Onions': { cat: 'Produce', kcal: 40, p: 1.1, f: 0.1, sf: 0, c: 9.3, sug: 4.2, fib: 1.7, na: 4, piece_weight: 40 },
  'Spring Onion': { cat: 'Produce', kcal: 32, p: 1.8, f: 0.2, sf: 0, c: 7.3, sug: 2.3, fib: 2.6, na: 16, piece_weight: 20 },
  'Garlic Clove': { cat: 'Produce', kcal: 149, p: 6.4, f: 0.5, sf: 0.1, c: 33.1, sug: 1.0, fib: 2.1, na: 17, piece_weight: 4 },
  'Fresh Ginger': { cat: 'Produce', kcal: 80, p: 1.8, f: 0.8, sf: 0.2, c: 17.8, sug: 1.7, fib: 2.0, na: 13, piece_weight: 25 },
  'Fresh Chilli': { cat: 'Produce', kcal: 40, p: 1.9, f: 0.4, sf: 0.1, c: 8.8, sug: 5.3, fib: 1.5, na: 9, piece_weight: 15 },
  'Green Chilli': { cat: 'Produce', kcal: 40, p: 1.9, f: 0.4, sf: 0.1, c: 8.8, sug: 5.3, fib: 1.5, na: 9, piece_weight: 15 },
  'Red Chilli': { cat: 'Produce', kcal: 40, p: 1.9, f: 0.4, sf: 0.1, c: 8.8, sug: 5.3, fib: 1.5, na: 9, piece_weight: 15 },
  'Carrot': { cat: 'Produce', kcal: 41, p: 0.9, f: 0.2, sf: 0, c: 9.6, sug: 4.7, fib: 2.8, na: 69, piece_weight: 100 },
  'Carrots': { cat: 'Produce', kcal: 41, p: 0.9, f: 0.2, sf: 0, c: 9.6, sug: 4.7, fib: 2.8, na: 69, piece_weight: 100 },
  'Baby Carrot Medley': { cat: 'Produce', kcal: 38, p: 0.8, f: 0.2, sf: 0, c: 9.0, sug: 4.5, fib: 2.5, na: 65 },
  'Baby Potatoes': { cat: 'Produce', kcal: 77, p: 2.0, f: 0.1, sf: 0, c: 17.5, sug: 0.8, fib: 2.2, na: 6, piece_weight: 40 },
  'Potato': { cat: 'Produce', kcal: 77, p: 2.0, f: 0.1, sf: 0, c: 17.5, sug: 0.8, fib: 2.2, na: 6, piece_weight: 180 },
  'Potatoes': { cat: 'Produce', kcal: 77, p: 2.0, f: 0.1, sf: 0, c: 17.5, sug: 0.8, fib: 2.2, na: 6, piece_weight: 180 },
  'Sweet Potato': { cat: 'Produce', kcal: 86, p: 1.6, f: 0.1, sf: 0, c: 20.1, sug: 4.2, fib: 3.0, na: 55, piece_weight: 200 },
  'Sweet Potatoes': { cat: 'Produce', kcal: 86, p: 1.6, f: 0.1, sf: 0, c: 20.1, sug: 4.2, fib: 3.0, na: 55, piece_weight: 200 },
  'Butternut': { cat: 'Produce', kcal: 45, p: 1.0, f: 0.1, sf: 0, c: 11.7, sug: 2.2, fib: 2.0, na: 4, piece_weight: 500 },
  'Butternut Chunks': { cat: 'Produce', kcal: 45, p: 1.0, f: 0.1, sf: 0, c: 11.7, sug: 2.2, fib: 2.0, na: 4 },
  'Diced Butternut': { cat: 'Produce', kcal: 45, p: 1.0, f: 0.1, sf: 0, c: 11.7, sug: 2.2, fib: 2.0, na: 4 },
  'Tomato': { cat: 'Produce', kcal: 18, p: 0.9, f: 0.2, sf: 0, c: 3.9, sug: 2.6, fib: 1.2, na: 5, piece_weight: 120 },
  'Tomatoes': { cat: 'Produce', kcal: 18, p: 0.9, f: 0.2, sf: 0, c: 3.9, sug: 2.6, fib: 1.2, na: 5, piece_weight: 120 },
  'Baby Tomatoes': { cat: 'Produce', kcal: 22, p: 1.0, f: 0.2, sf: 0, c: 4.8, sug: 3.2, fib: 1.4, na: 8, piece_weight: 15 },
  'Baby Tomato Medley': { cat: 'Produce', kcal: 22, p: 1.0, f: 0.2, sf: 0, c: 4.8, sug: 3.2, fib: 1.4, na: 8 },
  'Cooked Chopped Tomatoes': { cat: 'Pantry', kcal: 24, p: 1.2, f: 0.2, sf: 0, c: 4.2, sug: 3.0, fib: 1.1, na: 150 },
  'Tomato Paste': { cat: 'Pantry', kcal: 82, p: 4.3, f: 0.5, sf: 0.1, c: 18.9, sug: 12.0, fib: 4.1, na: 60 },
  'Sundried Tomatoes': { cat: 'Pantry', kcal: 258, p: 14.1, f: 3.0, sf: 0.4, c: 55.8, sug: 37.6, fib: 12.3, na: 1070 },
  'Baby Spinach': { cat: 'Produce', kcal: 23, p: 2.9, f: 0.4, sf: 0.1, c: 3.6, sug: 0.4, fib: 2.2, na: 79 },
  'Kale': { cat: 'Produce', kcal: 35, p: 2.9, f: 1.5, sf: 0.2, c: 4.4, sug: 1.0, fib: 4.1, na: 53 },
  'Shredded Kale': { cat: 'Produce', kcal: 35, p: 2.9, f: 1.5, sf: 0.2, c: 4.4, sug: 1.0, fib: 4.1, na: 53 },
  'Baby Marrow': { cat: 'Produce', kcal: 17, p: 1.2, f: 0.3, sf: 0.1, c: 3.1, sug: 2.5, fib: 1.0, na: 8, piece_weight: 60 },
  'Aubergine': { cat: 'Produce', kcal: 25, p: 1.0, f: 0.2, sf: 0, c: 5.9, sug: 3.5, fib: 3.0, na: 2, piece_weight: 300 },
  'White Button Mushroom': { cat: 'Produce', kcal: 22, p: 3.1, f: 0.3, sf: 0.1, c: 3.3, sug: 2.0, fib: 1.0, na: 5 },
  'White Button Mushrooms': { cat: 'Produce', kcal: 22, p: 3.1, f: 0.3, sf: 0.1, c: 3.3, sug: 2.0, fib: 1.0, na: 5 },
  'Portabellini Mushrooms': { cat: 'Produce', kcal: 24, p: 2.8, f: 0.4, sf: 0.1, c: 3.8, sug: 2.0, fib: 1.1, na: 6 },
  'Exotic Mushrooms': { cat: 'Produce', kcal: 28, p: 3.2, f: 0.4, sf: 0.1, c: 4.5, sug: 1.5, fib: 1.8, na: 5 },
  'Red Pepper': { cat: 'Produce', kcal: 31, p: 1.0, f: 0.3, sf: 0.1, c: 6.0, sug: 4.2, fib: 2.1, na: 4, piece_weight: 160 },
  'Yellow Pepper': { cat: 'Produce', kcal: 27, p: 1.0, f: 0.2, sf: 0.1, c: 6.3, sug: 4.0, fib: 1.7, na: 4, piece_weight: 160 },
  'Green Pepper': { cat: 'Produce', kcal: 20, p: 0.9, f: 0.2, sf: 0, c: 4.6, sug: 2.4, fib: 1.7, na: 3, piece_weight: 150 },
  'Cucumber': { cat: 'Produce', kcal: 15, p: 0.7, f: 0.1, sf: 0, c: 3.6, sug: 1.7, fib: 0.5, na: 2, piece_weight: 200 },
  'English Cucumber': { cat: 'Produce', kcal: 15, p: 0.7, f: 0.1, sf: 0, c: 3.6, sug: 1.7, fib: 0.5, na: 2, piece_weight: 250 },
  'Avocado': { cat: 'Produce', kcal: 160, p: 2.0, f: 14.7, sf: 2.1, c: 8.5, sug: 0.7, fib: 6.7, na: 7, piece_weight: 180 },
  'Avocados': { cat: 'Produce', kcal: 160, p: 2.0, f: 14.7, sf: 2.1, c: 8.5, sug: 0.7, fib: 6.7, na: 7, piece_weight: 180 },
  'Lemon': { cat: 'Produce', kcal: 29, p: 1.1, f: 0.3, sf: 0, c: 9.3, sug: 2.5, fib: 2.8, na: 2, piece_weight: 100 },
  'Lime': { cat: 'Produce', kcal: 30, p: 0.7, f: 0.2, sf: 0, c: 10.5, sug: 1.7, fib: 2.8, na: 2, piece_weight: 60 },
  'Apple': { cat: 'Produce', kcal: 52, p: 0.3, f: 0.2, sf: 0, c: 13.8, sug: 10.4, fib: 2.4, na: 1, piece_weight: 150 },
  'Apples': { cat: 'Produce', kcal: 52, p: 0.3, f: 0.2, sf: 0, c: 13.8, sug: 10.4, fib: 2.4, na: 1, piece_weight: 150 },
  'Green Apple': { cat: 'Produce', kcal: 52, p: 0.3, f: 0.2, sf: 0, c: 13.8, sug: 10.4, fib: 2.4, na: 1, piece_weight: 150 },
  'Peas': { cat: 'Produce', kcal: 81, p: 5.4, f: 0.4, sf: 0.1, c: 14.5, sug: 5.7, fib: 5.7, na: 5 },
  'Corn': { cat: 'Produce', kcal: 86, p: 3.3, f: 1.4, sf: 0.2, c: 19.0, sug: 6.3, fib: 2.0, na: 15, piece_weight: 150 },
  'Corn on the Cob': { cat: 'Produce', kcal: 86, p: 3.3, f: 1.4, sf: 0.2, c: 19.0, sug: 6.3, fib: 2.0, na: 15, piece_weight: 200 },
  'Sweetcorn': { cat: 'Produce', kcal: 86, p: 3.3, f: 1.4, sf: 0.2, c: 19.0, sug: 6.3, fib: 2.0, na: 15 },
  'Green Beans': { cat: 'Produce', kcal: 31, p: 1.8, f: 0.2, sf: 0, c: 7.0, sug: 3.3, fib: 2.7, na: 6 },
  'Broccoli': { cat: 'Produce', kcal: 34, p: 2.8, f: 0.4, sf: 0.1, c: 6.6, sug: 1.7, fib: 2.6, na: 33, piece_weight: 300 },
  'Broccoli Florets': { cat: 'Produce', kcal: 34, p: 2.8, f: 0.4, sf: 0.1, c: 6.6, sug: 1.7, fib: 2.6, na: 33 },
  'Cauliflower': { cat: 'Produce', kcal: 25, p: 1.9, f: 0.3, sf: 0.1, c: 5.0, sug: 1.9, fib: 2.0, na: 30, piece_weight: 400 },
  'Cauliflower Florets': { cat: 'Produce', kcal: 25, p: 1.9, f: 0.3, sf: 0.1, c: 5.0, sug: 1.9, fib: 2.0, na: 30 },
  'Cabbage': { cat: 'Produce', kcal: 25, p: 1.3, f: 0.1, sf: 0, c: 5.8, sug: 3.2, fib: 2.5, na: 18, piece_weight: 500 },
  'Red Cabbage': { cat: 'Produce', kcal: 31, p: 1.4, f: 0.2, sf: 0, c: 7.4, sug: 3.8, fib: 2.1, na: 27 },
  'Asian-Style Slaw Mix': { cat: 'Produce', kcal: 28, p: 1.2, f: 0.2, sf: 0, c: 6.2, sug: 3.5, fib: 2.3, na: 20 },
  'Salad Leaves': { cat: 'Produce', kcal: 15, p: 1.4, f: 0.2, sf: 0, c: 2.9, sug: 1.3, fib: 1.5, na: 25 },
  'Mixed Salad Leaves': { cat: 'Produce', kcal: 15, p: 1.4, f: 0.2, sf: 0, c: 2.9, sug: 1.3, fib: 1.5, na: 25 },
  'Rocket': { cat: 'Produce', kcal: 25, p: 2.6, f: 0.7, sf: 0.1, c: 3.7, sug: 2.1, fib: 1.6, na: 27 },
  'Wild Rocket': { cat: 'Produce', kcal: 25, p: 2.6, f: 0.7, sf: 0.1, c: 3.7, sug: 2.1, fib: 1.6, na: 27 },

  // --- HERBS & GREENS ---
  'Fresh Coriander': { cat: 'Fresh Herbs', kcal: 23, p: 2.1, f: 0.5, sf: 0.1, c: 3.7, sug: 0.9, fib: 2.8, na: 46 },
  'Fresh Parsley': { cat: 'Fresh Herbs', kcal: 36, p: 3.0, f: 0.8, sf: 0.1, c: 6.3, sug: 0.9, fib: 3.3, na: 56 },
  'Fresh Mint': { cat: 'Fresh Herbs', kcal: 44, p: 3.3, f: 0.7, sf: 0.2, c: 8.4, sug: 0.9, fib: 6.8, na: 31 },
  'Fresh Basil': { cat: 'Fresh Herbs', kcal: 23, p: 3.2, f: 0.6, sf: 0.1, c: 2.7, sug: 0.3, fib: 1.6, na: 4 },
  'Fresh Rosemary': { cat: 'Fresh Herbs', kcal: 131, p: 3.3, f: 5.9, sf: 2.8, c: 20.7, sug: 0, fib: 14.1, na: 26 },
  'Fresh Thyme': { cat: 'Fresh Herbs', kcal: 101, p: 5.6, f: 1.7, sf: 0.5, c: 24.5, sug: 0, fib: 14.0, na: 9 },
  'Fresh Oregano': { cat: 'Fresh Herbs', kcal: 68, p: 2.2, f: 1.6, sf: 0.5, c: 13.0, sug: 0.5, fib: 4.3, na: 15 },
  'Fresh Sage': { cat: 'Fresh Herbs', kcal: 115, p: 4.5, f: 3.5, sf: 1.2, c: 16.0, sug: 0.5, fib: 10.0, na: 10 },

  // --- GRAINS, PASTA & BAKERY ---
  'Whole Wheat Rotis': { cat: 'Bakery', kcal: 290, p: 8.5, f: 7.0, sf: 1.5, c: 48.0, sug: 2.0, fib: 5.5, na: 380, piece_weight: 65 },
  'Whole Wheat Roti': { cat: 'Bakery', kcal: 290, p: 8.5, f: 7.0, sf: 1.5, c: 48.0, sug: 2.0, fib: 5.5, na: 380, piece_weight: 65 },
  'Wholewheat Roti': { cat: 'Bakery', kcal: 290, p: 8.5, f: 7.0, sf: 1.5, c: 48.0, sug: 2.0, fib: 5.5, na: 380, piece_weight: 65 },
  'Roti': { cat: 'Bakery', kcal: 300, p: 8.0, f: 8.0, sf: 2.0, c: 49.0, sug: 2.0, fib: 3.5, na: 400, piece_weight: 65 },
  'Rotis': { cat: 'Bakery', kcal: 300, p: 8.0, f: 8.0, sf: 2.0, c: 49.0, sug: 2.0, fib: 3.5, na: 400, piece_weight: 65 },
  'Corn Tortillas': { cat: 'Bakery', kcal: 218, p: 5.7, f: 2.8, sf: 0.5, c: 45.0, sug: 1.0, fib: 6.0, na: 45, piece_weight: 30 },
  'Flour Tortillas': { cat: 'Bakery', kcal: 300, p: 8.0, f: 7.5, sf: 2.0, c: 50.0, sug: 2.5, fib: 2.5, na: 550, piece_weight: 45 },
  'Pita': { cat: 'Bakery', kcal: 275, p: 9.0, f: 1.5, sf: 0.3, c: 55.0, sug: 2.0, fib: 2.5, na: 520, piece_weight: 60 },
  'Pitas': { cat: 'Bakery', kcal: 275, p: 9.0, f: 1.5, sf: 0.3, c: 55.0, sug: 2.0, fib: 2.5, na: 520, piece_weight: 60 },
  'Cocktail Pitas': { cat: 'Bakery', kcal: 275, p: 9.0, f: 1.5, sf: 0.3, c: 55.0, sug: 2.0, fib: 2.5, na: 520, piece_weight: 30 },
  'Gnocchi': { cat: 'Pasta & Grains', kcal: 160, p: 3.5, f: 0.8, sf: 0.2, c: 34.0, sug: 1.0, fib: 2.0, na: 350 },
  'Potato Gnocchi': { cat: 'Pasta & Grains', kcal: 160, p: 3.5, f: 0.8, sf: 0.2, c: 34.0, sug: 1.0, fib: 2.0, na: 350 },
  'Tagliatelle': { cat: 'Pasta & Grains', kcal: 360, p: 13.0, f: 2.5, sf: 0.6, c: 70.0, sug: 3.0, fib: 3.5, na: 10 },
  'Egg Tagliatelle': { cat: 'Pasta & Grains', kcal: 370, p: 14.5, f: 3.5, sf: 1.0, c: 68.0, sug: 2.5, fib: 3.0, na: 40 },
  'Fettuccine': { cat: 'Pasta & Grains', kcal: 360, p: 13.0, f: 2.5, sf: 0.6, c: 70.0, sug: 3.0, fib: 3.5, na: 10 },
  'Basmati Rice': { cat: 'Pasta & Grains', kcal: 350, p: 8.0, f: 0.8, sf: 0.2, c: 78.0, sug: 0.2, fib: 1.5, na: 5 },
  'Jasmine Rice': { cat: 'Pasta & Grains', kcal: 355, p: 7.5, f: 0.7, sf: 0.2, c: 79.0, sug: 0.2, fib: 1.4, na: 5 },
  'Brown Basmati Rice': { cat: 'Pasta & Grains', kcal: 345, p: 8.5, f: 2.5, sf: 0.6, c: 72.0, sug: 0.5, fib: 3.5, na: 6 },
  'Arborio Rice': { cat: 'Pasta & Grains', kcal: 355, p: 7.0, f: 0.6, sf: 0.2, c: 80.0, sug: 0.2, fib: 1.2, na: 4 },
  'Black Rice': { cat: 'Pasta & Grains', kcal: 340, p: 9.0, f: 3.0, sf: 0.6, c: 68.0, sug: 0.5, fib: 4.5, na: 8 },
  'Quinoa': { cat: 'Pasta & Grains', kcal: 368, p: 14.1, f: 6.1, sf: 0.7, c: 64.2, sug: 1.8, fib: 7.0, na: 5 },
  'Tricolore Quinoa': { cat: 'Pasta & Grains', kcal: 368, p: 14.1, f: 6.1, sf: 0.7, c: 64.2, sug: 1.8, fib: 7.0, na: 5 },
  'Couscous': { cat: 'Pasta & Grains', kcal: 375, p: 12.8, f: 0.6, sf: 0.1, c: 77.4, sug: 0.5, fib: 5.0, na: 10 },
  'Bulgur Wheat': { cat: 'Pasta & Grains', kcal: 342, p: 12.3, f: 1.3, sf: 0.2, c: 75.9, sug: 0.4, fib: 18.3, na: 17 },
  'Egg Noodles': { cat: 'Pasta & Grains', kcal: 380, p: 14.0, f: 4.5, sf: 1.2, c: 70.0, sug: 2.0, fib: 3.0, na: 40 },
  'Ramen Noodles': { cat: 'Pasta & Grains', kcal: 380, p: 11.0, f: 4.0, sf: 1.0, c: 73.0, sug: 2.0, fib: 3.0, na: 650 },
  'Mung Bean Vermicelli Noodles': { cat: 'Pasta & Grains', kcal: 350, p: 0.5, f: 0.2, sf: 0, c: 86.0, sug: 0, fib: 0.5, na: 15 },
  'Rice Noodles': { cat: 'Pasta & Grains', kcal: 360, p: 3.5, f: 0.6, sf: 0.1, c: 83.0, sug: 0.2, fib: 1.6, na: 20 },
  'Tortilla Chips': { cat: 'Snacks', kcal: 480, p: 6.5, f: 23.0, sf: 3.0, c: 64.0, sug: 1.5, fib: 5.0, na: 450 },

  // --- LEGUMES & PULSES ---
  'Cooked Black Beans': { cat: 'Legumes', kcal: 95, p: 6.0, f: 0.5, sf: 0.1, c: 17.0, sug: 0.5, fib: 6.0, na: 180 },
  'Cooked Chickpeas': { cat: 'Legumes', kcal: 130, p: 7.5, f: 2.2, sf: 0.3, c: 20.0, sug: 1.5, fib: 5.5, na: 200 },
  'Cooked Cannellini Beans': { cat: 'Legumes', kcal: 90, p: 6.5, f: 0.5, sf: 0.1, c: 16.0, sug: 0.5, fib: 5.5, na: 190 },
  'Cooked Brown Lentils': { cat: 'Legumes', kcal: 115, p: 9.0, f: 0.4, sf: 0.1, c: 20.0, sug: 0.8, fib: 8.0, na: 150 },
  'Red Split Lentils': { cat: 'Legumes', kcal: 340, p: 25.0, f: 1.5, sf: 0.3, c: 58.0, sug: 2.0, fib: 11.0, na: 20 },
  'Brown Lentils': { cat: 'Legumes', kcal: 340, p: 25.0, f: 1.5, sf: 0.3, c: 58.0, sug: 2.0, fib: 11.0, na: 20 },

  // --- NUTS & SEEDS ---
  'Almonds': { cat: 'Nuts & Seeds', kcal: 579, p: 21.2, f: 49.9, sf: 3.8, c: 21.6, sug: 4.4, fib: 12.5, na: 1 },
  'Flaked Almonds': { cat: 'Nuts & Seeds', kcal: 579, p: 21.2, f: 49.9, sf: 3.8, c: 21.6, sug: 4.4, fib: 12.5, na: 1 },
  'Cashew Nuts': { cat: 'Nuts & Seeds', kcal: 553, p: 18.2, f: 43.8, sf: 7.8, c: 30.2, sug: 5.9, fib: 3.3, na: 12 },
  'Raw Cashews': { cat: 'Nuts & Seeds', kcal: 553, p: 18.2, f: 43.8, sf: 7.8, c: 30.2, sug: 5.9, fib: 3.3, na: 12 },
  'Roasted Peanuts': { cat: 'Nuts & Seeds', kcal: 585, p: 24.0, f: 49.0, sf: 7.0, c: 21.0, sug: 4.5, fib: 8.0, na: 200 },
  'Walnuts': { cat: 'Nuts & Seeds', kcal: 654, p: 15.2, f: 65.2, sf: 6.1, c: 13.7, sug: 2.6, fib: 6.7, na: 2 },
  'Sunflower Seeds': { cat: 'Nuts & Seeds', kcal: 584, p: 20.8, f: 51.5, sf: 4.5, c: 20.0, sug: 2.6, fib: 8.6, na: 9 },
  'Pumpkin Seeds': { cat: 'Nuts & Seeds', kcal: 559, p: 30.2, f: 49.0, sf: 8.7, c: 10.7, sug: 1.4, fib: 6.0, na: 7 },
  'Sesame Seeds': { cat: 'Nuts & Seeds', kcal: 573, p: 17.7, f: 49.7, sf: 7.0, c: 23.4, sug: 0.3, fib: 11.8, na: 11 },
  'White Sesame Seeds': { cat: 'Nuts & Seeds', kcal: 573, p: 17.7, f: 49.7, sf: 7.0, c: 23.4, sug: 0.3, fib: 11.8, na: 11 },
  'Black Sesame Seeds': { cat: 'Nuts & Seeds', kcal: 573, p: 17.7, f: 49.7, sf: 7.0, c: 23.4, sug: 0.3, fib: 11.8, na: 11 },

  // --- OILS, CONDIMENTS & PASTES ---
  'Olive Oil': { cat: 'Oils & Vinegars', kcal: 884, p: 0, f: 100.0, sf: 14.0, c: 0, sug: 0, fib: 0, na: 2, density: 0.92 },
  'Sesame Oil': { cat: 'Oils & Vinegars', kcal: 884, p: 0, f: 100.0, sf: 14.0, c: 0, sug: 0, fib: 0, na: 2, density: 0.92 },
  'Truffle Oil': { cat: 'Oils & Vinegars', kcal: 884, p: 0, f: 100.0, sf: 14.0, c: 0, sug: 0, fib: 0, na: 2, density: 0.92 },
  'Red Wine Vinegar': { cat: 'Oils & Vinegars', kcal: 19, p: 0.1, f: 0, sf: 0, c: 0.3, sug: 0.3, fib: 0, na: 8, density: 1.0 },
  'White Wine Vinegar': { cat: 'Oils & Vinegars', kcal: 19, p: 0.1, f: 0, sf: 0, c: 0.3, sug: 0.3, fib: 0, na: 8, density: 1.0 },
  'Balsamic Vinegar': { cat: 'Oils & Vinegars', kcal: 88, p: 0.5, f: 0, sf: 0, c: 17.0, sug: 15.0, fib: 0, na: 23, density: 1.05 },
  'Balsamic Reduction': { cat: 'Oils & Vinegars', kcal: 180, p: 1.0, f: 0, sf: 0, c: 42.0, sug: 38.0, fib: 0, na: 35, density: 1.15 },
  'Balsamic Glaze': { cat: 'Oils & Vinegars', kcal: 180, p: 1.0, f: 0, sf: 0, c: 42.0, sug: 38.0, fib: 0, na: 35, density: 1.15 },
  'Rice Wine Vinegar': { cat: 'Oils & Vinegars', kcal: 20, p: 0.1, f: 0, sf: 0, c: 1.0, sug: 0.8, fib: 0, na: 10, density: 1.0 },
  'Apple Cider Vinegar': { cat: 'Oils & Vinegars', kcal: 21, p: 0.1, f: 0, sf: 0, c: 0.9, sug: 0.4, fib: 0, na: 5, density: 1.0 },
  'Soy Sauce': { cat: 'Sauces & Condiments', kcal: 53, p: 8.1, f: 0.1, sf: 0, c: 4.9, sug: 0.4, fib: 0.8, na: 5500, density: 1.15 },
  'Low-Sodium Soy Sauce': { cat: 'Sauces & Condiments', kcal: 53, p: 8.1, f: 0.1, sf: 0, c: 4.9, sug: 0.4, fib: 0.8, na: 3500, density: 1.15 },
  'Fish Sauce': { cat: 'Sauces & Condiments', kcal: 35, p: 5.0, f: 0, sf: 0, c: 3.5, sug: 3.5, fib: 0, na: 7800, density: 1.2 },
  'Sweet Chilli Sauce': { cat: 'Sauces & Condiments', kcal: 190, p: 0.5, f: 0.2, sf: 0, c: 47.0, sug: 44.0, fib: 0.5, na: 1200, density: 1.2 },
  'Mayonnaise': { cat: 'Sauces & Condiments', kcal: 680, p: 1.0, f: 75.0, sf: 11.0, c: 1.0, sug: 1.0, fib: 0, na: 630 },
  'Dijon Mustard': { cat: 'Sauces & Condiments', kcal: 130, p: 7.0, f: 8.0, sf: 0.5, c: 6.0, sug: 2.0, fib: 4.0, na: 1800 },
  'Wholegrain Mustard': { cat: 'Sauces & Condiments', kcal: 140, p: 7.0, f: 9.0, sf: 0.6, c: 8.0, sug: 2.5, fib: 4.5, na: 1600 },
  'Honey': { cat: 'Sweeteners', kcal: 304, p: 0.3, f: 0, sf: 0, c: 82.4, sug: 82.1, fib: 0.2, na: 4, density: 1.42 },
  'Maple Syrup': { cat: 'Sweeteners', kcal: 260, p: 0, f: 0.1, sf: 0, c: 67.0, sug: 60.5, fib: 0, na: 12, density: 1.32 },
  'Coconut Milk': { cat: 'Canned Goods', kcal: 195, p: 2.0, f: 20.0, sf: 18.0, c: 3.0, sug: 1.5, fib: 0, na: 15, density: 1.0 },
  'Coconut Cream': { cat: 'Canned Goods', kcal: 230, p: 2.3, f: 24.0, sf: 21.0, c: 4.0, sug: 2.0, fib: 0, na: 20, density: 1.0 },
  'Tzatziki': { cat: 'Sauces & Condiments', kcal: 115, p: 4.0, f: 8.0, sf: 4.5, c: 6.0, sug: 4.0, fib: 0.8, na: 420 },
  'Basil Pesto': { cat: 'Sauces & Condiments', kcal: 450, p: 5.5, f: 45.0, sf: 7.0, c: 6.0, sug: 1.5, fib: 2.5, na: 750 },
  'Calamata Olives': { cat: 'Pantry', kcal: 240, p: 1.5, f: 24.0, sf: 3.5, c: 4.0, sug: 0.5, fib: 3.0, na: 1400 },
  'Kalamata Olives': { cat: 'Pantry', kcal: 240, p: 1.5, f: 24.0, sf: 3.5, c: 4.0, sug: 0.5, fib: 3.0, na: 1400 },
  'Pitted Black Olives': { cat: 'Pantry', kcal: 180, p: 1.2, f: 18.0, sf: 2.5, c: 3.5, sug: 0.5, fib: 2.5, na: 1200 },
  'Capers': { cat: 'Pantry', kcal: 23, p: 2.4, f: 0.9, sf: 0.2, c: 4.9, sug: 0.4, fib: 3.2, na: 2300 },
  'Tahini': { cat: 'Pantry', kcal: 595, p: 17.0, f: 53.8, sf: 7.5, c: 21.2, sug: 0.5, fib: 9.3, na: 115 },
  'Hummus': { cat: 'Dips & Spreads', kcal: 166, p: 7.9, f: 9.6, sf: 1.4, c: 14.3, sug: 0.3, fib: 6.0, na: 380 },
  'Guacamole': { cat: 'Dips & Spreads', kcal: 155, p: 2.0, f: 14.0, sf: 2.2, c: 8.0, sug: 1.0, fib: 5.5, na: 340 }
};

// Generic category inferrer for remaining ingredients
function inferNutrition(name, sampleUnits) {
  const lower = name.toLowerCase();

  // Check specific exact matches
  if (SPECIFIC_PROFILES[name]) return { ...SPECIFIC_PROFILES[name] };

  // Partial matches in specific profiles
  for (const [key, val] of Object.entries(SPECIFIC_PROFILES)) {
    if (lower === key.toLowerCase()) return { ...val };
  }

  // Smart heuristic based on keywords
  // 1. Meats & Poultry & Seafood
  if (/beef|steak|fillet|rump|sirloin|brisket|meatball|meatloaf|bobotie/.test(lower)) {
    return { cat: 'Meat', kcal: 200, p: 25.0, f: 11.0, sf: 4.5, c: 0, sug: 0, fib: 0, na: 65 };
  }
  if (/lamb|mutton/.test(lower)) {
    return { cat: 'Meat', kcal: 230, p: 23.0, f: 15.0, sf: 6.5, c: 0, sug: 0, fib: 0, na: 70 };
  }
  if (/chicken|poultry/.test(lower)) {
    return { cat: 'Poultry', kcal: 140, p: 25.0, f: 4.0, sf: 1.2, c: 0, sug: 0, fib: 0, na: 70 };
  }
  if (/pork|bacon|ham|kassler/.test(lower)) {
    return { cat: 'Meat', kcal: 220, p: 22.0, f: 14.0, sf: 5.0, c: 0.5, sug: 0.2, fib: 0, na: 450 };
  }
  if (/chorizo|salami|sausage/.test(lower)) {
    return { cat: 'Meat', kcal: 350, p: 20.0, f: 29.0, sf: 10.0, c: 2.0, sug: 1.0, fib: 0, na: 1300 };
  }
  if (/fish|hake|trout|salmon|tuna|yellowtail|dorado|basa|calamari|squid|prawn|seafood|mussel/.test(lower)) {
    return { cat: 'Fish & Seafood', kcal: 115, p: 21.0, f: 3.5, sf: 0.8, c: 0.5, sug: 0, fib: 0, na: 80 };
  }

  // 2. Dairy & Cheese
  if (/cheese|cheddar|mozzarella|parmesan|gouda|feta|halloumi|bocconcini|pecorino|ricotta/.test(lower)) {
    return { cat: 'Dairy', kcal: 320, p: 22.0, f: 25.0, sf: 16.0, c: 2.0, sug: 0.8, fib: 0, na: 750 };
  }
  if (/yoghurt|yogurt/.test(lower)) {
    return { cat: 'Dairy', kcal: 80, p: 5.0, f: 4.5, sf: 2.8, c: 5.0, sug: 5.0, fib: 0, na: 50, density: 1.0 };
  }
  if (/cream|crème/.test(lower)) {
    return { cat: 'Dairy', kcal: 310, p: 2.3, f: 32.0, sf: 20.0, c: 3.0, sug: 2.5, fib: 0, na: 45, density: 1.0 };
  }

  // 3. Pastas, Noodles, Rice & Grains
  if (/pasta|spaghetti|tagliatelle|fettuccine|macaroni|gnocchi|penne|ravioli|lasagne/.test(lower)) {
    if (/ravioli/.test(lower)) {
      return { cat: 'Pasta & Grains', kcal: 220, p: 8.5, f: 5.5, sf: 2.5, c: 34.0, sug: 2.0, fib: 2.2, na: 380 };
    }
    return { cat: 'Pasta & Grains', kcal: 280, p: 10.0, f: 2.0, sf: 0.5, c: 55.0, sug: 2.0, fib: 3.0, na: 150 };
  }
  if (/rice|quinoa|couscous|bulgur|grain/.test(lower)) {
    return { cat: 'Pasta & Grains', kcal: 355, p: 8.0, f: 1.0, sf: 0.3, c: 78.0, sug: 0.3, fib: 2.0, na: 5 };
  }
  if (/noodle|vermicelli|ramen/.test(lower)) {
    return { cat: 'Pasta & Grains', kcal: 360, p: 10.0, f: 3.0, sf: 0.8, c: 72.0, sug: 1.5, fib: 2.5, na: 200 };
  }
  if (/roti|wrap|pita|flatbread|tortilla|taco|bread|baguette|roll|bun/.test(lower)) {
    return { cat: 'Bakery', kcal: 285, p: 8.5, f: 6.0, sf: 1.5, c: 48.0, sug: 2.5, fib: 4.0, na: 420, piece_weight: 60 };
  }

  // 4. Nuts, Seeds & Dried Fruit
  if (/almond|cashew|walnut|peanut|nut|pecan/.test(lower)) {
    return { cat: 'Nuts & Seeds', kcal: 580, p: 20.0, f: 50.0, sf: 6.0, c: 20.0, sug: 5.0, fib: 8.0, na: 10 };
  }
  if (/seed|sesame|sunflower|pumpkin|chia/.test(lower)) {
    return { cat: 'Nuts & Seeds', kcal: 570, p: 20.0, f: 49.0, sf: 6.0, c: 18.0, sug: 2.0, fib: 9.0, na: 10 };
  }
  if (/raisin|cranberr|date|fig|apricot/.test(lower)) {
    return { cat: 'Dried Fruits', kcal: 300, p: 2.5, f: 0.5, sf: 0.1, c: 75.0, sug: 65.0, fib: 5.0, na: 15 };
  }

  // 5. Sauces, Pastes, Rubs, Condiments & Seasonings
  if (/paste|curry paste|pesto/.test(lower)) {
    return { cat: 'Sauces & Pastes', kcal: 220, p: 4.0, f: 16.0, sf: 2.5, c: 15.0, sug: 8.0, fib: 3.0, na: 1200, density: 1.1 };
  }
  if (/sauce|marinade|glaze|dressing|mayo|aioli/.test(lower)) {
    return { cat: 'Sauces & Condiments', kcal: 180, p: 1.5, f: 10.0, sf: 1.5, c: 20.0, sug: 16.0, fib: 0.8, na: 950, density: 1.1 };
  }
  if (/rub|spice|seasoning|powder|masala|cumin|paprika|turmeric|coriander seeds|cinnamon/.test(lower)) {
    return { cat: 'Spices & Seasonings', kcal: 310, p: 12.0, f: 10.0, sf: 1.5, c: 45.0, sug: 5.0, fib: 22.0, na: 800 };
  }
  if (/stock|broth/.test(lower)) {
    return { cat: 'Soups & Stocks', kcal: 20, p: 3.0, f: 0.5, sf: 0.1, c: 1.0, sug: 0.5, fib: 0, na: 750, density: 1.0 };
  }
  if (/oil/.test(lower)) {
    return { cat: 'Oils & Vinegars', kcal: 884, p: 0, f: 100.0, sf: 14.0, c: 0, sug: 0, fib: 0, na: 2, density: 0.92 };
  }
  if (/vinegar/.test(lower)) {
    return { cat: 'Oils & Vinegars', kcal: 22, p: 0.1, f: 0, sf: 0, c: 1.0, sug: 0.8, fib: 0, na: 10, density: 1.0 };
  }

  // 6. Legumes & Beans
  if (/bean|chickpea|lentil|dal|dhal|edamame|pulse/.test(lower)) {
    return { cat: 'Legumes', kcal: 120, p: 8.0, f: 1.0, sf: 0.2, c: 19.0, sug: 1.0, fib: 6.5, na: 180 };
  }

  // 7. Herbs & Greens
  if (/coriander|parsley|mint|basil|rosemary|thyme|sage|oregano|dill|chive|tarragon/.test(lower)) {
    return { cat: 'Fresh Herbs', kcal: 35, p: 3.0, f: 0.7, sf: 0.1, c: 6.0, sug: 0.8, fib: 3.5, na: 35 };
  }
  if (/spinach|kale|salad|lettuce|rocket|cabbage|slaw|chard|leaf|leaves|watercress/.test(lower)) {
    return { cat: 'Produce', kcal: 25, p: 2.2, f: 0.3, sf: 0.1, c: 4.0, sug: 1.5, fib: 2.2, na: 40 };
  }

  // 8. General Vegetables / Produce fallback
  return { cat: 'Produce', kcal: 45, p: 1.5, f: 0.3, sf: 0.1, c: 9.0, sug: 4.0, fib: 2.5, na: 30, piece_weight: 100 };
}

// Build complete database for all 509 ingredients
const ingredientsDatabase = [];

for (const [name, meta] of ingredientsMap.entries()) {
  const profile = inferNutrition(name, meta.units);
  const energyKcal = Math.round(profile.kcal * 10) / 10;
  const energyKj = Math.round(energyKcal * 4.184 * 10) / 10;

  ingredientsDatabase.push({
    name,
    category: profile.cat,
    serving_size: '100g',
    energy_kcal: energyKcal,
    energy_kj: energyKj,
    protein_g: Math.round(profile.p * 10) / 10,
    fat_g: Math.round(profile.f * 10) / 10,
    saturated_fat_g: Math.round((profile.sf || 0) * 10) / 10,
    carbs_g: Math.round(profile.c * 10) / 10,
    sugars_g: Math.round((profile.sug || 0) * 10) / 10,
    fibre_g: Math.round((profile.fib || 0) * 10) / 10,
    sodium_mg: Math.round(profile.na || 0),
    density_g_per_ml: profile.density || 1.0,
    piece_weight_g: profile.piece_weight || null,
    recipe_occurrences: meta.recipes.length
  });
}

// Sort alphabetically
ingredientsDatabase.sort((a, b) => a.name.localeCompare(b.name));

// Write JSON
const jsonOutputPath = path.join(__dirname, '..', 'extracted recipes', 'ingredients_nutrition.json');
fs.writeFileSync(jsonOutputPath, JSON.stringify(ingredientsDatabase, null, 2), 'utf8');
console.log(`Saved ingredients nutrition JSON: ${jsonOutputPath}`);

// Write CSV
const csvHeaders = [
  'name',
  'category',
  'serving_size',
  'energy_kcal',
  'energy_kj',
  'protein_g',
  'fat_g',
  'saturated_fat_g',
  'carbs_g',
  'sugars_g',
  'fibre_g',
  'sodium_mg',
  'density_g_per_ml',
  'piece_weight_g',
  'recipe_occurrences'
];

function escapeCsv(val) {
  if (val === null || val === undefined) return '';
  const s = String(val);
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

const csvRows = [
  csvHeaders.join(','),
  ...ingredientsDatabase.map(row => csvHeaders.map(h => escapeCsv(row[h])).join(','))
];

const csvOutputPath = path.join(__dirname, '..', 'extracted recipes', 'ingredients_nutrition.csv');
fs.writeFileSync(csvOutputPath, csvRows.join('\n'), 'utf8');
console.log(`Saved ingredients nutrition CSV: ${csvOutputPath}`);
