# Project: MCP Servers Monorepo

## Project Overview

This is a `pnpm` monorepo that contains a collection of Model Context Protocol (MCP) servers. The primary goal of this project is to provide various integrations and services through the MCP. The monorepo is managed with `pnpm` workspaces and uses `Changesets` for versioning.

The main package in this monorepo is `mcp-supabase-db`, which is an MCP server for Supabase/PostgreSQL database access. It allows AI agents to interact with a database using a variety of tools, including:

*   **Querying:** Executing SQL queries, including transactions.
*   **Schema Inspection:** Listing tables, getting table schemas, and listing indexes.
*   **Migrations:** Running and listing database migrations.
*   **Database Management:** Getting database stats and creating backups.

The server is implemented in Node.js and uses the `@modelcontextprotocol/sdk` for handling the MCP communication.

## Building and Running

The following commands are used to build, run, and test the project:

*   **Install Dependencies:**
    ```bash
    pnpm install
    ```
*   **Build All Packages:**
    ```bash
    pnpm build
    ```
*   **Run Tests:**
    ```bash
    pnpm test
    ```
*   **Run the Supabase DB Server:**
    ```bash
    pnpm --filter mcp-supabase-db start
    ```

## Development Conventions

*   **Package Management:** This project uses `pnpm` for package management. All dependencies should be managed using `pnpm` commands.
*   **Versioning:** Changes to packages are managed using `Changesets`. When making changes, a new changeset should be created by running `pnpm changeset`.
*   **Linting and Formatting:** While not explicitly defined in the provided files, it is recommended to use a consistent code style. A linter and formatter such as Prettier and ESLint would be beneficial.
*   **Environment Variables:** The `mcp-supabase-db` server requires a `POSTGRES_URL_NON_POOLING` environment variable to be set. This can be done by creating a `.env` file in the root of the repository.
