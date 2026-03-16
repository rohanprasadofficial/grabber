/**
 * GrabberDevTools — main orchestrator class.
 * Replaces the Chrome extension's background script + content script + side panel coordination.
 * Everything runs in one JS context now.
 */

import type {
  BagEntry,
  ElementStylePayload,
  GrabberConfig,
} from './types';
import { ElementSelector } from './selector';
import { SidePanelDrawer } from './drawer';
import { PromptModal } from './modal';
import { checkVSCodeConnection, sendToVSCode, formatBagForCopilot } from './sender';
import { injectStyles } from './inject-styles';

export class GrabberDevTools {
  private config: Required<GrabberConfig>;
  private selector: ElementSelector;
  private drawer: SidePanelDrawer;
  private cachedPayload: ElementStylePayload | null = null;
  private liveChanges = new Map<string, { orig: string; cur: string }>();
  private changesBag: BagEntry[] = [];
  private nextBagId = 1;
  private activateButton: HTMLDivElement | null = null;
  private stylesInjected = false;
  private isConnected = false;
  private connectionCheckInterval: ReturnType<typeof setInterval> | null = null;

  // Event callbacks (for external integration if needed)
  public onPayloadUpdate: ((payload: ElementStylePayload) => void) | null = null;
  public onBagUpdate: ((bag: BagEntry[], count: number) => void) | null = null;
  public onConnectionChange: ((connected: boolean) => void) | null = null;

  constructor(config: GrabberConfig = {}) {
    this.config = {
      serverUrl: config.serverUrl || 'http://localhost:4567',
      shortcut: config.shortcut || 'ctrl+shift+g',
      showActivateButton: config.showActivateButton ?? true,
    };

    this.selector = new ElementSelector((payload, element) => this.handleElementSelected(payload, element));

    // Wire up the side panel drawer with direct callbacks (replaces chrome.runtime messaging)
    this.drawer = new SidePanelDrawer({
      onActivateSelector: () => this.activate(),
      onStyleChange: (property, value) => this.applyStyleChange(property, value),
      onStyleReset: (property) => this.resetStyle(property),
      onStyleResetAll: () => this.resetAllStyles(),
      onAddToBag: (note) => this.addToBag(note),
      onRemoveBagEntry: (id) => this.removeBagEntry(id),
      onClearBag: () => this.clearBag(),
      onSendBag: () => this.sendBag(),
      getBag: () => this.getBag(),
      getLiveChangesCount: () => this.getLiveChangesCount(),
      checkConnection: () => checkVSCodeConnection(this.config.serverUrl),
    });
  }

