// src/react.tsx
import { useEffect, useRef } from "react";

// src/fiber.ts
function getFiberFromElement(element) {
  const el = element;
  for (const key in el) {
    if (key.startsWith("__reactFiber$") || key.startsWith("__reactInternalInstance$")) {
      return el[key];
    }
  }
  for (const key in el) {
    if (key.startsWith("__reactContainer$")) {
      return el[key];
    }
  }
  if (el._reactRootContainer) {
    const container = el._reactRootContainer;
    return container._internalRoot?.current?.child || container.current?.child;
  }
  return null;
}
async function waitForFiber(element, maxWaitMs = 1500, intervalMs = 100) {
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
function getDisplayName(fiber) {
  const type = fiber.type;
  if (!type) return "Unknown";
  if (typeof type === "string") return type;
  if (typeof type === "object") {
    if (type.displayName) return type.displayName;
    if (type.name) return type.name;
    if (type.type) return getDisplayName({ ...fiber, type: type.type });
    if (type.render) return type.render.displayName || type.render.name || "ForwardRef";
    if (type._context) return `${type._context.displayName || "Context"}.Provider`;
    if (type.Provider) return `${type.displayName || "Context"}.Consumer`;
  }
  if (typeof type === "function") {
    return type.displayName || type.name || "Component";
  }
  if (typeof type === "symbol") {
    const symbolStr = type.toString();
    if (symbolStr.includes("Fragment")) return "Fragment";
    if (symbolStr.includes("Suspense")) return "Suspense";
    if (symbolStr.includes("Profiler")) return "Profiler";
    if (symbolStr.includes("StrictMode")) return "StrictMode";
  }
  return "Unknown";
}
function isUserComponent(fiber) {
  const type = fiber.type;
  if (!type) return false;
  if (typeof type === "string") return false;
  if (typeof type === "symbol") return false;
  if (typeof type === "function") return true;
  if (typeof type === "object") {
    if (type.$$typeof) return true;
    if (type.render) return true;
    if (type.type) return true;
  }
  return false;
}
function sanitizeProps(props) {
  if (!props) return {};
  const sanitized = {};
  const seen = /* @__PURE__ */ new WeakSet();
  function sanitizeValue(value, depth = 0) {
    if (depth > 5) return "[Max Depth]";
    if (value === null || value === void 0) return value;
    if (typeof value === "function") return "[Function]";
    if (typeof value === "symbol") return "[Symbol]";
    if (value instanceof HTMLElement) return `[HTMLElement: ${value.tagName}]`;
    if (value instanceof Event) return "[Event]";
    if (typeof value === "object") {
      if (seen.has(value)) return "[Circular]";
      seen.add(value);
      if (Array.isArray(value)) {
        return value.slice(0, 10).map((v) => sanitizeValue(v, depth + 1));
      }
      const result = {};
      for (const [k, v] of Object.entries(value)) {
        if (k.startsWith("__") || k === "ref" || k === "key") continue;
        result[k] = sanitizeValue(v, depth + 1);
      }
      return result;
    }
    return value;
  }
  for (const [key, value] of Object.entries(props)) {
    if (key === "children") {
      sanitized[key] = "[Children]";
      continue;
    }
    sanitized[key] = sanitizeValue(value);
  }
  return sanitized;
}
var EMPTY_FIBER_DATA = {
  found: false,
  componentName: "",
  fileName: "",
  lineNumber: 0,
  columnNumber: 0,
  props: {},
  hierarchy: []
};
function getFiberDataFromFiber(fiber) {
  const debugOwner = fiber._debugOwner;
  let componentFiber = debugOwner;
  let sourceInfo = null;
  if (debugOwner?._debugSource) {
    sourceInfo = debugOwner._debugSource;
  }
  if (!componentFiber) {
    let current2 = fiber;
    while (current2) {
      if (isUserComponent(current2)) {
        componentFiber = current2;
        break;
      }
      current2 = current2.return;
    }
  }
  if (!sourceInfo && componentFiber) {
    let current2 = componentFiber;
    while (current2 && !sourceInfo) {
      if (current2._debugSource) {
        sourceInfo = current2._debugSource;
      }
      const ownerAtLevel = current2._debugOwner;
      if (!sourceInfo && ownerAtLevel?._debugSource) {
        sourceInfo = ownerAtLevel._debugSource;
      }
      current2 = current2.return;
    }
  }
  const hierarchy = [];
  const seen = /* @__PURE__ */ new Set();
  let current = debugOwner || fiber;
  while (current && hierarchy.length < 10) {
    if (seen.has(current)) break;
    seen.add(current);
    if (isUserComponent(current)) {
      const name = getDisplayName(current);
      if (name !== "Unknown" && !hierarchy.includes(name)) {
        hierarchy.unshift(name);
      }
    }
    const owner = current._debugOwner;
    if (owner && !seen.has(owner)) {
      current = owner;
    } else {
      current = current.return;
    }
  }
  return {
    found: true,
    componentName: componentFiber ? getDisplayName(componentFiber) : "Unknown",
    fileName: sourceInfo?.fileName || "",
    lineNumber: sourceInfo?.lineNumber || 0,
    columnNumber: sourceInfo?.columnNumber || 0,
    props: componentFiber ? sanitizeProps(componentFiber.memoizedProps || {}) : {},
    hierarchy
  };
}
function getFiberData(element) {
  const fiber = getFiberFromElement(element);
  if (!fiber) return EMPTY_FIBER_DATA;
  return getFiberDataFromFiber(fiber);
}
async function getFiberDataWithRetry(element) {
  const fiber = await waitForFiber(element);
  if (!fiber) return EMPTY_FIBER_DATA;
  return getFiberDataFromFiber(fiber);
}
function fiberDataToComponentInfo(data) {
  if (!data.found) return null;
  return {
    componentName: data.componentName,
    fileName: data.fileName,
    lineNumber: data.lineNumber,
    columnNumber: data.columnNumber,
    props: data.props
  };
}

// src/styles.ts
function getGriffelData(element) {
  try {
    const devtools = window.__GRIFFEL_DEVTOOLS__;
    if (!devtools || typeof devtools.getInfo !== "function") {
      return [];
    }
    const info = devtools.getInfo(element);
    if (!info || !Array.isArray(info)) return [];
    return info.map((slot) => ({
      slot: slot.slot || "unknown",
      rules: Array.isArray(slot.rules) ? slot.rules.map((r) => typeof r === "string" ? r : r.cssRule || String(r)) : [],
      sourceURL: slot.sourceURL || void 0
    }));
  } catch (e) {
    console.log("[Grabber] Griffel devtools not available:", e);
    return [];
  }
}
function getMatchedCSSRules(element) {
  const matched = [];
  function processRules(rules, source) {
    for (let i = 0; i < rules.length; i++) {
      const rule = rules[i];
      if (rule instanceof CSSStyleRule) {
        try {
          if (element.matches(rule.selectorText)) {
            const properties = {};
            for (let j = 0; j < rule.style.length; j++) {
              const prop = rule.style[j];
              properties[prop] = rule.style.getPropertyValue(prop);
            }
            matched.push({ selector: rule.selectorText, properties, source });
          }
        } catch {
        }
      } else if (rule instanceof CSSMediaRule) {
        if (window.matchMedia(rule.conditionText).matches) {
          processRules(rule.cssRules, source);
        }
      }
    }
  }
  for (let i = 0; i < document.styleSheets.length; i++) {
    const sheet = document.styleSheets[i];
    try {
      const source = sheet.href || `inline-${i}`;
      processRules(sheet.cssRules, source);
    } catch {
    }
  }
  return matched;
}
function getFluentUITokens(element) {
  const tokens = {};
  const computed = window.getComputedStyle(element);
  const tokenPrefixes = [
    "--colorNeutral",
    "--colorBrand",
    "--colorPalette",
    "--colorStatus",
    "--colorSubtle",
    "--colorTransparent",
    "--colorCompound",
    "--fontFamily",
    "--fontSize",
    "--fontWeight",
    "--lineHeight",
    "--spacingHorizontal",
    "--spacingVertical",
    "--borderRadius",
    "--strokeWidth",
    "--shadow",
    "--duration",
    "--curve"
  ];
  for (let i = 0; i < document.styleSheets.length; i++) {
    const sheet = document.styleSheets[i];
    try {
      for (let j = 0; j < sheet.cssRules.length; j++) {
        const rule = sheet.cssRules[j];
        if (rule instanceof CSSStyleRule) {
          try {
            if (element.matches(rule.selectorText) || rule.selectorText === ":root" || rule.selectorText === "body") {
              for (let k = 0; k < rule.style.length; k++) {
                const prop = rule.style[k];
                if (prop.startsWith("--")) {
                  for (const prefix of tokenPrefixes) {
                    if (prop.startsWith(prefix)) {
                      const value = computed.getPropertyValue(prop).trim();
                      if (value) tokens[prop] = value;
                      break;
                    }
                  }
                }
              }
            }
          } catch {
          }
        }
      }
    } catch {
    }
  }
  return tokens;
}
function extractStyleData(element) {
  return {
    griffelSlots: getGriffelData(element),
    matchedRules: getMatchedCSSRules(element),
    fluentTokens: getFluentUITokens(element)
  };
}
function extractComputedStyles(element) {
  const computed = window.getComputedStyle(element);
  const styles = {};
  const properties = [
    // Layout
    "display",
    "position",
    "top",
    "right",
    "bottom",
    "left",
    "flex-direction",
    "flex-wrap",
    "justify-content",
    "align-items",
    "align-self",
    "gap",
    "grid-template-columns",
    "grid-template-rows",
    // Box Model
    "width",
    "height",
    "min-width",
    "max-width",
    "min-height",
    "max-height",
    "margin-top",
    "margin-right",
    "margin-bottom",
    "margin-left",
    "padding-top",
    "padding-right",
    "padding-bottom",
    "padding-left",
    "box-sizing",
    // Typography
    "font-family",
    "font-size",
    "font-weight",
    "line-height",
    "letter-spacing",
    "text-align",
    "text-decoration",
    "text-transform",
    "color",
    "white-space",
    // Borders & Effects
    "border-top-width",
    "border-right-width",
    "border-bottom-width",
    "border-left-width",
    "border-top-style",
    "border-right-style",
    "border-bottom-style",
    "border-left-style",
    "border-top-color",
    "border-right-color",
    "border-bottom-color",
    "border-left-color",
    "border-top-left-radius",
    "border-top-right-radius",
    "border-bottom-right-radius",
    "border-bottom-left-radius",
    "box-shadow",
    "outline",
    // Background
    "background-color",
    "background-image",
    "opacity",
    // Other
    "overflow",
    "overflow-x",
    "overflow-y",
    "z-index",
    "cursor",
    "visibility"
  ];
  for (const prop of properties) {
    styles[prop] = computed.getPropertyValue(prop);
  }
  const inline = {};
  for (let i = 0; i < element.style.length; i++) {
    const prop = element.style[i];
    inline[prop] = element.style.getPropertyValue(prop);
  }
  const classes = element.className && typeof element.className === "string" ? element.className.split(" ").filter(Boolean) : [];
  return { computed: styles, inline, classes };
}

// src/selector.ts
var ElementSelector = class {
  constructor(onElementSelected) {
    this.isActive = false;
    this.overlay = null;
    this.infoBox = null;
    this.toast = null;
    this.guideTop = null;
    this.guideBottom = null;
    this.guideLeft = null;
    this.guideRight = null;
    this.dimensions = null;
    this.hoveredElement = null;
    this.currentFiberData = null;
    this.fetchingFiber = false;
    this.onElementSelected = onElementSelected;
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleClick = this.handleClick.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);
  }
  activate() {
    if (this.isActive) return;
    this.clearSelection();
    this.isActive = true;
    this.createOverlay();
    this.createInfoBox();
    this.showToast("Select an element \xB7 Esc to cancel");
    document.addEventListener("mousemove", this.handleMouseMove, true);
    document.addEventListener("click", this.handleClick, true);
    document.addEventListener("keydown", this.handleKeyDown, true);
    document.body.classList.add("grabber-active");
  }
  deactivate() {
    if (!this.isActive) return;
    this.isActive = false;
    document.removeEventListener("mousemove", this.handleMouseMove, true);
    document.removeEventListener("click", this.handleClick, true);
    document.removeEventListener("keydown", this.handleKeyDown, true);
    document.body.classList.remove("grabber-active");
    this.removeInfoBox();
    this.hideToast();
  }
  clearSelection() {
    this.removeOverlay();
    this.removeInfoBox();
    this.hideToast();
    document.querySelector("[data-grabber-selected]")?.removeAttribute("data-grabber-selected");
    this.hoveredElement = null;
    this.currentFiberData = null;
  }
  createOverlay() {
    this.overlay = document.createElement("div");
    this.overlay.id = "grabber-overlay";
    this.overlay.className = "grabber-overlay";
    document.body.appendChild(this.overlay);
    this.guideTop = this.createGuide("grabber-guide grabber-guide-h");
    this.guideBottom = this.createGuide("grabber-guide grabber-guide-h");
    this.guideLeft = this.createGuide("grabber-guide grabber-guide-v");
    this.guideRight = this.createGuide("grabber-guide grabber-guide-v");
    this.dimensions = document.createElement("div");
    this.dimensions.className = "grabber-dimensions";
    document.body.appendChild(this.dimensions);
  }
  createGuide(className) {
    const el = document.createElement("div");
    el.className = className;
    document.body.appendChild(el);
    return el;
  }
  removeOverlay() {
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
  createInfoBox() {
    this.infoBox = document.createElement("div");
    this.infoBox.id = "grabber-info-box";
    this.infoBox.className = "grabber-info-box";
    document.body.appendChild(this.infoBox);
  }
  removeInfoBox() {
    if (this.infoBox) {
      this.infoBox.remove();
      this.infoBox = null;
    }
  }
  showToast(message, type = "info") {
    this.hideToast();
    this.toast = document.createElement("div");
    this.toast.className = `grabber-toast grabber-toast-${type}`;
    this.toast.textContent = message;
    document.body.appendChild(this.toast);
    if (type !== "info") {
      setTimeout(() => this.hideToast(), 3e3);
    }
  }
  hideToast() {
    if (this.toast) {
      this.toast.remove();
      this.toast = null;
    }
  }
  handleMouseMove(event) {
    if (!this.isActive) return;
    const element = document.elementFromPoint(
      event.clientX,
      event.clientY
    );
    if (!element || element === this.hoveredElement || element.closest("#grabber-overlay") || element.closest("#grabber-info-box") || element.closest(".grabber-modal") || element.closest(".grabber-toast") || element.closest(".grabber-popup-wrapper") || element.closest(".grabber-sdk-drawer")) {
      return;
    }
    this.hoveredElement = element;
    this.highlightElement(element, event.clientX, event.clientY);
  }
  async highlightElement(element, x, y) {
    if (!this.overlay || !this.infoBox) return;
    const rect = element.getBoundingClientRect();
    this.overlay.style.top = `${rect.top + window.scrollY}px`;
    this.overlay.style.left = `${rect.left + window.scrollX}px`;
    this.overlay.style.width = `${rect.width}px`;
    this.overlay.style.height = `${rect.height}px`;
    this.overlay.style.display = "block";
    if (this.guideTop) {
      this.guideTop.style.top = `${rect.top}px`;
      this.guideTop.style.display = "block";
    }
    if (this.guideBottom) {
      this.guideBottom.style.top = `${rect.bottom}px`;
      this.guideBottom.style.display = "block";
    }
    if (this.guideLeft) {
      this.guideLeft.style.left = `${rect.left}px`;
      this.guideLeft.style.display = "block";
    }
    if (this.guideRight) {
      this.guideRight.style.left = `${rect.right}px`;
      this.guideRight.style.display = "block";
    }
    if (this.dimensions) {
      const w = Math.round(rect.width);
      const h = Math.round(rect.height);
      this.dimensions.textContent = `${w} \xD7 ${h}`;
      this.dimensions.style.top = `${rect.bottom + window.scrollY + 4}px`;
      this.dimensions.style.left = `${rect.left + window.scrollX + rect.width / 2}px`;
      this.dimensions.style.transform = "translateX(-50%)";
      this.dimensions.style.display = "block";
    }
    if (!this.fetchingFiber) {
      this.fetchingFiber = true;
      try {
        const fiberData = await getFiberDataWithRetry(element);
        this.currentFiberData = fiberData;
        this.updateInfoBox(element, rect, fiberData);
      } catch (error) {
        console.log("[Grabber] Failed to get fiber data:", error);
        this.currentFiberData = null;
        this.updateInfoBox(element, rect, null);
      } finally {
        this.fetchingFiber = false;
      }
    }
  }
  updateInfoBox(element, rect, fiberData) {
    if (!this.infoBox) return;
    let html = "";
    if (fiberData?.found) {
      const fileName = fiberData.fileName ? fiberData.fileName.split("/").pop() || fiberData.fileName : "";
      const lineInfo = fiberData.lineNumber ? `:${fiberData.lineNumber}` : "";
      const fileDisplay = fileName ? `${fileName}${lineInfo}` : "Source not available";
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
    this.infoBox.style.display = "block";
  }
  async handleClick(event) {
    if (!this.isActive) return;
    event.preventDefault();
    event.stopPropagation();
    const element = this.hoveredElement;
    if (!element) return;
    let fiberData = this.currentFiberData;
    if (!fiberData || !fiberData.found) {
      fiberData = getFiberData(element);
    }
    this.deactivate();
    document.querySelector("[data-grabber-selected]")?.removeAttribute("data-grabber-selected");
    element.setAttribute("data-grabber-selected", "true");
    const context = this.buildContext(element, fiberData);
    const styleData = extractComputedStyles(element);
    const { griffelSlots, matchedRules, fluentTokens } = extractStyleData(element);
    const payload = {
      elementContext: context,
      styleData,
      griffelSlots,
      fluentTokens,
      matchedRules
    };
    this.onElementSelected(payload);
  }
  handleKeyDown(event) {
    if (event.key === "Escape") {
      this.deactivate();
      this.clearSelection();
    }
  }
  buildContext(element, fiberData) {
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
        height: rect.height
      },
      pageUrl: window.location.href
    };
  }
  getCleanHtml(element) {
    const clone = element.cloneNode(true);
    const scripts = clone.querySelectorAll("script");
    scripts.forEach((s) => s.remove());
    let html = clone.outerHTML;
    if (html.length > 2e3) {
      html = element.outerHTML.slice(0, 2e3) + "...";
    }
    return html;
  }
  getCssSelector(element) {
    const path = [];
    let current = element;
    while (current && current !== document.body) {
      let selector = current.tagName.toLowerCase();
      if (current.id) {
        selector = `#${current.id}`;
        path.unshift(selector);
        break;
      }
      if (current.className && typeof current.className === "string") {
        const classes = current.className.split(" ").filter((c) => c && !c.startsWith("grabber-")).slice(0, 2);
        if (classes.length > 0) {
          selector += `.${classes.join(".")}`;
        }
      }
      path.unshift(selector);
      current = current.parentElement;
      if (path.length >= 5) break;
    }
    return path.join(" > ");
  }
};

