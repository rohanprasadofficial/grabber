/**
 * In-place prompt popup rendered inside an iframe.
 * Ported from Chrome extension — uses direct callbacks instead of chrome.runtime.
 */

import type { ElementContext, ElementStylePayload } from './types';

// All popup styles inlined inside the iframe — host page CSS cannot reach in
const IFRAME_CSS = `
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: transparent; overflow: hidden; }
.popup { padding: 12px 14px; }
.header { display: flex; align-items: center; margin-bottom: 10px; }
.label { flex: 1; min-width: 0; font-size: 12px; font-weight: 500; font-family: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace; color: rgba(0,0,0,0.45); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.badge { display: none; align-items: center; padding: 2px 8px; background: rgba(60,130,247,0.08); color: #3c82f7; font-size: 10px; font-weight: 600; border-radius: 9px; flex-shrink: 0; }
.close { flex-shrink: 0; width: 22px; height: 22px; display: flex; align-items: center; justify-content: center; background: none; border: none; border-radius: 4px; color: rgba(0,0,0,0.35); font-size: 16px; line-height: 1; cursor: pointer; margin-left: 4px; }
.close:hover { background: rgba(0,0,0,0.06); color: rgba(0,0,0,0.7); }
textarea { display: block; width: 100%; min-height: 40px; max-height: 120px; padding: 10px 12px; background: rgba(0,0,0,0.03); border: 1px solid rgba(0,0,0,0.08); border-radius: 10px; color: rgba(0,0,0,0.85); font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 13px; line-height: 1.5; resize: none; overflow: hidden; overflow-y: auto; transition: border-color 0.15s ease, box-shadow 0.15s ease; box-sizing: border-box; }
textarea:focus { outline: none; border-color: #3c82f7; box-shadow: 0 0 0 3px rgba(60,130,247,0.1); background: #fff; }
textarea::placeholder { color: rgba(0,0,0,0.3); }
.footer { display: flex; align-items: center; justify-content: space-between; margin-top: 10px; }
.hint { display: flex; align-items: center; gap: 3px; font-size: 11px; color: rgba(0,0,0,0.3); }
.hint kbd { display: inline-flex; align-items: center; justify-content: center; min-width: 18px; height: 18px; padding: 0 4px; background: rgba(0,0,0,0.04); border: 1px solid rgba(0,0,0,0.08); border-radius: 4px; font-family: system-ui, sans-serif; font-size: 10px; color: rgba(0,0,0,0.35); }
.btns { display: flex; gap: 6px; }
.add-btn { display: flex; align-items: center; gap: 4px; height: 30px; padding: 0 12px; background: rgba(0,0,0,0.04); border: 1px solid rgba(0,0,0,0.1); border-radius: 8px; color: rgba(0,0,0,0.6); font-family: system-ui, sans-serif; font-size: 12px; font-weight: 500; cursor: pointer; transition: all 0.15s ease; }
.add-btn:hover { background: rgba(0,0,0,0.06); color: rgba(0,0,0,0.8); }
.add-btn:active { transform: scale(0.97); }
.add-btn.ok { background: rgba(52,199,89,0.1); border-color: rgba(52,199,89,0.3); color: #22a352; }
.send-btn { display: flex; align-items: center; justify-content: center; width: 30px; height: 30px; background: rgba(0,0,0,0.06); border: none; border-radius: 8px; color: rgba(0,0,0,0.3); cursor: pointer; transition: all 0.15s ease; }
.send-btn:hover { background: rgba(0,0,0,0.08); color: rgba(0,0,0,0.5); }
.send-btn.active { background: #3c82f7; color: #fff; }
.send-btn.active:hover { background: #2563eb; color: #fff; }
.send-btn:active { transform: scale(0.95); }
.send-btn.sending { opacity: 0.6; pointer-events: none; }
`;

