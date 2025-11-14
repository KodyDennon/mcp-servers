export type ServerDoc = {
  slug: string;
  name: string;
  status: "stable" | "beta" | "preview";
  tagline: string;
  description: string;
  npm: string;
  repoPath: string;
  heroStats: { label: string; value: string }[];
  requirements: string[];
  install: { title: string; description?: string; lines: string[] }[];
  configuration: {
    intro: string;
    env: { key: string; description: string }[];
    notes?: string[];
  };
  modes: { name: string; env?: string; description: string }[];
  testing: string[];
  features: string[];
  resources: { label: string; href: string }[];
};

export const servers: ServerDoc[] = [
  {
    slug: "supabase-db",
    name: "Supabase DB",
    status: "stable",
    tagline:
      "Dual-mode Model Context Protocol server for Supabase/PostgreSQL with 35 direct tools and code execution mode.",
    description:
      "Supabase DB MCP exposes every database primitive you expect—connections, schema, migrations, data, admin—and layers on a Claude Code-compatible execution surface with caching, streaming, and skill libraries.",
    npm: "https://www.npmjs.com/package/mcp-supabase-db",
    repoPath: "packages/supabase-db",
    heroStats: [
      { label: "Tools", value: "35" },
      { label: "Execution modes", value: "Direct + Code" },
      { label: "Token savings", value: "≈98%" },
    ],
    requirements: [
      "Node.js 20 LTS or newer",
      "npm 10+ or pnpm 9+",
      "Supabase project with service-role credentials",
      "OpenAI API key for AI/RAG helpers",
    ],
    install: [
      {
        title: "Global CLI",
        lines: ["npm install -g mcp-supabase-db", "supabase-db-mcp"],
      },
      {
        title: "Project local",
        lines: [
          "npm install mcp-supabase-db",
          "npx mcp-supabase-db",
          "# or add to your MCP client config",
        ],
      },
      {
        title: "Workspace build (monorepo)",
        description: "Run from the repository root.",
        lines: [
          "pnpm install",
          "pnpm --filter mcp-supabase-db build",
          "pnpm --filter mcp-supabase-db start",
        ],
      },
    ],
    configuration: {
      intro:
        "The server loads `.env` followed by `mcp-config.json`. Override the search root by setting `MCP_SUPABASE_ROOT=/absolute/path/to/mcp-servers` when running the CLI globally.",
      env: [
        {
          key: "POSTGRES_URL_NON_POOLING",
          description: "Direct Postgres connection string (no pooling).",
        },
        {
          key: "SUPABASE_URL",
          description: "Supabase project URL, e.g. https://xyz.supabase.co.",
        },
        {
          key: "SUPABASE_SERVICE_ROLE_KEY",
          description: "Service role key (alias SUPABASE_SECRET_KEY).",
        },
        {
          key: "SUPABASE_ACCESS_TOKEN",
          description:
            "Dashboard access token used for Supabase management APIs.",
        },
        {
          key: "SUPABASE_PROJECT_ID",
          description: "Project reference (15 character string).",
        },
        {
          key: "OPENAI_API_KEY",
          description: "Required for AI helpers, embeddings, RAG tools.",
        },
      ],
      notes: [
        "All secrets can be supplied via your MCP client config if you prefer not to write to disk.",
        "Additional optional knobs: `RAG_CHUNK_SIZE`, `RAG_CHUNK_OVERLAP`, `CODE_EXECUTION_MODE`.",
      ],
    },
    modes: [
      {
        name: "Direct tools (default)",
        description:
          "35 discrete MCP tools for schema, data, migration, admin, realtime, and AI operations.",
      },
      {
        name: "Code execution sandbox",
        env: "MCP_MODE=code-api CODE_EXECUTION_MODE=sandbox",
        description:
          "Ships multi-step workflows into Claude Code’s sandbox. Tokens stay tiny, sensitive data never leaves the sandbox.",
      },
      {
        name: "Code execution direct",
        env: "MCP_MODE=code-api CODE_EXECUTION_MODE=direct",
        description:
          "Runs code locally for maximum power. Pair with robust client-side safeguards.",
      },
    ],
    testing: ["npm test", "npm run build", "npm audit --production"],
    features: [
      "Connection, schema, query, migration, and admin tooling",
      "Edge functions + realtime subscriptions",
      "AI helpers with directory/URL indexing and RAG",
      "Claude Code compatible code-execution surface",
      "Environment validation + guided onboarding",
    ],
    resources: [
      {
        label: "Package README",
        href: "https://github.com/KodyDennon/mcp-servers/tree/main/packages/supabase-db",
      },
      {
        label: "npm package",
        href: "https://www.npmjs.com/package/mcp-supabase-db",
      },
      {
        label: "Protocol spec",
        href: "https://modelcontextprotocol.io/",
      },
    ],
  },
];

export function getServer(slug: string) {
  return servers.find((server) => server.slug === slug);
}
