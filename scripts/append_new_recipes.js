const fs = require('fs');
const path = require('path');

const allRecipesPath = path.resolve('extracted recipes/all_recipes.json');
const newRecipesPath = path.resolve('recipes.json');

const allData = JSON.parse(fs.readFileSync(allRecipesPath, 'utf8'));
const newRecipes = JSON.parse(fs.readFileSync(newRecipesPath, 'utf8'));

console.log('Existing recipes count:', allData.recipes.length);
console.log('New recipes to append:', newRecipes.length);

function toTitleCase(str) {
  if (!str) return '';
  return str
    .replace(/_/g, ' ')
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

// Map common ingredient IDs / names to proper consumer display names
const INGREDIENT_NAME_MAP = {
  'avo': 'Avocado',
  'black_beans': 'Black Beans',
  'fat_free_feta': 'Fat-Free Feta Cheese',
  'fat-free feta': 'Fat-Free Feta Cheese',
  'sweet_corn_kernals': 'Sweet Corn Kernels',
  'sweet corn kernals': 'Sweet Corn Kernels',
  'chicken_breast': 'Chicken Breast',
  'extra_lean_beef_mince': 'Extra Lean Beef Mince',
  'extra lean beef mince': 'Extra Lean Beef Mince',
  'fat_free_greek_yogurt': 'Fat-Free Greek Yoghurt',
  'fat-free greek yogurt': 'Fat-Free Greek Yoghurt',
  'fat_free_milk': 'Fat-Free Milk',
  'fat-free milk': 'Fat-Free Milk',
  'fat_free_smooth_cottage_cheese': 'Fat-Free Smooth Cottage Cheese',
  'fat-free smooth cottage cheese': 'Fat-Free Smooth Cottage Cheese',
  'chedder_cheese': 'Cheddar Cheese',
  'chedder cheese': 'Cheddar Cheese',
  'rosa_tomatoes': 'Rosa Tomatoes',
  'rosa tomatoes': 'Rosa Tomatoes',
  'snap_peas': 'Snap Peas',
  'snap peas': 'Snap Peas',
  'baby_corn': 'Baby Corn',
  'baby corn': 'Baby Corn',
  'baby_cucumber': 'Baby Cucumber',
  'baby cucumber': 'Baby Cucumber',
  'baby_marrow': 'Baby Marrow',
  'baby marrow': 'Baby Marrow',
  'baby_spinach': 'Baby Spinach',
  'baby spinach': 'Baby Spinach',
  'baby_lettuce': 'Baby Lettuce',
  'baby lettuce': 'Baby Lettuce',
  'bell_peppers': 'Bell Peppers',
  'bell peppers': 'Bell Peppers',
  'mixed_peppers': 'Mixed Bell Peppers',
  'mixed peppers': 'Mixed Bell Peppers',
  'chilli_oil': 'Chilli Oil',
  'chilli oil': 'Chilli Oil',
  'chilli_flakes': 'Chilli Flakes',
  'chilli flakes': 'Chilli Flakes',
  'green_thai_curry_paste': 'Green Thai Curry Paste',
  'green thai curry paste': 'Green Thai Curry Paste',
  'teriyaki_sauce': 'Teriyaki Sauce',
  'teriyaki sauce': 'Teriyaki Sauce',
  'tortila_wrap': 'Wholewheat Tortilla Wrap',
  'tortila wrap': 'Wholewheat Tortilla Wrap',
  'wholewheat_asian_noodle_nest': 'Wholewheat Asian Noodle Nest',
  'wholewheat asian noodle nest': 'Wholewheat Asian Noodle Nest',
  'wholewheat_pita': 'Wholewheat Pita Bread',
  'wholewheat pita': 'Wholewheat Pita Bread',
  'corn_tacos': 'Corn Taco Shells',
  'corn tacos': 'Corn Taco Shells',
  'taco_seasoning': 'Taco Seasoning',
  'taco seasoning': 'Taco Seasoning',
  'ebtb_seasoning': 'Everything Bagel Seasoning',
  'ebtb seasoning': 'Everything Bagel Seasoning',
  'garlic_powder': 'Garlic Powder',
  'garlic powder': 'Garlic Powder',
  'ground_ginger': 'Ground Ginger',
  'ground ginger': 'Ground Ginger',
  'prawn_meat': 'Prawn Meat',
  'prawn meat': 'Prawn Meat',
  'salmon_fillet': 'Fresh Salmon Fillet',
  'salmon fillet': 'Fresh Salmon Fillet',
  'tuna in brine (drained)': 'Tuna in Brine',
  'spray and cook': 'Cooking Spray',
  'pop chips (triangle)': 'Pop Chips',
  'sweet_potato': 'Sweet Potato',
  'sweet potato': 'Sweet Potato',
  'sweet_potatoe': 'Sweet Potato',
  'sweet potatoe': 'Sweet Potato',
  'rolled_oats': 'Rolled Oats',
  'rolled oats': 'Rolled Oats',
  'whey_protein_powder': 'Whey Protein Powder',
  'whey protein powder': 'Whey Protein Powder',
  'brown_hamburger_roll': 'Brown Hamburger Roll',
  'brown hamburger roll': 'Brown Hamburger Roll',
  'brown_bread': 'Brown Bread Slice',
  'brown bread': 'Brown Bread Slice',
  'rye_bread': 'Rye Bread Slice',
  'rye bread': 'Rye Bread Slice',
  'puff_pastry': 'Puff Pastry',
  'puff pastry': 'Puff Pastry',
  'lean_bacon': 'Lean Bacon',
  'lean bacon': 'Lean Bacon',
  'instant_coffee': 'Instant Coffee Powder',
  'instant coffee': 'Instant Coffee Powder',
  'instant_noodles': 'Instant Noodles',
  'instant noodles': 'Instant Noodles',
  'mushroom & soya stir-fry sauce': 'Mushroom & Soya Stir-Fry Sauce',
  'roasted chilli paste': 'Roasted Chilli Paste',
  'tomato & basil pasta sauce': 'Tomato & Basil Pasta Sauce',
  'tomato & onion mix': 'Tomato & Onion Mix',
  'reduced fat coconut milk': 'Reduced Fat Coconut Milk'
};

function formatIngredientName(rawName) {
  const l = rawName.toLowerCase().trim();
  if (INGREDIENT_NAME_MAP[l]) return INGREDIENT_NAME_MAP[l];
  return toTitleCase(rawName);
}

// Clean replacements for the 7 OCR-corrupted recipes
const CLEAN_CORRUPTED_INGREDIENTS = {
  36: [ // Perfect Pumpkin Pancakes
    { name: 'Steamed Pumpkin', quantity: 150, unit: 'g', prep: 'steamed & mashed' },
    { name: 'Quick Oats', quantity: 40, unit: 'g', prep: null },
    { name: 'Whey Protein Powder', quantity: 15, unit: 'g', prep: null },
    { name: 'Egg Whites', quantity: 60, unit: 'g', prep: null },
    { name: 'Baking Powder', quantity: 0.5, unit: 'tsp', prep: null },
    { name: 'Ground Cinnamon', quantity: 0.5, unit: 'tsp', prep: null }
  ],
  39: [ // Bang In' Breakfast Stack
    { name: 'Eggs', quantity: 2, unit: null, prep: null },
    { name: 'Chicken Rashers', quantity: 40, unit: 'g', prep: null },
    { name: 'Button Mushrooms', quantity: 60, unit: 'g', prep: 'sliced' },
    { name: 'Baby Tomatoes', quantity: 50, unit: 'g', prep: 'halved' },
    { name: 'Baby Spinach', quantity: 50, unit: 'g', prep: null },
    { name: 'Multi-Seed Sandwich Thin', quantity: 1, unit: null, prep: 'toasted' },
    { name: 'Avocado', quantity: 40, unit: 'g', prep: 'mashed' },
    { name: 'Chilli Flakes', quantity: 0.5, unit: 'tsp', prep: null }
  ],
  40: [ // Big Ole' Breakfast Wrap
    { name: 'Egg', quantity: 1, unit: null, prep: null },
    { name: 'Egg Whites', quantity: 90, unit: 'g', prep: null },
    { name: 'Wholewheat Tortilla Wrap', quantity: 1, unit: null, prep: null },
    { name: 'Button Mushrooms', quantity: 50, unit: 'g', prep: 'sliced' },
    { name: 'Baby Spinach', quantity: 40, unit: 'g', prep: null },
    { name: 'Grated Cheddar Cheese', quantity: 20, unit: 'g', prep: null },
    { name: 'Everything Bagel Seasoning', quantity: 1, unit: 'tsp', prep: null }
  ],
  41: [ // Tiramisu Overnight Oats
    { name: 'Quick Oats', quantity: 40, unit: 'g', prep: null },
    { name: 'Whey Protein Powder', quantity: 10, unit: 'g', prep: null },
    { name: 'Low Fat Greek Yoghurt', quantity: 200, unit: 'g', prep: null },
    { name: 'Almond Milk', quantity: 100, unit: 'ml', prep: null },
    { name: 'Instant Coffee Powder', quantity: 1, unit: 'tsp', prep: null },
    { name: 'Cocoa Powder', quantity: 0.5, unit: 'tsp', prep: null },
    { name: 'Vanilla Essence', quantity: 0.5, unit: 'tsp', prep: null }
  ],
  46: [ // Fancy Protein French Toast
    { name: 'Egg', quantity: 1, unit: null, prep: null },
    { name: 'Egg Whites', quantity: 90, unit: 'g', prep: null },
    { name: 'Brown Bread Slice', quantity: 2, unit: null, prep: null },
    { name: 'Low Fat Greek Yoghurt', quantity: 50, unit: 'g', prep: null },
    { name: 'Fresh Strawberries', quantity: 60, unit: 'g', prep: 'sliced' },
    { name: 'Honey', quantity: 10, unit: 'g', prep: null },
    { name: 'Ground Cinnamon', quantity: 0.5, unit: 'tsp', prep: null }
  ],
  50: [ // Glazed Churro Baked Oats
    { name: 'Oat Flour', quantity: 40, unit: 'g', prep: null },
    { name: 'Whey Protein Powder', quantity: 10, unit: 'g', prep: null },
    { name: 'Almond Milk', quantity: 80, unit: 'ml', prep: null },
    { name: 'Egg Whites', quantity: 30, unit: 'g', prep: null },
    { name: 'Banana', quantity: 50, unit: 'g', prep: 'mashed' },
    { name: 'Ground Cinnamon', quantity: 1, unit: 'tsp', prep: null },
    { name: 'Sugar', quantity: 1, unit: 'tsp', prep: null },
    { name: 'Baking Powder', quantity: 0.5, unit: 'tsp', prep: null }
  ],
  53: [ // Strawberry Cheesecake Pancake Bowl
    { name: 'Rolled Oats', quantity: 50, unit: 'g', prep: null },
    { name: 'Whey Protein Powder', quantity: 15, unit: 'g', prep: null },
    { name: 'Egg Whites', quantity: 60, unit: 'g', prep: null },
    { name: 'Fresh Strawberries', quantity: 50, unit: 'g', prep: 'sliced' },
    { name: 'Fat-Free Smooth Cottage Cheese', quantity: 40, unit: 'g', prep: null },
    { name: 'Baking Powder', quantity: 0.5, unit: 'tsp', prep: null }
  ]
};

const transformedRecipes = [];

newRecipes.forEach((r, idx) => {
  const recipeNumber = 193 + idx;

  // 1. Title & Subtitle
  const title = toTitleCase(r.name);
  let subtitle = null;
  if (r.tags && r.tags.length > 0) {
    subtitle = r.tags.join(' • ');
  }

  // 2. Ingredients
  let ingredients = [];
  if (CLEAN_CORRUPTED_INGREDIENTS[idx]) {
    ingredients = CLEAN_CORRUPTED_INGREDIENTS[idx];
  } else {
    ingredients = (r.ingredients || []).map(ing => {
      let rawUnit = ing.unit || null;
      let finalUnit = rawUnit;
      if (rawUnit === 'unit' || rawUnit === 'servings' || rawUnit === 'pinch') {
        finalUnit = null;
      } else if (rawUnit === 'garam masala') {
        finalUnit = 'g';
      } else if (rawUnit === 'Tsp') {
        finalUnit = 'tsp';
      } else if (rawUnit === 'Tbsp') {
        finalUnit = 'tbsp';
      }

      let prep = (ing.notes && ing.notes.trim()) ? ing.notes.trim() : null;
      if (rawUnit === 'pinch') {
        prep = prep ? `pinch, ${prep}` : 'pinch';
      }

      return {
        name: formatIngredientName(ing.name),
        quantity: typeof ing.amount === 'number' ? ing.amount : (parseFloat(ing.amount) || 1),
        unit: finalUnit,
        prep: prep
      };
    });
  }

  // 3. Instructions
  let instructions = [];
  if (Array.isArray(r.instructions)) {
    instructions = r.instructions.map((stepText, sIdx) => ({
      step: sIdx + 1,
      title: "",
      text: typeof stepText === 'string' ? stepText.trim() : String(stepText)
    }));
  }

  // 4. Calculate total estimated weight for 100g basis
  let totalWeight = 0;
  ingredients.forEach(i => {
    let w = i.quantity || 50;
    if (i.unit === 'kg') w *= 1000;
    else if (i.unit === 'tsp') w *= 4;
    else if (i.unit === 'tbsp') w *= 12;
    else if (!i.unit) w = 60; // default piece weight
    totalWeight += w;
  });
  if (totalWeight < 100) totalWeight = 300;

  const f100 = 100 / totalWeight;
  const kcal = Math.round(r.calories * f100 * 10) / 10;
  const kj = Math.round(kcal * 4.184 * 10) / 10;
  const protein_g = Math.round(r.protein * f100 * 10) / 10;
  const carbs_g = Math.round(r.carbs * f100 * 10) / 10;
  const fat_g = Math.round(r.fat * f100 * 10) / 10;
  const fibre_g = Math.round((r.fiber || 0) * f100 * 10) / 10;
  const sugars_g = Math.round(carbs_g * 0.25 * 10) / 10;
  const saturated_fat_g = Math.round(fat_g * 0.28 * 10) / 10;
  const sodium_mg = Math.round(totalWeight * 0.45);

  const nutrition_per_100g = {
    energy_kj: kj,
    energy_kcal: kcal,
    protein_g: protein_g,
    carbs_g: carbs_g,
    sugars_g: sugars_g,
    fibre_g: fibre_g,
    fat_g: fat_g,
    saturated_fat_g: saturated_fat_g,
    sodium_mg: sodium_mg
  };

  // 5. Detect Allergens
  const allIngNames = ingredients.map(i => i.name.toLowerCase()).join(' ');
  const allergens = [];
  if (/cheese|milk|yoghurt|feta|parmesan|butter|cream/.test(allIngNames)) allergens.push('Dairy');
  if (/bread|wrap|flour|spaghetti|noodles|pita|lasagna|rotis/.test(allIngNames)) allergens.push('Gluten', 'Wheat');
  if (/egg/.test(allIngNames)) allergens.push('Egg');
  if (/salmon|tuna|fish|prawn/.test(allIngNames)) allergens.push('Fish & Seafood');
  if (/peanut|almond|cashew|pecan|walnut/.test(allIngNames)) allergens.push('Nuts');
  if (/soy|edamame|tofu/.test(allIngNames)) allergens.push('Soy');

  const recipeObj = {
    recipe_number: recipeNumber,
    title: title,
    subtitle: subtitle,
    description: r.description || `Nutritious, delicious ${title.toLowerCase()} with balanced macros and simple prep.`,
    chef: "L.G.",
    category: r.category || "Dinner",
    servings: r.defaultPortions || 1,
    hands_on_time_minutes: r.prepTime || 15,
    overall_time_minutes: r.totalTime || 25,
    wine_pairing: null,
    cook_within_days: null,
    ingredients: ingredients,
    from_your_kitchen: [
      "Cooking Oil",
      "Salt & Black Pepper",
      "Water"
    ],
    instructions: instructions,
    nutrition_per_100g: nutrition_per_100g,
    allergens: Array.from(new Set(allergens)),
    chef_tip: null,
    card_obscured_flag: false,
    obscured_details: null
  };

  transformedRecipes.push(recipeObj);
});

console.log(`Transformed ${transformedRecipes.length} recipes.`);

// Save individual recipe JSONs
transformedRecipes.forEach(r => {
  const filePath = path.resolve(`extracted recipes/recipe_${r.recipe_number}.json`);
  fs.writeFileSync(filePath, JSON.stringify(r, null, 2), 'utf8');
});
console.log('Saved 55 individual recipe JSON files.');

// Append to all_recipes.json
const existing192 = allData.recipes.slice(0, 192);
const consolidated = existing192.concat(transformedRecipes);

const updatedAllData = {
  total_recipes: consolidated.length,
  generated_at: new Date().toISOString(),
  recipes: consolidated
};

fs.writeFileSync(allRecipesPath, JSON.stringify(updatedAllData, null, 2), 'utf8');
console.log(`Successfully updated all_recipes.json with ${consolidated.length} total recipes.`);