function buildIframeHTML(label: string, isMac: boolean): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${IFRAME_CSS}</style></head><body>
<div class="popup">
  <div class="header">
    <div class="label">${label}</div>
    <span class="badge" id="badge"></span>
    <button class="close" id="close" title="Dismiss">&times;</button>
  </div>
  <textarea id="input" placeholder="Describe the change you want..." autocomplete="off" spellcheck="false"></textarea>
  <div class="footer">
    <span class="hint"><kbd>${isMac ? '\u2318' : 'Ctrl'}</kbd><kbd>\u21b5</kbd> add</span>
    <div class="btns">
      <button class="add-btn" id="add">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Add
      </button>
      <button class="send-btn" id="send" title="Send entire bag to Copilot">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
          <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z"/>
        </svg>
      </button>
    </div>
  </div>
</div>
<script>
  const input = document.getElementById('input');
  const addBtn = document.getElementById('add');
  const sendBtn = document.getElementById('send');
  const badge = document.getElementById('badge');

  function post(type, data) { parent.postMessage({ source: 'grabber-popup', type, ...data }, '*'); }

  input.addEventListener('input', () => {
    input.style.height = 'auto';
    const h = Math.min(input.scrollHeight, 120);
    input.style.height = h + 'px';
    post('resize', { height: document.body.scrollHeight });
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); post('add', { note: input.value.trim() }); }
    if (e.key === 'Escape') { e.preventDefault(); post('close'); }
  });

  addBtn.addEventListener('click', () => post('add', { note: input.value.trim() }));
  sendBtn.addEventListener('click', () => post('send', { note: input.value.trim() }));
  document.getElementById('close').addEventListener('click', () => post('close'));

  window.addEventListener('message', (e) => {
    if (!e.data || e.data.source !== 'grabber-host') return;
    if (e.data.type === 'added') {
      addBtn.classList.add('ok');
      setTimeout(() => addBtn.classList.remove('ok'), 600);
      input.value = '';
      input.style.height = 'auto';
      post('resize', { height: document.body.scrollHeight });
    }
    if (e.data.type === 'sending') { sendBtn.classList.add('sending'); }
    if (e.data.type === 'sent') { sendBtn.classList.remove('sending'); }
    if (e.data.type === 'badge') {
      if (e.data.count > 0) { badge.textContent = e.data.count + ' in bag'; badge.style.display = 'inline-flex'; sendBtn.classList.add('active'); }
      else { badge.style.display = 'none'; sendBtn.classList.remove('active'); }
    }
  });

  input.focus();
  requestAnimationFrame(() => post('resize', { height: document.body.scrollHeight }));
