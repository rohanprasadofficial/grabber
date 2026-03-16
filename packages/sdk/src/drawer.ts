/**
 * Side panel drawer — Figma-style design inspector rendered as an iframe.
 * Port of sidepanel.ts + sidepanel.html + sidepanel.css from the Chrome extension.
 * Uses an iframe for complete style isolation from the host page.
 * Communicates with GrabberDevTools via postMessage (replacing chrome.runtime).
 */

import type { ElementStylePayload, BagEntry } from './types';
import { checkFluentValue } from './fluent-tokens';

// ===== Drawer shell (host page side) =====

export interface DrawerCallbacks {
  onActivateSelector: () => void;
  onStyleChange: (property: string, value: string) => void;
  onStyleReset: (property: string) => void;
  onStyleResetAll: () => void;
  onAddToBag: (note: string) => void;
  onRemoveBagEntry: (id: number) => void;
  onClearBag: () => void;
  onSendBag: () => Promise<{ success: boolean; error?: string }>;
  getBag: () => { bag: BagEntry[]; count: number };
  getLiveChangesCount: () => number;
  checkConnection: () => Promise<boolean>;
}

export class SidePanelDrawer {
  private container: HTMLDivElement | null = null;
  private iframe: HTMLIFrameElement | null = null;
  private isOpen = false;
  private iframeReady = false;
  private pendingMessages: Array<{ type: string; data: Record<string, unknown> }> = [];
  private callbacks: DrawerCallbacks;

  constructor(callbacks: DrawerCallbacks) {
    this.callbacks = callbacks;
    this.handleMessage = this.handleMessage.bind(this);
    window.addEventListener('message', this.handleMessage);
  }

  show(): void {
    if (!this.container) {
      this.createDrawer();
    }

    this.isOpen = true;
    this.container!.style.transform = 'translateX(0)';
    // Push page content to the left so the drawer doesn't overlap
    const width = this.container!.offsetWidth || 320;
    document.documentElement.style.marginRight = `${width}px`;
    document.documentElement.style.transition = 'margin-right 0.25s cubic-bezier(0.4, 0, 0.2, 1)';
  }

  hide(): void {
    if (!this.isOpen) return;
    this.isOpen = false;

    if (this.container) {
      this.container.style.transform = 'translateX(100%)';
    }
    document.documentElement.style.marginRight = '';
  }

  toggle(): void {
    if (this.isOpen) this.hide();
    else this.show();
  }

  destroy(): void {
    window.removeEventListener('message', this.handleMessage);
    document.documentElement.style.marginRight = '';
    document.documentElement.style.transition = '';
    this.container?.remove();
    this.container = null;
    this.iframe = null;
    this.iframeReady = false;
  }

  updatePayload(payload: ElementStylePayload): void {
    this.show();
    this.sendOrQueue('GRABBER_STYLE_UPDATE', { data: payload });
  }

  updateConnection(connected: boolean): void {
    this.sendOrQueue('CONNECTION_STATUS', { connected });
  }

  refreshBag(): void {
    const { bag, count } = this.callbacks.getBag();
    this.sendOrQueue('BAG_STATE', { bag, count, liveCount: this.callbacks.getLiveChangesCount() });
  }

  /**
   * Send a message to the iframe, or queue it if the iframe hasn't loaded yet.
   */
  private sendOrQueue(type: string, data: Record<string, unknown>): void {
    if (this.iframeReady) {
      this.postToIframe(type, data);
    } else {
      this.pendingMessages.push({ type, data });
    }
  }

  /**
   * Flush all queued messages once the iframe is ready.
   */
  private flushPendingMessages(): void {
    for (const msg of this.pendingMessages) {
      this.postToIframe(msg.type, msg.data);
    }
    this.pendingMessages = [];
  }

  private createDrawer(): void {
    this.container = document.createElement('div');
    this.container.className = 'grabber-sdk-drawer';
    this.container.style.cssText = `
      position: fixed;
      top: 0;
      right: 0;
      width: 320px;
      height: 100vh;
      z-index: 2147483640;
      transform: translateX(100%);
      transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: -4px 0 24px rgba(0,0,0,0.08);
    `;

    // Resize handle
    const handle = document.createElement('div');
    handle.style.cssText = `
      position: absolute; top: 0; left: -4px; width: 8px; height: 100%;
      cursor: ew-resize; z-index: 1;
    `;
    handle.addEventListener('mousedown', (e) => this.startResize(e));
    this.container.appendChild(handle);

    this.iframe = document.createElement('iframe');
    this.iframe.style.cssText = 'width: 100%; height: 100%; border: none;';
    this.iframe.setAttribute('srcdoc', buildDrawerHTML());
    this.container.appendChild(this.iframe);

    document.body.appendChild(this.container);

    // Once loaded, mark ready, flush queued messages, send initial state
    this.iframe.addEventListener('load', () => {
      this.iframeReady = true;

      // Flush any messages that were queued while iframe was loading
      this.flushPendingMessages();

      // Send initial state
      this.callbacks.checkConnection().then((connected) => {
        this.updateConnection(connected);
      });
      this.refreshBag();
    });
  }

  private startResize(e: MouseEvent): void {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = this.container!.offsetWidth;

    const onMove = (e: MouseEvent) => {
      const delta = startX - e.clientX;
      const newWidth = Math.max(280, Math.min(600, startWidth + delta));
      this.container!.style.width = `${newWidth}px`;
      if (this.isOpen) {
        document.documentElement.style.marginRight = `${newWidth}px`;
      }
    };

    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }

  private postToIframe(type: string, data: Record<string, unknown> = {}): void {
    this.iframe?.contentWindow?.postMessage({ source: 'grabber-drawer-host', type, ...data }, '*');
  }

  private handleMessage(e: MessageEvent): void {
    if (!e.data || e.data.source !== 'grabber-drawer') return;

    switch (e.data.type) {
      case 'ACTIVATE_SELECTOR':
        this.callbacks.onActivateSelector();
        break;
      case 'STYLE_CHANGE':
        this.callbacks.onStyleChange(e.data.property, e.data.value);
        break;
      case 'STYLE_RESET':
        this.callbacks.onStyleReset(e.data.property);
        break;
      case 'STYLE_RESET_ALL':
        this.callbacks.onStyleResetAll();
        break;
      case 'BAG_ADD':
        this.callbacks.onAddToBag(e.data.note || '');
        this.refreshBag();
        break;
      case 'BAG_REMOVE':
        this.callbacks.onRemoveBagEntry(e.data.id);
        this.refreshBag();
        break;
      case 'BAG_CLEAR':
        this.callbacks.onClearBag();
        this.refreshBag();
        break;
      case 'BAG_SEND':
        this.callbacks.onSendBag().then((result) => {
          this.postToIframe('BAG_SEND_RESULT', result);
          this.refreshBag();
        });
        break;
      case 'CHECK_CONNECTION':
        this.callbacks.checkConnection().then((connected) => {
          this.updateConnection(connected);
        });
        break;
      case 'CLOSE_DRAWER':
        this.hide();
        break;
    }
  }
}


