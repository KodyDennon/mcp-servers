import { DirectoryLoader } from "../utils/directoryLoader.js";
import { CheerioWebBaseLoader } from "@langchain/community/document_loaders/web/cheerio";
import { OpenAI } from "openai";
import { getSupabaseClient } from "../supabaseClient.js";
import { chunkText } from "../utils/aiHelpers.js";

let openAIClient;

function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY environment variable is not set.");
  }
  if (!openAIClient) {
    openAIClient = new OpenAI({ apiKey });
  }
  return openAIClient;
}

async function ragTool(
  query,
  textColumn,
  vectorColumn,
  embeddingModel = "text-embedding-ada-002",
  languageModel = "gpt-4"
) {
  const openai = getOpenAIClient();
  const supabase = getSupabaseClient();

  const { data: tables, error: tablesError } = await supabase.rpc("listTables");
  if (tablesError) {
    throw new Error(`Error fetching tables: ${tablesError.message}`);
  }

  const schemaPromises = tables.map((table) =>
    supabase.rpc("getTableSchema", { tableName: table.name })
  );
  const schemas = await Promise.all(schemaPromises);

  const schemaDescriptions = schemas
    .map((schema, i) => {
      const columns = schema.data.columns
        .map((column) => `${column.name} (${column.type})`)
        .join(", ");
      return `Table: ${tables[i].name}, Columns: ${columns}`;
    })
    .join("\n");

  const prompt = `Given the following database schema:\n${schemaDescriptions}\n\nAnd the user query: "${query}"\n\nWhich table is most relevant to answer this query?`;

  const completionResponseForTable = await openai.chat.completions.create({
    model: languageModel,
    messages: [
      {
        role: "system",
        content: prompt,
      },
    ],
  });
  const contextTable =
    completionResponseForTable.choices[0].message.content.trim();

  const embeddingResponse = await openai.embeddings.create({
    model: embeddingModel,
    input: query,
  });
  const queryEmbedding = embeddingResponse.data[0].embedding;

  const { data: documents, error } = await supabase.rpc("match_documents", {
    query_embedding: queryEmbedding,
    match_threshold: 0.78,
    match_count: 10,
    table_name: contextTable,
    vector_column: vectorColumn,
  });

  if (error) {
    throw new Error(`Error matching documents: ${error.message}`);
  }

  const context = documents.map((doc) => doc[textColumn]).join("\n\n");

  const completionResponse = await openai.chat.completions.create({
    model: languageModel,
    messages: [
      {
        role: "system",
        content:
          "You are a helpful assistant. Use the following context to answer the question. If you don't know the answer, say that you don't know.\n\n" +
          `Context:\n${context}`,
      },
      {
        role: "user",
        content: `Question: ${query}`,
      },
    ],
  });

  return completionResponse.choices[0].message.content;
}

async function processAndEmbed(
  documents,
  tableName,
  textColumn,
  vectorColumn,
  embeddingModel
) {
  const openai = getOpenAIClient();
  const supabase = getSupabaseClient();
  const parsedChunkSize = Number.parseInt(
    process.env.RAG_CHUNK_SIZE ?? "1000",
    10
  );
  const parsedChunkOverlap = Number.parseInt(
    process.env.RAG_CHUNK_OVERLAP ?? "200",
    10
  );
  const chunkSize = Number.isFinite(parsedChunkSize) ? parsedChunkSize : 1000;
  const chunkOverlap = Number.isFinite(parsedChunkOverlap)
    ? parsedChunkOverlap
    : 200;
  const chunks = [];

  for (const doc of documents) {
    const textChunks = chunkText(doc.pageContent || "", chunkSize, chunkOverlap);
    for (const textChunk of textChunks) {
      chunks.push({
        pageContent: textChunk,
        metadata: doc.metadata || {},
      });
    }
  }

  for (const chunk of chunks) {
    const embeddingResponse = await openai.embeddings.create({
      model: embeddingModel,
      input: chunk.pageContent,
    });
    const embedding = embeddingResponse.data[0].embedding;

    const { error } = await supabase.from(tableName).insert({
      [textColumn]: chunk.pageContent,
      [vectorColumn]: embedding,
    });

    if (error) {
      throw new Error(`Error inserting chunk: ${error.message}`);
    }
  }

  return `Successfully indexed ${chunks.length} chunks into ${tableName}.`;
}

