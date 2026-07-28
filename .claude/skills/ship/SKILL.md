---
name: ship
description: Take a GitHub issue number from analysis to merged PR. Plans the issue, implements it in an isolated worktree, runs review-and-fix rounds, commits, pushes, opens the PR, requests review from max-token-aesir, answers and resolves the review comments, then merges once approved. Use when the user says "ship #N", "/ship N", "do issue N end to end", or asks to take an issue all the way to merge.
---

# ship — issue to merged PR

One argument: the issue number (`/ship 31`, `ship #31`). Repo is `marco-machado/nexus-reborn`, base branch `main`,
reviewer `max-token-aesir`.

## Rules for the whole run

- **Resumable.** Step 1 works out where the run already got to and jumps there. Never redo a completed step.
- **One approval gate: the merge.** Everything up to and including answering review comments happens without asking.
  Stop and ask before `gh pr merge`.
- **Never work in the main checkout.** All code work happens in the worktree created in step 2.
- **Report facts.** Lint and build results come from command output, never from "the edit looked right".

## 1. Work out where we are

```
gh issue view <N> --json number,title,body,state,labels,comments
git -C <repo> worktree list
gh pr list --state open --json number,headRefName,url --search "issue-<N>"
```

Pick the entry point:

| State | Go to |
| --- | --- |
| No worktree, no PR | step 2 |
| Worktree exists, nothing pushed | step 3 (skip what is already done) |
| Branch pushed, no PR | step 5 |
| PR open, no review yet | step 6 |
| PR open with unresolved threads | step 7 |
| PR approved | step 8 |

If the issue is already closed, say so and stop.

## 2. Worktree off the latest main

Slug: issue title lowercased, non-alphanumerics to `-`, first five words. Branch `issue-<N>-<slug>`,
worktree `.claude/worktrees/issue-<N>-<slug>` (that path is in `.git/info/exclude`, so it stays out of the diff).

```
git -C <repo> fetch origin main
git -C <repo> worktree add -b issue-<N>-<slug> <repo>/.claude/worktrees/issue-<N>-<slug> origin/main
cd <worktree> && npm ci
```

`npm ci` is needed: a fresh worktree has no `node_modules`, and lint and build are the only checks this project has.

## 3. Plan, implement, review, fix

One call. Use `scriptPath`, not `name`: the named-workflow registry does not pick up `.claude/workflows/`.

```
Workflow({
  scriptPath: '<repo>/.claude/workflows/ship-issue.js',
  args: {
    issue: <N>,
    title: '<issue title>',
    body: '<issue body>',
    comments: '<issue comments, or omit>',
    dir: '<absolute worktree path>',
    maxRounds: 3,
  },
})
```

It plans the issue, splits it into workstreams, implements them, runs `npm run lint` and `npm run build`, then loops
review → refute → fix up to three rounds, stopping early when a round produces no confirmed findings. It leaves the
changes staged and uncommitted.

The workflow runs in the background. When the notification lands, read the returned object:

- `finalVerify` must show lint and build passing. If either fails, fix it yourself before committing.
- `cappedWithUnreviewedFixes` non-empty means the three-round cap was hit with fixes that were never re-reviewed.
  Say so in the PR body.
- `reviewRounds` and `findingsFixed` go into the report you give the user.

Then run the built-in `code-review` workflow as an extra round before committing, and fix what it confirms:

```
Workflow({ name: 'code-review' })
```

It reviews the working diff, so run it with the worktree changes staged and uncommitted. If it is not in the
available workflow list, skip it and say so rather than claiming a review that did not happen.

## 4. Commit

Follow the repo's commit convention from `CLAUDE.md`: imperative subject, then a body saying what changed by file,
why, and what was verified. End with `Closes #<N>`.

```
git -C <worktree> add -A
git -C <worktree> commit -F <scratchpad>/commit-msg.txt
```

Check `git -C <worktree> status --porcelain` first: nothing machine-local (caches, absolute paths, `node_modules`)
goes in. If something like that is already staged, unstage it and tell the user.

## 5. Push and open the PR

```
git -C <worktree> push -u origin issue-<N>-<slug>
gh pr create --repo marco-machado/nexus-reborn --base main --head issue-<N>-<slug> \
  --title '<same as commit subject>' --body-file <scratchpad>/pr-body.txt
gh pr edit <PR> --add-reviewer max-token-aesir
```

PR body: what the issue asked for, what changed by file, what was verified (lint, build, the click-through), any
capped-round caveat from step 3, and `Closes #<N>`.

## 6. Wait for the review

Poll in the background so the wait costs nothing and you get woken when it lands:

```
Bash(run_in_background: true, command: '
  until [ "$(gh pr view <PR> --repo marco-machado/nexus-reborn --json reviewDecision -q .reviewDecision)" != "" ] \
     || [ "$(gh api graphql -f query="query{repository(owner:\"marco-machado\",name:\"nexus-reborn\"){pullRequest(number:<PR>){reviewThreads(first:100){nodes{isResolved}}}}}" \
          -q "[.data.repository.pullRequest.reviewThreads.nodes[]|select(.isResolved==false)]|length")" != "0" ]; do
    sleep 60
  done
  echo "review activity on PR <PR>"
')
```

When it exits you are re-invoked: go to step 7. If this skill is running under `/loop`, use `ScheduleWakeup` at
600-900s as a fallback heartbeat in case the poll dies; do not schedule shorter wakeups just to check.

## 7. Address the review

Fetch the threads:

```
gh api graphql -f query='
query($owner:String!,$repo:String!,$pr:Int!){
  repository(owner:$owner,name:$repo){
    pullRequest(number:$pr){
      reviewDecision
      reviewThreads(first:100){nodes{
        id isResolved isOutdated
        comments(first:20){nodes{databaseId author{login} path line body}}
      }}
    }
  }
}' -F owner=marco-machado -F repo=nexus-reborn -F pr=<PR>
```

For each thread with `isResolved: false`:

1. Decide: fix it, or push back with a reason. Pushing back is allowed when the comment is wrong or asks for
   something outside the issue. Say why in one or two sentences, do not just comply.
2. If fixing, make the change in the worktree.
3. Reply on the thread:
   ```
   gh api repos/marco-machado/nexus-reborn/pulls/<PR>/comments/<databaseId>/replies -f body='<reply>'
   ```
   Reply to the **first** comment's `databaseId` in the thread.
4. Resolve it:
   ```
   gh api graphql -f query='mutation($id:ID!){resolveReviewThread(input:{threadId:$id}){thread{isResolved}}}' -F id='<thread node id>'
   ```
   Resolve a thread you pushed back on too, once the reply states the reason. If the reviewer reopens it, handle it
   in the next round.

Then `npm run lint && npm run build` in the worktree, commit the round as its own commit (`Address review: <what>`),
push, and go back to step 6. Cap at three review rounds: past that, stop and hand the remaining threads to the user.

## 8. Merge (ask first)

Only when `reviewDecision` is `APPROVED` and no unresolved threads remain. Show the user:

- issue number and PR link
- what changed, by file
- review rounds and findings fixed
- lint and build status, from actual output

Then ask whether to merge. On yes:

```
gh pr merge <PR> --repo marco-machado/nexus-reborn --squash --delete-branch
git -C <repo> worktree remove <worktree>
git -C <repo> fetch origin main
```

`--delete-branch` removes the remote branch; `worktree remove` cleans the local copy. If the merge is blocked
(`mergeable: CONFLICTING`), rebase the worktree on `origin/main`, re-run lint and build, push, and ask again.

## Last line to the user

What now works and where it landed, one line: the merged PR URL and the issue it closed.
