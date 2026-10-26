import { describe, it, expect } from "vitest";
import { chunkPage } from "./chunk.ts";

describe("chunkPage", () => {
    it("returns no chunks for an empty page", () => {
        expect(chunkPage("", "a.pdf", 1)).toEqual([]);
    });

    it("returns one chunk when the page is smaller than the chunk size", () => {
        const result = chunkPage("one two three", "a.pdf", 1, 5, 2);

        expect(result).toEqual([
            {
                id: "a.pdf-p1-c0",
                text: "one two three",
                source: "a.pdf",
                page: 1,
            },
        ]);
    });

    it("returns exactly one chunk when the page has exactly the chunk size", () => {
        const words = Array.from({ length: 5 }, (_, i) => `word${i + 1}`);
        const text = words.join(" ");

        const result = chunkPage(text, "a.pdf", 1, 5, 2);

        expect(result).toHaveLength(1);
        expect(result[0]).toEqual({
            id: "a.pdf-p1-c0",
            text,
            source: "a.pdf",
            page: 1,
        });
    });

    it("splits a page into overlapping chunks", () => {
        const text = "one two three four five six seven eight nine ten";

        const result = chunkPage(text, "a.pdf", 1, 5, 2);

        expect(result).toEqual([
            {
                id: "a.pdf-p1-c0",
                text: "one two three four five",
                source: "a.pdf",
                page: 1,
            },
            {
                id: "a.pdf-p1-c1",
                text: "four five six seven eight",
                source: "a.pdf",
                page: 1,
            },
            {
                id: "a.pdf-p1-c2",
                text: "seven eight nine ten",
                source: "a.pdf",
                page: 1,
            },
        ]);
    });

    it("carries the source and page into every chunk id", () => {
        const result = chunkPage("one two three four five six", "manual.pdf", 12, 3, 1);

        expect(result.map((c) => c.id)).toEqual([
            "manual.pdf-p12-c0",
            "manual.pdf-p12-c1",
            "manual.pdf-p12-c2",
        ]);
        expect(result.every((c) => c.source === "manual.pdf" && c.page === 12)).toBe(true);
    });

    it("does not create an extra chunk after the page is fully covered", () => {
        const text = "one two three four five six seven eight nine ten";

        const result = chunkPage(text, "a.pdf", 1, 5, 2);

        expect(result).toHaveLength(3);
        expect(result.at(-1)?.text).toBe("seven eight nine ten");
    });

    it("throws when overlap is equal to chunk size", () => {
        expect(() => chunkPage("one two three", "a.pdf", 1, 5, 5))
            .toThrow("Overlap (5) must be smaller than chunk size (5)");
    });

    it("throws when overlap is greater than chunk size", () => {
        expect(() => chunkPage("one two three", "a.pdf", 1, 5, 6))
            .toThrow("Overlap (6) must be smaller than chunk size (5)");
    });

    it("handles multiple spaces and newlines between words", () => {
        const text = "one   two\nthree\tfour";

        const result = chunkPage(text, "a.pdf", 1, 10, 2);

        expect(result[0]?.text).toBe("one two three four");
    });
});