async function indexDirectoryTool(
  directoryPath,
  tableName,
  textColumn,
  vectorColumn,
  embeddingModel = "text-embedding-ada-002"
) {
  const loader = new DirectoryLoader(directoryPath);
  const docs = await loader.load();
  return processAndEmbed(
    docs,
    tableName,
    textColumn,
    vectorColumn,
    embeddingModel
  );
}

async function indexUrlTool(
  url,
  tableName,
  textColumn,
  vectorColumn,
  embeddingModel = "text-embedding-ada-002"
) {
  const loader = new CheerioWebBaseLoader(url);
  const docs = await loader.load();
  return processAndEmbed(
    docs,
    tableName,
    textColumn,
    vectorColumn,
    embeddingModel
  );
}

export const rag = {
  name: "rag",
  description:
    "Performs Retrieval-Augmented Generation (RAG) directly against your Supabase data, automatically selecting the most relevant table.",
  parameters: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description: "The query to answer.",
      },
      textColumn: {
        type: "string",
        description: "The column containing the text content.",
      },
      vectorColumn: {
        type: "string",
        description: "The column containing the vector embeddings.",
      },
      embeddingModel: {
        type: "string",
        description:
          "The embedding model to use. Defaults to text-embedding-ada-002.",
        default: "text-embedding-ada-002",
      },
      languageModel: {
        type: "string",
        description: "The language model to use. Defaults to gpt-4.",
        default: "gpt-4",
      },
    },
    required: ["query", "textColumn", "vectorColumn"],
  },
  execute: async ({
    query,
    textColumn,
    vectorColumn,
    embeddingModel,
    languageModel,
  }) => {
    return ragTool(query, textColumn, vectorColumn, embeddingModel, languageModel);
  },
};

export const indexDirectory = {
  name: "indexDirectory",
  description:
    "Scans a directory, chunks the documents, generates embeddings, and stores everything in the specified table.",
  parameters: {
    type: "object",
    properties: {
      directoryPath: {
        type: "string",
        description: "The path to the directory to index.",
      },
      tableName: {
        type: "string",
        description: "The name of the table to store the indexed data.",
      },
      textColumn: {
        type: "string",
        description: "The column to store the text content.",
      },
      vectorColumn: {
        type: "string",
        description: "The column to store the vector embeddings.",
      },
      embeddingModel: {
        type: "string",
        description:
          "The embedding model to use. Defaults to text-embedding-ada-002.",
        default: "text-embedding-ada-002",
      },
    },
    required: ["directoryPath", "tableName", "textColumn", "vectorColumn"],
  },
  execute: async ({
    directoryPath,
    tableName,
    textColumn,
    vectorColumn,
    embeddingModel,
  }) => {
    return indexDirectoryTool(
      directoryPath,
      tableName,
      textColumn,
      vectorColumn,
      embeddingModel
    );
  },
};

export const indexUrl = {
  name: "indexUrl",
  description:
    "Fetches content from a URL, chunks it, generates embeddings, and stores it.",
  parameters: {
    type: "object",
    properties: {
      url: {
        type: "string",
        description: "The URL to index.",
      },
      tableName: {
        type: "string",
        description: "The name of the table to store the indexed data.",
      },
      textColumn: {
        type: "string",
        description: "The column to store the text content.",
      },
      vectorColumn: {
        type: "string",
        description: "The column to store the vector embeddings.",
      },
      embeddingModel: {
        type: "string",
        description:
          "The embedding model to use. Defaults to text-embedding-ada-002.",
        default: "text-embedding-ada-002",
      },
    },
    required: ["url", "tableName", "textColumn", "vectorColumn"],
  },
  execute: async ({
    url,
    tableName,
    textColumn,
    vectorColumn,
    embeddingModel,
  }) => {
    return indexUrlTool(
      url,
      tableName,
      textColumn,
      vectorColumn,
      embeddingModel
    );
  },
};