// src/drawer.ts
var SidePanelDrawer = class {
  constructor(callbacks) {
    this.container = null;
    this.iframe = null;
    this.isOpen = false;
    this.iframeReady = false;
    this.pendingMessages = [];
    this.callbacks = callbacks;
    this.handleMessage = this.handleMessage.bind(this);
    window.addEventListener("message", this.handleMessage);
  }
  show() {
    if (!this.container) {
      this.createDrawer();
    }
    this.isOpen = true;
    this.container.style.transform = "translateX(0)";
  }
  hide() {
    if (!this.isOpen) return;
    this.isOpen = false;
    if (this.container) {
      this.container.style.transform = "translateX(100%)";
    }
  }
  toggle() {
    if (this.isOpen) this.hide();
    else this.show();
  }
  destroy() {
    window.removeEventListener("message", this.handleMessage);
    this.container?.remove();
    this.container = null;
    this.iframe = null;
    this.iframeReady = false;
  }
  updatePayload(payload) {
    this.show();
    this.sendOrQueue("GRABBER_STYLE_UPDATE", { data: payload });
  }
  updateConnection(connected) {
    this.sendOrQueue("CONNECTION_STATUS", { connected });
  }
  refreshBag() {
    const { bag, count } = this.callbacks.getBag();
    this.sendOrQueue("BAG_STATE", { bag, count, liveCount: this.callbacks.getLiveChangesCount() });
  }
  /**
   * Send a message to the iframe, or queue it if the iframe hasn't loaded yet.
   */
  sendOrQueue(type, data) {
    if (this.iframeReady) {
      this.postToIframe(type, data);
    } else {
      this.pendingMessages.push({ type, data });
    }
  }
  /**
   * Flush all queued messages once the iframe is ready.
   */
  flushPendingMessages() {
    for (const msg of this.pendingMessages) {
      this.postToIframe(msg.type, msg.data);
    }
    this.pendingMessages = [];
  }
  createDrawer() {
    this.container = document.createElement("div");
    this.container.className = "grabber-sdk-drawer";
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
    const handle = document.createElement("div");
    handle.style.cssText = `
      position: absolute; top: 0; left: -4px; width: 8px; height: 100%;
      cursor: ew-resize; z-index: 1;
    `;
    handle.addEventListener("mousedown", (e) => this.startResize(e));
    this.container.appendChild(handle);
    this.iframe = document.createElement("iframe");
    this.iframe.style.cssText = "width: 100%; height: 100%; border: none;";
    this.iframe.setAttribute("srcdoc", buildDrawerHTML());
    this.container.appendChild(this.iframe);
    document.body.appendChild(this.container);
    this.iframe.addEventListener("load", () => {
      this.iframeReady = true;
      this.flushPendingMessages();
      this.callbacks.checkConnection().then((connected) => {
        this.updateConnection(connected);
      });
      this.refreshBag();
    });
  }
  startResize(e) {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = this.container.offsetWidth;
    const onMove = (e2) => {
      const delta = startX - e2.clientX;
      const newWidth = Math.max(280, Math.min(600, startWidth + delta));
      this.container.style.width = `${newWidth}px`;
    };
    const onUp = () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }
  postToIframe(type, data = {}) {
    this.iframe?.contentWindow?.postMessage({ source: "grabber-drawer-host", type, ...data }, "*");
  }
  handleMessage(e) {
    if (!e.data || e.data.source !== "grabber-drawer") return;
    switch (e.data.type) {
      case "ACTIVATE_SELECTOR":
        this.callbacks.onActivateSelector();
        break;
      case "STYLE_CHANGE":
        this.callbacks.onStyleChange(e.data.property, e.data.value);
        break;
      case "STYLE_RESET":
        this.callbacks.onStyleReset(e.data.property);
        break;
      case "STYLE_RESET_ALL":
        this.callbacks.onStyleResetAll();
        break;
      case "BAG_ADD":
        this.callbacks.onAddToBag(e.data.note || "");
        this.refreshBag();
        break;
      case "BAG_REMOVE":
        this.callbacks.onRemoveBagEntry(e.data.id);
        this.refreshBag();
        break;
      case "BAG_CLEAR":
        this.callbacks.onClearBag();
        this.refreshBag();
        break;
      case "BAG_SEND":
        this.callbacks.onSendBag().then((result) => {
          this.postToIframe("BAG_SEND_RESULT", result);
          this.refreshBag();
        });
        break;
      case "CHECK_CONNECTION":
        this.callbacks.checkConnection().then((connected) => {
          this.updateConnection(connected);
        });
        break;
      case "CLOSE_DRAWER":
        this.hide();
        break;
    }
  }
};
function buildDrawerHTML() {
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
    <div id="sp-design" class="design-panel"></div>
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
          <button id="sp-bag-send" class="btn-accent-sm">Send all to Copilot</button>
        </div>
      </div>
      <div id="sp-bag-list" class="bag-list"></div>
    </div>
  </div>
</div>
<script>${DRAWER_JS}</script>
</body>
</html>`;
}
var DRAWER_CSS = `
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
.footer-bar { display: flex; align-items: center; justify-content: space-between; padding: 10px 16px; border-top: 1px solid var(--divider); background: var(--bg1); }
.footer-count { font-size: 11px; font-weight: 500; color: var(--orange); }
.footer-actions { display: flex; gap: 8px; }
.btn-sm { padding: 5px 12px; background: var(--bg0); border: 1px solid var(--border); border-radius: var(--r); color: var(--t2); font: 11px var(--f); cursor: pointer; transition: all 0.15s; }
.btn-sm:hover { color: var(--t1); background: var(--bg2); }
.btn-accent-sm { padding: 5px 12px; background: var(--accent); border: 1px solid var(--accent); border-radius: var(--r); color: #fff; font: 11px var(--f); font-weight: 500; cursor: pointer; transition: all 0.15s; }
.btn-accent-sm:hover { opacity: 0.9; }

/* Bag */
.bag-bar { border-top: 1px solid var(--divider); background: var(--bg1); padding: 10px 16px; }
.bag-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
.bag-title { font-size: 11px; font-weight: 600; color: var(--accent); }
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
var DRAWER_JS = `
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

// Fluent token validation (inline \u2014 matches fluent-tokens.ts)
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

// src/modal.ts
var IFRAME_CSS = `
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
function buildIframeHTML(label, isMac) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${IFRAME_CSS}</style></head><body>
<div class="popup">
  <div class="header">
    <div class="label">${label}</div>
    <span class="badge" id="badge"></span>
    <button class="close" id="close" title="Dismiss">&times;</button>
  </div>
  <textarea id="input" placeholder="Describe the change you want..." autocomplete="off" spellcheck="false"></textarea>
  <div class="footer">
    <span class="hint"><kbd>${isMac ? "\u2318" : "Ctrl"}</kbd><kbd>\u21B5</kbd> add</span>
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
</script></body></html>`;
}
var PromptModal = class {
  constructor(context, onElementSelected) {
    this.isBusy = false;
    // Bag operations are handled by GrabberDevTools via events
    this.onAddToBag = null;
    this.onSendBag = null;
    this.getBagCount = null;
    this.handleMessage = (e) => {
      if (!e.data || e.data.source !== "grabber-popup") return;
      switch (e.data.type) {
        case "add":
          this.addToBag(e.data.note || "");
          break;
        case "send":
          this.sendBag(e.data.note || "");
          break;
        case "close":
          this.close();
          break;
        case "resize":
          if (e.data.height) {
            this.iframe.style.height = e.data.height + "px";
          }
          break;
      }
    };
    this.context = context;
    this.onElementSelected = onElementSelected;
    const comp = context.component;
    const name = comp?.componentName || "Element";
    const file = comp?.fileName ? comp.fileName.split("/").pop() || "" : "";
    const line = comp?.lineNumber ? `:${comp.lineNumber}` : "";
    const label = file ? `${name} \xB7 ${file}${line}` : name;
    const isMac = navigator.userAgent.includes("Mac");
    this.wrapper = document.createElement("div");
    this.wrapper.className = "grabber-popup-wrapper";
    this.wrapper.style.cssText = `
      position: absolute; z-index: 2147483647;
      width: 340px; pointer-events: auto !important;
    `;
    this.iframe = document.createElement("iframe");
    this.iframe.style.cssText = `
      width: 100%; border: none; border-radius: 12px; overflow: hidden;
      background: #fff;
      box-shadow: 0 4px 24px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04);
      pointer-events: auto !important;
    `;
    this.iframe.setAttribute("srcdoc", buildIframeHTML(this.escapeHtml(label), isMac));
    this.wrapper.appendChild(this.iframe);
    document.body.appendChild(this.wrapper);
    this.positionPopup();
    window.addEventListener("message", this.handleMessage);
    this.handleClickOutside = this.handleClickOutside.bind(this);
    setTimeout(() => document.addEventListener("click", this.handleClickOutside, true), 100);
    this.iframe.addEventListener("load", () => this.refreshBag());
  }
  positionPopup() {
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
  postToIframe(type, data = {}) {
    this.iframe.contentWindow?.postMessage({ source: "grabber-host", type, ...data }, "*");
  }
  refreshBag() {
    const count = this.getBagCount ? this.getBagCount() : 0;
    this.postToIframe("badge", { count });
  }
  addToBag(note) {
    if (this.isBusy) return;
    this.isBusy = true;
    if (this.onAddToBag) {
      this.onAddToBag(note);
      this.postToIframe("added");
      this.refreshBag();
    }
    this.isBusy = false;
  }
  sendBag(note) {
    if (this.isBusy) return;
    if (note && this.onAddToBag) {
      this.onAddToBag(note);
    }
    const count = this.getBagCount ? this.getBagCount() : 0;
    if (count > 0 && this.onSendBag) {
      this.isBusy = true;
      this.postToIframe("sending");
      this.onSendBag("");
      this.postToIframe("sent");
      this.isBusy = false;
      setTimeout(() => this.close(), 400);
    }
  }
  handleClickOutside(e) {
    if (!this.wrapper.contains(e.target)) this.close();
  }
  close() {
    window.removeEventListener("message", this.handleMessage);
    document.removeEventListener("click", this.handleClickOutside, true);
    this.wrapper.style.opacity = "0";
    this.wrapper.style.transform = "translateY(4px) scale(0.96)";
    this.wrapper.style.transition = "opacity 0.12s, transform 0.12s";
    setTimeout(() => {
      this.wrapper.remove();
      document.getElementById("grabber-overlay")?.remove();
      document.getElementById("grabber-info-box")?.remove();
      document.querySelectorAll(".grabber-guide").forEach((el) => el.remove());
      document.querySelector(".grabber-dimensions")?.remove();
    }, 150);
  }
  escapeHtml(text) {
    const d = document.createElement("div");
    d.textContent = text;
    return d.innerHTML;
  }
};

// src/sender.ts
var DEFAULT_SERVER_URL = "http://localhost:4567";
async function checkVSCodeConnection(serverUrl = DEFAULT_SERVER_URL) {
  try {
    const r = await fetch(`${serverUrl}/health`);
    return r.ok;
  } catch {
    return false;
  }
}
async function sendToVSCode(data, serverUrl = DEFAULT_SERVER_URL) {
  try {
    const r = await fetch(`${serverUrl}/context`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    return r.ok ? { success: true } : { success: false, error: `HTTP ${r.status}` };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}
function formatBagForCopilot(bag) {
  let prompt = `## UI Change Request

Please apply the following changes to the codebase. Each item targets a specific React component.

`;
  for (let i = 0; i < bag.length; i++) {
    const entry = bag[i];
    const loc = entry.fileName ? `${entry.fileName}${entry.lineNumber ? ":" + entry.lineNumber : ""}` : "";
    prompt += `### ${i + 1}. ${entry.componentName}`;
    if (loc) prompt += ` (${loc})`;
    prompt += "\n";
    if (entry.note) {
      prompt += `${entry.note}
`;
    }
    if (entry.styleChanges.length > 0) {
      prompt += "\nStyle changes:\n";
      for (const ch of entry.styleChanges) {
        prompt += `- \`${ch.property}\`: ${ch.from} \u2192 ${ch.to}
`;
      }
    }
    prompt += "\n";
  }
  prompt += `---
Apply these changes using the project's styling approach (makeStyles / Griffel / CSS modules). Ensure the changes match the existing patterns in each file.
`;
  return prompt;
}

