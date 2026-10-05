const fs = require('fs');
const path = require('path');
const assert = require('assert');

const allRecipesPath = path.join(__dirname, '..', 'extracted recipes', 'all_recipes.json');
const allRecipesData = JSON.parse(fs.readFileSync(allRecipesPath, 'utf8'));
const recipes = allRecipesData.recipes;

// Simulate enrichment
function enrichRecipe(r) {
  const titleText = (r.title + ' ' + (r.subtitle || '')).toLowerCase();
  const ingText = (r.ingredients || []).map(i => i.name).join(' ').toLowerCase();
  const fullText = titleText + ' ' + ingText;

  let protein = 'Vegetarian';
  if (/beef|steak|fillet|rump|sirloin|brisket|meatball|meatloaf|bobotie/.test(fullText)) {
    protein = 'Beef';
  } else if (/lamb|mutton/.test(fullText)) {
    protein = 'Lamb';
  } else if (/chicken|poultry/.test(fullText)) {
    protein = 'Chicken';
  } else if (/pork|bacon|ham|kassler|chorizo/.test(fullText)) {
    protein = 'Pork';
  } else if (/fish|hake|trout|salmon|tuna|yellowtail|dorado|basa|squid|calamari|prawn|seafood|mussel/.test(fullText)) {
    protein = 'Fish & Seafood';
  } else if (/ostrich|venison|duck|turkey/.test(fullText)) {
    protein = 'Game';
  } else if (r.category === 'Vegetarian' || r.category === 'Veggie') {
    protein = 'Vegetarian';
  }
  return { ...r, protein };
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
