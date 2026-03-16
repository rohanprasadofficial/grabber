/**
 * Inject Grabber CSS styles into the document.
 * All styles are scoped with .grabber-* class prefixes to avoid conflicts.
 */

const GRABBER_CSS = `
/* ===== Grabber SDK Styles ===== */

/* Global State */
body.grabber-active {
  cursor: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="%233b82f6" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="3"/><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/></svg>') 12 12, crosshair !important;
}

body.grabber-active * {
  cursor: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="%233b82f6" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="3"/><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/></svg>') 12 12, crosshair !important;
}

/* Overlay (Element Highlight) */
.grabber-overlay {
  position: absolute;
  pointer-events: none;
  z-index: 2147483646;
  display: none;
  box-sizing: border-box;
  background: rgba(60, 130, 247, 0.06);
  border: 1.5px solid #3c82f7;
  border-radius: 2px;
  transition: top 0.04s ease-out, left 0.04s ease-out, width 0.04s ease-out, height 0.04s ease-out;
}

/* Guide lines */
.grabber-guide {
  position: fixed;
  pointer-events: none;
  z-index: 2147483645;
  display: none;
}
.grabber-guide-h {
  height: 0;
  left: 0;
  right: 0;
  border-top: 1px dashed rgba(60, 130, 247, 0.25);
}
.grabber-guide-v {
  width: 0;
  top: 0;
  bottom: 0;
  border-left: 1px dashed rgba(60, 130, 247, 0.25);
}

/* Dimension badge */
.grabber-dimensions {
  position: absolute;
  pointer-events: none;
  z-index: 2147483647;
  display: none;
  background: #3c82f7;
  color: #fff;
  font-family: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace;
  font-size: 10px;
  font-weight: 500;
  line-height: 1;
  padding: 3px 6px;
  border-radius: 4px;
  white-space: nowrap;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
}

/* Info Box (Hover Tooltip) */
.grabber-info-box {
  position: absolute;
  z-index: 2147483647;
  display: none;
  max-width: 320px;
  background: #fff;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 10px;
  padding: 8px 12px;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.04);
  animation: grabber-info-in 0.12s ease-out;
}

@keyframes grabber-info-in {
  from { opacity: 0; transform: translateY(-3px); }
  to { opacity: 1; transform: translateY(0); }
}

.grabber-info-component {
  font-weight: 600;
  font-size: 12px;
  color: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  gap: 6px;
}
.grabber-info-component::before {
  content: '';
  display: inline-block;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #3c82f7;
  flex-shrink: 0;
}
.grabber-info-file {
  color: rgba(0, 0, 0, 0.4);
  font-size: 10px;
  font-family: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-top: 2px;
  padding-left: 13px;
}

/* Toast */
.grabber-toast {
  position: fixed;
  top: 16px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 2147483647;
  background: rgba(10, 10, 10, 0.9);
  backdrop-filter: blur(16px) saturate(180%);
  -webkit-backdrop-filter: blur(16px) saturate(180%);
  color: #fafafa;
  padding: 10px 16px;
  border-radius: 9999px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
  font-size: 13px;
  font-weight: 500;
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  gap: 8px;
  animation: grabber-toast-in 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
.grabber-toast::before {
  content: '';
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #3b82f6;
  animation: grabber-dot-pulse 1.5s ease-in-out infinite;
}
@keyframes grabber-dot-pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(0.9); }
}
.grabber-toast-warning::before { background: #eab308; }
.grabber-toast-error::before { background: #ef4444; }

@keyframes grabber-toast-in {
  from { opacity: 0; transform: translateX(-50%) translateY(-20px) scale(0.95); }
  to { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
}

/* Floating Activate Button */
.grabber-activate-btn {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 2147483640;
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: rgba(10, 10, 10, 0.9);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
  color: #a1a1aa;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}
.grabber-activate-btn:hover {
  color: #fafafa;
  background: rgba(30, 30, 30, 0.95);
  transform: scale(1.05);
}
.grabber-activate-btn::after {
  content: '';
  position: absolute;
  top: 4px;
  right: 4px;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #ef4444;
  transition: background 0.3s;
}
.grabber-activate-btn.grabber-connected::after {
  background: #22c55e;
  box-shadow: 0 0 6px rgba(34, 197, 94, 0.5);
}
`;

let injected = false;

export function injectStyles(): void {
  if (injected) return;
  injected = true;

  const style = document.createElement('style');
  style.setAttribute('data-grabber-sdk', '');
  style.textContent = GRABBER_CSS;
  document.head.appendChild(style);
}
