// scripts/add_calories_to_recipes.js
const fs = require('fs');
const path = require('path');

const allRecipesPath = path.join(__dirname, '..', 'extracted recipes', 'all_recipes.json');
const allRecipesData = JSON.parse(fs.readFileSync(allRecipesPath, 'utf8'));

const lgPath = path.join(__dirname, '..', 'LGrecipes.json');
const lgData = JSON.parse(fs.readFileSync(lgPath, 'utf8'));

// Create lookup for LG recipes by index
const lgCalories = new Map();
lgData.forEach((r, idx) => {
  lgCalories.set(193 + idx, r.calories);
});

allRecipesData.recipes.forEach((r, idx) => {
  const num = Number(r.recipe_number);
  let cal = 0;

  if (lgCalories.has(num)) {
    cal = lgCalories.get(num);
  } else if (num === 26 || num === 42) {
    cal = r.nutrition_per_100g.energy_kcal;
  } else {
    let totalW = 0;
    (r.ingredients || []).forEach(i => {
      let w = i.quantity || 50;
      if (i.unit === 'kg') w *= 1000;
      else if (i.unit === 'tsp') w *= 4;
      else if (i.unit === 'tbsp') w *= 12;
      else if (!i.unit) w = 60;
      totalW += w;
    });
    if (totalW < 100) totalW = 300;
    const servingW = totalW / (r.servings || 4);
    cal = Math.round(servingW * ((r.nutrition_per_100g.energy_kcal || 120) / 100));
  }

  r.calories_per_serving = cal;

  // Also update individual recipe file if exists
  const singleFilePadded = path.join(__dirname, '..', 'extracted recipes', `recipe_${String(num).padStart(2, '0')}.json`);
  const singleFilePlain = path.join(__dirname, '..', 'extracted recipes', `recipe_${num}.json`);
  const targetSingle = fs.existsSync(singleFilePadded) ? singleFilePadded : (fs.existsSync(singleFilePlain) ? singleFilePlain : null);

  if (targetSingle) {
    try {
      const singleData = JSON.parse(fs.readFileSync(targetSingle, 'utf8'));
      singleData.calories_per_serving = cal;
      fs.writeFileSync(targetSingle, JSON.stringify(singleData, null, 2), 'utf8');
    } catch (e) {
      console.warn(`Failed to update ${targetSingle}:`, e.message);
    }
  }
});

fs.writeFileSync(allRecipesPath, JSON.stringify(allRecipesData, null, 2), 'utf8');
console.log(`Updated all_recipes.json and individual recipe files with calories_per_serving for ${allRecipesData.recipes.length} recipes.`);
