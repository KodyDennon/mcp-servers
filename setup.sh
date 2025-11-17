#!/bin/bash

# 🚀 MCP Servers - One-Command Setup Script
# This script will set up your MCP servers in seconds!

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color
BOLD='\033[1m'

echo ""
echo -e "${MAGENTA}${BOLD}╔════════════════════════════════════════╗${NC}"
echo -e "${MAGENTA}${BOLD}║   🚀 MCP Servers Setup Assistant      ║${NC}"
echo -e "${MAGENTA}${BOLD}╔════════════════════════════════════════╝${NC}"
echo ""

# Check for Node.js
echo -e "${CYAN}⚡ Checking prerequisites...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed!${NC}"
    echo -e "${YELLOW}   Please install Node.js >= 20.0.0 from https://nodejs.org${NC}"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
    echo -e "${RED}❌ Node.js version must be >= 20.0.0 (you have $(node -v))${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Node.js $(node -v) detected${NC}"

# Check for pnpm
if ! command -v pnpm &> /dev/null; then
    echo -e "${YELLOW}⚠️  pnpm not found. Installing pnpm...${NC}"
    npm install -g pnpm
    echo -e "${GREEN}✓ pnpm installed successfully${NC}"
else
    echo -e "${GREEN}✓ pnpm $(pnpm -v) detected${NC}"
fi

# Install dependencies
echo ""
echo -e "${CYAN}📦 Installing dependencies...${NC}"
pnpm install

# Build packages
echo ""
echo -e "${CYAN}🔨 Building packages...${NC}"
pnpm build

# Run tests
echo ""
echo -e "${CYAN}🧪 Running tests...${NC}"
pnpm test

echo ""
echo -e "${GREEN}${BOLD}╔════════════════════════════════════════╗${NC}"
echo -e "${GREEN}${BOLD}║   ✨ Setup Complete! ✨               ║${NC}"
echo -e "${GREEN}${BOLD}╚════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BOLD}Available MCP Servers:${NC}"
echo ""
echo -e "${CYAN}1. 🗄️  Supabase DB Server${NC} (v3.2.5)"
echo -e "   ${BLUE}Full-featured Supabase/PostgreSQL access with 35+ tools${NC}"
echo -e "   📍 Location: ${YELLOW}packages/supabase-db${NC}"
echo -e "   📖 Setup: ${YELLOW}packages/supabase-db/README.md${NC}"
echo ""
echo -e "${CYAN}2. 📱 iOS Simulator Server${NC} (v0.2.0)"
echo -e "   ${BLUE}DevTools-like automation for Xcode iPhone Simulator${NC}"
echo -e "   📍 Location: ${YELLOW}packages/ios-simulator${NC}"
echo -e "   📖 Setup: ${YELLOW}packages/ios-simulator/README.md${NC}"
echo ""
echo -e "${BOLD}Quick Start:${NC}"
echo -e "   ${YELLOW}cd packages/supabase-db && pnpm start${NC}     # Start Supabase DB server"
echo -e "   ${YELLOW}cd packages/ios-simulator && pnpm start${NC}   # Start iOS Simulator server"
echo ""
echo -e "${BOLD}Configuration Examples:${NC}"
echo -e "   ${YELLOW}packages/supabase-db/examples/${NC}           # Platform-specific configs"
echo ""
echo -e "${GREEN}Happy coding! 🎉${NC}"
echo ""
