# Supabase DB MCP Server - Production Docker Image
FROM node:20-alpine AS base

# Install pnpm
RUN npm install -g pnpm@8

WORKDIR /app

# Copy workspace files
COPY package.json pnpm-workspace.yaml ./
COPY packages/supabase-db/package.json ./packages/supabase-db/

# Install dependencies
FROM base AS dependencies
RUN pnpm install --frozen-lockfile

# Build stage
FROM dependencies AS build
COPY packages/supabase-db ./packages/supabase-db
WORKDIR /app/packages/supabase-db
RUN pnpm build

# Production stage
FROM node:20-alpine AS production

# Install pnpm for running the server
RUN npm install -g pnpm@8

WORKDIR /app

# Copy only production dependencies and built files
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=dependencies /app/packages/supabase-db/node_modules ./packages/supabase-db/node_modules
COPY --from=build /app/packages/supabase-db ./packages/supabase-db

WORKDIR /app/packages/supabase-db

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "console.log('healthy')" || exit 1

# Set environment variables
ENV NODE_ENV=production
ENV MCP_MODE=direct

# Default command
CMD ["node", "index.js"]

# Labels
LABEL org.opencontainers.image.title="Supabase DB MCP Server"
LABEL org.opencontainers.image.description="Model Context Protocol server for Supabase/PostgreSQL database access"
LABEL org.opencontainers.image.version="3.2.5"
LABEL org.opencontainers.image.authors="Kody Dennon"
LABEL org.opencontainers.image.url="https://github.com/KodyDennon/mcp-servers"
LABEL org.opencontainers.image.source="https://github.com/KodyDennon/mcp-servers"
LABEL org.opencontainers.image.licenses="MIT"
