---
name: create-pull-request
description: >
  Create a GitHub pull request for the current branch, with a Conventional Commits title
  and a structured description that closes the related issue. Use this skill whenever the
  user wants to create a PR, open a pull request, submit changes for review, or says
  things like "create a PR", "open a pull request", "PR for issue #X" or "let's get this
  merged". Also trigger when the user has finished implementing an issue and needs to
  open the PR, even if they do not say "pull request".
---

# Create pull request

Open pull requests for the `marianacosta16/manual-rag-evals` repository, in the format
used by the project's earlier PRs.

## Workflow

### 1. Gather context

- **Branch:** `git branch --show-current`. If it is `main`, stop and help create a
  branch first (`<type>/<issue-number>-<short-slug>`, e.g. `feat/5-vector-store`).
- **Related issue:** take it from the branch name (`feat/5-...` implies #5) and confirm
  it with the user instead of assuming. If there is none, ask; offer to create one with
  the `create-github-issue` skill. Without an issue, use a plain title and no `Closes`.
  Read it: `gh issue view <number>`.
- **Changes:** `git log main..HEAD --oneline` and `git diff main...HEAD --stat`. Read
  the changed files, not just the diff, so the description is accurate.
- **State:** `git status` must be clean. If there are uncommitted changes, tell the user.

### 2. Run the checks

Run `npm test`, `npm run lint` and `npm run typecheck`. If any fails, report it and do
not open the PR. Never write "tests pass" in the description unless they just did.

### 3. Draft the PR

**Title:** `<type>: <short description>`, imperative, lowercase, under 70 characters.
Types: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `ci`.

Examples: `feat: add local embeddings and the embed command`,
`ci: run lint, typecheck and tests on every push and pull request`.

**Body:**

```markdown
## Summary
<2-3 sentences: what this adds and why.>

## What changed
- <Key change, naming the file or command>
- <Tests added and what they cover>
- <README updates>

## Out of scope
- <What was left out on purpose, and which issue covers it>

## How to verify
- `npm test`, `npm run lint` and `npm run typecheck` pass (CI runs them on this PR)
- <Concrete manual step and what to expect, with real numbers only if measured>

Closes #<issue-number>
```

Guidelines:
- Focus on decisions and behaviour, not a list of every file.
- Mention anything a reviewer should know: new dependencies, changed commands, new
  environment variables (and the matching `.env.example` entry).
- Use real numbers only from a run that actually happened. Otherwise leave them out.
- `Closes #N` goes on its own line. If the issue still has work left after this PR,
  use `Refs #N` instead.

### 4. Confirm with the user

Show the title and body and ask for confirmation. Pushing is also a step that needs
their go-ahead.

### 5. Push and create

```bash
git push -u origin <branch>
gh pr create --base main --title "<title>" --body "<body>"
```

Share the PR URL. Tell the user CI will run on the PR and that merging should wait for
it to be green.

### 6. Optional review

Offer a read-only second look before merging: the `review-pull-request` skill reviews
the opened PR against its issue and CI, and the `code-reviewer` agent reviews the code
on the branch.

## Branch naming

`<type>/<issue-number>-<short-slug>`, with types `feat`, `fix`, `chore`, `docs`,
`refactor`, `test`, `ci`. Examples: `feat/5-vector-store`, `fix/12-page-numbering`.
