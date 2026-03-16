#Requires -Version 5.1
$ErrorActionPreference = "Stop"

# ── Colors ──
function Step($num, $msg) { Write-Host "`n[$num/5] $msg" -ForegroundColor Cyan }
function Success($msg) { Write-Host "  ✓ $msg" -ForegroundColor Green }
function Warn($msg) { Write-Host "  ! $msg" -ForegroundColor Yellow }
function Fail($msg) { Write-Host "  ✗ $msg" -ForegroundColor Red }

# ── Configuration ──
$REPO_URL = "https://github.com/rohanprasadofficial/grabber.git"
$CLONE_DIR = "grabber-demo"

Write-Host ""
Write-Host "╔══════════════════════════════════════╗" -ForegroundColor White
Write-Host "║       Grabber Demo Setup             ║" -ForegroundColor White
Write-Host "╚══════════════════════════════════════╝" -ForegroundColor White

# ── Step 1: Prerequisites ──
Step 1 "Checking prerequisites..."

# Git
if (!(Get-Command git -ErrorAction SilentlyContinue)) {
    if (Get-Command winget -ErrorAction SilentlyContinue) {
        Warn "git not found — installing via winget..."
        winget install --id Git.Git -e --accept-source-agreements --accept-package-agreements
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")
    } else {
        Fail "git not found. Install from https://git-scm.com"
        exit 1
    }
}
Success "git $(git --version)"

# Node.js
if (!(Get-Command node -ErrorAction SilentlyContinue)) {
    if (Get-Command winget -ErrorAction SilentlyContinue) {
        Warn "Node.js not found — installing via winget..."
        winget install --id OpenJS.NodeJS.LTS -e --accept-source-agreements --accept-package-agreements
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")
    } else {
        Fail "Node.js not found. Install from https://nodejs.org (v18+)"
        exit 1
    }
}
Success "Node.js $(node -v)"

# pnpm
if (!(Get-Command pnpm -ErrorAction SilentlyContinue)) {
    Warn "pnpm not found — installing via npm..."
    try {
        npm install -g pnpm@9
    } catch {
        # Fallback to corepack if npm global install fails
        try {
            corepack enable
            corepack prepare pnpm@9 --activate
        } catch {
            Fail "Could not install pnpm. Try running: npm install -g pnpm@9"
            exit 1
        }
    }
    # Refresh PATH so pnpm is discoverable
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")
    if (!(Get-Command pnpm -ErrorAction SilentlyContinue)) {
        Fail "pnpm still not found after install. Close this terminal, open a new one, and re-run the script."
        exit 1
    }
}
Success "pnpm $(pnpm -v)"

# VS Code
if (!(Get-Command code -ErrorAction SilentlyContinue)) {
    # Check common install paths
    $codePaths = @(
        "$env:LOCALAPPDATA\Programs\Microsoft VS Code\bin\code.cmd",
        "$env:ProgramFiles\Microsoft VS Code\bin\code.cmd"
    )
    $found = $false
    foreach ($p in $codePaths) {
        if (Test-Path $p) {
            Warn "VS Code found but 'code' not on PATH — adding it..."
            $env:Path += ";" + (Split-Path $p)
            $found = $true
            break
        }
    }
    if (-not $found) {
        if (Get-Command winget -ErrorAction SilentlyContinue) {
            Warn "VS Code not found — installing via winget..."
            winget install --id Microsoft.VisualStudioCode -e --accept-source-agreements --accept-package-agreements
            $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")
            # Also add the default install path
            $env:Path += ";$env:LOCALAPPDATA\Programs\Microsoft VS Code\bin"
        } else {
            Fail "VS Code not found and winget not available. Install from https://code.visualstudio.com"
            $SKIP_VSCODE = $true
        }
    }
    if (-not $SKIP_VSCODE -and (Get-Command code -ErrorAction SilentlyContinue)) {
        Success "VS Code installed"
    } elseif (-not $SKIP_VSCODE) {
        Fail "VS Code installation failed — skipping extension install"
        $SKIP_VSCODE = $true
    }
}

# ── Step 2: Clone repo ──
Step 2 "Cloning repository..."

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$packageJson = Join-Path $scriptDir "package.json"

if ((Test-Path $packageJson) -and (Select-String -Path $packageJson -Pattern "grabber-demo" -Quiet)) {
    $REPO_DIR = $scriptDir
    Success "Already inside the repo — skipping clone"
} else {
    if (Test-Path $CLONE_DIR) {
        Warn "$CLONE_DIR/ already exists — pulling latest..."
        Push-Location $CLONE_DIR
        git pull
        Pop-Location
    } else {
        git clone $REPO_URL $CLONE_DIR
    }
    $REPO_DIR = (Resolve-Path $CLONE_DIR).Path
    Success "Cloned to $REPO_DIR"
}

# ── Step 3: Install & build ──
Step 3 "Installing dependencies & building..."
Push-Location $REPO_DIR
try {
    pnpm install --frozen-lockfile 2>$null
} catch {
    pnpm install
}
pnpm build
Success "Build complete"

# ── Step 4: Install VS Code extension ──
Step 4 "Installing VS Code extension..."
if (-not $SKIP_VSCODE) {
    Push-Location (Join-Path $REPO_DIR "packages\vscode-extension")
    try {
        pnpm package 2>$null
    } catch {
        npx @vscode/vsce package --no-dependencies
    }
    $vsixFile = Get-ChildItem -Filter "*.vsix" -ErrorAction SilentlyContinue |
                Sort-Object LastWriteTime -Descending |
                Select-Object -First 1
    if ($vsixFile) {
        code --install-extension $vsixFile.FullName --force
        Success "VS Code extension installed ($($vsixFile.Name))"
        Warn "Restart VS Code if it's already open"
    } else {
        Fail "Could not build .vsix file"
    }
    Pop-Location
} else {
    Warn "Skipped (VS Code CLI not available)"
}

# ── Step 5: Done ──
Step 5 "Setup complete!"

Write-Host ""
Write-Host "══════════════════════════════════════" -ForegroundColor White
Write-Host "  How to run the demo" -ForegroundColor White
Write-Host "══════════════════════════════════════" -ForegroundColor White
Write-Host ""
Write-Host "  1. Open VS Code (Grabber extension auto-starts on port 4567)"
Write-Host ""
Write-Host "  2. Start the test app:"
Write-Host "     cd $REPO_DIR; pnpm start" -ForegroundColor White
Write-Host ""
Write-Host "  3. Open http://localhost:3333 in your browser"
Write-Host ""
Write-Host "  4. Try it out:"
Write-Host "     • Press Ctrl+Shift+G or click the Grabber button (bottom-right)"
Write-Host "     • Hover over any element to see the selection overlay"
Write-Host "     • Click an element to inspect React component info & styles"
Write-Host "     • Use 'Send to VS Code' to push context to Copilot Chat"
Write-Host ""
Write-Host "══════════════════════════════════════" -ForegroundColor White
Write-Host ""

Pop-Location

$reply = Read-Host "Start the test app now? (y/n)"
if ($reply -match "^[Yy]$") {
    Write-Host "`nStarting test app at http://localhost:3333 ..." -ForegroundColor Green
    Write-Host "(Press Ctrl+C to stop)`n"
    Push-Location $REPO_DIR
    pnpm start
    Pop-Location
}
