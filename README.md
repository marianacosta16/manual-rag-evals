# manual-rag-evals

Question answering over technical PDF manuals, with page-level citations and an
evaluation suite that measures whether retrieval and answers are actually correct.

> **Status: work in progress.** Ingestion, chunking, local embeddings and a first
> similarity search were prototyped in an earlier repository and are being brought
> here, cleaned up and tested. Answer generation and the evaluation suite are next.
> See the [roadmap](#roadmap).

## What it does

Ask a question in natural language, get an answer grounded in the manuals, with the source file and page number for every claim.

## How it works

1. **Ingest**: extract the text of each PDF page by page and split it into overlapping chunks. Each chunk keeps its source file and page number, so answers can cite where the information came from. Chunks never span two pages, which keeps the page number in a citation exact, at the cost of splitting an idea that continues on the next page.
2. **Embed**: turn every chunk into a vector with a local model, so no API key is needed and no document leaves the machine.
3. **Retrieve**: embed the question with the **same** model and return the most similar chunks. Vectors from different models are not comparable, so one shared `embed()` serves both chunks and questions.
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
| Embedding model | `Xenova/all-MiniLM-L6-v2` | Small and fast, runs locally in Node. Mainly English, which matches the manuals used |
| Embedding dimensions | 384 | Fixed by the model |
| Embedding batch size | 32 chunks | Embedding every chunk in one call would hold all intermediate tensors in memory |
| Top-k | 3 | Placeholder until the evaluation can compare values |

Vectors are normalised, so cosine similarity is a plain dot product. Model weights
(~87 MB) are downloaded from Hugging Face on first run and cached locally.

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

*Will be filled in when the code is ported (see the roadmap).* The intended workflow:

```bash
npm install
# put PDFs in docs/ (see docs/README.md)
npm run ingest
npm test
```

## Roadmap

- [ ] Project setup and CI
- [ ] Ingestion and chunking, with tests
- [ ] Local embeddings
- [ ] Persisted vector store and top-k search
- [ ] Retrieval evaluation (recall@k)
- [ ] Answer generation with citations
- [ ] Answer evaluation, cost and latency tracking
- [ ] Parameter tuning based on evaluation results

Each item has its own issue in this repository.
