import { readdir, readFile } from "node:fs/promises";
import { extractText, getDocumentProxy } from "unpdf";
import { chunkPage, CHUNK_SIZE_WORDS, CHUNK_OVERLAP_WORDS, type Chunk } from "./chunk.ts";

const DOCS_DIR = "docs";

// Covers, separators and blank pages carry no answers, only noise in the index.
export const MIN_PAGE_WORDS = 20;

const countWords = (text: string) => text.trim().split(/\s+/).filter(Boolean).length;

// `dir` defaults to docs/ and exists so tests can point at a temporary folder.
export async function ingestFile(file: string, dir = DOCS_DIR): Promise<Chunk[]> {
  const pdf = await getDocumentProxy(new Uint8Array(await readFile(`${dir}/${file}`)));
  const { totalPages, text } = await extractText(pdf, { mergePages: false });
  const pages = text as string[];

  const chunks: Chunk[] = [];
  let skipped = 0;

  pages.forEach((pageText, index) => {
    if (countWords(pageText) < MIN_PAGE_WORDS) {
      skipped++;
      return;
    }
    // Pages are 1-based for citations, matching what a reader sees in a PDF viewer.
    chunks.push(...chunkPage(pageText, file, index + 1));
  });

  if (chunks.length === 0) {
    console.warn(`  ! ${file}: no extractable text (scanned PDF?) — skipping`);
  } else {
    console.log(`  ${file}: ${totalPages} pages (${skipped} skipped) -> ${chunks.length} chunks`);
  }

  return chunks;
}

export async function ingestAll(dir = DOCS_DIR): Promise<Chunk[]> {
  const files = (await readdir(dir)).filter((f) => f.toLowerCase().endsWith(".pdf"));

  if (files.length === 0) {
    console.warn(`No PDFs found in ${dir}/. See ${DOCS_DIR}/README.md.`);
    return [];
  }

  console.log(`Ingesting ${files.length} PDF(s) with ${CHUNK_SIZE_WORDS}-word chunks (${CHUNK_OVERLAP_WORDS} overlap):`);

  const chunks: Chunk[] = [];
  for (const file of files) {
    chunks.push(...(await ingestFile(file, dir)));
  }

  const words = chunks.reduce((total, chunk) => total + countWords(chunk.text), 0);
  console.log(`Total: ${chunks.length} chunks, ~${words} words`);

  return chunks;
}

// Only run when this file is the entry point (npm run ingest), not when imported.
if (import.meta.main) {
  await ingestAll();
}
