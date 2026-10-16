const fs = require('fs');
const path = require('path');

const nutrPath = path.resolve('extracted recipes/ingredients_nutrition.json');
const ingsPath = path.resolve('ingredients.json');

const nutr = JSON.parse(fs.readFileSync(nutrPath, 'utf8'));
const ings = JSON.parse(fs.readFileSync(ingsPath, 'utf8'));

// Exact and normalized map from ingredients.json
const ingsMap = new Map();
ings.forEach(i => {
  ingsMap.set(i.name.toLowerCase().trim(), i.storeSection);
  if (i.id) {
    ingsMap.set(i.id.toLowerCase().replace(/_/g, ' ').trim(), i.storeSection);
  }
});

// Alias dictionary for direct terms
const ALIASES = {
  'avo': 'fruit and veg',
  'avocado': 'fruit and veg',
  'avocados': 'fruit and veg',
  'baby potatoes': 'fruit and veg',
  'baby carrot medley': 'fruit and veg',
  'baby spinach': 'fruit and veg',
  'baby tomato medley': 'fruit and veg',
  'baby tomatoes': 'fruit and veg',
  'free-range chicken breasts': 'butcher',
  'free-range beef fillet': 'butcher',
  'beef mince': 'butcher',
  'free-range beef mince': 'butcher',
  'free-range debone lamb leg': 'butcher',
  'deboned lamb leg': 'butcher',
  'danish-style feta': 'dairy products',
  'danish-style feta cheese': 'dairy products',
  'olive oil': 'sauce and spice',
  'cooking oil': 'sauce and spice',
  'white basmati rice': 'grains',
  'cooked chopped tomatoes': 'other', // canned tomatoes
  'cooked chopped tomato': 'other',
  'tomato paste': 'other',
  'coconut milk': 'sauce and spice',
  'coconut cream': 'sauce and spice',
  'garlic clove': 'fruit and veg',
  'garlic cloves': 'fruit and veg',
  'spring onion': 'fruit and veg',
  'spring onions': 'fruit and veg',
  'fresh coriander': 'fruit and veg',
  'fresh mint': 'fruit and veg',
  'fresh basil': 'fruit and veg',
  'fresh parsley': 'fruit and veg',
  'fresh rosemary': 'fruit and veg',
  'fresh thyme': 'fruit and veg',
  'fresh dill': 'fruit and veg',
  'fresh oregano': 'fruit and veg',
  'fresh sage': 'fruit and veg',
  'line-caught hake fillets': 'butcher',
  'rainbow trout fillets': 'butcher',
  'hake': 'freezer',
  'prawns': 'freezer',
  'prawn meat': 'freezer',
  'squid': 'freezer',
  'calamari': 'freezer'
};