// ===== Build the iframe HTML (all-in-one: HTML + CSS + JS) =====

function buildDrawerHTML(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>${DRAWER_CSS}</style>
</head>
<body>
<div id="app">
  <!-- Header bar -->
  <div class="sp-header">
    <div class="sp-header-top">
      <div class="sp-logo">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="3"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/></svg>
        Grabber
      </div>
      <div style="display:flex;align-items:center;gap:8px;">
        <div class="sp-status-badge" id="sp-status-badge">
          <span class="sp-status-dot" id="sp-status-dot"></span>
          <span id="sp-status-text">Checking...</span>
        </div>
        <button class="sp-close-btn" id="sp-close" title="Close panel">&times;</button>
      </div>
    </div>
    <div class="sp-header-meta">
      <span class="sp-header-value" id="sp-page-info">&mdash;</span>
      <span class="sp-header-sep">&middot;</span>
      <span class="sp-header-value success" id="sp-mode-info">Development</span>
    </div>
    <button id="sp-header-select" class="sp-header-btn">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="3"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/></svg>
      Select Element
    </button>
  </div>

  <div id="sp-empty" class="empty">
    <div class="empty-icon">
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
        <circle cx="12" cy="12" r="3"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/>
      </svg>
    </div>
    <p>Select an element on the page to start inspecting</p>
  </div>

  <div id="sp-main" class="main" style="display:none;">
    <div id="sp-info" class="info-bar"></div>
    <div id="sp-footer" class="footer-bar" style="display:none;">
      <span class="footer-count"><span id="sp-count">0</span> modified</span>
      <div class="footer-actions">
        <button id="sp-reset" class="btn-sm">Reset</button>
        <button id="sp-add-to-bag" class="btn-accent-sm">Add to bag</button>
      </div>
    </div>
    <div id="sp-bag" class="bag-bar" style="display:none;">
      <div class="bag-header">
        <span class="bag-title"><span id="sp-bag-count">0</span> changes in bag</span>
        <div class="bag-actions">
          <button id="sp-bag-clear" class="btn-sm">Clear</button>
          <button id="sp-bag-send" class="btn-accent-sm btn-send-copilot">Send all to Copilot</button>
        </div>
      </div>
      <div id="sp-bag-list" class="bag-list"></div>
    </div>
    <div id="sp-design" class="design-panel"></div>
  </div>
</div>
<script>${DRAWER_JS}</script>
</body>
</html>`;
}


// ===== CSS (exact port from sidepanel.css) =====

const DRAWER_CSS = `
:root {
  --f: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
  --m: 'SF Mono', 'Cascadia Code', 'Consolas', monospace;
  --bg0: #ffffff; --bg1: #fafafa; --bg2: #f3f3f3; --bg3: #e8e8e8;
  --border: #e0e0e0; --divider: #ebebeb;
  --t1: #1a1a1a; --t2: #666666; --t3: #999999;
  --accent: #0969da; --accent-dim: rgba(9, 105, 218, 0.08);
  --orange: #d97706; --orange-dim: rgba(217, 119, 6, 0.08);
  --box-margin: #f5deb3; --box-margin-bg: #fdf6e3;
  --box-padding: #c8e6c9; --box-padding-bg: #f1f8f1;
  --box-element: #bbdefb; --box-element-bg: #e3f2fd;
  --r: 6px;
}
* { margin: 0; padding: 0; box-sizing: border-box; }
body { background: var(--bg0); color: var(--t1); font: 12px/1.5 var(--f); overflow-y: auto; overflow-x: hidden; -webkit-font-smoothing: antialiased; }
#app { display: flex; flex-direction: column; min-height: 100vh; width: 100%; }

/* Header */
.sp-header { padding: 14px 16px 12px; border-bottom: 1px solid var(--divider); background: var(--bg0); }
.sp-header-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
.sp-logo { display: flex; align-items: center; gap: 8px; font-weight: 600; font-size: 14px; color: var(--t1); letter-spacing: -0.01em; }
.sp-status-badge { display: flex; align-items: center; gap: 5px; font-size: 11px; color: var(--t3); padding: 2px 8px 2px 6px; background: var(--bg1); border-radius: 100px; border: 1px solid var(--border); }
.sp-status-dot { width: 6px; height: 6px; border-radius: 50%; background: #d4d4d4; transition: all 0.3s; }
.sp-status-dot.connected { background: #22c55e; box-shadow: 0 0 6px rgba(34, 197, 94, 0.5); }
.sp-close-btn { background: none; border: none; font-size: 18px; color: var(--t3); cursor: pointer; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; border-radius: 4px; }
.sp-close-btn:hover { background: var(--bg2); color: var(--t1); }
.sp-header-meta { display: flex; align-items: center; gap: 6px; margin-bottom: 10px; padding: 0 2px; }
.sp-header-sep { color: var(--t3); font-size: 10px; }
.sp-header-value { font: 11px var(--m); color: var(--t3); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.sp-header-value.success { color: #16a34a; font-weight: 500; }
.sp-header-value.warning { color: #d97706; font-weight: 500; }
.sp-header-btn { width: 100%; padding: 8px 16px; background: var(--t1); border: none; border-radius: var(--r); color: var(--bg0); font: 12px/1 var(--f); font-weight: 500; cursor: pointer; transition: all 0.15s; display: flex; align-items: center; justify-content: center; gap: 8px; }
.sp-header-btn:hover { background: #333; }
.sp-header-btn:active { transform: scale(0.98); }
.sp-header-btn:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }

/* Empty */
.empty { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 64px 24px; gap: 12px; }
.empty-icon { color: var(--border); }
.empty p { color: var(--t3); font-size: 12px; text-align: center; line-height: 1.5; }

/* Main */
.main { flex: 1; display: flex; flex-direction: column; }

/* Info Bar */
.info-bar { display: flex; align-items: flex-start; gap: 10px; padding: 14px 16px; background: var(--bg0); border-bottom: 1px solid var(--divider); }
.info-details { flex: 1; min-width: 0; }
.info-name { font-weight: 600; font-size: 14px; color: var(--t1); line-height: 1.3; }
.info-file { font: 11px/1.4 var(--m); color: var(--t3); margin-top: 2px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.info-reselect { flex-shrink: 0; padding: 4px 12px; background: var(--bg0); border: 1px solid var(--border); border-radius: var(--r); color: var(--t2); font: 11px var(--f); cursor: pointer; transition: all 0.15s; }
.info-reselect:hover { color: var(--t1); background: var(--bg2); }

/* Design Panel */
.design-panel { flex: 1; padding-bottom: 8px; }

/* Section */
.sec { border-bottom: 1px solid var(--divider); }
.sec-head { display: flex; align-items: center; justify-content: space-between; padding: 10px 16px; cursor: pointer; user-select: none; transition: background 0.1s; }
.sec-head:hover { background: var(--bg1); }
.sec-label { font-size: 12px; font-weight: 600; color: var(--t1); }
.sec-chev { font-size: 8px; color: var(--t3); transition: transform 0.15s ease; }
.sec.shut .sec-chev { transform: rotate(-90deg); }
.sec.shut .sec-body { display: none; }
.sec-body { padding: 0 16px 14px; }

/* Grid */
.grid, .grid-1, .grid-3, .grid-4 { display: grid; gap: 6px; margin-bottom: 6px; }
.grid { grid-template-columns: 1fr 1fr; }
.grid-1 { grid-template-columns: 1fr; }
.grid-3 { grid-template-columns: 1fr 1fr 1fr; }
.grid-4 { grid-template-columns: 1fr 1fr 1fr 1fr; }
.sub-label { font-size: 11px; font-weight: 500; color: var(--t2); padding: 8px 0 4px; }
.sub-label:first-child { padding-top: 0; }

/* Field */
.field { display: flex; align-items: center; gap: 6px; background: var(--bg2); border: 1px solid transparent; border-radius: 5px; padding: 0 8px; height: 30px; min-width: 0; transition: all 0.12s; }
.field:hover { background: var(--bg3); }
.field:focus-within { border-color: var(--accent); background: var(--bg0); box-shadow: 0 0 0 2px var(--accent-dim); }
.field-label { font-size: 11px; color: var(--t3); flex-shrink: 0; user-select: none; }
.field-input { flex: 1; background: none; border: none; outline: none; color: var(--t1); font: 11px var(--m); min-width: 0; text-align: right; height: 100%; }

/* Color */
.field-color { display: flex; align-items: center; gap: 8px; background: var(--bg2); border: 1px solid transparent; border-radius: 5px; padding: 0 8px; height: 30px; min-width: 0; transition: all 0.12s; }
.field-color:hover { background: var(--bg3); }
.swatch { width: 16px; height: 16px; border-radius: 4px; border: 1px solid rgba(0,0,0,0.12); flex-shrink: 0; cursor: pointer; }
.color-val { flex: 1; font: 11px var(--m); color: var(--t1); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; min-width: 0; }
.color-hidden { width: 0; height: 0; opacity: 0; position: absolute; border: 0; padding: 0; }

/* Select */
.field-select { width: 100%; background: var(--bg2); border: 1px solid transparent; border-radius: 5px; padding: 0 8px; height: 30px; color: var(--t1); font: 11px var(--m); outline: none; cursor: pointer; -webkit-appearance: none; appearance: none; background-image: url("data:image/svg+xml,%3Csvg width='8' height='5' viewBox='0 0 8 5' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L4 4L7 1' stroke='%23999' stroke-linecap='round'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 8px center; padding-right: 20px; transition: all 0.12s; }
.field-select:hover { background-color: var(--bg3); }
.field-select:focus { border-color: var(--accent); box-shadow: 0 0 0 2px var(--accent-dim); }

/* Range */
.field-range { display: flex; align-items: center; gap: 8px; background: var(--bg2); border: 1px solid transparent; border-radius: 5px; padding: 0 8px; height: 30px; transition: all 0.12s; }
.field-range:hover { background: var(--bg3); }
.field-range input[type="range"] { flex: 1; -webkit-appearance: none; height: 3px; background: var(--border); border-radius: 2px; outline: none; }
.field-range input[type="range"]::-webkit-slider-thumb { -webkit-appearance: none; width: 12px; height: 12px; border-radius: 50%; background: var(--accent); cursor: pointer; box-shadow: 0 1px 3px rgba(0,0,0,0.15); }
.field-range .range-val { font: 11px var(--m); color: var(--t2); min-width: 30px; text-align: right; }

/* Fluent validation */
.fluent-icon { flex-shrink: 0; }
.fluent-summary { padding: 8px 16px; background: #fff8f0; border-bottom: 1px solid #fde0b6; }
.fluent-summary-row { display: flex; align-items: center; gap: 8px; color: var(--orange); }
.fluent-summary-text { flex: 1; font-size: 11px; font-weight: 500; color: #92400e; }
.fluent-fix-all-btn { padding: 3px 10px; background: var(--orange); border: none; border-radius: var(--r); color: #fff; font: 11px var(--f); font-weight: 600; cursor: pointer; transition: opacity 0.12s; white-space: nowrap; }
.fluent-fix-all-btn:hover { opacity: 0.85; }
.field-wrapper { min-width: 0; }
.field-warn { border-color: #f59e0b !important; background: #fffbeb !important; }
.fluent-hint { display: flex; align-items: center; gap: 4px; padding: 3px 6px 1px; color: var(--orange); }
.fluent-hint .fluent-icon { width: 10px; height: 10px; opacity: 0.7; }
.fluent-hint-text { font: 9px var(--m); font-weight: 600; color: #b45309; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.fluent-fix-btn { flex-shrink: 0; padding: 1px 6px; background: none; border: 1px solid #f59e0b; border-radius: 3px; font: 9px var(--m); font-weight: 600; color: #d97706; cursor: pointer; transition: all 0.12s; white-space: nowrap; }
.fluent-fix-btn:hover { background: #fef3c7; color: #92400e; }
.box-val-warn .box-val-input { color: #d97706; font-weight: 600; }
.box-fix-btn { display: block; margin: 1px auto 0; padding: 0 4px; height: 16px; background: #fef3c7; border: 1px solid #f59e0b; border-radius: 3px; font: 9px var(--m); font-weight: 600; color: #d97706; cursor: pointer; transition: all 0.12s; white-space: nowrap; }
.box-fix-btn:hover { background: #fde68a; color: #92400e; }

/* Modified indicator */
.field-mod { position: relative; }
.field-mod::after { content: ''; position: absolute; top: 3px; right: 3px; width: 5px; height: 5px; border-radius: 50%; background: var(--orange); }

/* Box model */
.box-model { margin-bottom: 8px; }
.box-model-diagram { position: relative; display: grid; grid-template-columns: 1fr auto 1fr; grid-template-rows: auto auto auto; align-items: center; justify-items: center; border-radius: 6px; padding: 6px; min-height: 90px; }
.box-model-diagram.box-margin { background: var(--box-margin-bg); border: 1.5px dashed var(--box-margin); }
.box-model-diagram.box-padding { background: var(--box-padding-bg); border: 1.5px dashed var(--box-padding); }
.box-model-diagram.box-radius { background: var(--box-element-bg); border: 1.5px dashed var(--box-element); }
.box-model-type { position: absolute; top: 4px; left: 8px; font-size: 9px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: var(--t3); }
.box-top { grid-column: 1 / -1; grid-row: 1; justify-self: center; padding: 2px 0; }
.box-left { grid-column: 1; grid-row: 2; justify-self: center; }
.box-center { grid-column: 2; grid-row: 2; width: 44px; height: 36px; border-radius: 4px; margin: 4px 20px; display: flex; align-items: center; justify-content: center; }
.box-margin .box-center { background: var(--box-padding-bg); border: 1.5px solid var(--box-padding); }
.box-padding .box-center { background: var(--box-element-bg); border: 1.5px solid var(--box-element); }
.box-radius .box-center { background: var(--bg0); border: 1.5px solid var(--border); }
.box-right { grid-column: 3; grid-row: 2; justify-self: center; }
.box-bottom { grid-column: 1 / -1; grid-row: 3; justify-self: center; padding: 2px 0; }
.box-val-input { background: none; border: none; outline: none; font: 11px var(--m); color: var(--t1); width: 44px; text-align: center; border-radius: 3px; padding: 2px 0; }
.box-val-input:hover { background: rgba(0,0,0,0.05); }
.box-val-input:focus { background: var(--bg0); box-shadow: 0 0 0 1.5px var(--accent); }
.box-model-corners { display: grid; grid-template-columns: 1fr 1fr; grid-template-rows: 1fr 1fr; width: 100%; height: 100%; min-height: 80px; position: relative; }
.box-corner { display: flex; align-items: center; justify-content: center; }
.box-corner-tl { grid-column: 1; grid-row: 1; }
.box-corner-tr { grid-column: 2; grid-row: 1; }
.box-corner-bl { grid-column: 1; grid-row: 2; }
.box-corner-br { grid-column: 2; grid-row: 2; }
.box-corner-center { position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%); width: 40px; height: 32px; border-radius: 4px; background: var(--bg0); border: 1.5px solid var(--border); }

/* Tokens */
.token-row { display: flex; align-items: center; gap: 8px; padding: 4px 0; }
.token-name { flex: 1; font: 10px var(--m); color: var(--accent); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; min-width: 0; }
.token-val { font: 10px var(--m); color: var(--t2); flex-shrink: 0; }

/* Griffel */
.slot-name { font: 11px var(--m); font-weight: 600; color: var(--accent); margin-top: 8px; }
.slot-name:first-child { margin-top: 0; }
.slot-rule { font: 10px var(--m); color: var(--t2); padding-left: 12px; line-height: 1.7; }

/* Footer */
.footer-bar { display: flex; align-items: center; justify-content: space-between; padding: 10px 16px; border-bottom: 1px solid var(--divider); background: linear-gradient(135deg, #fff7ed, #fef3c7); position: sticky; top: 0; z-index: 10; }
.footer-count { font-size: 11px; font-weight: 600; color: #b45309; }
.footer-actions { display: flex; gap: 8px; }
.btn-sm { padding: 5px 12px; background: var(--bg0); border: 1px solid var(--border); border-radius: var(--r); color: var(--t2); font: 11px var(--f); cursor: pointer; transition: all 0.15s; }
.btn-sm:hover { color: var(--t1); background: var(--bg2); }
.btn-accent-sm { padding: 6px 14px; background: linear-gradient(135deg, #7c3aed, #6d28d9); border: none; border-radius: var(--r); color: #fff; font: 11px var(--f); font-weight: 600; cursor: pointer; transition: all 0.15s; box-shadow: 0 2px 8px rgba(109, 40, 217, 0.35); }
.btn-accent-sm:hover { opacity: 0.92; box-shadow: 0 4px 12px rgba(109, 40, 217, 0.45); transform: translateY(-1px); }
.btn-accent-sm:active { transform: translateY(0); }
.btn-send-copilot { background: linear-gradient(135deg, #059669, #047857); box-shadow: 0 2px 8px rgba(5, 150, 105, 0.35); }
.btn-send-copilot:hover { box-shadow: 0 4px 12px rgba(5, 150, 105, 0.45); }

/* Bag */
.bag-bar { border-bottom: 1px solid var(--divider); background: linear-gradient(135deg, #eff6ff, #dbeafe); padding: 10px 16px; position: sticky; top: 0; z-index: 10; }
.bag-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
.bag-title { font-size: 11px; font-weight: 700; color: #1d4ed8; }
.bag-actions { display: flex; gap: 6px; }
.bag-list { display: flex; flex-direction: column; gap: 6px; }
.bag-entry { background: var(--bg0); border: 1px solid var(--border); border-radius: var(--r); padding: 8px 10px; font-size: 11px; }
.bag-entry-head { display: flex; align-items: center; gap: 6px; }
.bag-entry-name { font-weight: 600; color: var(--t1); }
.bag-entry-loc { font: 10px var(--m); color: var(--t3); flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.bag-entry-remove { background: none; border: none; color: var(--t3); cursor: pointer; font-size: 14px; line-height: 1; padding: 0 2px; flex-shrink: 0; }
.bag-entry-remove:hover { color: var(--t1); }
.bag-entry-note { color: var(--t2); margin-top: 4px; line-height: 1.4; }
.bag-entry-changes { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 4px; }
.bag-entry-change { font: 10px var(--m); color: var(--t3); background: var(--bg2); padding: 2px 6px; border-radius: 3px; }

/* Scrollbar */
::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: rgba(0,0,0,0.18); }
`;


// ===== JS (exact port from sidepanel.ts, chrome.runtime replaced with postMessage) =====

const DRAWER_JS = `
var payload = null;
var changes = new Map();

var LABELS = {
  'width': 'W', 'height': 'H', 'min-width': 'Min W', 'max-width': 'Max W',
  'min-height': 'Min H', 'max-height': 'Max H',
  'margin-top': 'T', 'margin-right': 'R', 'margin-bottom': 'B', 'margin-left': 'L',
  'padding-top': 'T', 'padding-right': 'R', 'padding-bottom': 'B', 'padding-left': 'L',
  'border-top-left-radius': 'TL', 'border-top-right-radius': 'TR',
  'border-bottom-right-radius': 'BR', 'border-bottom-left-radius': 'BL',
  'font-size': 'Size', 'font-weight': 'Weight', 'line-height': 'LH',
  'letter-spacing': 'Spacing', 'gap': 'Gap', 'opacity': 'Opacity',
  'top': 'T', 'right': 'R', 'bottom': 'B', 'left': 'L', 'z-index': 'Z',
  'border-top-width': 'Width', 'border-top-style': 'Style',
};

var SECTIONS = [
  { label: 'Layout', rows: [
    { gridClass: 'grid', props: ['display', 'position'] },
    { gridClass: 'grid-4', props: ['top', 'right', 'bottom', 'left'], subLabel: 'Position' },
    { gridClass: 'grid', props: ['flex-direction', 'flex-wrap'] },
    { gridClass: 'grid-3', props: ['justify-content', 'align-items', 'gap'] },
  ]},
  { label: 'Size', rows: [
    { gridClass: 'grid', props: ['width', 'height'] },
    { gridClass: 'grid', props: ['min-width', 'max-width'] },
    { gridClass: 'grid', props: ['min-height', 'max-height'] },
  ]},
  { label: 'Typography', rows: [
    { gridClass: 'grid-1', props: ['font-family'] },
    { gridClass: 'grid-3', props: ['font-size', 'font-weight', 'line-height'] },
    { gridClass: 'grid', props: ['text-align', 'letter-spacing'] },
  ]},
  { label: 'Fill', rows: [
    { gridClass: 'grid-1', props: ['color'], subLabel: 'Text' },
    { gridClass: 'grid-1', props: ['background-color'], subLabel: 'Background' },
    { gridClass: 'grid-1', props: ['opacity'] },
  ]},
  { label: 'Border', rows: [
    { gridClass: 'grid', props: ['border-top-width', 'border-top-style'], subLabel: 'Border' },
    { gridClass: 'grid-1', props: ['border-top-color'] },
    { gridClass: 'grid-1', props: ['box-shadow'], subLabel: 'Shadow' },
  ]},
  { label: 'Effects', rows: [
    { gridClass: 'grid', props: ['overflow', 'visibility'] },
    { gridClass: 'grid', props: ['cursor', 'z-index'] },
  ]},
];

var SKIP = new Set(['', 'rgba(0, 0, 0, 0)']);
var COLOR_PROPS = new Set(['color', 'background-color', 'border-top-color']);
var ENUM_PROPS = {
  'display': ['block', 'inline', 'inline-block', 'flex', 'inline-flex', 'grid', 'none'],
  'position': ['static', 'relative', 'absolute', 'fixed', 'sticky'],
  'flex-direction': ['row', 'column', 'row-reverse', 'column-reverse'],
  'flex-wrap': ['nowrap', 'wrap', 'wrap-reverse'],
  'justify-content': ['flex-start', 'center', 'flex-end', 'space-between', 'space-around'],
  'align-items': ['stretch', 'flex-start', 'center', 'flex-end', 'baseline'],
  'text-align': ['left', 'center', 'right', 'justify'],
  'overflow': ['visible', 'hidden', 'scroll', 'auto'],
  'visibility': ['visible', 'hidden'],
  'cursor': ['auto', 'default', 'pointer', 'text', 'move', 'not-allowed'],
  'border-top-style': ['none', 'solid', 'dashed', 'dotted', 'double'],
};
var RANGE_PROPS = {
  'opacity': { min: 0, max: 1, step: 0.01 },
  'font-weight': { min: 100, max: 900, step: 100 },
};

// Fluent token validation (inline — matches fluent-tokens.ts)
var SPACING = [0, 2, 4, 6, 8, 10, 12, 16, 20, 24, 32];
var BORDER_RADIUS = [0, 2, 4, 6, 8, 12, 16, 24, 32, 40, 10000];
var STROKE_WIDTH = [1, 2, 3, 4];
var FONT_SIZE_VALS = [10, 12, 14, 16, 20, 24, 28, 32, 40, 68];
var LINE_HEIGHT_VALS = [14, 16, 20, 22, 28, 32, 36, 40, 52, 92];
var FONT_WEIGHT_VALS = [400, 500, 600, 700];

var SPACING_NAMES = {0:'None',2:'XXS',4:'XS',6:'SNudge',8:'S',10:'MNudge',12:'M',16:'L',20:'XL',24:'XXL',32:'XXXL'};
var RADIUS_NAMES = {0:'None',2:'Small',4:'Medium',6:'Large',8:'XLarge',12:'2XLarge',16:'3XLarge',24:'4XLarge',32:'5XLarge',40:'6XLarge',10000:'Circular'};
var STROKE_NAMES = {1:'Thin',2:'Thick',3:'Thicker',4:'Thickest'};
var FONT_SIZE_NAMES = {10:'Base100',12:'Base200',14:'Base300',16:'Base400',20:'Base500',24:'Base600',28:'Hero700',32:'Hero800',40:'Hero900',68:'Hero1000'};
var LINE_HEIGHT_NAMES = {14:'Base100',16:'Base200',20:'Base300',22:'Base400',28:'Base500',32:'Base600',36:'Hero700',40:'Hero800',52:'Hero900',92:'Hero1000'};
var WEIGHT_NAMES = {400:'Regular',500:'Medium',600:'Semibold',700:'Bold'};

function getCategory(prop) {
  if (/^(margin|padding)/.test(prop)) return { values: SPACING, names: SPACING_NAMES, prefix: 'spacing' };
  if (/^gap$/.test(prop)) return { values: SPACING, names: SPACING_NAMES, prefix: 'spacing' };
  if (/border.*radius/i.test(prop)) return { values: BORDER_RADIUS, names: RADIUS_NAMES, prefix: 'borderRadius' };
  if (/border.*width/i.test(prop)) return { values: STROKE_WIDTH, names: STROKE_NAMES, prefix: 'strokeWidth' };
  if (prop === 'font-size') return { values: FONT_SIZE_VALS, names: FONT_SIZE_NAMES, prefix: 'fontSize' };
  if (prop === 'line-height') return { values: LINE_HEIGHT_VALS, names: LINE_HEIGHT_NAMES, prefix: 'lineHeight' };
  if (prop === 'font-weight') return { values: FONT_WEIGHT_VALS, names: WEIGHT_NAMES, prefix: 'fontWeight' };
  return null;
}
function findNearest(values, target) { var best=values[0],bd=Math.abs(target-best); for(var v of values){var d=Math.abs(target-v);if(d<bd){best=v;bd=d;}} return best; }
function parseNumeric(value) { if(value==='0')return 0; if(value==='auto'||value==='none'||value==='normal'||value==='inherit')return null; var m=value.match(/^(-?\\d+(?:\\.\\d+)?)\\s*(px)?$/); if(m)return parseFloat(m[1]); var n=parseFloat(value); if(!isNaN(n)&&String(n)===value.trim())return n; return null; }
function checkFluentValue(prop, value) {
  var cat = getCategory(prop);
  if (!cat) return { valid: true };
  var num = parseNumeric(value);
  if (num === null || num === 0) return { valid: true };
  if (cat.values.includes(num)) return { valid: true };
  var nearest = findNearest(cat.values, num);
  var unit = prop === 'font-weight' ? '' : 'px';
  var name = cat.names[nearest];
  return { valid: false, nearest: nearest + unit, tokenName: name ? cat.prefix + name : undefined };
}

var FLUENT_ICON = '<svg class="fluent-icon" width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><path d="M7.3 1.4a1 1 0 0 1 1.4 0l6 6a1 1 0 0 1 0 1.4l-6 6a1 1 0 0 1-1.4 0l-6-6a1 1 0 0 1 0-1.4l6-6z"/></svg>';
var fluentViolations = [];

// DOM refs
var emptyEl = document.getElementById('sp-empty');
var mainEl = document.getElementById('sp-main');
var infoEl = document.getElementById('sp-info');
var designEl = document.getElementById('sp-design');
var footerEl = document.getElementById('sp-footer');
var countEl = document.getElementById('sp-count');
var resetBtn = document.getElementById('sp-reset');
var addToBagBtn = document.getElementById('sp-add-to-bag');
var bagBar = document.getElementById('sp-bag');
var bagCountEl = document.getElementById('sp-bag-count');
var bagListEl = document.getElementById('sp-bag-list');
var bagClearBtn = document.getElementById('sp-bag-clear');
var bagSendBtn = document.getElementById('sp-bag-send');
var statusDot = document.getElementById('sp-status-dot');
var statusText = document.getElementById('sp-status-text');
var pageInfoEl = document.getElementById('sp-page-info');
var headerSelectBtn = document.getElementById('sp-header-select');

function post(type, data) { parent.postMessage(Object.assign({ source: 'grabber-drawer', type: type }, data || {}), '*'); }

// Header
headerSelectBtn.addEventListener('click', function() {
  headerSelectBtn.disabled = true;
  headerSelectBtn.textContent = 'Activating...';
  post('ACTIVATE_SELECTOR');
  setTimeout(function() { headerSelectBtn.disabled = false; headerSelectBtn.textContent = 'Select Element'; }, 1500);
});
document.getElementById('sp-close').addEventListener('click', function() { post('CLOSE_DRAWER'); });

// Footer events
resetBtn.addEventListener('click', function() { post('STYLE_RESET_ALL'); changes.clear(); if(payload) render(payload); updateFooter(); });
addToBagBtn.addEventListener('click', function() { post('BAG_ADD', { note: '' }); changes.clear(); if(payload) render(payload); updateFooter(); });
bagClearBtn.addEventListener('click', function() { post('BAG_CLEAR'); });
bagSendBtn.addEventListener('click', function() {
  if (changes.size > 0) {
    post('BAG_ADD', { note: '' });
    changes.clear();
    if(payload) render(payload);
    updateFooter();
  }
  bagSendBtn.textContent = 'Sending...';
  post('BAG_SEND');
});

// Page info
try {
  var url = new URL(window.parent.location.href);
  var host = url.hostname.replace('www.', '');
  pageInfoEl.textContent = host.length > 20 ? host.slice(0,20) + '...' : host;
} catch(e) { pageInfoEl.textContent = 'App'; }

// Messages from host
window.addEventListener('message', function(e) {
  if (!e.data || e.data.source !== 'grabber-drawer-host') return;
  if (e.data.type === 'GRABBER_STYLE_UPDATE') {
    payload = e.data.data;
    changes.clear();
    render(payload);
  }
  if (e.data.type === 'CONNECTION_STATUS') {
    if (e.data.connected) { statusDot.classList.add('connected'); statusText.textContent = 'Connected'; }
    else { statusDot.classList.remove('connected'); statusText.textContent = 'Offline'; }
  }
  if (e.data.type === 'BAG_STATE') {
    renderBag(e.data.bag || [], e.data.count || 0);
  }
  if (e.data.type === 'BAG_SEND_RESULT') {
    bagSendBtn.textContent = e.data.success ? 'Sent!' : 'Failed';
    setTimeout(function() { bagSendBtn.textContent = 'Send all to Copilot'; }, 1500);
  }
});

// Initial connection check
post('CHECK_CONNECTION');

function render(p) {
  emptyEl.style.display = 'none';
  mainEl.style.display = 'flex';
  fluentViolations = [];
  renderInfo(p);
  renderDesign(p);
  renderFluentSummary();
  updateFooter();
}

function renderInfo(p) {
  var c = p.elementContext.component;
  if (c) {
    var f = c.fileName ? c.fileName.split('/').pop() || '' : '';
    var l = c.lineNumber ? ':' + c.lineNumber : '';
    infoEl.innerHTML = '<div class="info-details"><div class="info-name">' + c.componentName + '</div><div class="info-file">' + f + l + '</div></div><button class="info-reselect" id="resel">Reselect</button>';
  } else {
    var tag = p.elementContext.cssSelector.split(' > ').pop() || 'element';
    infoEl.innerHTML = '<div class="info-details"><div class="info-name">&lt;' + tag + '&gt;</div><div class="info-file">Native element</div></div><button class="info-reselect" id="resel">Reselect</button>';
  }
  var resel = document.getElementById('resel');
  if (resel) resel.addEventListener('click', function() { post('ACTIVATE_SELECTOR'); });
}

function renderDesign(p) {
  designEl.innerHTML = '';
  var css = p.styleData.computed;
  var sizeInserted = false;

  for (var si = 0; si < SECTIONS.length; si++) {
    var sec = SECTIONS[si];
    var hasContent = sec.rows.some(function(r) { return r.props.some(function(prop) { var v = val(prop, css); return v && !SKIP.has(v); }); });
    if (!hasContent) continue;

    designEl.appendChild(mkSection(sec.label, function(sec) { return function() {
      var body = document.createElement('div');
      for (var ri = 0; ri < sec.rows.length; ri++) {
        var row = sec.rows[ri];
        var activeProps = row.props.filter(function(prop) { var v = val(prop, css); return v && !SKIP.has(v); });
        if (activeProps.length === 0) continue;
        if (row.subLabel) { var lbl = document.createElement('div'); lbl.className = 'sub-label'; lbl.textContent = row.subLabel; body.appendChild(lbl); }
        var grid = document.createElement('div'); grid.className = row.gridClass || 'grid';
        for (var pi = 0; pi < row.props.length; pi++) {
          var prop = row.props[pi];
          var v = val(prop, css);
          if (!v || SKIP.has(v)) { grid.appendChild(document.createElement('div')); continue; }
          grid.appendChild(mkField(prop, v));
        }
        body.appendChild(grid);
      }
      return body;
    }; }(sec)));

    if (sec.label === 'Size' && !sizeInserted) {
      sizeInserted = true;
      var mProps = ['margin-top','margin-right','margin-bottom','margin-left'];
      var pProps = ['padding-top','padding-right','padding-bottom','padding-left'];
      var hasM = mProps.some(function(p) { var v = val(p, css); return v && !SKIP.has(v); });
      var hasP = pProps.some(function(p) { var v = val(p, css); return v && !SKIP.has(v); });
      if (hasM || hasP) {
        designEl.appendChild(mkSection('Spacing', function() {
          var body = document.createElement('div');
          if (hasM) body.appendChild(mkBoxModel('Margin', 'box-margin', [{prop:'margin-top',pos:'top'},{prop:'margin-right',pos:'right'},{prop:'margin-bottom',pos:'bottom'},{prop:'margin-left',pos:'left'}], css));
          if (hasP) body.appendChild(mkBoxModel('Padding', 'box-padding', [{prop:'padding-top',pos:'top'},{prop:'padding-right',pos:'right'},{prop:'padding-bottom',pos:'bottom'},{prop:'padding-left',pos:'left'}], css));
          return body;
        }));
      }
    }

    if (sec.label === 'Border') {
      var rProps = ['border-top-left-radius','border-top-right-radius','border-bottom-right-radius','border-bottom-left-radius'];
      var hasR = rProps.some(function(p) { var v = val(p, css); return v && !SKIP.has(v); });
      if (hasR) {
        var borderNode = designEl.lastElementChild;
        designEl.removeChild(borderNode);
        designEl.appendChild(mkSection('Radius', function() {
          return mkRadiusDiagram([{prop:'border-top-left-radius',pos:'tl'},{prop:'border-top-right-radius',pos:'tr'},{prop:'border-bottom-left-radius',pos:'bl'},{prop:'border-bottom-right-radius',pos:'br'}], css);
        }));
        designEl.appendChild(borderNode);
      }
    }
  }

  if (!sizeInserted) {
    var mProps2 = ['margin-top','margin-right','margin-bottom','margin-left'];
    var pProps2 = ['padding-top','padding-right','padding-bottom','padding-left'];
    var hasM2 = mProps2.some(function(p) { var v = val(p, css); return v && !SKIP.has(v); });
    var hasP2 = pProps2.some(function(p) { var v = val(p, css); return v && !SKIP.has(v); });
    if (hasM2 || hasP2) {
      designEl.appendChild(mkSection('Spacing', function() {
        var body = document.createElement('div');
        if (hasM2) body.appendChild(mkBoxModel('Margin','box-margin',[{prop:'margin-top',pos:'top'},{prop:'margin-right',pos:'right'},{prop:'margin-bottom',pos:'bottom'},{prop:'margin-left',pos:'left'}], css));
        if (hasP2) body.appendChild(mkBoxModel('Padding','box-padding',[{prop:'padding-top',pos:'top'},{prop:'padding-right',pos:'right'},{prop:'padding-bottom',pos:'bottom'},{prop:'padding-left',pos:'left'}], css));
        return body;
      }));
    }
  }

  if (p.griffelSlots && p.griffelSlots.length) {
    designEl.appendChild(mkSection('Griffel', function() {
      var b = document.createElement('div');
      for (var s of p.griffelSlots) {
        var n = document.createElement('div'); n.className = 'slot-name'; n.textContent = s.slot; b.appendChild(n);
        for (var r of s.rules) { var e = document.createElement('div'); e.className = 'slot-rule'; e.textContent = r; b.appendChild(e); }
      }
      return b;
    }, true));
  }

  if (p.fluentTokens && Object.keys(p.fluentTokens).length) {
    designEl.appendChild(mkSection('Tokens', function() {
      var b = document.createElement('div');
      for (var tk of Object.entries(p.fluentTokens)) {
        var row = document.createElement('div'); row.className = 'token-row';
        if (/^(#|rgba?\\(|hsla?\\()/i.test(tk[1])) { var sw = document.createElement('span'); sw.className = 'swatch'; sw.style.backgroundColor = tk[1]; row.appendChild(sw); }
        var n = document.createElement('span'); n.className = 'token-name'; n.textContent = tk[0].replace(/^--/, ''); n.title = tk[0];
        var v = document.createElement('span'); v.className = 'token-val'; v.textContent = tk[1];
        row.appendChild(n); row.appendChild(v); b.appendChild(row);
      }
      return b;
    }, true));
  }
}

function renderFluentSummary() {
  var old = document.getElementById('fluent-summary');
  if (old) old.remove();
  if (fluentViolations.length === 0) return;
  var bar = document.createElement('div'); bar.id = 'fluent-summary'; bar.className = 'fluent-summary';
  bar.innerHTML = '<div class="fluent-summary-row">' + FLUENT_ICON + '<span class="fluent-summary-text">' + fluentViolations.length + ' value' + (fluentViolations.length > 1 ? 's' : '') + ' not following Fluent 2</span><button class="fluent-fix-all-btn" id="fluent-fix-all">Fix all</button></div>';
  infoEl.insertAdjacentElement('afterend', bar);
  document.getElementById('fluent-fix-all').addEventListener('click', function() {
    for (var v of fluentViolations) apply(v.prop, v.nearest);
    if (payload) render(payload);
  });
}

function val(prop, css) { return changes.has(prop) ? changes.get(prop).cur : (css[prop] || ''); }

function mkSection(label, build, shut) {
  var s = document.createElement('div'); s.className = 'sec' + (shut ? ' shut' : '');
  var h = document.createElement('div'); h.className = 'sec-head';
  h.innerHTML = '<span class="sec-label">' + label + '</span><span class="sec-chev">&#9662;</span>';
  var b = document.createElement('div'); b.className = 'sec-body'; b.appendChild(build());
  h.addEventListener('click', function() { s.classList.toggle('shut'); });
  s.appendChild(h); s.appendChild(b);
  return s;
}

function mkBoxModel(label, cssClass, sides, css) {
  var wrapper = document.createElement('div'); wrapper.className = 'box-model';
  var diagram = document.createElement('div'); diagram.className = 'box-model-diagram ' + cssClass;
  var typeLabel = document.createElement('span'); typeLabel.className = 'box-model-type'; typeLabel.textContent = label;
  diagram.appendChild(typeLabel);
  var center = document.createElement('div'); center.className = 'box-center';
  diagram.appendChild(center);
  for (var side of sides) {
    var v = val(side.prop, css) || '0';
    var posEl = document.createElement('div'); posEl.className = 'box-' + side.pos;
    var inp = document.createElement('input'); inp.className = 'box-val-input'; inp.type = 'text'; inp.value = v;
    (function(prop, inp) {
      inp.addEventListener('change', function() { apply(prop, inp.value.trim()); });
      inp.addEventListener('keydown', function(e) { if (e.key === 'Enter') inp.blur(); });
    })(side.prop, inp);
    posEl.appendChild(inp);
    var check = checkFluentValue(side.prop, v);
    if (!check.valid && check.nearest) {
      posEl.classList.add('box-val-warn');
      fluentViolations.push({ prop: side.prop, value: v, nearest: check.nearest, tokenName: check.tokenName || '' });
      var fix = document.createElement('button'); fix.className = 'box-fix-btn';
      fix.title = check.tokenName ? check.tokenName + ' (' + check.nearest + ')' : check.nearest;
      fix.textContent = check.nearest;
      (function(prop, inp, posEl, fix, nearest) {
        fix.addEventListener('click', function() { inp.value = nearest; apply(prop, nearest); posEl.classList.remove('box-val-warn'); fix.remove(); });
      })(side.prop, inp, posEl, fix, check.nearest);
      posEl.appendChild(fix);
    }
    diagram.appendChild(posEl);
  }
  wrapper.appendChild(diagram);
  return wrapper;
}

function mkRadiusDiagram(corners, css) {
  var diagram = document.createElement('div'); diagram.className = 'box-model-diagram box-radius';
  var typeLabel = document.createElement('span'); typeLabel.className = 'box-model-type'; typeLabel.textContent = 'Radius';
  diagram.appendChild(typeLabel);
  var grid = document.createElement('div'); grid.className = 'box-model-corners';
  var centerBox = document.createElement('div'); centerBox.className = 'box-corner-center';
  grid.appendChild(centerBox);
  for (var corner of corners) {
    var v = val(corner.prop, css) || '0';
    var cell = document.createElement('div'); cell.className = 'box-corner box-corner-' + corner.pos;
    var inp = document.createElement('input'); inp.className = 'box-val-input'; inp.type = 'text'; inp.value = v;
    (function(prop, inp) {
      inp.addEventListener('change', function() { apply(prop, inp.value.trim()); });
      inp.addEventListener('keydown', function(e) { if (e.key === 'Enter') inp.blur(); });
    })(corner.prop, inp);
    cell.appendChild(inp);
    var check = checkFluentValue(corner.prop, v);
    if (!check.valid && check.nearest) {
      cell.classList.add('box-val-warn');
      fluentViolations.push({ prop: corner.prop, value: v, nearest: check.nearest, tokenName: check.tokenName || '' });
      var fix = document.createElement('button'); fix.className = 'box-fix-btn';
      fix.title = check.tokenName ? check.tokenName + ' (' + check.nearest + ')' : check.nearest;
      fix.textContent = check.nearest;
      (function(prop, inp, cell, fix, nearest) {
        fix.addEventListener('click', function() { inp.value = nearest; apply(prop, nearest); cell.classList.remove('box-val-warn'); fix.remove(); });
      })(corner.prop, inp, cell, fix, check.nearest);
      cell.appendChild(fix);
    }
    grid.appendChild(cell);
  }
  diagram.appendChild(grid);
  return diagram;
}

function mkField(prop, value) {
  var label = LABELS[prop] || prop.replace(/^(border-top-|border-bottom-|border-right-|border-left-)/, '');
  var isMod = changes.has(prop);
  if (COLOR_PROPS.has(prop)) return mkColorField(prop, value, isMod);
  if (ENUM_PROPS[prop]) return mkSelectField(prop, value, label, isMod);
  if (RANGE_PROPS[prop]) return mkRangeField(prop, value, label, isMod);
  return mkInputField(prop, value, label, isMod);
}

function mkInputField(prop, value, label, mod) {
  var wrapper = document.createElement('div'); wrapper.className = 'field-wrapper';
  var el = document.createElement('div'); el.className = 'field' + (mod ? ' field-mod' : '');
  el.innerHTML = '<span class="field-label">' + label + '</span>';
  var inp = document.createElement('input'); inp.className = 'field-input'; inp.type = 'text'; inp.value = value;
  inp.addEventListener('change', function() { apply(prop, inp.value.trim()); });
  inp.addEventListener('keydown', function(e) { if (e.key === 'Enter') inp.blur(); });
  el.appendChild(inp);
  wrapper.appendChild(el);
  var check = checkFluentValue(prop, value);
  if (!check.valid && check.nearest) {
    el.classList.add('field-warn');
    fluentViolations.push({ prop: prop, value: value, nearest: check.nearest, tokenName: check.tokenName || '' });
    var hint = document.createElement('div'); hint.className = 'fluent-hint';
    hint.innerHTML = FLUENT_ICON + '<span class="fluent-hint-text">' + (check.tokenName || 'Fluent') + '</span>';
    var fixBtn = document.createElement('button'); fixBtn.className = 'fluent-fix-btn';
    fixBtn.textContent = 'Fix \\u2192 ' + check.nearest;
    (function(prop, inp, el, hint, nearest) {
      fixBtn.addEventListener('click', function() { inp.value = nearest; apply(prop, nearest); el.classList.remove('field-warn'); hint.remove(); });
    })(prop, inp, el, hint, check.nearest);
    hint.appendChild(fixBtn);
    wrapper.appendChild(hint);
  }
  return wrapper;
}

function mkColorField(prop, value, mod) {
  var el = document.createElement('div'); el.className = 'field-color' + (mod ? ' field-mod' : '');
  var sw = document.createElement('span'); sw.className = 'swatch'; sw.style.backgroundColor = value;
  var hidden = document.createElement('input'); hidden.className = 'color-hidden'; hidden.type = 'color'; hidden.value = toHex(value);
  var txt = document.createElement('span'); txt.className = 'color-val'; txt.textContent = value;
  sw.addEventListener('click', function() { hidden.click(); });
  hidden.addEventListener('input', function() { sw.style.backgroundColor = hidden.value; txt.textContent = hidden.value; apply(prop, hidden.value); });
  el.appendChild(sw); el.appendChild(hidden); el.appendChild(txt);
  return el;
}

function mkSelectField(prop, value, label, mod) {
  var sel = document.createElement('select'); sel.className = 'field-select' + (mod ? ' field-mod' : '');
  var opts = ENUM_PROPS[prop];
  if (!opts.includes(value)) { var o = document.createElement('option'); o.value = value; o.textContent = value; o.selected = true; sel.appendChild(o); }
  for (var opt of opts) { var o = document.createElement('option'); o.value = opt; o.textContent = opt; if (opt === value) o.selected = true; sel.appendChild(o); }
  sel.addEventListener('change', function() { apply(prop, sel.value); });
  return sel;
}

function mkRangeField(prop, value, label, mod) {
  var rng = RANGE_PROPS[prop];
  var el = document.createElement('div'); el.className = 'field-range' + (mod ? ' field-mod' : '');
  var lbl = document.createElement('span'); lbl.className = 'field-label'; lbl.textContent = label;
  var slider = document.createElement('input'); slider.type = 'range'; slider.min = String(rng.min); slider.max = String(rng.max); slider.step = String(rng.step);
  slider.value = String(parseFloat(value) || 0);
  var v = document.createElement('span'); v.className = 'range-val'; v.textContent = value;
  slider.addEventListener('input', function() { v.textContent = slider.value; apply(prop, slider.value); });
  el.appendChild(lbl); el.appendChild(slider); el.appendChild(v);
  return el;
}

function apply(prop, val) {
  var orig = changes.has(prop) ? changes.get(prop).orig : (payload ? payload.styleData.computed[prop] || '' : '');
  if (val === orig) { changes.delete(prop); } else { changes.set(prop, { orig: orig, cur: val }); }
  post('STYLE_CHANGE', { property: prop, value: val });
  updateFooter();
}

function updateFooter() {
  countEl.textContent = String(changes.size);
  footerEl.style.display = changes.size > 0 ? 'flex' : 'none';
}

function renderBag(bag, count) {
  bagCountEl.textContent = String(count);
  bagBar.style.display = count > 0 ? 'block' : 'none';
  bagListEl.innerHTML = '';
  for (var entry of bag) {
    var el = document.createElement('div'); el.className = 'bag-entry';
    var loc = entry.fileName ? entry.fileName + (entry.lineNumber ? ':' + entry.lineNumber : '') : '';
    var html = '<div class="bag-entry-head"><span class="bag-entry-name">' + entry.componentName + '</span>';
    if (loc) html += '<span class="bag-entry-loc">' + loc + '</span>';
    html += '<button class="bag-entry-remove" data-id="' + entry.id + '" title="Remove">&times;</button></div>';
    if (entry.note) html += '<div class="bag-entry-note">' + entry.note + '</div>';
    if (entry.styleChanges.length > 0) {
      html += '<div class="bag-entry-changes">';
      for (var ch of entry.styleChanges) html += '<span class="bag-entry-change">' + ch.property + ': ' + ch.from + ' \\u2192 ' + ch.to + '</span>';
      html += '</div>';
    }
    el.innerHTML = html;
    (function(id) {
      el.querySelector('.bag-entry-remove').addEventListener('click', function() { post('BAG_REMOVE', { id: id }); });
    })(entry.id);
    bagListEl.appendChild(el);
  }
}

function toHex(rgb) {
  if (rgb.startsWith('#')) return rgb.slice(0, 7);
  var m = rgb.match(/(\\d+)\\s*,\\s*(\\d+)\\s*,\\s*(\\d+)/);
  if (!m) return '#000000';
  return '#' + [m[1], m[2], m[3]].map(function(n) { return parseInt(n).toString(16).padStart(2, '0'); }).join('');
}
`;
