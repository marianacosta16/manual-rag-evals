// Chunk size trade-off: small chunks lose surrounding context, large chunks mix several
// topics into one embedding and make search less precise. 500 words is a starting point
// to be tuned with the evaluation (issue #9).
export const CHUNK_SIZE_WORDS = 500;

// Overlap keeps a sentence that crosses a chunk boundary whole in at least one chunk.
export const CHUNK_OVERLAP_WORDS = 50;

export interface Chunk {
  id: string;
  text: string;
  source: string;
  page: number;
}

// Splits one page into overlapping chunks. Chunks never cross pages, so every chunk
// can be cited with an exact page number.
export function chunkPage(
  text: string,
  source: string,
  page: number,
  size = CHUNK_SIZE_WORDS,
  overlap = CHUNK_OVERLAP_WORDS,
): Chunk[] {
  if (overlap >= size) {
    throw new Error(`Overlap (${overlap}) must be smaller than chunk size (${size})`);
  }

  const words = text.split(/\s+/).filter(Boolean);
  const step = size - overlap;
  const chunks: Chunk[] = [];

  for (let start = 0; start < words.length; start += step) {
    const end = Math.min(start + size, words.length);
    chunks.push({
      id: `${source}-p${page}-c${chunks.length}`,
      text: words.slice(start, end).join(" "),
      source,
      page,
    });
    // Stop once the page is fully covered, so the tail isn't repeated in a tiny extra chunk.
    if (end === words.length) break;
  }

  return chunks;
}