function determineStoreSection(item) {
  const name = item.name;
  const lName = name.toLowerCase().trim();

  // 1. Direct match in ingredients.json
  if (ingsMap.has(lName)) return ingsMap.get(lName);

  // 2. Direct match in ALIASES
  if (ALIASES[lName]) return ALIASES[lName];

  // 3. Rules by patterns
  // BUTCHER / MEAT / POULTRY / SEAFOOD
  if (/beef|steak|rump|sirloin|brisket|mince|biltong|fillet|schnitzel|lamb|mutton|chops|goulash|pork|bacon|ham|kassler|chorizo|ostrich|venison|duck|turkey/.test(lName)) {
    // Check if it's a rub or spice
    if (/rub|spice|seasoning/.test(lName)) return 'sauce and spice';
    return 'butcher';
  }
  if (/chicken/.test(lName)) {
    if (/paste|curry|stock|sauce/.test(lName)) return 'sauce and spice';
    return 'butcher';
  }
  if (/hake|trout|salmon|tuna|yellowtail|dorado|basa|fish/.test(lName)) {
    if (/sauce|paste/.test(lName)) return 'sauce and spice';
    if (/tuna in brine|canned/.test(lName)) return 'other';
    return 'butcher';
  }
  if (/prawn|shrimp|squid|calamari|mussel|seafood/.test(lName)) {
    return 'freezer';
  }

  // DAIRY PRODUCTS
  if (/milk|cheese|cheddar|mozzarella|parmesan|feta|halloumi|ricotta|yoghurt|yogurt|cream|crème|creme|butter|bocconcini|camembert|chevin|emmental|paneer|pecorino|sour cream|labneh/.test(lName)) {
    if (/butternut & ricotta ravioli|spinach & ricotta ravioli/.test(lName)) return 'grains'; // ravioli pasta
    if (/coconut milk|coconut cream/.test(lName)) return 'sauce and spice';
    return 'dairy products';
  }

  // BAKERY
  if (/roti|rotis|tortilla|tortillas|pita|bread|breads|baguette|bun|buns|flatbread|flatbreads|wrap|wraps|spanakopita|pizza base|breadcrumbs|panko/.test(lName)) {
    return 'bakery';
  }

  // GRAINS & PASTA
  if (/rice|quinoa|couscous|bulgur|pasta|spaghetti|fettuccine|tagliatelle|linguine|fusilli|conchiglie|orzo|ravioli|gnocchi|noodle|noodles|vermicelli|barley|spelt|millet|oats|flour|cornflour|maizena|baking soda|baking powder|sugar|cocoa powder/.test(lName)) {
    if (/wholegrain mustard dressing/.test(lName)) return 'sauce and spice';
    if (/rice wine vinegar/.test(lName)) return 'sauce and spice';
    return 'grains';
  }

  // SAUCE AND SPICE
  if (/oil|vinegar|sauce|paste|pesto|curry|dressing|marinade|glaze|mayo|mustard|chutney|baste|relish|molasses|tamari|sambal|sriracha|tahini|honey|syrup|stock|rub|spice|seasoning|powder|masala|cumin|paprika|turmeric|salt|pepper|peppercorn|flakes|dukkah|chilli flakes|zest/.test(lName)) {
    if (/black pepper|white pepper/.test(lName)) return 'sauce and spice';
    return 'sauce and spice';
  }

  // OTHER: Canned goods, legumes, nuts, seeds, dried fruits, eggs, pantry snacks
  if (/bean|beans|chickpea|chickpeas|cannellini|lentil|lentils|edamame/.test(lName)) {
    if (/green beans/.test(lName)) return 'fruit and veg';
    return 'other';
  }
  if (/almond|almonds|cashew|cashews|walnut|walnuts|peanut|peanuts|pecan|pecans|seed|seeds|sesame|sunflower|pumpkin seeds/.test(lName)) {
    return 'other';
  }
  if (/apricot|apricots|cranberries|dates|sultanas|raisins/.test(lName)) {
    return 'other';
  }
  if (/egg|eggs|egg white|egg whites|coffee|vanilla|protein powder|spray and cook|pop chips|nacho|nachos|falafel|canned|olives|capers|gherkin|pickled|skewers|nori/.test(lName)) {
    return 'other';
  }
  if (/cooked chopped tomato|tomato passata/.test(lName)) {
    return 'other';
  }
  if (/wine|brandy/.test(lName)) {
    return 'other';
  }
  if (/hummus|guacamole|raita/.test(lName)) {
    return 'other';
  }

  // FRUIT AND VEG (Default for fresh produce & fresh herbs)
  return 'fruit and veg';
}

const breakdown = {};
const validSections = new Set([
  'dairy products',
  'fruit and veg',
  'grains',
  'sauce and spice',
  'other',
  'bakery',
  'butcher',
  'freezer'
]);

const updatedNutr = nutr.map(item => {
  const newCat = determineStoreSection(item);
  if (!validSections.has(newCat)) {
    console.error('Invalid section assigned:', newCat, 'for', item.name);
  }
  breakdown[newCat] = (breakdown[newCat] || 0) + 1;
  return {
    ...item,
    category: newCat
  };
});

console.log('Total items in nutrition DB:', updatedNutr.length);
console.log('Category breakdown:');
console.table(breakdown);

// Save updated ingredients_nutrition.json
fs.writeFileSync(nutrPath, JSON.stringify(updatedNutr, null, 2), 'utf8');
console.log('Successfully updated ingredients_nutrition.json');

// Also update ingredients_nutrition.csv
const csvPath = path.resolve('extracted recipes/ingredients_nutrition.csv');
const csvHeaders = 'name,category,serving_size,energy_kcal,energy_kj,protein_g,fat_g,saturated_fat_g,carbs_g,sugars_g,fibre_g,sodium_mg,density_g_per_ml,piece_weight_g,recipe_occurrences\n';
const csvRows = updatedNutr.map(i => {
  return [
    `"${i.name.replace(/"/g, '""')}"`,
    i.category,
    i.serving_size || '100g',
    i.energy_kcal ?? 0,
    i.energy_kj ?? 0,
    i.protein_g ?? 0,
    i.fat_g ?? 0,
    i.saturated_fat_g ?? 0,
    i.carbs_g ?? 0,
    i.sugars_g ?? 0,
    i.fibre_g ?? 0,
    i.sodium_mg ?? 0,
    i.density_g_per_ml ?? 1.0,
    i.piece_weight_g ?? '',
    i.recipe_occurrences ?? 1
  ].join(',');
}).join('\n');

fs.writeFileSync(csvPath, csvHeaders + csvRows, 'utf8');
console.log('Successfully updated ingredients_nutrition.csv');
