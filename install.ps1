# Supabase DB MCP Server Auto-Installer (Windows)
# Supports: Claude Code, Claude Desktop, Cursor, Gemini CLI, Cline, Roo Code, Windsurf, Codex

# Colors
$ErrorColor = "Red"
$SuccessColor = "Green"
$WarningColor = "Yellow"
$InfoColor = "Cyan"

# Get script directory
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ServerPath = Join-Path $ScriptDir "index.js"

# Helper functions
function Print-Header {
    param([string]$Message)
    Write-Host "============================================================" -ForegroundColor Blue
    Write-Host $Message -ForegroundColor Blue
    Write-Host "============================================================" -ForegroundColor Blue
}

function Print-Success {
    param([string]$Message)
    Write-Host "✓ $Message" -ForegroundColor $SuccessColor
}

function Print-Error {
    param([string]$Message)
    Write-Host "✗ $Message" -ForegroundColor $ErrorColor
}

function Print-Warning {
    param([string]$Message)
    Write-Host "⚠ $Message" -ForegroundColor $WarningColor
}

function Print-Info {
    param([string]$Message)
    Write-Host "ℹ $Message" -ForegroundColor $InfoColor
}

# Check Node.js
function Check-Node {
    if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
        Print-Error "Node.js is not installed"
        Print-Info "Download from: https://nodejs.org/"
        exit 1
    }

    $nodeVersionOutput = node -v
    $nodeVersion = [int]($nodeVersionOutput -replace 'v(\d+)\..*', '$1')

    if ($nodeVersion -lt 18) {
        Print-Error "Node.js version must be >= 18 (current: $nodeVersionOutput)"
        exit 1
    }

    Print-Success "Node.js $nodeVersionOutput found"
}

# Check dependencies
function Check-Dependencies {
    $nodeModulesPath = Join-Path $ScriptDir "node_modules"

    if (-not (Test-Path $nodeModulesPath)) {
        Print-Warning "Dependencies not installed"
        Print-Info "Running npm install..."
        Push-Location $ScriptDir
        npm install
        Pop-Location
        Print-Success "Dependencies installed"
    } else {
        Print-Success "Dependencies already installed"
    }
}

# Get database connection string
function Get-ConnectionString {
    Print-Header "Database Configuration"

    # Check if .env exists
    $envFile = Join-Path $ScriptDir "..\..\..env"
    $postgresUrl = ""

    if (Test-Path $envFile) {
        Print-Success ".env file found at: $envFile"

        # Try to extract from .env
        $envContent = Get-Content $envFile
        $postgresLine = $envContent | Where-Object { $_ -match "POSTGRES_URL_NON_POOLING" }

        if ($postgresLine) {
            $postgresUrl = ($postgresLine -split '=', 2)[1].Trim('"', "'")
            Print-Success "Using connection string from .env"

            # Ask if they want to use it
            Write-Host "`nConnection string found:"
            Write-Host "$($postgresUrl.Substring(0, [Math]::Min(30, $postgresUrl.Length)))..." -ForegroundColor Cyan
            $useEnv = Read-Host "Use this connection string? (y/n)"

            if ($useEnv -ne "y") {
                $postgresUrl = ""
            }
        }
    }

    # If not from .env, ask user
    if (-not $postgresUrl) {
        Write-Host ""
        Print-Info "Enter your PostgreSQL connection string"
        Print-Info "Format: postgresql://user:password@host:5432/database"
        Print-Info "Get it from Supabase Dashboard → Settings → Database"
        Write-Host ""
        $postgresUrl = Read-Host "Connection string"
    }

    # Validate format
    if (-not ($postgresUrl -match "^postgresql://|^postgres://")) {
        Print-Error "Invalid connection string format"
        Print-Info "Must start with postgresql:// or postgres://"
        exit 1
    }

    Print-Success "Connection string configured"
    return $postgresUrl
}

# Backup existing config
function Backup-Config {
    param([string]$ConfigFile)

    if (Test-Path $ConfigFile) {
        $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
        $backupFile = "$ConfigFile.backup.$timestamp"
        Copy-Item $ConfigFile $backupFile
        Print-Success "Backed up existing config to: $backupFile"
    }
}

