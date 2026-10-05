const fs = require('fs');
const path = require('path');
const assert = require('assert');

const allRecipesPath = path.join(__dirname, '..', 'extracted recipes', 'all_recipes.json');
const allRecipesData = JSON.parse(fs.readFileSync(allRecipesPath, 'utf8'));
const recipes = allRecipesData.recipes;

// Simulate enrichment
function enrichRecipe(r) {
  if (r.category === 'Vegetarian' || r.category === 'Veggie') return { ...r, protein: 'Vegetarian' };
  const titleText = (r.title + ' ' + (r.subtitle || '')).toLowerCase();
  if (/fish|hake|trout|salmon|tuna|yellowtail|dorado|basa|squid|calamari|prawn|seafood|mussel/.test(titleText)) return { ...r, protein: 'Fish & Seafood' };
  if (/chicken|poultry/.test(titleText)) return { ...r, protein: 'Chicken' };
  if (/lamb|mutton/.test(titleText)) return { ...r, protein: 'Lamb' };
  if (/pork|bacon|\bham\b|kassler|chorizo/.test(titleText)) return { ...r, protein: 'Pork' };
  if (/ostrich|venison|duck|turkey/.test(titleText)) return { ...r, protein: 'Game' };
  if (/beef|steak|rump|sirloin|brisket|bobotie/.test(titleText)) return { ...r, protein: 'Beef' };

  const ingNames = (r.ingredients || []).map(i => i.name.toLowerCase()).filter(n => !n.includes('stock') && !n.includes('broth')).join(' ');
  if (/fish|hake|trout|salmon|tuna|yellowtail|dorado|basa|squid|calamari|prawn|seafood|mussel/.test(ingNames)) return { ...r, protein: 'Fish & Seafood' };
  if (/chicken|poultry/.test(ingNames)) return { ...r, protein: 'Chicken' };
  if (/lamb|mutton/.test(ingNames)) return { ...r, protein: 'Lamb' };
  if (/pork|bacon|\bham\b|kassler|chorizo/.test(ingNames)) return { ...r, protein: 'Pork' };
  if (/ostrich|venison|duck|turkey/.test(ingNames)) return { ...r, protein: 'Game' };
  if (/beef|rump|sirloin|brisket|mince|biltong|fillet/.test(ingNames)) return { ...r, protein: 'Beef' };
  return { ...r, protein: 'Vegetarian' };
}

const enrichedRecipes = recipes.map(enrichRecipe);

// Test quick plan logic
function generateQuickPlan(recipesList, count = 3) {
  const desiredProteins = ['Chicken', 'Beef', 'Vegetarian', 'Fish & Seafood', 'Pork', 'Lamb'];
  const chosen = [];
  const usedIds = new Set();

  for (const prot of desiredProteins) {
    if (chosen.length >= count) break;
    const candidates = recipesList.filter(r => r.protein === prot && !usedIds.has(Number(r.recipe_number)));
    if (candidates.length > 0) {
      const pick = candidates[Math.floor(Math.random() * candidates.length)];
      chosen.push(pick);
      usedIds.add(Number(pick.recipe_number));
    }
  }

  return chosen.map(r => ({
    id: Number(r.recipe_number),
    portions: Number(r.servings) || 4
  }));
}

const plan = generateQuickPlan(enrichedRecipes, 3);
console.log('Generated plan with', plan.length, 'meals:', plan);
assert.strictEqual(plan.length, 3, 'Should generate exactly 3 meals');
plan.forEach(item => {
  assert(typeof item.id === 'number', 'ID must be a number');
  assert(item.id > 0, 'ID must be positive');
  assert(item.portions >= 1, 'Portions must be >= 1');
});

// Import aggregation logic from test_shopping_full.js
const testShopping = require('./test_shopping_full.js');
console.log('✓ Quick plan logic verified successfully!');