  /**
   * Initialize the devtools — inject styles, add keyboard shortcut, show button, create drawer.
   */
  init(): void {
    if (!this.stylesInjected) {
      injectStyles();
      this.stylesInjected = true;
    }

    // Keyboard shortcut
    document.addEventListener('keydown', this.handleKeyDown);

    // Global ESC handler
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        document.querySelector('.grabber-popup-wrapper')?.remove();
        this.selector.clearSelection();
      }
    }, true);

    // Floating activate button
    if (this.config.showActivateButton) {
      this.createActivateButton();
    }

    // Connection check
    this.checkConnection();
    this.connectionCheckInterval = setInterval(() => this.checkConnection(), 5000);

    console.log('[Grabber SDK] Initialized');
  }

  /**
   * Clean up all resources.
   */
  destroy(): void {
    document.removeEventListener('keydown', this.handleKeyDown);
    this.activateButton?.remove();
    this.activateButton = null;
    this.selector.clearSelection();
    this.drawer.destroy();
    if (this.connectionCheckInterval) {
      clearInterval(this.connectionCheckInterval);
    }
  }

  /**
   * Activate the element selector.
   */
  activate(): void {
    this.drawer.show();
    this.selector.activate();
  }

  /**
   * Deactivate the element selector.
   */
  deactivate(): void {
    this.selector.deactivate();
  }

  // ===== Bag Operations =====

  addToBag(note: string): void {
    const comp = this.cachedPayload?.elementContext?.component;
    const styleChanges: { property: string; from: string; to: string }[] = [];
    for (const [prop, { orig, cur }] of this.liveChanges) {
      styleChanges.push({ property: prop, from: orig, to: cur });
    }

    this.changesBag.push({
      id: this.nextBagId++,
      componentName: comp?.componentName || 'Element',
      fileName: comp?.fileName?.split('/').pop() || '',
      lineNumber: comp?.lineNumber || 0,
      note,
      styleChanges,
    });

    this.liveChanges.clear();
    this.onBagUpdate?.(this.changesBag, this.changesBag.length);
    this.drawer.refreshBag();
  }

  removeBagEntry(id: number): void {
    const idx = this.changesBag.findIndex((e) => e.id === id);
    if (idx >= 0) this.changesBag.splice(idx, 1);
    this.onBagUpdate?.(this.changesBag, this.changesBag.length);
    this.drawer.refreshBag();
  }

  clearBag(): void {
    this.changesBag.length = 0;
    this.liveChanges.clear();
    this.onBagUpdate?.(this.changesBag, 0);
    this.drawer.refreshBag();
  }

  getBag(): { bag: BagEntry[]; count: number } {
    return { bag: this.changesBag, count: this.changesBag.length };
  }

  async sendBag(): Promise<{ success: boolean; error?: string }> {
    const prompt = formatBagForCopilot(this.changesBag);
    const result = await sendToVSCode(
      {
        type: 'GRABBER_CONTEXT',
        prompt,
        context: this.cachedPayload?.elementContext || null,
        timestamp: Date.now(),
        version: '1.0.0',
      },
      this.config.serverUrl
    );

    if (result.success) {
      this.changesBag.length = 0;
      this.liveChanges.clear();
      this.onBagUpdate?.(this.changesBag, 0);
    }

    return result;
  }

  // ===== Style Changes =====

  applyStyleChange(property: string, value: string): void {
    const orig = this.liveChanges.has(property)
      ? this.liveChanges.get(property)!.orig
      : (this.cachedPayload?.styleData.computed[property] || '');

    if (value === orig) {
      this.liveChanges.delete(property);
    } else {
      this.liveChanges.set(property, { orig, cur: value });
    }

    const element = document.querySelector('[data-grabber-selected]') as HTMLElement;
    if (element) {
      element.style.setProperty(property, value);
    }
  }

  resetStyle(property: string): void {
    this.liveChanges.delete(property);
    const element = document.querySelector('[data-grabber-selected]') as HTMLElement;
    if (element) {
      element.style.removeProperty(property);
    }
  }

  resetAllStyles(): void {
    this.liveChanges.clear();
    const element = document.querySelector('[data-grabber-selected]') as HTMLElement;
    if (element) {
      element.removeAttribute('style');
    }
  }

  getLiveChangesCount(): number {
    return this.liveChanges.size;
  }

  // ===== Internal =====

  private handleElementSelected = (payload: ElementStylePayload, _element: HTMLElement): void => {
    this.cachedPayload = payload;
    this.liveChanges.clear();
    this.onPayloadUpdate?.(payload);

    // Create the prompt modal with bag callbacks wired up
    // (In Chrome extension, modal used chrome.runtime.sendMessage to background — now direct)
    const modal = new PromptModal(payload.elementContext, () => {});
    modal.onAddToBag = (note: string) => this.addToBag(note);
    modal.onSendBag = () => { this.sendBag(); };
    modal.getBagCount = () => this.changesBag.length;

    // Open the side panel drawer and send the payload (same as chrome.sidePanel.open + GRABBER_STYLE_UPDATE)
    this.drawer.updatePayload(payload);
  };

  private handleKeyDown = (e: KeyboardEvent): void => {
    const shortcut = this.config.shortcut.toLowerCase();
    const parts = shortcut.split('+');

    const needCtrl = parts.includes('ctrl');
    const needMeta = parts.includes('cmd') || parts.includes('meta');
    const needShift = parts.includes('shift');
    const needAlt = parts.includes('alt');
    const key = parts[parts.length - 1];

    const isMac = navigator.userAgent.includes('Mac');
    const ctrlOrCmd = isMac ? e.metaKey : e.ctrlKey;

    if (
      ((needCtrl || needMeta) && ctrlOrCmd) &&
      (needShift ? e.shiftKey : true) &&
      (needAlt ? e.altKey : true) &&
      e.key.toLowerCase() === key
    ) {
      e.preventDefault();
      this.activate();
    }
  };

  private createActivateButton(): void {
    this.activateButton = document.createElement('div');
    this.activateButton.className = 'grabber-activate-btn';
    this.activateButton.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
        <circle cx="12" cy="12" r="3"/>
        <path d="M12 2v4M12 18v4M2 12h4M18 12h4"/>
      </svg>
    `;
    this.activateButton.title = 'Grabber: Select Element (Ctrl+Shift+G)';
    this.activateButton.addEventListener('click', () => this.activate());
    document.body.appendChild(this.activateButton);
  }

  private async checkConnection(): Promise<void> {
    const connected = await checkVSCodeConnection(this.config.serverUrl);
    if (connected !== this.isConnected) {
      this.isConnected = connected;
      this.onConnectionChange?.(connected);

      // Update button indicator
      if (this.activateButton) {
        this.activateButton.classList.toggle('grabber-connected', connected);
      }

      // Update drawer status
      this.drawer.updateConnection(connected);
    }
  }
}
