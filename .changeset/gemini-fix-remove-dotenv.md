---
"mcp-supabase-db": patch
---

fix: Remove dotenv logic to prevent conflicts

To ensure compatibility with frameworks that manage their own environment (like ADK), all `dotenv` loading logic has been removed from the server. The server now relies exclusively on `process.env`, expecting the parent process to provide the necessary environment variables. This simplifies the server's behavior and prevents environment conflicts.
