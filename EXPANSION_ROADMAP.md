
# Supabase MCP Server Expansion Roadmap

This document outlines a roadmap for making the `mcp-supabase-db` server an extremely powerful tool for working with Supabase.

## 1. Deeper AI & Vector Search Integration

### 1.1. RAG-as-a-Service

*   **Description:** A high-level tool for performing Retrieval-Augmented Generation (RAG) directly against your Supabase data.
*   **Benefits:** Enables the AI agent to answer questions and generate content based on information in the database, turning the MCP server into a complete RAG solution.
*   **Implementation:**
    *   A new tool `rag(query, contextTable, textColumn, vectorColumn, embeddingModel, languageModel)` that:
        1.  Generates an embedding for the `query`.
        2.  Performs a vector search on the `vectorColumn` of the `contextTable`.
        3.  Constructs a context from the `textColumn` of the search results.
        4.  Passes the context and query to a language model to generate a response.
*   **Example:** `rag('What are the new features in v2?', 'release_notes', 'content', 'embedding', 'text-embedding-ada-002', 'gpt-4')`

### 1.2. Automated Document Processing & Indexing

*   **Description:** Tools for automatically processing and indexing documents (e.g., from a local directory or a web URL) into a Supabase table, ready for vector search.
*   **Benefits:** Streamlines the process of building a knowledge base for RAG.
*   **Implementation:**
    *   `indexDirectory(path, tableName, textColumn, vectorColumn)`: Scans a directory, chunks the documents, generates embeddings, and stores everything in the specified table.
    *   `indexUrl(url, tableName, textColumn, vectorColumn)`: Fetches content from a URL, chunks it, generates embeddings, and stores it.
*   **Example:** `indexDirectory('/path/to/docs', 'documents', 'content', 'embedding')`

## 2. Advanced Database & Schema Management

### 2.1. Granular Schema Manipulation

*   **Description:** Tools for creating and managing tables, columns, and indexes without writing SQL.
*   **Benefits:** Allows the AI agent to dynamically modify the database schema.
*   **Implementation:**
    *   `createTable(tableName, columns)`
    *   `dropTable(tableName)`
    *   `addColumn(tableName, columnName, columnType, constraints)`
    *   `dropColumn(tableName, columnName)`
    *   `createIndex(tableName, columnName, indexType)`
*   **Example:** `createTable('products', [{'name': 'id', 'type': 'uuid', 'isPrimary': true}, {'name': 'name', 'type': 'text'}])`

### 2.2. Simplified Row-Level Operations

*   **Description:** Tools for inserting, updating, and deleting individual rows without writing SQL.
*   **Benefits:** Simplifies data manipulation and reduces the risk of SQL injection.
*   **Implementation:**
    *   `insertRow(tableName, data)`
    *   `updateRow(tableName, rowId, data)`
    *   `deleteRow(tableName, rowId)`
*   **Example:** `insertRow('products', {'name': 'Laptop', 'price': 1200})`

## 3. Supabase-Specific Features

### 3.1. Real-time Subscriptions

*   **Description:** A tool to subscribe to database changes in real-time.
*   **Benefits:** Enables the AI agent to react to events as they happen in the database.
*   **Implementation:**
    *   `subscribe(tableName, event, callbackUrl)`: Subscribes to `INSERT`, `UPDATE`, or `DELETE` events and sends a notification to a callback URL.
*   **Example:** `subscribe('orders', 'INSERT', 'https://my-agent.com/new-order-hook')`

### 3.2. Supabase Edge Function Management

*   **Description:** Tools for deploying and managing Supabase Edge Functions.
*   **Benefits:** Allows the AI agent to create and manage serverless functions directly from the MCP server.
*   **Implementation:**
    *   `deployFunction(functionName, functionCode)`
    *   `listFunctions()`
    *   `deleteFunction(functionName)`
*   **Example:** `deployFunction('hello-world', 'export default () => new Response("Hello, World!")')`

## 4. Enhanced Developer Experience

### 4.1. Interactive Setup & Configuration

*   **Description:** An interactive setup process to guide users through configuring the server.
*   **Benefits:** Simplifies the initial setup and reduces configuration errors.
*   **Implementation:**
    *   On first run, if no `.env` file is found, prompt the user for the required environment variables.

### 4.2. Richer Configuration File

*   **Description:** Support for a `mcp-config.json` file to manage server settings.
*   **Benefits:** Provides a more structured way to manage configuration, especially for multiple environments.
*   **Implementation:**
    *   Load configuration from `mcp-config.json` if it exists, with environment variables overriding the file settings.