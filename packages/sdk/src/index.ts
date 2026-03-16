/**
 * @grabber/sdk — Inspect React UI elements and send context to VS Code Copilot.
 *
 * Usage (React):
 *   import { GrabberDevTools } from '@grabber/sdk';
 *   <GrabberDevTools />
 *
 * Usage (Vanilla):
 *   import { GrabberDevTools as GrabberCore } from '@grabber/sdk/core';
 *   const grabber = new GrabberCore();
 *   grabber.init();
 */

// React component (primary API)
export { GrabberDevTools } from './react';

// Core class (vanilla JS API)
export { GrabberDevTools as GrabberCore } from './grabber';

// Types
export type {
  ComponentInfo,
  ElementContext,
  GrabberPayload,
  StyleData,
  StyleChange,
  GriffelSlotInfo,
  MatchedCSSRule,
  ElementStylePayload,
  BagEntry,
  GrabberConfig,
} from './types';

// Utilities (for advanced usage)
export { getFiberData, getFiberDataWithRetry, getFiberFromElement, fiberDataToComponentInfo } from './fiber';
export { extractStyleData, extractComputedStyles, getGriffelData, getMatchedCSSRules, getFluentUITokens } from './styles';
export { checkFluentValue } from './fluent-tokens';
export { checkVSCodeConnection, sendToVSCode, formatBagForCopilot } from './sender';