<\/script></body></html>`;
}

/**
 * In-place prompt popup rendered inside an iframe.
 * Uses direct callbacks instead of chrome.runtime.sendMessage.
 */
export class PromptModal {
  private wrapper: HTMLDivElement;
  private iframe: HTMLIFrameElement;
  private context: ElementContext;
  private onElementSelected: (payload: ElementStylePayload) => void;
  private isBusy = false;

  // Bag operations are handled by GrabberDevTools via events
  public onAddToBag: ((note: string) => void) | null = null;
  public onSendBag: ((note: string) => void) | null = null;
  public getBagCount: (() => number) | null = null;

  constructor(context: ElementContext, onElementSelected: (payload: ElementStylePayload) => void) {
    this.context = context;
    this.onElementSelected = onElementSelected;

    const comp = context.component;
    const name = comp?.componentName || 'Element';
    const file = comp?.fileName ? comp.fileName.split('/').pop() || '' : '';
    const line = comp?.lineNumber ? `:${comp.lineNumber}` : '';
    const label = file ? `${name} \u00b7 ${file}${line}` : name;
    const isMac = navigator.userAgent.includes('Mac');

    this.wrapper = document.createElement('div');
    this.wrapper.className = 'grabber-popup-wrapper';
    this.wrapper.style.cssText = `
      position: absolute; z-index: 2147483647;
      width: 340px; pointer-events: auto !important;
    `;

    this.iframe = document.createElement('iframe');
    this.iframe.style.cssText = `
      width: 100%; border: none; border-radius: 12px; overflow: hidden;
      background: #fff;
      box-shadow: 0 4px 24px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04);
      pointer-events: auto !important;
    `;
    this.iframe.setAttribute('srcdoc', buildIframeHTML(this.escapeHtml(label), isMac));

    this.wrapper.appendChild(this.iframe);
    document.body.appendChild(this.wrapper);
    this.positionPopup();

    window.addEventListener('message', this.handleMessage);

    this.handleClickOutside = this.handleClickOutside.bind(this);
    setTimeout(() => document.addEventListener('click', this.handleClickOutside, true), 100);

    this.iframe.addEventListener('load', () => this.refreshBag());
  }

  private handleMessage = (e: MessageEvent): void => {
    if (!e.data || e.data.source !== 'grabber-popup') return;

    switch (e.data.type) {
      case 'add':
        this.addToBag(e.data.note || '');
        break;
      case 'send':
        this.sendBag(e.data.note || '');
        break;
      case 'close':
        this.close();
        break;
      case 'resize':
        if (e.data.height) {
          this.iframe.style.height = e.data.height + 'px';
        }
        break;
    }
  };

  private positionPopup(): void {
    const rect = this.context.boundingRect;
    const pw = 340, ph = 180, pad = 12;
    let top = rect.top + rect.height + pad + window.scrollY;
    let left = rect.left + window.scrollX;
    if (top + ph > window.innerHeight + window.scrollY - pad) top = rect.top - ph - pad + window.scrollY;
    if (left + pw > window.innerWidth - pad) left = window.innerWidth - pw - pad;
    if (left < pad) left = pad;
    this.wrapper.style.top = `${top}px`;
    this.wrapper.style.left = `${left}px`;
  }

  private postToIframe(type: string, data: Record<string, unknown> = {}): void {
    this.iframe.contentWindow?.postMessage({ source: 'grabber-host', type, ...data }, '*');
  }

  private refreshBag(): void {
    const count = this.getBagCount ? this.getBagCount() : 0;
    this.postToIframe('badge', { count });
  }

  private addToBag(note: string): void {
    if (this.isBusy) return;
    this.isBusy = true;

    if (this.onAddToBag) {
      this.onAddToBag(note);
      this.postToIframe('added');
      this.refreshBag();
    }

    this.isBusy = false;
  }

  private sendBag(note: string): void {
    if (this.isBusy) return;

    if (note && this.onAddToBag) {
      this.onAddToBag(note);
    }

    const count = this.getBagCount ? this.getBagCount() : 0;
    if (count > 0 && this.onSendBag) {
      this.isBusy = true;
      this.postToIframe('sending');
      this.onSendBag('');
      this.postToIframe('sent');
      this.isBusy = false;
      setTimeout(() => this.close(), 400);
    }
  }

  private handleClickOutside(e: MouseEvent): void {
    if (!this.wrapper.contains(e.target as Node)) this.close();
  }

  private close(): void {
    window.removeEventListener('message', this.handleMessage);
    document.removeEventListener('click', this.handleClickOutside, true);

    this.wrapper.style.opacity = '0';
    this.wrapper.style.transform = 'translateY(4px) scale(0.96)';
    this.wrapper.style.transition = 'opacity 0.12s, transform 0.12s';

    setTimeout(() => {
      this.wrapper.remove();
      document.getElementById('grabber-overlay')?.remove();
      document.getElementById('grabber-info-box')?.remove();
      document.querySelectorAll('.grabber-guide').forEach(el => el.remove());
      document.querySelector('.grabber-dimensions')?.remove();
    }, 150);
  }

  private escapeHtml(text: string): string {
    const d = document.createElement('div');
    d.textContent = text;
    return d.innerHTML;
  }
}
