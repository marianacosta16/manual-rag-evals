import { describe, expect, it } from "vitest";
import { embed, EMBEDDING_DIMENSIONS } from "./embed.ts";

// These tests load the real embedding model (~87 MB, downloaded on first run), so they
// are skipped by default and never run in CI. Run them by hand with RUN_MODEL_TESTS=1:
//   bash:        RUN_MODEL_TESTS=1 npx vitest run src/embed/embed.model.test.ts
//   PowerShell:  $env:RUN_MODEL_TESTS=1; npx vitest run src/embed/embed.model.test.ts
//
// They assert relationships between vectors, never exact numbers: a different model
// would change every number while keeping the behaviour we actually depend on.
const dotProduct = (a: number[], b: number[]) => a.reduce((sum, value, i) => sum + value * (b[i] ?? 0), 0);

async function vectorOf(text: string): Promise<number[]> {
  const [vector] = await embed([text]);
  if (!vector) throw new Error(`No vector returned for "${text}"`);
  return vector;
}

describe.skipIf(!process.env.RUN_MODEL_TESTS)("embed with the real model", () => {
  it("returns vectors of the expected dimension", async () => {
    const vectors = await embed(["first text", "second text"]);

    expect(vectors).toHaveLength(2);
    expect(vectors.every((vector) => vector.length === EMBEDDING_DIMENSIONS)).toBe(true);
  });

  it("returns normalised vectors, so cosine similarity is a dot product", async () => {
    const vector = await vectorOf("Preheat the oven before baking");

    expect(Math.sqrt(dotProduct(vector, vector))).toBeCloseTo(1, 5);
  });

  it("places texts with similar meaning closer than unrelated ones", async () => {
    const oven = await vectorOf("Preheat the oven to 200 degrees before baking");
    const sameMeaning = await vectorOf("Heat the oven up before you start cooking");
    const unrelated = await vectorOf("Install the latest graphics card driver");

    // Wording barely overlaps, so this only passes if meaning is what drives the vectors.
    expect(dotProduct(oven, sameMeaning)).toBeGreaterThan(dotProduct(oven, unrelated));
  });

  it("gives the same vector for the same text", async () => {
    expect(await vectorOf("Clean the filter every month")).toEqual(await vectorOf("Clean the filter every month"));
  });
});
