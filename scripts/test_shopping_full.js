const fs = require('fs');
const path = require('path');
const assert = require('assert');

const allRecipesPath = path.join(__dirname, '..', 'extracted recipes', 'all_recipes.json');
const allRecipesData = JSON.parse(fs.readFileSync(allRecipesPath, 'utf8'));
const recipes = allRecipesData.recipes;

// Test with string IDs and numeric IDs (to simulate localStorage or HTML data attributes)
const testPlan = [
  { id: "1", portions: 4 }, // Vibey Durban Lamb Curry (servings: 4)
  { id: 2, portions: 4 },   // Herb Crusted Fillet (servings: 2) -> factor 2
  { id: "6", portions: 2 }  // Sirloin On Quinoa (servings: 2) -> factor 1
];

function calculateAggregatedShopping(plan, recipes) {
  if (!plan || plan.length === 0) return [];

  const aggregated = new Map();

  plan.forEach(planItem => {
    const planId = Number(planItem.id);
    const recipe = recipes.find(r => Number(r.recipe_number) === planId);
    if (!recipe) {
      console.warn('Recipe not found for ID:', planItem.id);
      return;
    }

    const factor = (planItem.portions || 4) / (recipe.servings || 4);

    const PLURAL_MAP = {
      'onions': 'Onion',
      'garlic cloves': 'Garlic Clove',
      'carrots': 'Carrot',
      'lemons': 'Lemon',
      'tomatoes': 'Tomato'
    };

    (recipe.ingredients || []).forEach(ing => {
      if (!ing || !ing.name) return;
      const rawName = ing.name.trim();
      const cleaned = rawName.replace(/\s*\([^)]*\)/g, '').trim();
      const baseName = PLURAL_MAP[cleaned.toLowerCase()] || cleaned;
      const unit = ing.unit || null;
      let qty = (ing.quantity !== null && ing.quantity !== undefined && !isNaN(ing.quantity))
        ? ing.quantity * factor
        : null;

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
          recipesUsed: new Set([recipe.title])
        });
      } else {
        aggregated.get(mapKey).recipesUsed.add(recipe.title);
      }
    });
  });

  return Array.from(aggregated.values());
}

const items = calculateAggregatedShopping(testPlan, recipes);
console.log('Total aggregated items from test plan:', items.length);
assert(items.length > 20, 'Should have aggregated at least 20 items');

// Verify Baby Potatoes combined:
// Recipe 1: 1kg (1000g) * 1 = 1000g
// Recipe 2: 400g * 2 = 800g
// Total Baby Potatoes = 1800g
const potatoes = items.find(i => i.name.toLowerCase() === 'baby potatoes');
assert(potatoes, 'Baby potatoes should be in shopping list');
assert.strictEqual(potatoes.quantity, 1800, 'Baby potatoes should combine to 1800g');
assert.strictEqual(potatoes.recipesUsed.size, 2, 'Should be used in 2 recipes');

console.log('✓ Baby Potatoes aggregation verified: 1800g used in', Array.from(potatoes.recipesUsed));
console.log('--- TEST PASSED ---');
