/**
 * Style extraction — Griffel slots, matched CSS rules, Fluent UI tokens.
 * Runs directly in the same JS context (no bridge needed).
 */

import type { GriffelSlotInfo, MatchedCSSRule, StyleData } from './types';

export interface StyleExtractionResult {
  griffelSlots: GriffelSlotInfo[];
  matchedRules: MatchedCSSRule[];
  fluentTokens: Record<string, string>;
}

/**
 * Get Griffel devtools data for an element.
 * Griffel in dev mode exposes window.__GRIFFEL_DEVTOOLS__.getInfo(element)
 */
export function getGriffelData(element: HTMLElement): GriffelSlotInfo[] {
  try {
    const devtools = (window as any).__GRIFFEL_DEVTOOLS__;
    if (!devtools || typeof devtools.getInfo !== 'function') {
      return [];
    }

    const info = devtools.getInfo(element);
    if (!info || !Array.isArray(info)) return [];

    return info.map((slot: any) => ({
      slot: slot.slot || 'unknown',
      rules: Array.isArray(slot.rules)
        ? slot.rules.map((r: any) => typeof r === 'string' ? r : (r.cssRule || String(r)))
        : [],
      sourceURL: slot.sourceURL || undefined,
    }));
  } catch (e) {
    console.log('[Grabber] Griffel devtools not available:', e);
    return [];
  }
}

/**
 * Get all matched CSS rules for an element by traversing document.styleSheets.
 */
export function getMatchedCSSRules(element: HTMLElement): MatchedCSSRule[] {
  const matched: MatchedCSSRule[] = [];

  function processRules(rules: CSSRuleList, source: string): void {
    for (let i = 0; i < rules.length; i++) {
      const rule = rules[i];

      if (rule instanceof CSSStyleRule) {
        try {
          if (element.matches(rule.selectorText)) {
            const properties: Record<string, string> = {};
            for (let j = 0; j < rule.style.length; j++) {
              const prop = rule.style[j];
              properties[prop] = rule.style.getPropertyValue(prop);
            }
            matched.push({ selector: rule.selectorText, properties, source });
          }
        } catch {
          // element.matches can throw for invalid selectors
        }
      } else if (rule instanceof CSSMediaRule) {
        if (window.matchMedia(rule.conditionText).matches) {
          processRules(rule.cssRules, source);
        }
      }
    }
  }

  for (let i = 0; i < document.styleSheets.length; i++) {
    const sheet = document.styleSheets[i];
    try {
      const source = sheet.href || `inline-${i}`;
      processRules(sheet.cssRules, source);
    } catch {
      // Cross-origin stylesheet
    }
  }

  return matched;
}

/**
 * Detect Fluent UI design tokens (CSS custom properties) applied to the element.
 */
export function getFluentUITokens(element: HTMLElement): Record<string, string> {
  const tokens: Record<string, string> = {};
  const computed = window.getComputedStyle(element);

  const tokenPrefixes = [
    '--colorNeutral', '--colorBrand', '--colorPalette', '--colorStatus',
    '--colorSubtle', '--colorTransparent', '--colorCompound',
    '--fontFamily', '--fontSize', '--fontWeight', '--lineHeight',
    '--spacingHorizontal', '--spacingVertical',
    '--borderRadius', '--strokeWidth',
    '--shadow', '--duration', '--curve',
  ];

  for (let i = 0; i < document.styleSheets.length; i++) {
    const sheet = document.styleSheets[i];
    try {
      for (let j = 0; j < sheet.cssRules.length; j++) {
        const rule = sheet.cssRules[j];
        if (rule instanceof CSSStyleRule) {
          try {
            if (element.matches(rule.selectorText) || rule.selectorText === ':root' || rule.selectorText === 'body') {
              for (let k = 0; k < rule.style.length; k++) {
                const prop = rule.style[k];
                if (prop.startsWith('--')) {
                  for (const prefix of tokenPrefixes) {
                    if (prop.startsWith(prefix)) {
                      const value = computed.getPropertyValue(prop).trim();
                      if (value) tokens[prop] = value;
                      break;
                    }
                  }
                }
              }
            }
          } catch {
            // matches() can throw
          }
        }
      }
    } catch {
      // Cross-origin
    }
  }

  return tokens;
}

/**
 * Extract all style data from an element — Griffel, CSS rules, Fluent tokens.
 */
export function extractStyleData(element: HTMLElement): StyleExtractionResult {
  return {
    griffelSlots: getGriffelData(element),
    matchedRules: getMatchedCSSRules(element),
    fluentTokens: getFluentUITokens(element),
  };
}

/**
 * Extract computed styles from an element, organized by category.
 */
export function extractComputedStyles(element: HTMLElement): StyleData {
  const computed = window.getComputedStyle(element);
  const styles: Record<string, string> = {};

  const properties = [
    // Layout
    'display', 'position', 'top', 'right', 'bottom', 'left',
    'flex-direction', 'flex-wrap', 'justify-content', 'align-items', 'align-self', 'gap',
    'grid-template-columns', 'grid-template-rows',
    // Box Model
    'width', 'height', 'min-width', 'max-width', 'min-height', 'max-height',
    'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
    'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
    'box-sizing',
    // Typography
    'font-family', 'font-size', 'font-weight', 'line-height', 'letter-spacing',
    'text-align', 'text-decoration', 'text-transform', 'color', 'white-space',
    // Borders & Effects
    'border-top-width', 'border-right-width', 'border-bottom-width', 'border-left-width',
    'border-top-style', 'border-right-style', 'border-bottom-style', 'border-left-style',
    'border-top-color', 'border-right-color', 'border-bottom-color', 'border-left-color',
    'border-top-left-radius', 'border-top-right-radius', 'border-bottom-right-radius', 'border-bottom-left-radius',
    'box-shadow', 'outline',
    // Background
    'background-color', 'background-image', 'opacity',
    // Other
    'overflow', 'overflow-x', 'overflow-y', 'z-index', 'cursor', 'visibility',
  ];

  for (const prop of properties) {
    styles[prop] = computed.getPropertyValue(prop);
  }

  // Extract inline styles
  const inline: Record<string, string> = {};
  for (let i = 0; i < element.style.length; i++) {
    const prop = element.style[i];
    inline[prop] = element.style.getPropertyValue(prop);
  }

  // Extract class list
  const classes = element.className && typeof element.className === 'string'
    ? element.className.split(' ').filter(Boolean)
    : [];

  return { computed: styles, inline, classes };
}