// src/inject-styles.ts
var GRABBER_CSS = `
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
var injected = false;
function injectStyles() {
  if (injected) return;
  injected = true;
  const style = document.createElement("style");
  style.setAttribute("data-grabber-sdk", "");
  style.textContent = GRABBER_CSS;
  document.head.appendChild(style);
}

// src/grabber.ts
var GrabberDevTools = class {
  constructor(config = {}) {
    this.cachedPayload = null;
    this.liveChanges = /* @__PURE__ */ new Map();
    this.changesBag = [];
    this.nextBagId = 1;
    this.activateButton = null;
    this.stylesInjected = false;
    this.isConnected = false;
    this.connectionCheckInterval = null;
    // Event callbacks (for external integration if needed)
    this.onPayloadUpdate = null;
    this.onBagUpdate = null;
    this.onConnectionChange = null;
    // ===== Internal =====
    this.handleElementSelected = (payload) => {
      this.cachedPayload = payload;
      this.liveChanges.clear();
      this.onPayloadUpdate?.(payload);
      const modal = new PromptModal(payload.elementContext, () => {
      });
      modal.onAddToBag = (note) => this.addToBag(note);
      modal.onSendBag = () => {
        this.sendBag();
      };
      modal.getBagCount = () => this.changesBag.length;
      this.drawer.updatePayload(payload);
    };
    this.handleKeyDown = (e) => {
      const shortcut = this.config.shortcut.toLowerCase();
      const parts = shortcut.split("+");
      const needCtrl = parts.includes("ctrl");
      const needMeta = parts.includes("cmd") || parts.includes("meta");
      const needShift = parts.includes("shift");
      const needAlt = parts.includes("alt");
      const key = parts[parts.length - 1];
      const isMac = navigator.userAgent.includes("Mac");
      const ctrlOrCmd = isMac ? e.metaKey : e.ctrlKey;
      if ((needCtrl || needMeta) && ctrlOrCmd && (needShift ? e.shiftKey : true) && (needAlt ? e.altKey : true) && e.key.toLowerCase() === key) {
        e.preventDefault();
        this.activate();
      }
    };
    this.config = {
      serverUrl: config.serverUrl || "http://localhost:4567",
      shortcut: config.shortcut || "ctrl+shift+g",
      showActivateButton: config.showActivateButton ?? true
    };
    this.selector = new ElementSelector((payload) => this.handleElementSelected(payload));
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
      checkConnection: () => checkVSCodeConnection(this.config.serverUrl)
    });
  }
  /**
   * Initialize the devtools — inject styles, add keyboard shortcut, show button, create drawer.
   */
  init() {
    if (!this.stylesInjected) {
      injectStyles();
      this.stylesInjected = true;
    }
    document.addEventListener("keydown", this.handleKeyDown);
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        document.querySelector(".grabber-popup-wrapper")?.remove();
        this.selector.clearSelection();
      }
    }, true);
    if (this.config.showActivateButton) {
      this.createActivateButton();
    }
    this.checkConnection();
    this.connectionCheckInterval = setInterval(() => this.checkConnection(), 5e3);
    console.log("[Grabber SDK] Initialized");
  }
  /**
   * Clean up all resources.
   */
  destroy() {
    document.removeEventListener("keydown", this.handleKeyDown);
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
  activate() {
    this.selector.activate();
  }
  /**
   * Deactivate the element selector.
   */
  deactivate() {
    this.selector.deactivate();
  }
  // ===== Bag Operations =====
  addToBag(note) {
    const comp = this.cachedPayload?.elementContext?.component;
    const styleChanges = [];
    for (const [prop, { orig, cur }] of this.liveChanges) {
      styleChanges.push({ property: prop, from: orig, to: cur });
    }
    this.changesBag.push({
      id: this.nextBagId++,
      componentName: comp?.componentName || "Element",
      fileName: comp?.fileName?.split("/").pop() || "",
      lineNumber: comp?.lineNumber || 0,
      note,
      styleChanges
    });
    this.liveChanges.clear();
    this.onBagUpdate?.(this.changesBag, this.changesBag.length);
    this.drawer.refreshBag();
  }
  removeBagEntry(id) {
    const idx = this.changesBag.findIndex((e) => e.id === id);
    if (idx >= 0) this.changesBag.splice(idx, 1);
    this.onBagUpdate?.(this.changesBag, this.changesBag.length);
    this.drawer.refreshBag();
  }
  clearBag() {
    this.changesBag.length = 0;
    this.liveChanges.clear();
    this.onBagUpdate?.(this.changesBag, 0);
    this.drawer.refreshBag();
  }
  getBag() {
    return { bag: this.changesBag, count: this.changesBag.length };
  }
  async sendBag() {
    const prompt = formatBagForCopilot(this.changesBag);
    const result = await sendToVSCode(
      {
        type: "GRABBER_CONTEXT",
        prompt,
        context: this.cachedPayload?.elementContext || null,
        timestamp: Date.now(),
        version: "1.0.0"
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
  applyStyleChange(property, value) {
    const orig = this.liveChanges.has(property) ? this.liveChanges.get(property).orig : this.cachedPayload?.styleData.computed[property] || "";
    if (value === orig) {
      this.liveChanges.delete(property);
    } else {
      this.liveChanges.set(property, { orig, cur: value });
    }
    const element = document.querySelector("[data-grabber-selected]");
    if (element) {
      element.style.setProperty(property, value);
    }
  }
  resetStyle(property) {
    this.liveChanges.delete(property);
    const element = document.querySelector("[data-grabber-selected]");
    if (element) {
      element.style.removeProperty(property);
    }
  }
  resetAllStyles() {
    this.liveChanges.clear();
    const element = document.querySelector("[data-grabber-selected]");
    if (element) {
      element.removeAttribute("style");
    }
  }
  getLiveChangesCount() {
    return this.liveChanges.size;
  }
  createActivateButton() {
    this.activateButton = document.createElement("div");
    this.activateButton.className = "grabber-activate-btn";
    this.activateButton.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
        <circle cx="12" cy="12" r="3"/>
        <path d="M12 2v4M12 18v4M2 12h4M18 12h4"/>
      </svg>
    `;
    this.activateButton.title = "Grabber: Select Element (Ctrl+Shift+G)";
    this.activateButton.addEventListener("click", () => this.activate());
    document.body.appendChild(this.activateButton);
  }
  async checkConnection() {
    const connected = await checkVSCodeConnection(this.config.serverUrl);
    if (connected !== this.isConnected) {
      this.isConnected = connected;
      this.onConnectionChange?.(connected);
      if (this.activateButton) {
        this.activateButton.classList.toggle("grabber-connected", connected);
      }
      this.drawer.updateConnection(connected);
    }
  }
};

