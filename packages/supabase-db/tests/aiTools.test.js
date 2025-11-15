// Set OPENAI_API_KEY for tests (required since v3.2.0 made it optional)
process.env.OPENAI_API_KEY = "test-api-key";

import { rag, indexDirectory, indexUrl } from "../src/tools/aiTools";
import { OpenAI, _getMockOpenAIInstance } from "openai";
import { getSupabaseClient } from "../src/supabaseClient";
import { CheerioWebBaseLoader } from "@langchain/community/document_loaders/web/cheerio";
import { chunkText } from "../src/utils/aiHelpers";
import { DirectoryLoader } from "../src/utils/directoryLoader";

jest.mock("openai", () => {
  const mockOpenAIInstance = {
    embeddings: {
      create: jest.fn(),
    },
    chat: {
      completions: {
        create: jest.fn(),
      },
    },
  };
  const OpenAI = jest.fn(() => mockOpenAIInstance);
  return {
    OpenAI,
    _getMockOpenAIInstance: () => mockOpenAIInstance, // Helper to access the instance
  };
});
jest.mock("../src/supabaseClient");
jest.mock("@langchain/community/document_loaders/web/cheerio");
jest.mock("../src/utils/aiHelpers", () => ({
  chunkText: jest.fn(() => ["mock chunk"]),
}));
jest.mock("../src/utils/directoryLoader", () => ({
  DirectoryLoader: jest.fn().mockImplementation(() => ({
    load: jest
      .fn()
      .mockResolvedValue([{ pageContent: "mock directory content" }]),
  })),
}));

describe("aiTools", () => {
  let mockSupabase;
  let currentMockOpenAIInstance; // Declare here

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock Supabase client
    mockSupabase = {
      rpc: jest
        .fn()
        .mockResolvedValue({
          data: [{ content: "test content" }],
          error: null,
        }),
      from: jest.fn().mockReturnThis(), // Allows chaining .from().insert()
      insert: jest.fn().mockResolvedValue({ error: null }),
    };
    getSupabaseClient.mockReturnValue(mockSupabase);

    // Configure the shared mockOpenAIInstance
    currentMockOpenAIInstance = _getMockOpenAIInstance();
    currentMockOpenAIInstance.embeddings.create.mockResolvedValue({
      data: [{ embedding: [0.1, 0.2] }],
    });
    currentMockOpenAIInstance.chat.completions.create.mockResolvedValue({
      choices: [{ message: { content: "test response" } }],
    });

    // Mock document loaders and chunker
    CheerioWebBaseLoader.mockImplementation(() => ({
      load: jest.fn().mockResolvedValue([{ pageContent: "mock url content" }]),
    }));
    chunkText.mockReturnValue(["mock chunk"]);
  });

  describe("rag", () => {
    it("should perform RAG with automatic context selection", async () => {
      // Mock rpc calls for table listing and schema fetching
      mockSupabase.rpc
        .mockResolvedValueOnce({ data: [{ name: "test_table" }], error: null }) // listTables
        .mockResolvedValueOnce({
          data: { columns: [{ name: "content", type: "text" }] },
          error: null,
        }) // getTableSchema
        .mockResolvedValueOnce({
          data: [{ content: "test content" }],
          error: null,
        }); // match_documents

      const result = await rag.execute({
        query: "test query",
        textColumn: "content",
        vectorColumn: "embedding",
      });

      expect(mockSupabase.rpc).toHaveBeenCalledWith("listTables");
      expect(mockSupabase.rpc).toHaveBeenCalledWith("getTableSchema", {
        tableName: "test_table",
      });
      expect(currentMockOpenAIInstance.embeddings.create).toHaveBeenCalledTimes(
        1,
      ); // For query embedding
      expect(
        currentMockOpenAIInstance.chat.completions.create,
      ).toHaveBeenCalledTimes(2); // For table selection and final response
      expect(result).toBe("test response");
    });

    it("should throw an error if OPENAI_API_KEY is not set", async () => {
      const originalApiKey = process.env.OPENAI_API_KEY;
      delete process.env.OPENAI_API_KEY;

      await expect(
        rag.execute({
          query: "test query",
          textColumn: "content",
          vectorColumn: "embedding",
        }),
      ).rejects.toThrow("OPENAI_API_KEY environment variable is not set.");

      process.env.OPENAI_API_KEY = originalApiKey; // Restore API key
    });
  });

  describe("indexDirectory", () => {
    it("should index a directory", async () => {
      const result = await indexDirectory.execute({
        directoryPath: "/test/dir",
        tableName: "test_table",
        textColumn: "content",
        vectorColumn: "embedding",
      });

      expect(DirectoryLoader).toHaveBeenCalledWith("/test/dir");
      expect(DirectoryLoader.mock.results[0].value.load).toHaveBeenCalled();
      expect(chunkText).toHaveBeenCalledWith(
        "mock directory content",
        1000,
        200,
      );
      expect(currentMockOpenAIInstance.embeddings.create).toHaveBeenCalledTimes(
        1,
      );
      expect(mockSupabase.from).toHaveBeenCalledWith("test_table");
      expect(mockSupabase.insert).toHaveBeenCalledWith({
        content: "mock chunk",
        embedding: [0.1, 0.2],
      });
      expect(result).toBe("Successfully indexed 1 chunks into test_table.");
    });

    it("should throw an error if OPENAI_API_KEY is not set", async () => {
      const originalApiKey = process.env.OPENAI_API_KEY;
      delete process.env.OPENAI_API_KEY;

      await expect(
        indexDirectory.execute({
          directoryPath: "/test/dir",
          tableName: "test_table",
          textColumn: "content",
          vectorColumn: "embedding",
        }),
      ).rejects.toThrow("OPENAI_API_KEY environment variable is not set.");

      process.env.OPENAI_API_KEY = originalApiKey; // Restore API key
    });
  });

  describe("indexUrl", () => {
    it("should index a URL", async () => {
      const result = await indexUrl.execute({
        url: "https://example.com",
        tableName: "test_table",
        textColumn: "content",
        vectorColumn: "embedding",
      });

      expect(CheerioWebBaseLoader).toHaveBeenCalledWith("https://example.com");
      expect(
        CheerioWebBaseLoader.mock.results[0].value.load,
      ).toHaveBeenCalled();
      expect(chunkText).toHaveBeenCalledWith("mock url content", 1000, 200);
      expect(currentMockOpenAIInstance.embeddings.create).toHaveBeenCalledTimes(
        1,
      );
      expect(mockSupabase.from).toHaveBeenCalledWith("test_table");
      expect(mockSupabase.insert).toHaveBeenCalledWith({
        content: "mock chunk",
        embedding: [0.1, 0.2],
      });
      expect(result).toBe("Successfully indexed 1 chunks into test_table.");
    });

    it("should throw an error if OPENAI_API_KEY is not set", async () => {
      const originalApiKey = process.env.OPENAI_API_KEY;
      delete process.env.OPENAI_API_KEY;

      await expect(
        indexUrl.execute({
          url: "https://example.com",
          tableName: "test_table",
          textColumn: "content",
          vectorColumn: "embedding",
        }),
      ).rejects.toThrow("OPENAI_API_KEY environment variable is not set.");

      process.env.OPENAI_API_KEY = originalApiKey; // Restore API key
    });
  });
});
