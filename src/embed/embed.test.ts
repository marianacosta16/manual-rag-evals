import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Chunk } from "../ingest/chunk.ts";

// The model is replaced by a fake, so these tests need no download and no network.
// They check our logic (batching, ordering, loading once), not the model's quality:
// that is covered by embed.model.test.ts, which is opt-in.
const { fakeModel, pipeline, env } = vi.hoisted(() => {
  // Encodes each text "t<number>" as the vector [<number>], so tests can check that
  // every vector ends up attached to the right chunk.
  const fakeModel = vi.fn(async (texts: string[]) => ({
    tolist: () => texts.map((text) => [Number(text.slice(1))]),
  }));
  return {
    fakeModel,
    pipeline: vi.fn(async () => fakeModel),
    env: { cacheDir: "" },
  };
});

vi.mock("@huggingface/transformers", () => ({ env, pipeline }));

// A fresh module per test, because the loaded model is cached at module level.
async function loadEmbed() {
  vi.resetModules();
  return import("./embed.ts");
}

const makeChunks = (count: number): Chunk[] =>
  Array.from({ length: count }, (_, i) => ({
    id: `manual.pdf-p1-c${i}`,
    text: `t${i}`,
    source: "manual.pdf",
    page: 1,
  }));

beforeEach(() => {
  vi.clearAllMocks();
  // embedChunks writes a progress line; keep the test output clean.
  vi.spyOn(process.stdout, "write").mockImplementation(() => true);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("embed", () => {
  it("returns no vectors and does not load the model for no input", async () => {
    const { embed } = await loadEmbed();

    expect(await embed([])).toEqual([]);
    expect(pipeline).not.toHaveBeenCalled();
  });

  it("returns one vector per text, in the same order", async () => {
    const { embed } = await loadEmbed();

    expect(await embed(["t3", "t1", "t2"])).toEqual([[3], [1], [2]]);
  });

  it("asks the model for mean-pooled, normalised vectors", async () => {
    const { embed } = await loadEmbed();

    await embed(["t1"]);

    expect(fakeModel).toHaveBeenCalledWith(["t1"], { pooling: "mean", normalize: true });
  });

  it("loads the configured model once and reuses it", async () => {
    const { embed, EMBEDDING_MODEL } = await loadEmbed();

    await embed(["t1"]);
    await embed(["t2"]);

    expect(pipeline).toHaveBeenCalledTimes(1);
    expect(pipeline).toHaveBeenCalledWith("feature-extraction", EMBEDDING_MODEL);
  });

  it("caches the model inside the project, not in node_modules", async () => {
    await loadEmbed();

    expect(env.cacheDir).toBe(".cache/models");
  });
});

describe("embedChunks", () => {
  it("returns no chunks and does not load the model for no input", async () => {
    const { embedChunks } = await loadEmbed();

    expect(await embedChunks([])).toEqual([]);
    expect(pipeline).not.toHaveBeenCalled();
  });

  it("keeps every chunk field and attaches its own vector", async () => {
    const { embedChunks } = await loadEmbed();
    const chunks = makeChunks(3);

    const embedded = await embedChunks(chunks);

    expect(embedded).toEqual(chunks.map((chunk, i) => ({ ...chunk, vector: [i] })));
  });

  it("embeds in batches of 32 and keeps the order across batches", async () => {
    const { embedChunks } = await loadEmbed();

    const embedded = await embedChunks(makeChunks(70));

    expect(fakeModel.mock.calls.map(([texts]) => texts.length)).toEqual([32, 32, 6]);
    expect(embedded.map((chunk) => chunk.vector)).toEqual(Array.from({ length: 70 }, (_, i) => [i]));
  });

  it("fails clearly when the model returns fewer vectors than chunks", async () => {
    const { embedChunks } = await loadEmbed();
    fakeModel.mockResolvedValueOnce({ tolist: () => [[0]] });

    await expect(embedChunks(makeChunks(2))).rejects.toThrow("No embedding returned for chunk manual.pdf-p1-c1");
  });
});
