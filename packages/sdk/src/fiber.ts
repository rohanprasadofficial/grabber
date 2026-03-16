/**
 * React Fiber extraction — runs directly in the same JS context (no bridge needed).
 * Extracts component name, source file, props, and hierarchy from React internals.
 */

import type { ComponentInfo } from './types';

export interface FiberData {
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
export function getFiberFromElement(element: HTMLElement): FiberNode | null {
  const el = element as any;

  for (const key in el) {
    if (
      key.startsWith('__reactFiber$') ||
      key.startsWith('__reactInternalInstance$')
    ) {
      return el[key] as FiberNode;
    }
  }

  for (const key in el) {
    if (key.startsWith('__reactContainer$')) {
      return el[key] as FiberNode;
    }
  }

  if (el._reactRootContainer) {
    const container = el._reactRootContainer;
    return container._internalRoot?.current?.child || container.current?.child;
  }

  return null;
}

/**
 * Wait for React fiber to be attached to an element (handles SSR hydration delay).
 */
export async function waitForFiber(
  element: HTMLElement,
  maxWaitMs: number = 1500,
  intervalMs: number = 100
): Promise<FiberNode | null> {
  const immediate = getFiberFromElement(element);
  if (immediate) return immediate;

  const start = Date.now();
  while (Date.now() - start < maxWaitMs) {
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
    const fiber = getFiberFromElement(element);
    if (fiber) return fiber;
  }

  return null;
}

function getDisplayName(fiber: FiberNode): string {
  const type = fiber.type as any;

  if (!type) return 'Unknown';
  if (typeof type === 'string') return type;

  if (typeof type === 'object') {
    if (type.displayName) return type.displayName;
    if (type.name) return type.name;
    if (type.type) return getDisplayName({ ...fiber, type: type.type });
    if (type.render) return type.render.displayName || type.render.name || 'ForwardRef';
    if (type._context) return `${type._context.displayName || 'Context'}.Provider`;
    if (type.Provider) return `${type.displayName || 'Context'}.Consumer`;
  }

  if (typeof type === 'function') {
    return type.displayName || type.name || 'Component';
  }

  if (typeof type === 'symbol') {
    const symbolStr = type.toString();
    if (symbolStr.includes('Fragment')) return 'Fragment';
    if (symbolStr.includes('Suspense')) return 'Suspense';
    if (symbolStr.includes('Profiler')) return 'Profiler';
    if (symbolStr.includes('StrictMode')) return 'StrictMode';
  }

  return 'Unknown';
}

function isUserComponent(fiber: FiberNode): boolean {
  const type = fiber.type as any;
  if (!type) return false;
  if (typeof type === 'string') return false;
  if (typeof type === 'symbol') return false;
  if (typeof type === 'function') return true;
  if (typeof type === 'object') {
    if (type.$$typeof) return true;
    if (type.render) return true;
    if (type.type) return true;
  }
  return false;
}

function sanitizeProps(props: Record<string, unknown>): Record<string, unknown> {
  if (!props) return {};

  const sanitized: Record<string, unknown> = {};
  const seen = new WeakSet();

  function sanitizeValue(value: unknown, depth = 0): unknown {
    if (depth > 5) return '[Max Depth]';
    if (value === null || value === undefined) return value;
    if (typeof value === 'function') return '[Function]';
    if (typeof value === 'symbol') return '[Symbol]';
    if (value instanceof HTMLElement) return `[HTMLElement: ${value.tagName}]`;
    if (value instanceof Event) return '[Event]';

    if (typeof value === 'object') {
      if (seen.has(value as object)) return '[Circular]';
      seen.add(value as object);

      if (Array.isArray(value)) {
        return value.slice(0, 10).map((v) => sanitizeValue(v, depth + 1));
      }

      const result: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(value)) {
        if (k.startsWith('__') || k === 'ref' || k === 'key') continue;
        result[k] = sanitizeValue(v, depth + 1);
      }
      return result;
    }

    return value;
  }

  for (const [key, value] of Object.entries(props)) {
    if (key === 'children') {
      sanitized[key] = '[Children]';
      continue;
    }
    sanitized[key] = sanitizeValue(value);
  }

  return sanitized;
}

const EMPTY_FIBER_DATA: FiberData = {
  found: false,
  componentName: '',
  fileName: '',
  lineNumber: 0,
  columnNumber: 0,
  props: {},
  hierarchy: [],
};

/**
 * Build FiberData from an already-resolved fiber node.
 */
function getFiberDataFromFiber(fiber: FiberNode): FiberData {
  const debugOwner = (fiber as any)._debugOwner as FiberNode | null;
  let componentFiber: FiberNode | null = debugOwner;
  let sourceInfo: { fileName: string; lineNumber: number; columnNumber: number } | null = null;

  if (debugOwner?._debugSource) {
    sourceInfo = debugOwner._debugSource;
  }

  if (!componentFiber) {
    let current: FiberNode | null = fiber;
    while (current) {
      if (isUserComponent(current)) {
        componentFiber = current;
        break;
      }
      current = current.return;
    }
  }

  if (!sourceInfo && componentFiber) {
    let current: FiberNode | null = componentFiber;
    while (current && !sourceInfo) {
      if (current._debugSource) {
        sourceInfo = current._debugSource;
      }
      const ownerAtLevel = (current as any)._debugOwner;
      if (!sourceInfo && ownerAtLevel?._debugSource) {
        sourceInfo = ownerAtLevel._debugSource;
      }
      current = current.return;
    }
  }

  const hierarchy: string[] = [];
  const seen = new Set<FiberNode>();
  let current: FiberNode | null = debugOwner || fiber;

  while (current && hierarchy.length < 10) {
    if (seen.has(current)) break;
    seen.add(current);

    if (isUserComponent(current)) {
      const name = getDisplayName(current);
      if (name !== 'Unknown' && !hierarchy.includes(name)) {
        hierarchy.unshift(name);
      }
    }

    const owner: FiberNode | null = (current as any)._debugOwner;
    if (owner && !seen.has(owner)) {
      current = owner;
    } else {
      current = current.return;
    }
  }

  return {
    found: true,
    componentName: componentFiber ? getDisplayName(componentFiber) : 'Unknown',
    fileName: sourceInfo?.fileName || '',
    lineNumber: sourceInfo?.lineNumber || 0,
    columnNumber: sourceInfo?.columnNumber || 0,
    props: componentFiber ? sanitizeProps(componentFiber.memoizedProps || {}) : {},
    hierarchy,
  };
}

/**
 * Get fiber data from an element (synchronous).
 * No bridge needed — we're in the same JS context.
 */
export function getFiberData(element: HTMLElement): FiberData {
  const fiber = getFiberFromElement(element);
  if (!fiber) return EMPTY_FIBER_DATA;
  return getFiberDataFromFiber(fiber);
}

/**
 * Get fiber data with SSR hydration retry support.
 */
export async function getFiberDataWithRetry(element: HTMLElement): Promise<FiberData> {
  const fiber = await waitForFiber(element);
  if (!fiber) return EMPTY_FIBER_DATA;
  return getFiberDataFromFiber(fiber);
}

/**
 * Convert FiberData to ComponentInfo format.
 */
export function fiberDataToComponentInfo(data: FiberData): ComponentInfo | null {
  if (!data.found) return null;

  return {
    componentName: data.componentName,
    fileName: data.fileName,
    lineNumber: data.lineNumber,
    columnNumber: data.columnNumber,
    props: data.props,
  };
}
