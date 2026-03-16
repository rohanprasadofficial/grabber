/** Component information extracted from React Fiber */
export interface ComponentInfo {
  componentName: string;
  fileName: string;
  lineNumber: number;
  columnNumber: number;
  props: Record<string, unknown>;
}

/** Full context about a selected UI element */
export interface ElementContext {
  component: ComponentInfo | null;
  html: string;
  hierarchy: string[];
  cssSelector: string;
  boundingRect: {
    top: number;
    left: number;
    width: number;
    height: number;
  };
  pageUrl: string;
}

/** Payload sent to VS Code */
export interface GrabberPayload {
  type: string;
  prompt: string;
  context: ElementContext;
  timestamp: number;
  version: string;
}

/** Computed and inline styles extracted from a selected element */
export interface StyleData {
  computed: Record<string, string>;
  inline: Record<string, string>;
  classes: string[];
}

/** A single style change made by the user */
export interface StyleChange {
  property: string;
  oldValue: string;
  newValue: string;
}

/** Griffel slot info from __GRIFFEL_DEVTOOLS__ */
export interface GriffelSlotInfo {
  slot: string;
  rules: string[];
  sourceURL?: string;
}

/** Matched CSS rule */
export interface MatchedCSSRule {
  selector: string;
  properties: Record<string, string>;
  source: string;
}

/** Full style payload for the inspector panel */
export interface ElementStylePayload {
  elementContext: ElementContext;
  styleData: StyleData;
  griffelSlots?: GriffelSlotInfo[];
  fluentTokens?: Record<string, string>;
  matchedRules?: MatchedCSSRule[];
}

/** A single entry in the changes bag */
export interface BagEntry {
  id: number;
  componentName: string;
  fileName: string;
  lineNumber: number;
  note: string;
  styleChanges: { property: string; from: string; to: string }[];
}

/** Configuration for GrabberDevTools */
export interface GrabberConfig {
  /** VS Code server URL (default: http://localhost:4567) */
  serverUrl?: string;
  /** Keyboard shortcut to activate selector (default: ctrl+shift+g / cmd+shift+g) */
  shortcut?: string;
  /** Show floating activate button (default: true) */
  showActivateButton?: boolean;
}
