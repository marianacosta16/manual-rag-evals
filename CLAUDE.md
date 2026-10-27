# CLAUDE.md

Guidance for Claude Code when working in this repository.

## What this is

Question answering over technical PDF manuals, with page-level citations and an
evaluation suite that measures whether retrieval and answers are actually correct.
TypeScript on Node, run with `tsx`, no frontend: the interface is a CLI.
See `README.md` for the rationale, current settings and roadmap. The work is tracked in
GitHub issues, one per roadmap item.

## Commands

```bash
npm install
npm run ingest      # extract text from docs/*.pdf and split it into chunks (no model)
npm run embed       # ingest, then embed every chunk with the local model (downloads it once)
npm test            # Vitest, runs offline
npm run lint        # oxlint
npm run typecheck   # tsc --noEmit
```

Single test file: `npx vitest run src/ingest/chunk.test.ts`.
Tests that use the real embedding model are opt-in:
`RUN_MODEL_TESTS=1 npx vitest run src/embed/embed.model.test.ts`.

Before saying work is done, `npm test`, `npm run lint` and `npm run typecheck` must all pass.

## Architecture

```
src/ingest/    chunk.ts (chunkPage, pure), ingest.ts (reads PDFs with unpdf)
src/embed/     embed.ts (embed, embedChunks), embed-all.ts (the `embed` command)
src/search/    vector store and top-k search (not built yet)
src/generate/  prompt and LLM call (not built yet)
evals/         evaluation questions and runner (not built yet)
docs/          source PDFs (git-ignored)
```

A chunk is `{ id, text, source, page }`, with id `<source>-p<page>-c<index>` and a
1-based page. Chunks never span pages, so every citation has an exact page number.

## Rules that matter here

- **Ingestion never loads the model.** `ingest.ts` only produces chunks; embedding is a
  separate step. This keeps ingestion tests model-free.
- **The same embedding model must embed chunks and questions.** There is one shared
  `embed()` and one `EMBEDDING_MODEL` constant. Never duplicate either.
- **Tests run offline and need no secrets.** CI downloads no model and has no API key.
  Mock `unpdf`, `node:fs/promises` and `@huggingface/transformers` in unit tests; keep
  real-model tests opt-in. Tests assert on values, not only on "does not throw".
- **Tunable values are named constants** with a comment on the trade-off
  (`CHUNK_SIZE_WORDS`, `CHUNK_OVERLAP_WORDS`, `MIN_PAGE_WORDS`, `EMBEDDING_MODEL`, ...),
  and the README settings table must match the code.
- **Environment variables:** read from `process.env`, never hard-coded. Every variable
  used must be listed (without a value) in `.env.example`. Never commit `.env`.
- **README results are real.** Never write a metric, timing or count that was not
  measured in a real run. Use `TODO` until it is.
- **`tsconfig` is strict with `noUncheckedIndexedAccess`:** array access can be
  `undefined`, so handle it instead of using `!` or casts.
- Imports of local files include the `.ts` extension.

## Workflow

- **Branches:** `<type>/<issue-number>-<short-slug>`, e.g. `feat/5-vector-store`.
  Types: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `ci`.
- **Commits:** Conventional Commits in English, imperative, ending with the issue:
  `feat: add page-aware chunking with tests, ref #3`. The last commit of an issue uses
  `closes #N` instead of `ref #N`.
- **Pull requests:** title `<type>: <short description>`, body with Summary, What
  changed, Out of scope, How to verify, and `Closes #N` on its own line.
- **Issues:** Summary, Context, Acceptance criteria (checkboxes).
- Do not commit, push, merge or change the git identity unless the user asks.
- Do not delete or overwrite `docs/*.pdf` or the local `.cache/`.

## Skills and agents

- `/create-github-issue`: draft and create an issue in the project's format.
- `/create-pull-request`: draft and open a pull request for the current branch.
- `/review-pull-request`: review a PR against its issue and the project's rules; only
  posts the review on GitHub if asked.
- `code-reviewer` agent: read-only review of the current diff; suggests, never edits.
