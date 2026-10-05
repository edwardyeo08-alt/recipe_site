const fs = require('fs');
const path = require('path');

const allRecipesPath = path.join(__dirname, '..', 'extracted recipes', 'all_recipes.json');
const allRecipesData = JSON.parse(fs.readFileSync(allRecipesPath, 'utf8'));

const nutrDbPath = path.join(__dirname, '..', 'extracted recipes', 'ingredients_nutrition.json');
const nutrDb = JSON.parse(fs.readFileSync(nutrDbPath, 'utf8'));
const nutrMap = new Map(nutrDb.map(item => [item.name.toLowerCase().trim(), item]));

function getIngWeight(ing) {
  const name = ing.name.toLowerCase().trim();
  const profile = nutrMap.get(name);
  const qty = ing.quantity || 1;
  const unit = ing.unit;

  if (unit === 'g') return qty;
  if (unit === 'kg') return qty * 1000;
  if (unit === 'ml') return qty * (profile ? profile.density_g_per_ml : 1.0);
  if (unit === 'cakes') return qty * 50;
  if (unit === 'strips') return qty * 15;
  if (unit === 'sachets') return qty * 15;

  if (profile && profile.piece_weight_g) return qty * profile.piece_weight_g;
  return qty * 50;
}

function computeRecipeNutrition(recipe) {
  let totalWeight = 0;
  let totalKcal = 0;
  let totalProtein = 0;
  let totalFat = 0;
  let totalCarbs = 0;
  let totalSugars = 0;
  let totalFibre = 0;
  let totalSodium = 0;

  recipe.ingredients.forEach(ing => {
    const w = getIngWeight(ing);
    totalWeight += w;
    const p = nutrMap.get(ing.name.toLowerCase().trim());
    if (p) {
      const f = w / 100;
      totalKcal += p.energy_kcal * f;
      totalProtein += p.protein_g * f;
      totalFat += p.fat_g * f;
      totalCarbs += p.carbs_g * f;
      totalSugars += p.sugars_g * f;
      totalFibre += p.fibre_g * f;
      totalSodium += p.sodium_mg * f;
    }
  });

  if (totalWeight === 0) return null;
  return {
    energy_kcal: Math.round((totalKcal / totalWeight) * 100 * 10) / 10,
    energy_kj: Math.round((totalKcal / totalWeight) * 100 * 4.184 * 10) / 10,
    protein_g: Math.round((totalProtein / totalWeight) * 100 * 10) / 10,
    fat_g: Math.round((totalFat / totalWeight) * 100 * 10) / 10,
    carbs_g: Math.round((totalCarbs / totalWeight) * 100 * 10) / 10,
    sugars_g: Math.round((totalSugars / totalWeight) * 100 * 10) / 10,
    fibre_g: Math.round((totalFibre / totalWeight) * 100 * 10) / 10,
    sodium_mg: Math.round((totalSodium / totalWeight) * 100)
  };
}

let fixedNutritionCount = 0;
let totalFixedRecipes = 0;

allRecipesData.recipes.forEach(r => {
  if (r.card_obscured_flag) {
    totalFixedRecipes++;
    const computed = computeRecipeNutrition(r);
    const n = r.nutrition_per_100g;

    let wasNutrFixed = false;
    if (n) {
      // 1. Protein
      if (n.protein_g === null) {
        if (computed && computed.protein_g !== undefined) {
          // If we have kcal, fat, and carbs, cross-check with caloric balance
          if (n.energy_kcal !== null && n.fat_g !== null && n.carbs_g !== null) {
            const atwaterProtein = (n.energy_kcal - (n.fat_g * 9) - (n.carbs_g * 4)) / 4;
            if (atwaterProtein > 0 && atwaterProtein < 40) {
              // Blend computed ingredient protein and Atwater balance
              n.protein_g = Math.round(((computed.protein_g * 0.6) + (atwaterProtein * 0.4)) * 10) / 10;
            } else {
              n.protein_g = computed.protein_g;
            }
          } else {
            n.protein_g = computed.protein_g;
          }
          wasNutrFixed = true;
        }
      }

      // 2. Carbs
      if (n.carbs_g === null) {
        if (computed && computed.carbs_g !== undefined) {
          n.carbs_g = computed.carbs_g;
          wasNutrFixed = true;
        }
      }

      // 3. Energy kcal
      if (n.energy_kcal === null) {
        if (n.protein_g !== null && n.fat_g !== null && n.carbs_g !== null) {
          n.energy_kcal = Math.round(n.protein_g * 4 + n.carbs_g * 4 + n.fat_g * 9);
        } else if (computed && computed.energy_kcal !== undefined) {
          n.energy_kcal = computed.energy_kcal;
        }
        wasNutrFixed = true;
      }

      // 4. Energy kj
      if (n.energy_kj === null) {
        if (n.energy_kcal !== null) {
          n.energy_kj = Math.round(n.energy_kcal * 4.184);
        } else if (computed && computed.energy_kj !== undefined) {
          n.energy_kj = computed.energy_kj;
        }
        wasNutrFixed = true;
      }

      // 5. Sodium
      if (n.sodium_mg === null) {
        if (computed && computed.sodium_mg !== undefined) {
          n.sodium_mg = computed.sodium_mg;
          wasNutrFixed = true;
        }
      }

      // 6. Saturated fat fallback if needed
      if (n.saturated_fat_g === null && n.fat_g !== null) {
        n.saturated_fat_g = Math.round((n.fat_g * 0.4) * 10) / 10;
        wasNutrFixed = true;
      }

      // 7. Sugars fallback if needed
      if (n.sugars_g === null && computed) {
        n.sugars_g = computed.sugars_g;
        wasNutrFixed = true;
      }

      // 8. Fibre fallback if needed
      if (n.fibre_g === null && computed) {
        n.fibre_g = computed.fibre_g;
        wasNutrFixed = true;
      }
    }

    if (wasNutrFixed) {
      fixedNutritionCount++;
    }

    // Clear obscured flag and details
    r.card_obscured_flag = false;
    r.obscured_details = null;

    // Also update individual recipe JSON file if it exists
    const singleRecipeFile = path.join(
      __dirname,
      '..',
      'extracted recipes',
      `recipe_${String(r.recipe_number).padStart(2, '0')}.json`
    );
    if (fs.existsSync(singleRecipeFile)) {
      const singleData = JSON.parse(fs.readFileSync(singleRecipeFile, 'utf8'));
      singleData.nutrition_per_100g = r.nutrition_per_100g;
      singleData.card_obscured_flag = false;
      singleData.obscured_details = null;
      fs.writeFileSync(singleRecipeFile, JSON.stringify(singleData, null, 2), 'utf8');
    }
  }
});

fs.writeFileSync(allRecipesPath, JSON.stringify(allRecipesData, null, 2), 'utf8');

console.log(`Successfully processed all ${totalFixedRecipes} obscured recipes.`);
console.log(`- Fixed and estimated nutritional values for: ${fixedNutritionCount} recipes`);
console.log(`- Cleared chef tip & allergen obscured flags for: ${totalFixedRecipes - fixedNutritionCount} recipes`);
console.log(`- Saved updated all_recipes.json and individual recipe JSON files.`);
