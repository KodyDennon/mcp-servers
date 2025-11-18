# iOS Simulator MCP Server - Production Docker Image
# Note: This requires macOS with Xcode installed
# This Dockerfile is for consistency but the server must run on macOS

FROM node:20-alpine AS base

# Install pnpm
RUN npm install -g pnpm@8

WORKDIR /app

# Copy workspace files
COPY package.json pnpm-workspace.yaml ./
COPY packages/ios-simulator/package.json ./packages/ios-simulator/

# Install dependencies
FROM base AS dependencies
RUN pnpm install --frozen-lockfile

# Build stage
FROM dependencies AS build
COPY packages/ios-simulator ./packages/ios-simulator
WORKDIR /app/packages/ios-simulator
RUN pnpm build

# Production stage
FROM node:20-alpine AS production

# Install pnpm
RUN npm install -g pnpm@8

WORKDIR /app

# Copy only production dependencies and built files
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=dependencies /app/packages/ios-simulator/node_modules ./packages/ios-simulator/node_modules
COPY --from=build /app/packages/ios-simulator ./packages/ios-simulator

WORKDIR /app/packages/ios-simulator

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "console.log('healthy')" || exit 1

# Set environment variables
ENV NODE_ENV=production

# Default command
CMD ["node", "index.js"]

# Labels
LABEL org.opencontainers.image.title="iOS Simulator MCP Server"
LABEL org.opencontainers.image.description="Model Context Protocol server for iOS Simulator automation"
LABEL org.opencontainers.image.version="0.2.0"
LABEL org.opencontainers.image.authors="Kody Dennon"
LABEL org.opencontainers.image.url="https://github.com/KodyDennon/mcp-servers"
LABEL org.opencontainers.image.source="https://github.com/KodyDennon/mcp-servers"
LABEL org.opencontainers.image.licenses="MIT"

# Warning: This server requires macOS and Xcode
# Docker on macOS can run this, but Linux/Windows cannot use iOS Simulator
