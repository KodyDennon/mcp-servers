---
"mcp-supabase-db": patch
---

fix: Improve .env file loading by searching multiple locations

To robustly handle environment variables, the server now searches for a `.env` file in the following order:

1. The current working directory (the user's project root).
2. A backup location within the installed `mcp-supabase-db` package itself.

This ensures predictable behavior for both local development and when the package is installed as a dependency.