// src/react.tsx
function GrabberDevTools2(props) {
  const instanceRef = useRef(null);
  useEffect(() => {
    const grabber = new GrabberDevTools(props);
    grabber.init();
    instanceRef.current = grabber;
    window.__GRABBER__ = {
      activate: () => grabber.activate(),
      deactivate: () => grabber.deactivate(),
      getBag: () => grabber.getBag(),
      sendBag: () => grabber.sendBag(),
      clearBag: () => grabber.clearBag()
    };
    return () => {
      grabber.destroy();
      delete window.__GRABBER__;
    };
  }, []);
  return null;
}

// src/fluent-tokens.ts
var SPACING = [0, 2, 4, 6, 8, 10, 12, 16, 20, 24, 32];
var BORDER_RADIUS = [0, 2, 4, 6, 8, 12, 16, 24, 32, 40, 1e4];
var STROKE_WIDTH = [1, 2, 3, 4];
var FONT_SIZE = [10, 12, 14, 16, 20, 24, 28, 32, 40, 68];
var LINE_HEIGHT = [14, 16, 20, 22, 28, 32, 36, 40, 52, 92];
var FONT_WEIGHT = [400, 500, 600, 700];
var SPACING_NAMES = {
  0: "None",
  2: "XXS",
  4: "XS",
  6: "SNudge",
  8: "S",
  10: "MNudge",
  12: "M",
  16: "L",
  20: "XL",
  24: "XXL",
  32: "XXXL"
};
var RADIUS_NAMES = {
  0: "None",
  2: "Small",
  4: "Medium",
  6: "Large",
  8: "XLarge",
  12: "2XLarge",
  16: "3XLarge",
  24: "4XLarge",
  32: "5XLarge",
  40: "6XLarge",
  1e4: "Circular"
};
var STROKE_NAMES = {
  1: "Thin",
  2: "Thick",
  3: "Thicker",
  4: "Thickest"
};
var FONT_SIZE_NAMES = {
  10: "Base100",
  12: "Base200",
  14: "Base300",
  16: "Base400",
  20: "Base500",
  24: "Base600",
  28: "Hero700",
  32: "Hero800",
  40: "Hero900",
  68: "Hero1000"
};
var LINE_HEIGHT_NAMES = {
  14: "Base100",
  16: "Base200",
  20: "Base300",
  22: "Base400",
  28: "Base500",
  32: "Base600",
  36: "Hero700",
  40: "Hero800",
  52: "Hero900",
  92: "Hero1000"
};
var WEIGHT_NAMES = {
  400: "Regular",
  500: "Medium",
  600: "Semibold",
  700: "Bold"
};
function getCategory(prop) {
  if (/^(margin|padding)/.test(prop)) return { values: SPACING, names: SPACING_NAMES, prefix: "spacing" };
  if (/^gap$/.test(prop)) return { values: SPACING, names: SPACING_NAMES, prefix: "spacing" };
  if (/border.*radius/i.test(prop)) return { values: BORDER_RADIUS, names: RADIUS_NAMES, prefix: "borderRadius" };
  if (/border.*width/i.test(prop)) return { values: STROKE_WIDTH, names: STROKE_NAMES, prefix: "strokeWidth" };
  if (prop === "font-size") return { values: FONT_SIZE, names: FONT_SIZE_NAMES, prefix: "fontSize" };
  if (prop === "line-height") return { values: LINE_HEIGHT, names: LINE_HEIGHT_NAMES, prefix: "lineHeight" };
  if (prop === "font-weight") return { values: FONT_WEIGHT, names: WEIGHT_NAMES, prefix: "fontWeight" };
  return null;
}
function findNearest(values, target) {
  let best = values[0];
  let bestDist = Math.abs(target - best);
  for (const v of values) {
    const d = Math.abs(target - v);
    if (d < bestDist) {
      best = v;
      bestDist = d;
    }
  }
  return best;
}
function parseNumeric(value) {
  if (value === "0") return 0;
  if (value === "auto" || value === "none" || value === "normal" || value === "inherit") return null;
  const m = value.match(/^(-?\d+(?:\.\d+)?)\s*(px)?$/);
  if (m) return parseFloat(m[1]);
  const n = parseFloat(value);
  if (!isNaN(n) && String(n) === value.trim()) return n;
  return null;
}
function checkFluentValue(property, value) {
  const cat = getCategory(property);
  if (!cat) return { valid: true };
  const num = parseNumeric(value);
  if (num === null) return { valid: true };
  if (num === 0) return { valid: true };
  if (cat.values.includes(num)) {
    return { valid: true };
  }
  const nearest = findNearest(cat.values, num);
  const unit = property === "font-weight" ? "" : "px";
  const name = cat.names[nearest];
  const tokenName = name ? `${cat.prefix}${name}` : void 0;
  return { valid: false, nearest: `${nearest}${unit}`, tokenName };
}
export {
  GrabberDevTools as GrabberCore,
  GrabberDevTools2 as GrabberDevTools,
  checkFluentValue,
  checkVSCodeConnection,
  extractComputedStyles,
  extractStyleData,
  fiberDataToComponentInfo,
  formatBagForCopilot,
  getFiberData,
  getFiberDataWithRetry,
  getFiberFromElement,
  getFluentUITokens,
  getGriffelData,
  getMatchedCSSRules,
  sendToVSCode
};
//# sourceMappingURL=index.js.map