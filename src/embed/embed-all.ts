import { ingestAll } from "../ingest/ingest.ts";
import { embedChunks, EMBEDDING_MODEL, type EmbeddedChunk } from "./embed.ts";

// Ingestion stays model-free (it only produces chunks); this step adds the vectors.
export async function embedAll(): Promise<EmbeddedChunk[]> {
  const chunks = await ingestAll();

  console.log(`Embedding with ${EMBEDDING_MODEL}:`);
  const startedAt = Date.now();
  const embedded = await embedChunks(chunks);
  const seconds = ((Date.now() - startedAt) / 1000).toFixed(1);
  console.log(`  ${embedded.length} vectors of ${embedded[0]?.vector.length ?? 0} dimensions in ${seconds}s`);

  return embedded;
}

// Only run when this file is the entry point (npm run embed), not when imported.
if (import.meta.main) {
  await embedAll();
}
