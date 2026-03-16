/** Information about a React component extracted from Fiber */
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

/** Payload sent from Chrome extension to VS Code */
export interface GrabberPayload {
  type: string;
  prompt: string;
  context: ElementContext;
  timestamp: number;
  version: string;
}

/** Response from VS Code extension */
export interface GrabberResponse {
  success: boolean;
  error?: string;
  timestamp: number;
}
