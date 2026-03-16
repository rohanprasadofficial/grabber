/** Component information extracted from React Fiber */
interface ComponentInfo {
    componentName: string;
    fileName: string;
    lineNumber: number;
    columnNumber: number;
    props: Record<string, unknown>;
}
/** Full context about a selected UI element */
interface ElementContext {
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
interface GrabberPayload {
    type: string;
    prompt: string;
    context: ElementContext;
    timestamp: number;
    version: string;
}
/** Computed and inline styles extracted from a selected element */
interface StyleData {
    computed: Record<string, string>;
    inline: Record<string, string>;
    classes: string[];
}
/** A single style change made by the user */
interface StyleChange {
    property: string;
    oldValue: string;
    newValue: string;
}
/** Griffel slot info from __GRIFFEL_DEVTOOLS__ */
interface GriffelSlotInfo {
    slot: string;
    rules: string[];
    sourceURL?: string;
}
/** Matched CSS rule */
interface MatchedCSSRule {
    selector: string;
    properties: Record<string, string>;
    source: string;
}
/** Full style payload for the inspector panel */
interface ElementStylePayload {
    elementContext: ElementContext;
    styleData: StyleData;
    griffelSlots?: GriffelSlotInfo[];
    fluentTokens?: Record<string, string>;
    matchedRules?: MatchedCSSRule[];
}
/** A single entry in the changes bag */
interface BagEntry {
    id: number;
    componentName: string;
    fileName: string;
    lineNumber: number;
    note: string;
    styleChanges: {
        property: string;
        from: string;
        to: string;
    }[];
}
/** Configuration for GrabberDevTools */
interface GrabberConfig {
    /** VS Code server URL (default: http://localhost:4567) */
    serverUrl?: string;
    /** Keyboard shortcut to activate selector (default: ctrl+shift+g / cmd+shift+g) */
    shortcut?: string;
    /** Show floating activate button (default: true) */
    showActivateButton?: boolean;
}

/**
 * React component wrapper for GrabberDevTools.
 * Usage:
 *   import { GrabberDevTools } from '@grabber/sdk';
 *   <GrabberDevTools />
 */

interface GrabberDevToolsProps extends GrabberConfig {
}
/**
 * Drop-in React component that initializes Grabber.
 * Place it anywhere in your component tree (typically in the root layout).
 *
 * ```tsx
 * import { GrabberDevTools } from '@grabber/sdk';
 *
 * function App() {
 *   return (
 *     <>
 *       {process.env.NODE_ENV === 'development' && <GrabberDevTools />}
 *       <YourApp />
 *     </>
 *   );
 * }
 * ```
 */
declare function GrabberDevTools$1(props: GrabberDevToolsProps): null;

/**
 * GrabberDevTools — main orchestrator class.
 * Replaces the Chrome extension's background script + content script + side panel coordination.
 * Everything runs in one JS context now.
 */

declare class GrabberDevTools {
    private config;
    private selector;
    private drawer;
    private cachedPayload;
    private liveChanges;
    private changesBag;
    private nextBagId;
    private activateButton;
    private stylesInjected;
    private isConnected;
    private connectionCheckInterval;
    onPayloadUpdate: ((payload: ElementStylePayload) => void) | null;
    onBagUpdate: ((bag: BagEntry[], count: number) => void) | null;
    onConnectionChange: ((connected: boolean) => void) | null;
    constructor(config?: GrabberConfig);
    /**
     * Initialize the devtools — inject styles, add keyboard shortcut, show button, create drawer.
     */
    init(): void;
    /**
     * Clean up all resources.
     */
    destroy(): void;
    /**
     * Activate the element selector.
     */
    activate(): void;
    /**
     * Deactivate the element selector.
     */
    deactivate(): void;
    addToBag(note: string): void;
    removeBagEntry(id: number): void;
    clearBag(): void;
    getBag(): {
        bag: BagEntry[];
        count: number;
    };
    sendBag(): Promise<{
        success: boolean;
        error?: string;
    }>;
    applyStyleChange(property: string, value: string): void;
    resetStyle(property: string): void;
    resetAllStyles(): void;
    getLiveChangesCount(): number;
    private handleElementSelected;
    private handleKeyDown;
    private createActivateButton;
    private checkConnection;
}

/**
 * React Fiber extraction — runs directly in the same JS context (no bridge needed).
 * Extracts component name, source file, props, and hierarchy from React internals.
 */

interface FiberData {
    found: boolean;
    componentName: string;
    fileName: string;
    lineNumber: number;
    columnNumber: number;
    props: Record<string, unknown>;
    hierarchy: string[];
}
interface FiberNode {
    type: any;
    stateNode: HTMLElement | null;
    return: FiberNode | null;
    child: FiberNode | null;
    sibling: FiberNode | null;
    memoizedProps: any;
    _debugSource?: {
        fileName: string;
        lineNumber: number;
        columnNumber: number;
    };
    _debugOwner?: FiberNode;
}
/**
 * Get fiber from a DOM element by checking React's internal properties.
 */
declare function getFiberFromElement(element: HTMLElement): FiberNode | null;
/**
 * Get fiber data from an element (synchronous).
 * No bridge needed — we're in the same JS context.
 */
declare function getFiberData(element: HTMLElement): FiberData;
/**
 * Get fiber data with SSR hydration retry support.
 */
declare function getFiberDataWithRetry(element: HTMLElement): Promise<FiberData>;
/**
 * Convert FiberData to ComponentInfo format.
 */
declare function fiberDataToComponentInfo(data: FiberData): ComponentInfo | null;

/**
 * Style extraction — Griffel slots, matched CSS rules, Fluent UI tokens.
 * Runs directly in the same JS context (no bridge needed).
 */

interface StyleExtractionResult {
    griffelSlots: GriffelSlotInfo[];
    matchedRules: MatchedCSSRule[];
    fluentTokens: Record<string, string>;
}
/**
 * Get Griffel devtools data for an element.
 * Griffel in dev mode exposes window.__GRIFFEL_DEVTOOLS__.getInfo(element)
 */
declare function getGriffelData(element: HTMLElement): GriffelSlotInfo[];
/**
 * Get all matched CSS rules for an element by traversing document.styleSheets.
 */
declare function getMatchedCSSRules(element: HTMLElement): MatchedCSSRule[];
/**
 * Detect Fluent UI design tokens (CSS custom properties) applied to the element.
 */
declare function getFluentUITokens(element: HTMLElement): Record<string, string>;
/**
 * Extract all style data from an element — Griffel, CSS rules, Fluent tokens.
 */
declare function extractStyleData(element: HTMLElement): StyleExtractionResult;
/**
 * Extract computed styles from an element, organized by category.
 */
declare function extractComputedStyles(element: HTMLElement): StyleData;

/**
 * Fluent UI v2 design tokens — valid values for design system validation.
 * Source: @fluentui/tokens webLightTheme
 */
interface FluentCheck {
    valid: boolean;
    nearest?: string;
    tokenName?: string;
}
/**
 * Check if a CSS property value matches a Fluent UI design token.
 * Returns { valid: true } if it matches, or { valid: false, nearest, tokenName } with the fix.
 */
declare function checkFluentValue(property: string, value: string): FluentCheck;

/**
 * VS Code HTTP sender — POST to localhost:4567.
 * Identical protocol to what the Chrome extension's background script used.
 */

/**
 * Check if VS Code Grabber server is running.
 */
declare function checkVSCodeConnection(serverUrl?: string): Promise<boolean>;
/**
 * Send payload to VS Code extension.
 */
declare function sendToVSCode(data: Record<string, unknown>, serverUrl?: string): Promise<{
    success: boolean;
    error?: string;
}>;
/**
 * Format the changes bag as a Copilot instruction — same format as the Chrome extension.
 */
declare function formatBagForCopilot(bag: BagEntry[]): string;

export { type BagEntry, type ComponentInfo, type ElementContext, type ElementStylePayload, type GrabberConfig, GrabberDevTools as GrabberCore, GrabberDevTools$1 as GrabberDevTools, type GrabberPayload, type GriffelSlotInfo, type MatchedCSSRule, type StyleChange, type StyleData, checkFluentValue, checkVSCodeConnection, extractComputedStyles, extractStyleData, fiberDataToComponentInfo, formatBagForCopilot, getFiberData, getFiberDataWithRetry, getFiberFromElement, getFluentUITokens, getGriffelData, getMatchedCSSRules, sendToVSCode };
