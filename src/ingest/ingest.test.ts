import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { readFile, readdir } from "node:fs/promises";
import { extractText, getDocumentProxy } from "unpdf";

import { ingestFile, ingestAll, MIN_PAGE_WORDS } from "./ingest.ts";
import { CHUNK_SIZE_WORDS } from "./chunk.ts";

vi.mock("node:fs/promises", () => ({
  readFile: vi.fn(),
  readdir: vi.fn(),
}));

vi.mock("unpdf", () => ({
  extractText: vi.fn(),
  getDocumentProxy: vi.fn(),
}));

function makeText(numberOfWords: number): string {
  return Array.from(
    { length: numberOfWords },
    (_, index) => `word${index}`,
  ).join(" ");
}

function mockPdfPages(pages: string[]): void {
  vi.mocked(readFile).mockResolvedValue(Buffer.from("fake-pdf"));

  vi.mocked(getDocumentProxy).mockResolvedValue(
    {} as Awaited<ReturnType<typeof getDocumentProxy>>,
  );

  vi.mocked(extractText).mockResolvedValue({
    totalPages: pages.length,
    text: pages,
  } as Awaited<ReturnType<typeof extractText>>);
}

function mockDirectoryFiles(files: string[]): void {
  vi.mocked(readdir).mockResolvedValue(files as never);
}

describe("ingestFile", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should create chunks with the expected ID, text, source and page", async () => {
    const pageText = makeText(MIN_PAGE_WORDS);
    mockPdfPages([pageText]);

    const chunks = await ingestFile("manual.pdf");

    expect(chunks).toHaveLength(1);
    expect(chunks).toStrictEqual([
      expect.objectContaining({
        id: "manual.pdf-p1-c0",
        text: pageText,
        source: "manual.pdf",
        page: 1,
      }),
    ]);

    expect(console.warn).not.toHaveBeenCalled();
});

it("should skip short pages and preserve the original page numbers", async () => {
  mockPdfPages([
    makeText(MIN_PAGE_WORDS),
    makeText(MIN_PAGE_WORDS - 1),
    makeText(MIN_PAGE_WORDS),
  ]);

  const chunks = await ingestFile("manual.pdf");

  const pageNumbers = [
    ...new Set(chunks.map((chunk) => chunk.page)),
  ];

  expect(pageNumbers).toEqual([1, 3]);
  expect(chunks.map((chunk) => chunk.id)).toEqual([
    "manual.pdf-p1-c0",
    "manual.pdf-p3-c0",
  ]);
});

  it("should keep a page with exactly MIN_PAGE_WORDS words", async () => {
    mockPdfPages([makeText(MIN_PAGE_WORDS)]);

    const chunks = await ingestFile("manual.pdf");

    expect(chunks).toHaveLength(1);
    expect(chunks).toStrictEqual([
      expect.objectContaining({
        id: "manual.pdf-p1-c0",
      }),
    ]);

    expect(console.warn).not.toHaveBeenCalled();
  });

  it("should create multiple chunks with distinct IDs for a long page", async () => {
    mockPdfPages([makeText(CHUNK_SIZE_WORDS + 1)]);

    const chunks = await ingestFile("manual.pdf");

    expect(chunks.length).toBeGreaterThan(1);

    expect(
      chunks.every((chunk) =>
        chunk.id.startsWith("manual.pdf-p1-c"),
      ),
    ).toBe(true);

    expect(new Set(chunks.map((chunk) => chunk.id)).size).toBe(
      chunks.length,
    );
  });

  it("should return an empty array and warn when the PDF has no text", async () => {
    mockPdfPages(["", "   "]);

    const chunks = await ingestFile("scanned.pdf");

    expect(chunks).toEqual([]);
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining("no extractable text"),
    );
  });
});

describe("ingestAll", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});

    mockPdfPages([makeText(MIN_PAGE_WORDS)]);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should ingest all PDFs regardless of extension case and ignore other files", async () => {
    mockDirectoryFiles([
      "manual.pdf",
      "guide.PDF",
      "notes.txt",
    ]);

    const chunks = await ingestAll("test-docs");

    expect(chunks.map((chunk) => chunk.id)).toEqual([
      "manual.pdf-p1-c0",
      "guide.PDF-p1-c0",
    ]);

    expect(readFile).toHaveBeenCalledTimes(2);
    expect(readFile).toHaveBeenCalledWith("test-docs/manual.pdf");
    expect(readFile).toHaveBeenCalledWith("test-docs/guide.PDF");
    expect(readFile).not.toHaveBeenCalledWith("test-docs/notes.txt");
  });

  it("should return an empty array and warn when the directory contains no PDFs", async () => {
    mockDirectoryFiles([
      "notes.txt",
      "README.md",
    ]);

    const chunks = await ingestAll("empty-docs");

    expect(chunks).toEqual([]);

    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining("No PDFs found in empty-docs/"),
    );

    expect(readFile).not.toHaveBeenCalled();
  });
});