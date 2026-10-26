# manual-rag-evals

[![CI](https://github.com/marianacosta16/manual-rag-evals/actions/workflows/ci.yml/badge.svg)](https://github.com/marianacosta16/manual-rag-evals/actions/workflows/ci.yml)

Question answering over technical PDF manuals, with page-level citations and an
evaluation suite that measures whether retrieval and answers are actually correct.

> **Status: work in progress.** PDF ingestion and chunking are in place and tested.
> Local embeddings and similarity search were prototyped in an earlier repository and
> are being brought here next, followed by answer generation and the evaluation suite.
> See the [roadmap](#roadmap).

## What it does

Ask a question in natural language, get an answer grounded in the manuals, with the source file and page number for every claim.

## How it works

1. **Ingest**: extract the text of each PDF page by page and split it into overlapping chunks. Each chunk keeps its source file and page number, so answers can cite where the information came from. Chunks never span two pages, which keeps the page number in a citation exact, at the cost of splitting an idea that continues on the next page.
2. **Embed** *(planned)*: turn every chunk into a vector with a local model, so no API key is needed and no document leaves the machine.
3. **Retrieve** *(planned)*: embed the question with the **same** model and return the most similar chunks. Vectors from different models are not comparable, so one shared `embed()` serves both chunks and questions.
4. **Generate** *(planned)*: send the question and the retrieved chunks to an LLM and return an answer that cites its sources.
5. **Evaluate** *(planned)*: run a fixed set of questions and report retrieval quality, answer quality, cost and latency.

## Current settings

These are starting points, not tuned values. They are meant to be measured and
adjusted once the evaluation is in place.

| Setting | Value | Why |
| ------- | ----- | --- |
| Chunk size | 500 words | Small chunks lose surrounding context; large chunks mix several topics into one embedding and make search less precise |
| Chunk overlap | 50 words | Keeps a sentence that crosses a chunk boundary whole in at least one chunk |
| Minimum page size | 20 words | Covers, separators and near-blank pages cannot answer anything and only add noise |

They are named constants: `CHUNK_SIZE_WORDS` and `CHUNK_OVERLAP_WORDS` in
`src/ingest/chunk.ts`, `MIN_PAGE_WORDS` in `src/ingest/ingest.ts`.

Settings for embeddings and retrieval (model, dimensions, batch size, top-k) will be
added here as those steps are ported.

## Evaluation

*Planned.* A fixed set of questions, each labelled with the page that contains the
answer, including some whose answer is **not** in the documents, to check the system
admits it instead of inventing one.

| Metric | What it measures | Result |
| ------ | ---------------- | ------ |
| Recall@k | The correct page is among the top-k retrieved chunks | TODO |
| Answer correctness | The answer contains the expected key facts | TODO |
| Cost per question | Tokens and cost per answer | TODO |
| Latency | Time per answer | TODO |

## Where it fails and why

*To be filled in with real failure cases found during evaluation.*

## Getting started

Prerequisites: Node.js 20 or later.

```bash
npm install
cp .env.example .env     # only needed once answer generation exists
```

Put the PDFs you want to query in `docs/` (see [docs/README.md](docs/README.md)), then:

```bash
npm run ingest           # extract text and split it into chunks
```

It logs, for each PDF, the pages found, the pages skipped for being too short, and the
chunks produced. For example, with three manuals:

```
Ingesting 3 PDF(s) with 500-word chunks (50 overlap):
  BOSCH_microwave_oven_24p.pdf: 24 pages (3 skipped) -> 33 chunks
  BOSCH_washing_machine_52p.pdf: 52 pages (3 skipped) -> 49 chunks
  LG_easy_guide_notebook_223p.pdf: 223 pages (5 skipped) -> 219 chunks
Total: 301 chunks, ~61210 words
```

A PDF with no extractable text (for example a scanned one) is skipped with a warning.

To check the code:

```bash
npm test
npm run lint
npm run typecheck
```

Search and question-answering commands will be documented here as each part is ported
(see the roadmap).

## Continuous integration

Every push to `main` and every pull request runs, on GitHub Actions:

1. `npm run lint`: static checks with oxlint
2. `npm run typecheck`: TypeScript type-check
3. `npm test`: unit tests with Vitest

CI does not run the evaluation (it needs an API key and costs money) and tests never download the embedding model, so CI runs offline.

## Project structure

```
src/
  ingest/      PDF reading and chunking
  embed/       local embedding model
  search/      vector store and similarity search
  generate/    prompt and LLM call
evals/         evaluation questions and runner
docs/          source PDFs (git-ignored)
```

## Roadmap

- [x] Project setup and CI
- [x] Ingestion and chunking, with tests
- [ ] Local embeddings
- [ ] Persisted vector store and top-k search
- [ ] Retrieval evaluation (recall@k)
- [ ] Answer generation with citations
- [ ] Answer evaluation, cost and latency tracking
- [ ] Parameter tuning based on evaluation results

Each item has its own issue in this repository.
