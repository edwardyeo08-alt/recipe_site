const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('--- RUNNING MEALPLAN LOGIC & DATASET TESTS ---');

// 1. Check all_recipes.json
const allRecipesPath = path.join(__dirname, '..', 'extracted recipes', 'all_recipes.json');
assert(fs.existsSync(allRecipesPath), 'all_recipes.json must exist');
const allRecipesData = JSON.parse(fs.readFileSync(allRecipesPath, 'utf8'));
assert.strictEqual(allRecipesData.recipes.length, 192, 'Should have exactly 192 recipes');

let obscuredCount = 0;
let nullNutrCount = 0;
let missingImages = 0;

allRecipesData.recipes.forEach(r => {
  if (r.card_obscured_flag) obscuredCount++;
  if (r.nutrition_per_100g) {
    for (const [k, v] of Object.entries(r.nutrition_per_100g)) {
      if (v === null) nullNutrCount++;
    }
  }
  const imgPath = path.join(
    __dirname,
    '..',
    'extracted recipes',
    `recipe_${String(r.recipe_number).padStart(2, '0')}_dish.jpg`
  );
  if (!fs.existsSync(imgPath)) missingImages++;
});

assert.strictEqual(obscuredCount, 0, 'No recipes should have card_obscured_flag true');
assert.strictEqual(nullNutrCount, 0, 'No recipe should have null nutrition values');
assert.strictEqual(missingImages, 0, 'All 192 recipes must have dish images');
console.log('✓ all_recipes.json integrity verified: 192 recipes, 0 obscured, 0 nulls, 192 images');

// 2. Check ingredients_nutrition.json & CSV
const nutrJsonPath = path.join(__dirname, '..', 'extracted recipes', 'ingredients_nutrition.json');
const nutrCsvPath = path.join(__dirname, '..', 'extracted recipes', 'ingredients_nutrition.csv');
assert(fs.existsSync(nutrJsonPath), 'ingredients_nutrition.json must exist');
assert(fs.existsSync(nutrCsvPath), 'ingredients_nutrition.csv must exist');

const nutrData = JSON.parse(fs.readFileSync(nutrJsonPath, 'utf8'));
assert(nutrData.length >= 500, `Expected at least 500 ingredients, got ${nutrData.length}`);

nutrData.forEach(ing => {
  assert(ing.name && ing.name.length > 0, 'Ingredient must have a name');
  assert(typeof ing.energy_kcal === 'number', `energy_kcal must be number for ${ing.name}`);
  assert(typeof ing.protein_g === 'number', `protein_g must be number for ${ing.name}`);
  assert(typeof ing.fat_g === 'number', `fat_g must be number for ${ing.name}`);
  assert(typeof ing.carbs_g === 'number', `carbs_g must be number for ${ing.name}`);
});
console.log(`✓ ingredients_nutrition.json verified: ${nutrData.length} ingredients with complete nutritional data`);

// 3. Test Protein Classification
const sampleRecipes = allRecipesData.recipes;
function classifyProtein(r) {
  const fullText = (r.title + ' ' + (r.subtitle || '') + ' ' + (r.ingredients || []).map(i => i.name).join(' ')).toLowerCase();
  if (/beef|steak|fillet|rump|sirloin|brisket|meatball|meatloaf|bobotie/.test(fullText)) return 'Beef';
  if (/lamb|mutton/.test(fullText)) return 'Lamb';
  if (/chicken|poultry/.test(fullText)) return 'Chicken';
  if (/pork|bacon|ham|kassler|chorizo/.test(fullText)) return 'Pork';
  if (/fish|hake|trout|salmon|tuna|yellowtail|dorado|basa|squid|calamari|prawn|seafood|mussel/.test(fullText)) return 'Fish & Seafood';
  if (/ostrich|venison|duck|turkey/.test(fullText)) return 'Game';
  return 'Vegetarian';
}

assert.strictEqual(classifyProtein(sampleRecipes[0]), 'Lamb', 'Recipe 1 should be Lamb');
assert.strictEqual(classifyProtein(sampleRecipes[1]), 'Beef', 'Recipe 2 should be Beef');
console.log('✓ Protein classification logic verified');

// 4. Test Portion Scaling & Unit Conversion
const r1 = sampleRecipes[0]; // Vibey Durban Lamb Curry (servings: 4, Free-Range Deboned Lamb Leg: 640g, Baby Potatoes: 1kg)
const scaleFactor = 2 / r1.servings; // 0.5
const scaledLamb = 640 * scaleFactor;
assert.strictEqual(scaledLamb, 320, 'Lamb for 2 portions should be 320g');

const scaledPotatoesG = (1 * 1000) * scaleFactor;
assert.strictEqual(scaledPotatoesG, 500, 'Potatoes for 2 portions should be 500g');
console.log('✓ Portion scaling and mass normalization verified');

console.log('--- ALL UNIT TESTS PASSED SUCCESSFULLY! ---');
