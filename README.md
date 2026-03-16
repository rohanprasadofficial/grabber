# Grabber Demo

Grabber lets you select React UI elements in the browser and send rich context (component tree, styles, design tokens) to GitHub Copilot Chat in VS Code.

## Quick Start

Run this single command:

```bash
curl -fsSL https://raw.githubusercontent.com/rohanprasadofficial/grabber/main/setup.sh | bash
```

Or if you prefer to clone first:

```bash
git clone https://github.com/rohanprasadofficial/grabber.git
cd grabber-demo
./setup.sh
```

The setup script will:
1. Clone the repo (if run via curl)
2. Install dependencies (Node 18+, pnpm)
3. Build the SDK
4. Build & install the VS Code extension
5. Offer to start the test app

## Running the Demo

```bash
cd grabber-demo
pnpm start
```

Then open http://localhost:3333 and:
- Press **Ctrl+Shift+G** (or click the Grabber button in the bottom-right)
- Hover over any element to see the selection overlay
- Click an element to inspect its React component & styles
- Click **Send to VS Code** to push context to Copilot Chat

## Prerequisites

- **Node.js** 18+ — https://nodejs.org
- **pnpm** — installed automatically via corepack if missing
- **VS Code** with the `code` CLI command available
  - Enable via: `Cmd+Shift+P` → "Shell Command: Install 'code' command in PATH"

## Project Structure

```
grabber-demo/
├── packages/
│   ├── sdk/                  # Grabber SDK (element inspection, styles, fiber)
│   └── vscode-extension/     # VS Code extension (receives context → Copilot Chat)
├── test-app/                 # Sample React app with Grabber SDK integrated
├── setup.sh                  # One-command setup
└── package.json
```
