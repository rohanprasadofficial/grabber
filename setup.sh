#!/bin/bash
set -e

BOLD='\033[1m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m'

TOTAL_STEPS=5
step() { echo -e "\n${BLUE}${BOLD}[$1/$TOTAL_STEPS]${NC} $2"; }
success() { echo -e "  ${GREEN}✓${NC} $1"; }
warn() { echo -e "  ${YELLOW}!${NC} $1"; }
fail() { echo -e "  ${RED}✗${NC} $1"; }

# ── Configuration ──
REPO_URL="https://github.com/rohanprasadofficial/grabber.git"
CLONE_DIR="grabber-demo"

echo -e "${BOLD}╔══════════════════════════════════════╗${NC}"
echo -e "${BOLD}║       Grabber Demo Setup             ║${NC}"
echo -e "${BOLD}╚══════════════════════════════════════╝${NC}"

# ── Step 1: Prerequisites ──
step 1 "Checking prerequisites..."

if ! command -v git &>/dev/null; then
  fail "git not found. Install from https://git-scm.com"
  exit 1
fi
success "git $(git --version | awk '{print $3}')"

if ! command -v node &>/dev/null; then
  fail "Node.js not found. Install from https://nodejs.org (v18+)"
  exit 1
fi
success "Node.js $(node -v)"

if ! command -v pnpm &>/dev/null; then
  warn "pnpm not found — installing via corepack..."
  corepack enable && corepack prepare pnpm@9 --activate
fi
success "pnpm $(pnpm -v)"

if ! command -v code &>/dev/null; then
  # On macOS, the CLI may exist inside the app bundle but not be on PATH
  if [ -f "/Applications/Visual Studio Code.app/Contents/Resources/app/bin/code" ]; then
    warn "VS Code found but 'code' CLI not on PATH — adding it..."
    export PATH="/Applications/Visual Studio Code.app/Contents/Resources/app/bin:$PATH"
  else
    warn "VS Code not found — installing..."
    if [[ "$OSTYPE" == darwin* ]]; then
      if command -v brew &>/dev/null; then
        brew install --cask visual-studio-code
      else
        warn "Homebrew not found — installing Homebrew first..."
        /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
        brew install --cask visual-studio-code
      fi
      export PATH="/Applications/Visual Studio Code.app/Contents/Resources/app/bin:$PATH"
    elif [[ "$OSTYPE" == linux* ]]; then
      if command -v apt-get &>/dev/null; then
        curl -fsSL https://packages.microsoft.com/keys/microsoft.asc | sudo gpg --dearmor -o /usr/share/keyrings/ms.gpg
        echo "deb [arch=amd64 signed-by=/usr/share/keyrings/ms.gpg] https://packages.microsoft.com/repos/code stable main" | sudo tee /etc/apt/sources.list.d/vscode.list
        sudo apt-get update && sudo apt-get install -y code
      elif command -v dnf &>/dev/null; then
        sudo rpm --import https://packages.microsoft.com/keys/microsoft.asc
        echo -e "[code]\nname=Visual Studio Code\nbaseurl=https://packages.microsoft.com/yumrepos/vscode\nenabled=1\ngpgcheck=1\ngpgkey=https://packages.microsoft.com/keys/microsoft.asc" | sudo tee /etc/yum.repos.d/vscode.repo
        sudo dnf install -y code
      else
        fail "Unsupported Linux package manager — install VS Code manually from https://code.visualstudio.com"
        SKIP_VSCODE=1
      fi
    else
      fail "Unsupported OS — install VS Code manually from https://code.visualstudio.com"
      SKIP_VSCODE=1
    fi
  fi
  if [ -z "$SKIP_VSCODE" ] && command -v code &>/dev/null; then
    success "VS Code installed"
  elif [ -z "$SKIP_VSCODE" ]; then
    fail "VS Code installation failed — skipping extension install"
    SKIP_VSCODE=1
  fi
fi

# ── Step 2: Clone repo ──
step 2 "Cloning repository..."

# If script is run from inside the repo already, skip cloning
if [ -f "$(dirname "$0")/package.json" ] && grep -q "grabber-demo" "$(dirname "$0")/package.json" 2>/dev/null; then
  REPO_DIR="$(cd "$(dirname "$0")" && pwd)"
  success "Already inside the repo — skipping clone"
else
  if [ -d "$CLONE_DIR" ]; then
    warn "$CLONE_DIR/ already exists — pulling latest..."
    cd "$CLONE_DIR" && git pull && cd ..
  else
    git clone "$REPO_URL" "$CLONE_DIR"
  fi
  REPO_DIR="$(cd "$CLONE_DIR" && pwd)"
  success "Cloned to $REPO_DIR"
fi

# ── Step 3: Install & build ──
step 3 "Installing dependencies & building..."
cd "$REPO_DIR"
pnpm install --frozen-lockfile 2>/dev/null || pnpm install
pnpm build
success "Build complete"

# ── Step 4: Install VS Code extension ──
step 4 "Installing VS Code extension..."
if [ -z "$SKIP_VSCODE" ]; then
  cd "$REPO_DIR/packages/vscode-extension"
  pnpm package 2>/dev/null || npx @vscode/vsce package --no-dependencies
  VSIX_FILE=$(ls -t *.vsix 2>/dev/null | head -1)
  if [ -n "$VSIX_FILE" ]; then
    code --install-extension "$VSIX_FILE" --force
    success "VS Code extension installed ($VSIX_FILE)"
    warn "Restart VS Code if it's already open"
  else
    fail "Could not build .vsix file"
  fi
  cd "$REPO_DIR"
else
  warn "Skipped (VS Code CLI not available)"
fi

# ── Step 5: Done ──
step 5 "Setup complete!"

echo ""
echo -e "${BOLD}══════════════════════════════════════${NC}"
echo -e "${BOLD}  How to run the demo${NC}"
echo -e "${BOLD}══════════════════════════════════════${NC}"
echo ""
echo "  1. Open VS Code (Grabber extension auto-starts on port 4567)"
echo ""
echo "  2. Start the test app:"
echo -e "     ${BOLD}cd $REPO_DIR && pnpm start${NC}"
echo ""
echo "  3. Open http://localhost:3333 in your browser"
echo ""
echo "  4. Try it out:"
echo "     • Press Ctrl+Shift+G or click the Grabber button (bottom-right)"
echo "     • Hover over any element to see the selection overlay"
echo "     • Click an element to inspect React component info & styles"
echo "     • Use 'Send to VS Code' to push context to Copilot Chat"
echo ""
echo -e "${BOLD}══════════════════════════════════════${NC}"
echo ""

read -p "Start the test app now? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  echo -e "\n${GREEN}Starting test app at http://localhost:3333 ...${NC}"
  echo "(Press Ctrl+C to stop)"
  echo ""
  cd "$REPO_DIR"
  pnpm start
fi
