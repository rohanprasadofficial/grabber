/**
 * React component wrapper for GrabberDevTools.
 * Usage:
 *   import { GrabberDevTools } from '@grabber/sdk';
 *   <GrabberDevTools />
 */

import { useEffect, useRef } from 'react';
import { GrabberDevTools as GrabberCore } from './grabber';
import type { GrabberConfig } from './types';

export interface GrabberDevToolsProps extends GrabberConfig {}

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
export function GrabberDevTools(props: GrabberDevToolsProps): null {
  const instanceRef = useRef<GrabberCore | null>(null);

  useEffect(() => {
    const grabber = new GrabberCore(props);
    grabber.init();
    instanceRef.current = grabber;

    // Expose for debugging
    (window as any).__GRABBER__ = {
      activate: () => grabber.activate(),
      deactivate: () => grabber.deactivate(),
      getBag: () => grabber.getBag(),
      sendBag: () => grabber.sendBag(),
      clearBag: () => grabber.clearBag(),
    };

    return () => {
      grabber.destroy();
      delete (window as any).__GRABBER__;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Renders nothing — all UI is managed via direct DOM manipulation
  return null;
}
