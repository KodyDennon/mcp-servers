#!/bin/bash

# Supabase DB MCP Server Auto-Installer
# Supports: Claude Code, Claude Desktop, Cursor, Gemini CLI, Cline, Roo Code, Windsurf, Codex

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVER_PATH="$SCRIPT_DIR/index.js"

# Helper functions
print_header() {
    echo -e "${BLUE}============================================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}============================================================${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${CYAN}ℹ $1${NC}"
}

# Check Node.js
check_node() {
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed"
        print_info "Download from: https://nodejs.org/"
        exit 1
    fi

    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        print_error "Node.js version must be >= 18 (current: $(node -v))"
        exit 1
    fi

    print_success "Node.js $(node -v) found"
}

# Check dependencies
check_dependencies() {
    if [ ! -d "$SCRIPT_DIR/node_modules" ]; then
        print_warning "Dependencies not installed"
        print_info "Running npm install..."
        cd "$SCRIPT_DIR"
        npm install
        print_success "Dependencies installed"
    else
        print_success "Dependencies already installed"
    fi
}

# Get database connection string
get_connection_string() {
    print_header "Database Configuration"

    # Check if .env exists
    ENV_FILE="$SCRIPT_DIR/../../.env"
    if [ -f "$ENV_FILE" ]; then
        print_success ".env file found at: $ENV_FILE"

        # Try to extract from .env
        if grep -q "POSTGRES_URL_NON_POOLING" "$ENV_FILE"; then
            POSTGRES_URL=$(grep "POSTGRES_URL_NON_POOLING" "$ENV_FILE" | cut -d'=' -f2 | tr -d '"' | tr -d "'")
            print_success "Using connection string from .env"

            # Ask if they want to use it
            echo -e "\nConnection string found:"
            echo -e "${CYAN}${POSTGRES_URL:0:30}...${NC}"
            read -p "Use this connection string? (y/n): " use_env

            if [ "$use_env" != "y" ]; then
                POSTGRES_URL=""
            fi
        fi
    fi

    # If not from .env, ask user
    if [ -z "$POSTGRES_URL" ]; then
        echo ""
        print_info "Enter your PostgreSQL connection string"
        print_info "Format: postgresql://user:password@host:5432/database"
        print_info "Get it from Supabase Dashboard → Settings → Database"
        echo ""
        read -p "Connection string: " POSTGRES_URL
    fi

    # Validate format
    if [[ ! "$POSTGRES_URL" =~ ^postgresql:// ]] && [[ ! "$POSTGRES_URL" =~ ^postgres:// ]]; then
        print_error "Invalid connection string format"
        print_info "Must start with postgresql:// or postgres://"
        exit 1
    fi

    print_success "Connection string configured"
}

# Backup existing config
backup_config() {
    local config_file=$1
    if [ -f "$config_file" ]; then
        backup_file="${config_file}.backup.$(date +%Y%m%d_%H%M%S)"
        cp "$config_file" "$backup_file"
        print_success "Backed up existing config to: $backup_file"
    fi
}

# Add to JSON config file
add_to_json_config() {
    local config_file=$1
    local tool_name=$2

    # Create directory if it doesn't exist
    mkdir -p "$(dirname "$config_file")"

    # Backup existing config
    backup_config "$config_file"

    # Create or update config
    if [ ! -f "$config_file" ]; then
        # Create new config
        cat > "$config_file" << EOF
{
  "mcpServers": {
    "supabase-db": {
      "command": "node",
      "args": ["$SERVER_PATH"],
      "env": {
        "POSTGRES_URL_NON_POOLING": "$POSTGRES_URL"
      }
    }
  }
}
EOF
        print_success "$tool_name: Created new config"
    else
        # Update existing config using node
        node -e "
const fs = require('fs');
try {
  const config = JSON.parse(fs.readFileSync('$config_file', 'utf8'));
  if (!config.mcpServers) config.mcpServers = {};
  config.mcpServers['supabase-db'] = {
    command: 'node',
    args: ['$SERVER_PATH'],
    env: {
      POSTGRES_URL_NON_POOLING: '$POSTGRES_URL'
    }
  };
  fs.writeFileSync('$config_file', JSON.stringify(config, null, 2));
  console.log('success');
} catch (err) {
  console.error('error: ' + err.message);
  process.exit(1);
}
        "
        if [ $? -eq 0 ]; then
            print_success "$tool_name: Updated config"
        else
            print_error "$tool_name: Failed to update config"
        fi
    fi
}

# Detect and configure AI tools
detect_and_configure() {
    print_header "Detecting AI Tools"

    local configured_count=0

    # Claude Desktop
    if [ "$(uname)" == "Darwin" ]; then
        CLAUDE_CONFIG="$HOME/Library/Application Support/Claude/claude_desktop_config.json"
    elif [ "$(uname)" == "Linux" ]; then
        CLAUDE_CONFIG="$HOME/.config/Claude/claude_desktop_config.json"
    fi

    if [ ! -z "$CLAUDE_CONFIG" ]; then
        if [ -d "$(dirname "$CLAUDE_CONFIG")" ]; then
            print_info "Found Claude Desktop"
            read -p "Configure Claude Desktop? (y/n): " configure_claude
            if [ "$configure_claude" == "y" ]; then
                add_to_json_config "$CLAUDE_CONFIG" "Claude Desktop"
                ((configured_count++))
            fi
        fi
    fi

    # Windsurf
    WINDSURF_CONFIG="$HOME/.codeium/windsurf/mcp_config.json"
    if [ -d "$(dirname "$WINDSURF_CONFIG")" ] || [ -f "$WINDSURF_CONFIG" ]; then
        print_info "Found Windsurf IDE"
        read -p "Configure Windsurf? (y/n): " configure_windsurf
        if [ "$configure_windsurf" == "y" ]; then
            add_to_json_config "$WINDSURF_CONFIG" "Windsurf"
            ((configured_count++))
        fi
    fi

    # Gemini CLI
    if command -v gemini &> /dev/null; then
        print_info "Found Gemini CLI"
        read -p "Configure Gemini CLI? (y/n): " configure_gemini
        if [ "$configure_gemini" == "y" ]; then
            GEMINI_CONFIG="$HOME/.gemini/settings.json"
            add_to_json_config "$GEMINI_CONFIG" "Gemini CLI"
            ((configured_count++))
        fi
    fi

    # Codex
    if command -v codex &> /dev/null || [ -f "$HOME/.codex/config.toml" ]; then
        print_info "Found Codex"
        read -p "Configure Codex? (y/n): " configure_codex
        if [ "$configure_codex" == "y" ]; then
            CODEX_CONFIG="$HOME/.codex/config.toml"
            mkdir -p "$(dirname "$CODEX_CONFIG")"
            backup_config "$CODEX_CONFIG"

            # Add to TOML config
            if [ ! -f "$CODEX_CONFIG" ] || ! grep -q "supabase-db" "$CODEX_CONFIG"; then
                cat >> "$CODEX_CONFIG" << EOF

[mcpServers.supabase-db]
command = "node"
args = ["$SERVER_PATH"]

[mcpServers.supabase-db.env]
POSTGRES_URL_NON_POOLING = "$POSTGRES_URL"
EOF
                print_success "Codex: Configured"
                ((configured_count++))
            else
                print_warning "Codex: Already configured"
            fi
        fi
    fi

    # Roo Code (global)
    if [ "$(uname)" == "Darwin" ] || [ "$(uname)" == "Linux" ]; then
        ROO_CONFIG="$HOME/.config/Code/User/mcp_settings.json"
        if [ -d "$HOME/.config/Code" ]; then
            print_info "Found Roo Code"
            read -p "Configure Roo Code (global)? (y/n): " configure_roo
            if [ "$configure_roo" == "y" ]; then
                add_to_json_config "$ROO_CONFIG" "Roo Code"
                ((configured_count++))
            fi
        fi
    fi

    # Cline (workspace)
    print_info "Cline (VS Code extension) can be configured"
    read -p "Configure Cline in current workspace? (y/n): " configure_cline
    if [ "$configure_cline" == "y" ]; then
        CLINE_CONFIG="$(pwd)/cline_mcp_settings.json"
        add_to_json_config "$CLINE_CONFIG" "Cline"
        ((configured_count++))
    fi

    echo ""
    if [ $configured_count -eq 0 ]; then
        print_warning "No tools were configured"
        print_info "You can manually configure using examples in the 'examples/' directory"
    else
        print_success "Configured $configured_count tool(s)"
    fi
}

# Test connection
test_connection() {
    print_header "Testing Database Connection"

    export POSTGRES_URL_NON_POOLING="$POSTGRES_URL"

    print_info "Starting test connection..."

    # Run server for 3 seconds to test
    timeout 3 node "$SERVER_PATH" > /tmp/mcp_test.log 2>&1 || true

    if grep -q "Connected to database" /tmp/mcp_test.log; then
        print_success "Database connection successful!"

        # Extract database info
        db_name=$(grep "Connected to database" /tmp/mcp_test.log | sed 's/.*Connected to database: //' | sed 's/ .*//')
        print_success "Connected to: $db_name"
    else
        print_error "Database connection failed"
        print_info "Check the log output:"
        cat /tmp/mcp_test.log
        exit 1
    fi

    rm -f /tmp/mcp_test.log
}

# Final instructions
print_final_instructions() {
    print_header "Installation Complete!"

    echo ""
    print_success "Supabase DB MCP Server is ready to use!"
    echo ""
    print_info "Next steps:"
    echo ""
    echo "  1. Restart your AI tool(s)"
    echo "  2. Start a new conversation"
    echo "  3. Ask: 'What database tools are available?'"
    echo ""
    print_info "Available tools: 12"
    echo "  - query (execute SQL)"
    echo "  - queryTransaction (atomic transactions)"
    echo "  - listTables (show tables)"
    echo "  - getTableSchema (table structure)"
    echo "  - explainQuery (optimize queries)"
    echo "  - runMigration (apply migrations)"
    echo "  - and more..."
    echo ""
    print_info "Documentation:"
    echo "  - Full guide: PLATFORMS.md"
    echo "  - Main README: README.md"
    echo "  - Validate config: node validate-config.js"
    echo ""
    print_info "Troubleshooting:"
    echo "  - Run: node validate-config.js"
    echo "  - Check: PLATFORMS.md"
    echo "  - Issues: https://github.com/KodyDennon/PersonalOF/issues"
    echo ""
}

# Main installation flow
main() {
    clear
    print_header "Supabase DB MCP Server - Auto Installer"
    echo ""
    print_info "This installer will:"
    echo "  1. Check system requirements"
    echo "  2. Install dependencies"
    echo "  3. Configure database connection"
    echo "  4. Detect and configure AI tools"
    echo "  5. Test the connection"
    echo ""
    read -p "Continue? (y/n): " continue_install

    if [ "$continue_install" != "y" ]; then
        print_info "Installation cancelled"
        exit 0
    fi

    echo ""
    print_header "System Requirements Check"
    check_node
    check_dependencies

    echo ""
    get_connection_string

    echo ""
    detect_and_configure

    echo ""
    test_connection

    echo ""
    print_final_instructions
}

# Run main
main
