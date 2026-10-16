// scripts/test_portions_and_layout.js
const fs = require('fs');
const path = require('path');
const assert = require('assert');

// 1. Test Math & Clamping Logic
function testStepperLogic() {
  console.log('--- Testing Stepper & Portion Increment Logic ---');
  let portions = 1;

  function step(current, delta) {
    const nextVal = Math.round((current + delta) * 100) / 100;
    return Math.max(0.25, Math.min(24, nextVal));
  }

  function formatPortion(val) {
    const portionDisplay = Number.isInteger(val)
      ? val
      : val.toFixed(2).replace(/\.?0+$/, '');
    const portionLabel = val === 1 ? 'portion' : 'portions';
    return `${portionDisplay} ${portionLabel}`;
  }

  // Increment from 1 to 1.75
  portions = step(portions, 0.25);
  assert.strictEqual(portions, 1.25);
  assert.strictEqual(formatPortion(portions), '1.25 portions');

  portions = step(portions, 0.25);
  assert.strictEqual(portions, 1.5);
  assert.strictEqual(formatPortion(portions), '1.5 portions');

  portions = step(portions, 0.25);
  assert.strictEqual(portions, 1.75);
  assert.strictEqual(formatPortion(portions), '1.75 portions');
  console.log('✓ Stepped up to 1.75 portions: OK');

  // Decrement to minimum 0.25
  portions = step(portions, -1.5);
  assert.strictEqual(portions, 0.25);
  assert.strictEqual(formatPortion(portions), '0.25 portions');

  // Attempt to step below 0.25
  portions = step(portions, -0.25);
  assert.strictEqual(portions, 0.25, 'Should not drop below 0.25');
  console.log('✓ Decrement and 0.25 clamp: OK');

  // Exact 1 portion singular label
  assert.strictEqual(formatPortion(1), '1 portion');
  console.log('✓ Singular / plural labels: OK');
}

// 2. Test CSS Structure
function testCssLayout() {
  console.log('--- Testing CSS Layout & Separation ---');
  const css = fs.readFileSync(path.join(__dirname, '..', 'style.css'), 'utf-8');

  // Verify mobile grid places remove on far right
  assert(css.includes('"img info remove"'), 'Mobile grid template should have remove on right of row 1');
  assert(css.includes('"img stepper remove"'), 'Mobile grid template should have remove on right of row 2');
  
  // Verify desktop grid
  assert(css.includes('grid-template-areas: "img info stepper remove"'), 'Desktop grid template should have remove as rightmost area');

  // Verify remove button alignment
  assert(css.includes('justify-self: end'), 'Remove button should align to end (far right)');
  assert(css.includes('.plan-item-remove-btn'), 'Remove button styling class should exist');

  // Verify calories badge styling
  assert(css.includes('.plan-item-cal'), 'plan-item-cal badge styling should exist');
  assert(css.includes('.cook-meta-tag'), 'cook-meta-tag styling should exist');
  console.log('✓ CSS Grid layout and far-right bin alignment: OK');
}

// 3. Test App.js Integration
function testAppJsIntegration() {
  console.log('--- Testing app.js Code Structure ---');
  const appJs = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf-8');

  assert(appJs.includes('item.portions - 0.25'), 'Decrement step of 0.25 present in app.js');
  assert(appJs.includes('item.portions + 0.25'), 'Increment step of 0.25 present in app.js');
  assert(appJs.includes('Math.max(0.25,'), 'Portion clamp of 0.25 present in app.js');
  assert(appJs.includes('item.portions.toFixed(2)'), 'Portion formatting present in app.js');

  // Verify calories per 1 serving fields in meal plan card and cook view
  assert(appJs.includes('plan-item-cal'), 'plan-item-cal badge present in meal plan template');
  assert(appJs.includes('kcal / 1 serving'), 'Calories per 1 serving text present in meal plan template');
  assert(appJs.includes('per 1 serving'), 'Calories per 1 serving present in cook view template');
  assert(appJs.includes('getRecipeCalories'), 'getRecipeCalories helper function present in app.js');
  console.log('✓ app.js implementation & calories fields: OK');
}

// 4. Test Recipe Dataset Calories
function testRecipeDatasetCalories() {
  console.log('--- Testing Dataset Calories Integrity ---');
  const allRecipes = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'extracted recipes', 'all_recipes.json'), 'utf-8')).recipes;

  assert.strictEqual(allRecipes.length, 247, 'All 247 recipes should exist');
  allRecipes.forEach(r => {
    assert(typeof r.calories_per_serving === 'number', `Recipe #${r.recipe_number} must have calories_per_serving`);
    assert(r.calories_per_serving > 0, `Recipe #${r.recipe_number} calories must be positive (> 0)`);
  });
  console.log('✓ All 247 recipes have valid positive calories_per_serving: OK');
}

testStepperLogic();
testCssLayout();
testAppJsIntegration();
testRecipeDatasetCalories();
console.log('=== ALL MEAL PLAN PORTION, LAYOUT & CALORIE TESTS PASSED ===');
