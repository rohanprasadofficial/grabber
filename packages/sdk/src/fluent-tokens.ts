/**
 * Fluent UI v2 design tokens — valid values for design system validation.
 * Source: @fluentui/tokens webLightTheme
 */

const SPACING = [0, 2, 4, 6, 8, 10, 12, 16, 20, 24, 32];
const BORDER_RADIUS = [0, 2, 4, 6, 8, 12, 16, 24, 32, 40, 10000];
const STROKE_WIDTH = [1, 2, 3, 4];
const FONT_SIZE = [10, 12, 14, 16, 20, 24, 28, 32, 40, 68];
const LINE_HEIGHT = [14, 16, 20, 22, 28, 32, 36, 40, 52, 92];
const FONT_WEIGHT = [400, 500, 600, 700];

const SPACING_NAMES: Record<number, string> = {
  0: 'None', 2: 'XXS', 4: 'XS', 6: 'SNudge', 8: 'S', 10: 'MNudge',
  12: 'M', 16: 'L', 20: 'XL', 24: 'XXL', 32: 'XXXL',
};
const RADIUS_NAMES: Record<number, string> = {
  0: 'None', 2: 'Small', 4: 'Medium', 6: 'Large', 8: 'XLarge',
  12: '2XLarge', 16: '3XLarge', 24: '4XLarge', 32: '5XLarge', 40: '6XLarge', 10000: 'Circular',
};
const STROKE_NAMES: Record<number, string> = {
  1: 'Thin', 2: 'Thick', 3: 'Thicker', 4: 'Thickest',
};
const FONT_SIZE_NAMES: Record<number, string> = {
  10: 'Base100', 12: 'Base200', 14: 'Base300', 16: 'Base400', 20: 'Base500',
  24: 'Base600', 28: 'Hero700', 32: 'Hero800', 40: 'Hero900', 68: 'Hero1000',
};
const LINE_HEIGHT_NAMES: Record<number, string> = {
  14: 'Base100', 16: 'Base200', 20: 'Base300', 22: 'Base400', 28: 'Base500',
  32: 'Base600', 36: 'Hero700', 40: 'Hero800', 52: 'Hero900', 92: 'Hero1000',
};
const WEIGHT_NAMES: Record<number, string> = {
  400: 'Regular', 500: 'Medium', 600: 'Semibold', 700: 'Bold',
};

function getCategory(prop: string): { values: number[]; names: Record<number, string>; prefix: string } | null {
  if (/^(margin|padding)/.test(prop)) return { values: SPACING, names: SPACING_NAMES, prefix: 'spacing' };
  if (/^gap$/.test(prop)) return { values: SPACING, names: SPACING_NAMES, prefix: 'spacing' };
  if (/border.*radius/i.test(prop)) return { values: BORDER_RADIUS, names: RADIUS_NAMES, prefix: 'borderRadius' };
  if (/border.*width/i.test(prop)) return { values: STROKE_WIDTH, names: STROKE_NAMES, prefix: 'strokeWidth' };
  if (prop === 'font-size') return { values: FONT_SIZE, names: FONT_SIZE_NAMES, prefix: 'fontSize' };
  if (prop === 'line-height') return { values: LINE_HEIGHT, names: LINE_HEIGHT_NAMES, prefix: 'lineHeight' };
  if (prop === 'font-weight') return { values: FONT_WEIGHT, names: WEIGHT_NAMES, prefix: 'fontWeight' };
  return null;
}

function findNearest(values: number[], target: number): number {
  let best = values[0];
  let bestDist = Math.abs(target - best);
  for (const v of values) {
    const d = Math.abs(target - v);
    if (d < bestDist) { best = v; bestDist = d; }
  }
  return best;
}

function parseNumeric(value: string): number | null {
  if (value === '0') return 0;
  if (value === 'auto' || value === 'none' || value === 'normal' || value === 'inherit') return null;
  const m = value.match(/^(-?\d+(?:\.\d+)?)\s*(px)?$/);
  if (m) return parseFloat(m[1]);
  const n = parseFloat(value);
  if (!isNaN(n) && String(n) === value.trim()) return n;
  return null;
}

export interface FluentCheck {
  valid: boolean;
  nearest?: string;
  tokenName?: string;
}

/**
 * Check if a CSS property value matches a Fluent UI design token.
 * Returns { valid: true } if it matches, or { valid: false, nearest, tokenName } with the fix.
 */
export function checkFluentValue(property: string, value: string): FluentCheck {
  const cat = getCategory(property);
  if (!cat) return { valid: true };

  const num = parseNumeric(value);
  if (num === null) return { valid: true };
  if (num === 0) return { valid: true };

  if (cat.values.includes(num)) {
    return { valid: true };
  }

  const nearest = findNearest(cat.values, num);
  const unit = property === 'font-weight' ? '' : 'px';
  const name = cat.names[nearest];
  const tokenName = name ? `${cat.prefix}${name}` : undefined;

  return { valid: false, nearest: `${nearest}${unit}`, tokenName };
}
