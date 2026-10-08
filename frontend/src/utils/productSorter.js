const sizeOrder = {
  'nb': 1,
  'newborn': 1,
  's': 2,
  'small': 2,
  'm': 3,
  'medium': 3,
  'l': 4,
  'large': 4,
  'xl': 5,
  'xxl': 6,
  'xxxl': 7
};

export function getProductSortKey(prod) {
  if (!prod) return { brandWeight: 99, sizeWeight: 99, count: 0, name: '' };
  const name = (prod.name || '').toLowerCase();
  const sku = (prod.sku || '').toLowerCase();

  let brandWeight = 3;
  if (name.includes('femi9') || sku.includes('femi9')) brandWeight = 1;
  else if (name.includes('lumi9') || sku.includes('lumi9')) brandWeight = 2;

  let sizeWeight = 99;
  let count = 0;

  if (brandWeight === 2) {
    // Lumi9 Baby Diapers: NB -> S -> M -> L -> XL -> XXL, small to large by piece count
    // 1. Detect size
    if (/\b(nb|newborn)\b/i.test(name) || /-nb-/i.test(sku)) {
      sizeWeight = 1;
    } else if (/\b(s|small)\b/i.test(name) || /-s-/i.test(sku)) {
      sizeWeight = 2;
    } else if (/\b(m|medium)\b/i.test(name) || /-m-/i.test(sku)) {
      sizeWeight = 3;
    } else if (/\b(xl|extra\s*large)\b/i.test(name) || /-xl-/i.test(sku)) {
      sizeWeight = 5;
    } else if (/\b(xxl)\b/i.test(name) || /-xxl-/i.test(sku)) {
      sizeWeight = 6;
    } else if (/\b(l|large)\b/i.test(name) || /-l-/i.test(sku)) {
      sizeWeight = 4;
    }

    // 2. Detect count: e.g. (3), (24), (54) or -3, -24, -54
    const countMatch = name.match(/\((\d+)\)/) || sku.match(/-(\d+)$/) || name.match(/\b(\d+)\s*(pcs|count|p)?\b/i);
    if (countMatch) {
      count = parseInt(countMatch[1], 10) || 0;
    }
  } else if (brandWeight === 1) {
    // Femi9: 180mm -> 290mm -> 330mm -> Combo
    const mmMatch = name.match(/(\d+)mm/i);
    sizeWeight = mmMatch ? parseInt(mmMatch[1], 10) : (name.includes('combo') ? 9999 : 50);
    const pcsMatch = name.match(/(\d+)\s*pcs/i) || sku.match(/-(\d+)p/i);
    count = pcsMatch ? parseInt(pcsMatch[1], 10) : 0;
  }

  return { brandWeight, sizeWeight, count, name };
}

export function compareProducts(a, b) {
  const keyA = getProductSortKey(a);
  const keyB = getProductSortKey(b);

  if (keyA.brandWeight !== keyB.brandWeight) return keyA.brandWeight - keyB.brandWeight;
  if (keyA.sizeWeight !== keyB.sizeWeight) return keyA.sizeWeight - keyB.sizeWeight;
  if (keyA.count !== keyB.count) return keyA.count - keyB.count;
  return keyA.name.localeCompare(keyB.name);
}

export function sortProducts(products) {
  if (!Array.isArray(products)) return [];
  return [...products].sort(compareProducts);
}

export default sortProducts;
