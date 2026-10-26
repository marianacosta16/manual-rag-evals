import { env, pipeline, type FeatureExtractionPipeline } from "@huggingface/transformers";
import type { Chunk } from "../ingest/chunk.ts";

// Keep the downloaded model inside the project (git-ignored) instead of node_modules,
// so removing node_modules doesn't force a re-download.
env.cacheDir = ".cache/models";

// Small, fast, English-focused sentence embedding model. The same model must embed both
// the chunks and the question: vectors from different models are not comparable.
export const EMBEDDING_MODEL = "Xenova/all-MiniLM-L6-v2";
export const EMBEDDING_DIMENSIONS = 384;

// The model truncates input at ~256 word pieces, so the tail of a 500-word chunk is not
// represented in its vector — one more reason to measure chunk size in #9.
let extractor: Promise<FeatureExtractionPipeline> | null = null;

function getExtractor(): Promise<FeatureExtractionPipeline> {
  // Loaded once and reused: loading the model is far slower than running it.
  extractor ??= pipeline("feature-extraction", EMBEDDING_MODEL);
  return extractor;
}

// Turns texts into normalised vectors. Normalised means cosine similarity is just a dot
// product, which keeps the search in #5 simple.
export async function embed(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];

  const model = await getExtractor();
  const output = await model(texts, { pooling: "mean", normalize: true });

  return output.tolist() as number[][];
}

export interface EmbeddedChunk extends Chunk {
  vector: number[];
}

// Embedding runs in batches: one call with hundreds of chunks would hold every
// intermediate tensor in memory at once.
const BATCH_SIZE = 32;

export async function embedChunks(chunks: Chunk[]): Promise<EmbeddedChunk[]> {
  const embedded: EmbeddedChunk[] = [];

  for (let start = 0; start < chunks.length; start += BATCH_SIZE) {
    const batch = chunks.slice(start, start + BATCH_SIZE);
    const vectors = await embed(batch.map((chunk) => chunk.text));
    batch.forEach((chunk, index) => {
      const vector = vectors[index];
      if (!vector) throw new Error(`No embedding returned for chunk ${chunk.id}`);
      embedded.push({ ...chunk, vector });
    });
    process.stdout.write(`\r  embedding ${embedded.length}/${chunks.length} chunks...`);
  }
  process.stdout.write("\r\x1b[K");

  return embedded;
}