# Add to JSON config file
function Add-ToJsonConfig {
    param(
        [string]$ConfigFile,
        [string]$ToolName,
        [string]$PostgresUrl
    )

    # Create directory if it doesn't exist
    $configDir = Split-Path -Parent $ConfigFile
    if (-not (Test-Path $configDir)) {
        New-Item -ItemType Directory -Path $configDir -Force | Out-Null
    }

    # Backup existing config
    Backup-Config $ConfigFile

    $serverConfig = @{
        command = "node"
        args = @($ServerPath)
        env = @{
            POSTGRES_URL_NON_POOLING = $PostgresUrl
        }
    }

    # Create or update config
    if (-not (Test-Path $ConfigFile)) {
        # Create new config
        $config = @{
            mcpServers = @{
                "supabase-db" = $serverConfig
            }
        }
        $config | ConvertTo-Json -Depth 10 | Set-Content $ConfigFile
        Print-Success "$ToolName`: Created new config"
    } else {
        # Update existing config
        try {
            $config = Get-Content $ConfigFile -Raw | ConvertFrom-Json

            if (-not $config.mcpServers) {
                $config | Add-Member -MemberType NoteProperty -Name mcpServers -Value @{}
            }

            $config.mcpServers | Add-Member -MemberType NoteProperty -Name "supabase-db" -Value $serverConfig -Force

            $config | ConvertTo-Json -Depth 10 | Set-Content $ConfigFile
            Print-Success "$ToolName`: Updated config"
        } catch {
            Print-Error "$ToolName`: Failed to update config - $_"
        }
    }
}

# Detect and configure AI tools
function Detect-AndConfigure {
    param([string]$PostgresUrl)

    Print-Header "Detecting AI Tools"

    $configuredCount = 0

    # Claude Desktop
    $claudeConfig = Join-Path $env:APPDATA "Claude\claude_desktop_config.json"
    if (Test-Path (Split-Path -Parent $claudeConfig)) {
        Print-Info "Found Claude Desktop"
        $configureClaude = Read-Host "Configure Claude Desktop? (y/n)"
        if ($configureClaude -eq "y") {
            Add-ToJsonConfig $claudeConfig "Claude Desktop" $PostgresUrl
            $configuredCount++
        }
    }

    # Windsurf
    $windsurfConfig = Join-Path $env:USERPROFILE ".codeium\windsurf\mcp_config.json"
    if ((Test-Path (Split-Path -Parent $windsurfConfig)) -or (Test-Path $windsurfConfig)) {
        Print-Info "Found Windsurf IDE"
        $configureWindsurf = Read-Host "Configure Windsurf? (y/n)"
        if ($configureWindsurf -eq "y") {
            Add-ToJsonConfig $windsurfConfig "Windsurf" $PostgresUrl
            $configuredCount++
        }
    }

    # Gemini CLI
    if (Get-Command gemini -ErrorAction SilentlyContinue) {
        Print-Info "Found Gemini CLI"
        $configureGemini = Read-Host "Configure Gemini CLI? (y/n)"
        if ($configureGemini -eq "y") {
            $geminiConfig = Join-Path $env:USERPROFILE ".gemini\settings.json"
            Add-ToJsonConfig $geminiConfig "Gemini CLI" $PostgresUrl
            $configuredCount++
        }
    }

    # Codex
    if ((Get-Command codex -ErrorAction SilentlyContinue) -or (Test-Path (Join-Path $env:USERPROFILE ".codex\config.toml"))) {
        Print-Info "Found Codex"
        $configureCodex = Read-Host "Configure Codex? (y/n)"
        if ($configureCodex -eq "y") {
            $codexConfig = Join-Path $env:USERPROFILE ".codex\config.toml"
            $codexDir = Split-Path -Parent $codexConfig

            if (-not (Test-Path $codexDir)) {
                New-Item -ItemType Directory -Path $codexDir -Force | Out-Null
            }

            Backup-Config $codexConfig

            # Add to TOML config
            if ((-not (Test-Path $codexConfig)) -or (-not (Select-String -Path $codexConfig -Pattern "supabase-db" -Quiet))) {
                $tomlContent = @"

[mcpServers.supabase-db]
command = "node"
args = ["$($ServerPath -replace '\\', '\\')"]

[mcpServers.supabase-db.env]
POSTGRES_URL_NON_POOLING = "$PostgresUrl"
"@
                Add-Content $codexConfig $tomlContent
                Print-Success "Codex: Configured"
                $configuredCount++
            } else {
                Print-Warning "Codex: Already configured"
            }
        }
    }

    # Roo Code
    $rooConfig = Join-Path $env:APPDATA "Code\User\mcp_settings.json"
    if (Test-Path (Join-Path $env:APPDATA "Code")) {
        Print-Info "Found Roo Code"
        $configureRoo = Read-Host "Configure Roo Code (global)? (y/n)"
        if ($configureRoo -eq "y") {
            Add-ToJsonConfig $rooConfig "Roo Code" $PostgresUrl
            $configuredCount++
        }
    }

    # Cline
    Print-Info "Cline (VS Code extension) can be configured"
    $configureCline = Read-Host "Configure Cline in current workspace? (y/n)"
    if ($configureCline -eq "y") {
        $clineConfig = Join-Path (Get-Location) "cline_mcp_settings.json"
        Add-ToJsonConfig $clineConfig "Cline" $PostgresUrl
        $configuredCount++
    }

    Write-Host ""
    if ($configuredCount -eq 0) {
        Print-Warning "No tools were configured"
        Print-Info "You can manually configure using examples in the 'examples/' directory"
    } else {
        Print-Success "Configured $configuredCount tool(s)"
    }
}

