/**
 * Element selector for highlighting and selecting React components.
 * Ported from Chrome extension — no chrome.* APIs, direct function calls.
 */

import { getFiberData, getFiberDataWithRetry, fiberDataToComponentInfo, type FiberData } from './fiber';
import { extractComputedStyles, extractStyleData } from './styles';
import type { ElementContext, StyleData, ElementStylePayload } from './types';

export type ElementSelectedCallback = (payload: ElementStylePayload) => void;

export class ElementSelector {
  private isActive = false;
  private overlay: HTMLDivElement | null = null;
  private infoBox: HTMLDivElement | null = null;
  private toast: HTMLDivElement | null = null;
  private guideTop: HTMLDivElement | null = null;
  private guideBottom: HTMLDivElement | null = null;
  private guideLeft: HTMLDivElement | null = null;
  private guideRight: HTMLDivElement | null = null;
  private dimensions: HTMLDivElement | null = null;
  private hoveredElement: HTMLElement | null = null;
  private currentFiberData: FiberData | null = null;
  private fetchingFiber = false;
  private onElementSelected: ElementSelectedCallback;

  constructor(onElementSelected: ElementSelectedCallback) {
    this.onElementSelected = onElementSelected;
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleClick = this.handleClick.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);
  }

  activate(): void {
    if (this.isActive) return;

    this.clearSelection();
    this.isActive = true;
    this.createOverlay();
    this.createInfoBox();
    this.showToast('Select an element \u00b7 Esc to cancel');

    document.addEventListener('mousemove', this.handleMouseMove, true);
    document.addEventListener('click', this.handleClick, true);
    document.addEventListener('keydown', this.handleKeyDown, true);

    document.body.classList.add('grabber-active');
  }

  deactivate(): void {
    if (!this.isActive) return;

    this.isActive = false;

    document.removeEventListener('mousemove', this.handleMouseMove, true);
    document.removeEventListener('click', this.handleClick, true);
    document.removeEventListener('keydown', this.handleKeyDown, true);

    document.body.classList.remove('grabber-active');

    this.removeInfoBox();
    this.hideToast();
  }

  clearSelection(): void {
    this.removeOverlay();
    this.removeInfoBox();
    this.hideToast();
    document.querySelector('[data-grabber-selected]')?.removeAttribute('data-grabber-selected');
    this.hoveredElement = null;
    this.currentFiberData = null;
  }

  private createOverlay(): void {
    this.overlay = document.createElement('div');
    this.overlay.id = 'grabber-overlay';
    this.overlay.className = 'grabber-overlay';
    document.body.appendChild(this.overlay);

    this.guideTop = this.createGuide('grabber-guide grabber-guide-h');
    this.guideBottom = this.createGuide('grabber-guide grabber-guide-h');
    this.guideLeft = this.createGuide('grabber-guide grabber-guide-v');
    this.guideRight = this.createGuide('grabber-guide grabber-guide-v');

    this.dimensions = document.createElement('div');
    this.dimensions.className = 'grabber-dimensions';
    document.body.appendChild(this.dimensions);
  }

  private createGuide(className: string): HTMLDivElement {
    const el = document.createElement('div');
    el.className = className;
    document.body.appendChild(el);
    return el;
  }

  private removeOverlay(): void {
    this.overlay?.remove();
    this.overlay = null;
    this.guideTop?.remove();
    this.guideTop = null;
    this.guideBottom?.remove();
    this.guideBottom = null;
    this.guideLeft?.remove();
    this.guideLeft = null;
    this.guideRight?.remove();
    this.guideRight = null;
    this.dimensions?.remove();
    this.dimensions = null;
  }

  private createInfoBox(): void {
    this.infoBox = document.createElement('div');
    this.infoBox.id = 'grabber-info-box';
    this.infoBox.className = 'grabber-info-box';
    document.body.appendChild(this.infoBox);
  }

  private removeInfoBox(): void {
    if (this.infoBox) {
      this.infoBox.remove();
      this.infoBox = null;
    }
  }

  private showToast(
    message: string,
    type: 'info' | 'warning' | 'error' = 'info'
  ): void {
    this.hideToast();

    this.toast = document.createElement('div');
    this.toast.className = `grabber-toast grabber-toast-${type}`;
    this.toast.textContent = message;
    document.body.appendChild(this.toast);

    if (type !== 'info') {
      setTimeout(() => this.hideToast(), 3000);
    }
  }

  private hideToast(): void {
    if (this.toast) {
      this.toast.remove();
      this.toast = null;
    }
  }

  private handleMouseMove(event: MouseEvent): void {
    if (!this.isActive) return;

    const element = document.elementFromPoint(
      event.clientX,
      event.clientY
    ) as HTMLElement;

    if (
      !element ||
      element === this.hoveredElement ||
      element.closest('#grabber-overlay') ||
      element.closest('#grabber-info-box') ||
      element.closest('.grabber-modal') ||
      element.closest('.grabber-toast') ||
      element.closest('.grabber-popup-wrapper') ||
      element.closest('.grabber-sdk-drawer')
    ) {
      return;
    }

    this.hoveredElement = element;
    this.highlightElement(element, event.clientX, event.clientY);
  }

  private async highlightElement(element: HTMLElement, x: number, y: number): Promise<void> {
    if (!this.overlay || !this.infoBox) return;

    const rect = element.getBoundingClientRect();

    this.overlay.style.top = `${rect.top + window.scrollY}px`;
    this.overlay.style.left = `${rect.left + window.scrollX}px`;
    this.overlay.style.width = `${rect.width}px`;
    this.overlay.style.height = `${rect.height}px`;
    this.overlay.style.display = 'block';

    if (this.guideTop) {
      this.guideTop.style.top = `${rect.top}px`;
      this.guideTop.style.display = 'block';
    }
    if (this.guideBottom) {
      this.guideBottom.style.top = `${rect.bottom}px`;
      this.guideBottom.style.display = 'block';
    }
    if (this.guideLeft) {
      this.guideLeft.style.left = `${rect.left}px`;
      this.guideLeft.style.display = 'block';
    }
    if (this.guideRight) {
      this.guideRight.style.left = `${rect.right}px`;
      this.guideRight.style.display = 'block';
    }

    if (this.dimensions) {
      const w = Math.round(rect.width);
      const h = Math.round(rect.height);
      this.dimensions.textContent = `${w} \u00d7 ${h}`;
      this.dimensions.style.top = `${rect.bottom + window.scrollY + 4}px`;
      this.dimensions.style.left = `${rect.left + window.scrollX + rect.width / 2}px`;
      this.dimensions.style.transform = 'translateX(-50%)';
      this.dimensions.style.display = 'block';
    }

    // Get React component info — DIRECT call, no bridge
    if (!this.fetchingFiber) {
      this.fetchingFiber = true;
      try {
        const fiberData = await getFiberDataWithRetry(element);
        this.currentFiberData = fiberData;
        this.updateInfoBox(element, rect, fiberData);
      } catch (error) {
        console.log('[Grabber] Failed to get fiber data:', error);
        this.currentFiberData = null;
        this.updateInfoBox(element, rect, null);
      } finally {
        this.fetchingFiber = false;
      }
    }
  }

  private updateInfoBox(element: HTMLElement, rect: DOMRect, fiberData: FiberData | null): void {
    if (!this.infoBox) return;

    let html = '';

    if (fiberData?.found) {
      const fileName = fiberData.fileName
        ? fiberData.fileName.split('/').pop() || fiberData.fileName
        : '';
      const lineInfo = fiberData.lineNumber ? `:${fiberData.lineNumber}` : '';
      const fileDisplay = fileName ? `${fileName}${lineInfo}` : 'Source not available';

      html = `
        <div class="grabber-info-component">${fiberData.componentName}</div>
        <div class="grabber-info-file">${fileDisplay}</div>
      `;
    } else {
      html = `
        <div class="grabber-info-component">&lt;${element.tagName.toLowerCase()}&gt;</div>
        <div class="grabber-info-file">Native element</div>
      `;
    }

    this.infoBox.innerHTML = html;

    const infoBoxHeight = 50;
    const padding = 10;

    let top = rect.top + window.scrollY - infoBoxHeight - padding;
    if (top < window.scrollY + padding) {
      top = rect.bottom + window.scrollY + padding;
    }

    const left = Math.min(
      Math.max(padding, rect.left + window.scrollX),
      window.innerWidth - 380
    );

    this.infoBox.style.top = `${top}px`;
    this.infoBox.style.left = `${left}px`;
    this.infoBox.style.display = 'block';
  }

  private async handleClick(event: MouseEvent): Promise<void> {
    if (!this.isActive) return;

    event.preventDefault();
    event.stopPropagation();

    const element = this.hoveredElement;
    if (!element) return;

    // If hover fiber fetch hasn't completed yet (user clicked fast), get it sync now
    let fiberData = this.currentFiberData;
    if (!fiberData || !fiberData.found) {
      fiberData = getFiberData(element);
    }
    this.deactivate();

    // Mark element for reliable targeting
    document.querySelector('[data-grabber-selected]')?.removeAttribute('data-grabber-selected');
    element.setAttribute('data-grabber-selected', 'true');

    // Build context — DIRECT calls, no bridges
    const context = this.buildContext(element, fiberData);
    const styleData = extractComputedStyles(element);

    // Extract Griffel/Fluent data — DIRECT call, no bridge
    const { griffelSlots, matchedRules, fluentTokens } = extractStyleData(element);

    // Notify GrabberDevTools with full payload — it creates the modal & opens the drawer
    const payload: ElementStylePayload = {
      elementContext: context,
      styleData,
      griffelSlots,
      fluentTokens,
      matchedRules,
    };

    this.onElementSelected(payload);
  }

  private handleKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.deactivate();
      this.clearSelection();
    }
  }

  private buildContext(element: HTMLElement, fiberData: FiberData | null): ElementContext {
    const rect = element.getBoundingClientRect();

    return {
      component: fiberData ? fiberDataToComponentInfo(fiberData) : null,
      html: this.getCleanHtml(element),
      hierarchy: fiberData?.hierarchy || [],
      cssSelector: this.getCssSelector(element),
      boundingRect: {
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      },
      pageUrl: window.location.href,
    };
  }

  private getCleanHtml(element: HTMLElement): string {
    const clone = element.cloneNode(true) as HTMLElement;
    const scripts = clone.querySelectorAll('script');
    scripts.forEach((s) => s.remove());

    let html = clone.outerHTML;
    if (html.length > 2000) {
      html = element.outerHTML.slice(0, 2000) + '...';
    }

    return html;
  }

  private getCssSelector(element: HTMLElement): string {
    const path: string[] = [];
    let current: HTMLElement | null = element;

    while (current && current !== document.body) {
      let selector = current.tagName.toLowerCase();

      if (current.id) {
        selector = `#${current.id}`;
        path.unshift(selector);
        break;
      }

      if (current.className && typeof current.className === 'string') {
        const classes = current.className
          .split(' ')
          .filter((c) => c && !c.startsWith('grabber-'))
          .slice(0, 2);
        if (classes.length > 0) {
          selector += `.${classes.join('.')}`;
        }
      }

      path.unshift(selector);
      current = current.parentElement;

      if (path.length >= 5) break;
    }

    return path.join(' > ');
  }
}
