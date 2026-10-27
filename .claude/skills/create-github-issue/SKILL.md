---
name: create-github-issue
description: >
  Create a well-structured GitHub issue in the project's format (Summary, Context,
  Acceptance criteria). Use this skill whenever the user wants to create a GitHub
  issue, file a bug, request a feature, track a task, or says things like "open an
  issue", "create a ticket", "I need an issue for...", or "let's track this". Also
  trigger when the user describes a problem or feature that should be tracked, and
  suggest creating an issue.
---

# Create GitHub issue

Create issues for the `marianacosta16/manual-rag-evals` repository in the same style as
the existing ones (look at a couple with `gh issue view 5` or `gh issue view 7` first).

## Workflow

### 1. Gather context

- **From the user:** what to build, fix or change, and why it matters.
- **From the codebase:** read `CLAUDE.md` and `README.md` (roadmap, settings), and scan
  the files the issue touches (`src/ingest`, `src/embed`, ...) so the issue names real
  files, functions and constants instead of vague areas.
- **From GitHub:** check for duplicates (step 2) and for issues this one depends on.

### 2. Check for duplicates

```bash
gh issue list --repo marianacosta16/manual-rag-evals --state all --search "<keywords>"
```

If the GitHub MCP tools are available, `mcp__github__search_issues` with
`owner: marianacosta16` and `repo: manual-rag-evals` does the same. If potential
duplicates exist, show them (number, title, state) and let the user decide. Do not
block, just inform.

### 3. Draft the issue

```markdown
## Summary
<One clear sentence: what to build or change.>

## Context
<Why it matters and what it enables. The current state, the desired state and the gap,
with specifics from the code: files, functions, constants, commands.>

<Design decisions already made, as a short list.>

Out of scope: <what this issue deliberately does not do.>

## Acceptance criteria
- [ ] <Specific, binary pass/fail condition>
- [ ] <Another condition>
```

Guidelines:
- **Summary** is a single sentence understandable without the rest.
- **Context** carries the weight. Name the files and constants involved and mention
  anything that constrains the work (see the rules in `CLAUDE.md`: tests offline,
  ingestion model-free, `.env.example` in sync).
- **Acceptance criteria:** 3 to 7 checkboxes, each concrete and verifiable. Prefer
  "`npm run embed` logs the total time taken" over "works well". Include the tests
  that must exist and the README section that must be updated.
- Do not refer to other issues by number unless the dependency is real and stable.
- Never invent measurements. If a number is unknown, say so.

### 4. Confirm with the user

Show the drafted title and body and ask for confirmation before creating anything.

### 5. Create the issue

```bash
gh issue create \
  --repo marianacosta16/manual-rag-evals \
  --title "<title>" \
  --label "enhancement" \
  --body "<body>"
```

The GitHub MCP tool `mcp__github__issue_write` (`method: create`) is an equivalent
alternative. After creating it, share the issue URL.

## Labels

Default `enhancement`. Use `bug` when something that worked now fails, or behaviour
contradicts the acceptance criteria of an earlier issue.

## Title conventions

- Start with a verb: "Add...", "Fix...", "Update...", "Remove...".
- Under 70 characters and specific: "Add a persisted vector store with top-k cosine
  search", not "Search".