# Test connection
function Test-Connection {
    param([string]$PostgresUrl)

    Print-Header "Testing Database Connection"

    $env:POSTGRES_URL_NON_POOLING = $PostgresUrl

    Print-Info "Starting test connection..."

    # Run server for 3 seconds to test
    $job = Start-Job -ScriptBlock {
        param($serverPath)
        & node $serverPath 2>&1
    } -ArgumentList $ServerPath

    Start-Sleep -Seconds 3
    Stop-Job $job
    $output = Receive-Job $job
    Remove-Job $job

    if ($output -match "Connected to database") {
        Print-Success "Database connection successful!"

        # Extract database info
        $dbLine = $output | Where-Object { $_ -match "Connected to database" }
        if ($dbLine -match "Connected to database:\s+(\w+)") {
            $dbName = $matches[1]
            Print-Success "Connected to: $dbName"
        }
    } else {
        Print-Error "Database connection failed"
        Print-Info "Check the log output:"
        Write-Host ($output | Out-String)
        exit 1
    }
}

# Final instructions
function Print-FinalInstructions {
    Print-Header "Installation Complete!"

    Write-Host ""
    Print-Success "Supabase DB MCP Server is ready to use!"
    Write-Host ""
    Print-Info "Next steps:"
    Write-Host ""
    Write-Host "  1. Restart your AI tool(s)"
    Write-Host "  2. Start a new conversation"
    Write-Host "  3. Ask: 'What database tools are available?'"
    Write-Host ""
    Print-Info "Available tools: 12"
    Write-Host "  - query (execute SQL)"
    Write-Host "  - queryTransaction (atomic transactions)"
    Write-Host "  - listTables (show tables)"
    Write-Host "  - getTableSchema (table structure)"
    Write-Host "  - explainQuery (optimize queries)"
    Write-Host "  - runMigration (apply migrations)"
    Write-Host "  - and more..."
    Write-Host ""
    Print-Info "Documentation:"
    Write-Host "  - Full guide: PLATFORMS.md"
    Write-Host "  - Main README: README.md"
    Write-Host "  - Validate config: node validate-config.js"
    Write-Host ""
    Print-Info "Troubleshooting:"
    Write-Host "  - Run: node validate-config.js"
    Write-Host "  - Check: PLATFORMS.md"
    Write-Host "  - Issues: https://github.com/KodyDennon/PersonalOF/issues"
    Write-Host ""
}

# Main installation flow
function Main {
    Clear-Host
    Print-Header "Supabase DB MCP Server - Auto Installer (Windows)"
    Write-Host ""
    Print-Info "This installer will:"
    Write-Host "  1. Check system requirements"
    Write-Host "  2. Install dependencies"
    Write-Host "  3. Configure database connection"
    Write-Host "  4. Detect and configure AI tools"
    Write-Host "  5. Test the connection"
    Write-Host ""
    $continueInstall = Read-Host "Continue? (y/n)"

    if ($continueInstall -ne "y") {
        Print-Info "Installation cancelled"
        exit 0
    }

    Write-Host ""
    Print-Header "System Requirements Check"
    Check-Node
    Check-Dependencies

    Write-Host ""
    $postgresUrl = Get-ConnectionString

    Write-Host ""
    Detect-AndConfigure $postgresUrl

    Write-Host ""
    Test-Connection $postgresUrl

    Write-Host ""
    Print-FinalInstructions
}

# Run main
Main
