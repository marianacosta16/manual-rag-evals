---
name: review-pull-request
description: >
  Review a GitHub pull request: read the diff, check it against the linked issue and the
  project's rules, and produce a structured review with findings and a verdict. Use this
  skill whenever the user wants to review a PR, check a PR's changes, or says things like
  "review PR #X", "check this PR", "what do you think of this PR", "review the open PRs"
  or "can you review my changes". Also trigger right after a PR has been created and the
  user wants a sanity check before merging.
---

# Review pull request

Review pull requests of the `marianacosta16/manual-rag-evals` repository. The goal is a
clear, actionable summary so the user can merge, ask for changes or discuss with
confidence. The review is read-only unless the user asks to submit it.

## Workflow

### 1. Identify the PR

If the user gave a number or URL, use it. Otherwise list the open PRs and ask:

```bash
gh pr list --repo marianacosta16/manual-rag-evals --state open --json number,title,headRefName,createdAt
```

### 2. Fetch the details and the CI status

```bash
gh pr view <number> --json title,body,state,baseRefName,headRefName,additions,deletions,changedFiles,reviewDecision
gh pr checks <number>
```

A failing or pending check is the first thing to report. Do not call a PR ready while
CI is red.

### 3. Read the diff, and the code around it

```bash
gh pr diff <number>
gh pr diff <number> --name-only
```

For a diff over ~500 lines, review file by file. Read the changed files in full, and
their tests, not only the diff, since a diff hides context. `CLAUDE.md` holds the
project's rules: read it before judging.

### 4. Check the linked issue

Take the issue number from `Closes #N` (or `Refs #N`) in the PR body or from the branch
name (`feat/5-...`). The comparison between what was asked and what was built is the
backbone of the review.

```bash
gh issue view <number> --json title,body
```

Go through each acceptance criterion and say whether the PR covers it.

### 5. Produce the review

```markdown
## PR review: #<pr-number>, <pr-title>

### Overview
<1-2 sentences: what the PR does and whether it addresses the issue.>

### CI
<Result of each check, or "pending" / "failing" with the failing step.>

### Issue alignment
- **Issue:** #<n>, <title>
- **Status:** Fully addressed / Partially addressed / Misaligned
- **Missing:** <acceptance criteria not covered, or "None">

### Findings

#### Blockers
<Things that must change before merging. "None" if there are none.>

#### Correctness
<Bugs and missing edge cases: chunking and page numbers, `undefined` from indexed
access, error handling.>

#### Tests
<Do they assert on values? Do they cover edges? Do they run offline, without the
embedding model or an API key, so CI stays green?>

#### Project rules
<Ingestion model-free; one shared `embed()` and `EMBEDDING_MODEL`; tunable values are
named constants and the README settings table matches; every environment variable is
in `.env.example`.>

#### README and honesty
<Docs match the code. No metric, timing or count that was not measured.>

#### Security
<Committed secrets, `.env` content, keys in logs or error messages.>

#### Suggestions
<Non-blocking improvements: naming, simplification, reuse.>

### Verdict
**Ready to merge** / **Changes requested** / **Comment only**: <one-sentence reason>
```

Guidelines:
- Be specific: cite file and line, not vague impressions.
- Separate **blockers** from **suggestions**. Treating everything as a blocker stalls
  work; never blocking lets bugs through.
- If the PR is good, say so briefly. Do not invent problems to look thorough.
- Judge the "How to verify" section of the PR body: are the steps reproducible, and
  are any numbers in it plausible and measured?

### 6. Submit the review (only if asked)

By default the review stays in the conversation. If the user wants it on GitHub, confirm
the verdict first, since a submitted review is visible on the PR:

```bash
gh pr review <number> --comment --body "<review>"
gh pr review <number> --request-changes --body "<review>"
gh pr review <number> --approve --body "<review>"
```

GitHub does not let you approve or request changes on your own pull request. When the
PR was opened by the user's own account, use `--comment`.
