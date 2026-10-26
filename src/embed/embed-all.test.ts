import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Chunk } from "../ingest/chunk.ts";
import { ingestAll } from "../ingest/ingest.ts";
import { embedChunks } from "./embed.ts";
import { embedAll } from "./embed-all.ts";

vi.mock("../ingest/ingest.ts", () => ({ ingestAll: vi.fn() }));
vi.mock("./embed.ts", () => ({
  EMBEDDING_MODEL: "test-model",
  embedChunks: vi.fn(),
}));

const chunk: Chunk = { id: "manual.pdf-p1-c0", text: "hello", source: "manual.pdf", page: 1 };

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.mocked(ingestAll).mockResolvedValue([chunk]);
  vi.mocked(embedChunks).mockResolvedValue([{ ...chunk, vector: [0.1, 0.2, 0.3] }]);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("embedAll", () => {
  it("embeds the chunks produced by ingestion and returns them with their vectors", async () => {
    const embedded = await embedAll();

    expect(embedChunks).toHaveBeenCalledWith([chunk]);
    expect(embedded).toEqual([{ ...chunk, vector: [0.1, 0.2, 0.3] }]);
  });

  it("logs the model, the number of vectors, their dimension and the time taken", async () => {
    await embedAll();

    expect(console.log).toHaveBeenCalledWith("Embedding with test-model:");
    expect(console.log).toHaveBeenCalledWith(expect.stringMatching(/1 vectors of 3 dimensions in \d+\.\d+s/));
  });
});
