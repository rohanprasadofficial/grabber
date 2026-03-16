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

# Track missing prerequisites for summary at the end
MISSING_PREREQS=()

# ── Configuration ──
REPO_URL="https://github.com/rohanprasadofficial/grabber.git"
CLONE_DIR="grabber-demo"

echo -e "${BOLD}╔══════════════════════════════════════╗${NC}"
echo -e "${BOLD}║       Grabber Demo Setup             ║${NC}"
echo -e "${BOLD}╚══════════════════════════════════════╝${NC}"

# ── Step 1: Prerequisites ──
step 1 "Checking prerequisites..."

# Git
if ! command -v git &>/dev/null; then
  warn "git not found — attempting to install..."
  if [[ "$OSTYPE" == darwin* ]]; then
    # macOS: xcode-select installs git via Command Line Tools
    if xcode-select --install 2>/dev/null; then
      warn "Xcode Command Line Tools installer launched — please complete the installation and re-run this script."
      MISSING_PREREQS+=("git")
    else
      fail "Could not install git automatically."
      MISSING_PREREQS+=("git")
    fi
  elif [[ "$OSTYPE" == linux* ]]; then
    if command -v apt-get &>/dev/null; then
      sudo apt-get update && sudo apt-get install -y git
    elif command -v dnf &>/dev/null; then
      sudo dnf install -y git
    elif command -v yum &>/dev/null; then
      sudo yum install -y git
    else
      fail "Could not install git automatically."
      MISSING_PREREQS+=("git")
    fi
  else
    MISSING_PREREQS+=("git")
  fi
  hash -r 2>/dev/null
fi
if command -v git &>/dev/null; then
  success "git $(git --version | awk '{print $3}')"
else
  fail "git is not installed."
  MISSING_PREREQS+=("git")
fi

# Node.js
if ! command -v node &>/dev/null; then
  warn "Node.js not found — attempting to install..."
  if [[ "$OSTYPE" == darwin* ]]; then
    if command -v brew &>/dev/null; then
      brew install node@22
      brew link --overwrite node@22
    else
      warn "Homebrew not found — installing Homebrew first..."
      /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
      # Add brew to PATH for Apple Silicon & Intel Macs
      if [ -f /opt/homebrew/bin/brew ]; then
        eval "$(/opt/homebrew/bin/brew shellenv)"
      elif [ -f /usr/local/bin/brew ]; then
        eval "$(/usr/local/bin/brew shellenv)"
      fi
      brew install node@22
      brew link --overwrite node@22
    fi
  elif [[ "$OSTYPE" == linux* ]]; then
    if command -v apt-get &>/dev/null; then
      curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
      sudo apt-get install -y nodejs
    elif command -v dnf &>/dev/null; then
      curl -fsSL https://rpm.nodesource.com/setup_22.x | sudo bash -
      sudo dnf install -y nodejs
    else
      fail "Could not install Node.js automatically."
      MISSING_PREREQS+=("node")
    fi
  else
    MISSING_PREREQS+=("node")
  fi
  hash -r 2>/dev/null
fi
if command -v node &>/dev/null; then
  success "Node.js $(node -v)"
else
  fail "Node.js is not installed."
  MISSING_PREREQS+=("node")
fi

# If git or node are missing, show instructions and exit gracefully
if [ ${#MISSING_PREREQS[@]} -gt 0 ]; then
  echo ""
  echo -e "${RED}${BOLD}Some required tools could not be installed automatically.${NC}"
  echo -e "${BOLD}Please install the following manually and re-run this script:${NC}"
  echo ""
  for prereq in "${MISSING_PREREQS[@]}"; do
    case "$prereq" in
      git)
        echo -e "  ${BOLD}Git${NC}"
        echo "    • macOS:  xcode-select --install  (or)  brew install git"
        echo "    • Linux:  sudo apt-get install git  (or)  sudo dnf install git"
        echo "    • Download: https://git-scm.com"
        echo ""
        ;;
      node)
        echo -e "  ${BOLD}Node.js (v18+)${NC}"
        echo "    • macOS:  brew install node@22"
        echo "    • Linux:  https://nodejs.org/en/download"
        echo "    • Download: https://nodejs.org"
        echo ""
        ;;
    esac
  done
  echo -e "${BOLD}After installing, re-run:${NC}  bash setup.sh"
  echo ""
  exit 0
fi

# pnpm
if ! command -v pnpm &>/dev/null; then
  warn "pnpm not found — installing via npm..."
  if npm install -g pnpm@9 2>/dev/null; then
    : # installed via npm
  elif command -v corepack &>/dev/null; then
    warn "npm global install failed — trying corepack..."
    corepack enable && corepack prepare pnpm@9 --activate
  else
    fail "Could not install pnpm. Try running: npm install -g pnpm@9"
    exit 1
  fi
  # Refresh PATH so pnpm is discoverable
  hash -r 2>/dev/null
  if ! command -v pnpm &>/dev/null; then
    fail "pnpm still not found after install. Close this terminal, open a new one, and re-run the script."
    exit 1
  fi
fi
success "pnpm $(pnpm -v)"

# VS Code
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
        fail "VS Code auto-install requires Homebrew. Install VS Code manually from https://code.visualstudio.com"
        SKIP_VSCODE=1
      fi
      if [ -z "$SKIP_VSCODE" ]; then
        export PATH="/Applications/Visual Studio Code.app/Contents/Resources/app/bin:$PATH"
      fi
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
    warn "VS Code installation failed — skipping extension install."
    warn "Install manually from https://code.visualstudio.com and re-run this script."
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

# Open the project in VS Code
if [ -z "$SKIP_VSCODE" ] && command -v code &>/dev/null; then
  code "$REPO_DIR"
  success "Opened $REPO_DIR in VS Code"
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
