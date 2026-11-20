# Session 02: CI + deploy

> Reconstructed by Claude from its own session context, not a raw terminal export. User messages are
> verbatim. Claude's replies are verbatim where they were prose and shortened where they were tool output.
> There are no timestamps, so none are invented.

## User

_(The user selected lines 40 to 47 of `ROADMAP.md`: step 2, "CI + deploy".)_

Let's continue working on MTG lifecounter project
read ROADMAP.md and start working with step 2 CI and deployment

Before all, rename the branch mastor to main to align GitHub naming convention

Plan mode first: list the files you will create or change and flag anything
that deviates from the roadmap. Also tell me:
- which manual GitHub steps remain for me (e.g. Pages source) and how to verify
  them,
- how the workflow is structured (triggers, jobs, permissions, Node version,
  npm ci, Pages artifact/deploy actions) and why,
- the Vite base value you'll use.
Wait for my OK.

Then implement on a branch (ci/github-actions), run lint/typecheck/test/build
locally, tick the checkbox in ROADMAP.md, and show me a diff summary plus the
proposed commit message. Do not commit until I confirm. After I confirm, push
the branch and open a PR; if gh is available, watch the run and report the
result. I'll merge and we'll verify the deploy on main.

## Claude

_Ran `git branch -m master main`, read `ROADMAP.md`, `package.json`, `vite.config.ts` and `index.html`, and
checked the remote (`git ls-remote --heads origin` showed only `master`; `gh` is not installed)._

I renamed the branch locally with `git branch -m master main`. Nothing else has changed yet. Here is the plan.

**Remote state.** The remote still only has `master`, and `gh` isn't installed. That changes two things:
- **Remote `main`:** a PR needs `main` on GitHub as its base, so `main` has to be pushed first
  (`git push -u origin main`). I won't push without your OK. After that you'd set `main` as the default
  branch in Settings → Branches and delete remote `master`.
- **PR and run status:** I'll use the GitHub MCP tools (`create_pull_request`, `pull_request_read`) instead
  of `gh`. I can read check status through them, but I can't stream the run logs. If you'd rather use `gh`,
  `brew install gh` followed by `gh auth login` would fix it.

**Files**

| File | Change |
|---|---|
| `.github/workflows/ci.yml` | **Create** |
| `vite.config.ts` | **Edit**: add `base: '/mtg-commander-lifecounter/'` |
| `ROADMAP.md` | **Edit**: tick step 2 |

I'll leave `docs/ai-log/01-scaffolding.txt` untracked. You export the logs by hand, so it won't go in this
commit.

**Deviations from the roadmap**
1. Remote `main` has to exist first. The roadmap doesn't cover this.
2. No `gh`. I'll use the MCP tools as described above.
3. `.nvmrc` says Node 24. The workflow will use `node-version-file: .nvmrc` so CI and local can't drift.
   That's an addition, not a conflict.
4. The `build` script already runs `tsc --noEmit`. So the build job repeats the typecheck. I'll keep a
   separate `typecheck` step anyway, because it fails faster and reports more clearly.

**Workflow structure**
- **Triggers:** `push` to `main`, `pull_request` into `main`, and `workflow_dispatch`. PRs run checks only.
  They never deploy. Deploys happen only on push to `main`, which is what your merge will trigger.
- **Permissions:** the top level is `contents: read` only. The deploy job alone adds `pages: write` and
  `id-token: write`. This is least privilege, so a PR run can't write to Pages.
- **Concurrency:** group `pages`, with `cancel-in-progress: false` so an in-flight deploy isn't killed.
  Check runs are cheap to cancel.
- **Job `check`:** `actions/checkout`, `actions/setup-node` (with `node-version-file: .nvmrc` and
  `cache: npm`), `npm ci`, then lint, typecheck, test and build. `npm ci` installs exactly what the
  lockfile says and fails if `package.json` and the lockfile disagree. On push to `main` only, it also
  runs `actions/upload-pages-artifact` with `path: dist`. It builds once, and the deployed artifact is the
  one that passed the checks.
- **Job `deploy`:** runs only on push to `main` and has `needs: check`. It uses `actions/deploy-pages` with
  `environment: github-pages`, which exposes the live URL in the run summary.
- **Action versions:** I'll pin to major tags and confirm the current versions when I write the file.

**Vite base:** `base: '/mtg-commander-lifecounter/'`. Project Pages serves from
`https://rwmarmol.github.io/mtg-commander-lifecounter/`, so assets need that prefix. I'll hardcode it. An
env-driven value would be extra machinery that the spec doesn't call for.

**Manual GitHub steps for you**
1. **Pages source:** Settings → Pages → Build and deployment → Source = **GitHub Actions**. To verify, that
   page should show "GitHub Actions" as the source, and after the first deploy "Your site is live at …".
   You can also run `curl -sI https://rwmarmol.github.io/mtg-commander-lifecounter/`, which should return
   200 once deployed.
2. **Default branch:** set it to `main` (Settings → Branches), then delete remote `master`. To verify, run
   `git ls-remote --heads origin`. It should list only `main`.
3. **Pages environment rules:** Settings → Environments → `github-pages` normally allows deploys from
   `main` by default. Check that `main` isn't blocked.
4. **Actions enabled:** the Actions tab should show workflows as allowed.

**Verification after you merge:** the push-to-`main` run should go green on both jobs. The deploy summary
should show the URL, and the page should load without 404s on its assets. That is the check that `base`
is right.

Do I have your OK to proceed? That means pushing `main` to origin first, then implementing on
`ci/github-actions` and running the local checks. I'll stop before committing and show you the diff and the
commit message.

## User

Forget about remane branch, then I will apply it manually
THe rest is OK

## Claude

_Ran `git branch -m main master`, created `ci/github-actions`, and checked the latest release of each
action through the GitHub API (checkout v7.0.1, setup-node v7.1.0, upload-pages-artifact v5.0.0,
deploy-pages v5.0.1). Wrote `.github/workflows/ci.yml`, added `base` to `vite.config.ts`, ticked step 2 in
`ROADMAP.md`, then ran lint, typecheck, test and build._

`.github/workflows/ci.yml` as first written:
```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read

concurrency:
  group: pages-${{ github.ref }}
  cancel-in-progress: ${{ github.event_name == 'pull_request' }}

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
      - uses: actions/setup-node@v7
        with:
          node-version-file: .nvmrc
          cache: npm
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck
      - run: npm test
      - run: npm run build
      - uses: actions/upload-pages-artifact@v5
        if: github.event_name == 'push' && github.ref == 'refs/heads/main'
        with:
          path: dist

  deploy:
    needs: check
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    permissions:
      pages: write
      id-token: write
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v5
```

`vite.config.ts`: added `base: '/mtg-commander-lifecounter/',` above `plugins`.

Lint, typecheck, test (1 of 1 passing) and build all pass locally. The built `index.html` now loads its
assets from `/mtg-commander-lifecounter/assets/…`, so the `base` value is working.

**Branch state.** I'd already renamed the branch locally before you changed your mind, so I **reverted it
to `master`**. I created `ci/github-actions` from it. I haven't touched the remote.

**Diff summary**

| File | Change |
|---|---|
| `.github/workflows/ci.yml` | New file, 46 lines. |
| `vite.config.ts` | `+ base: '/mtg-commander-lifecounter/'` |
| `ROADMAP.md` | Step 2 ticked `[x]`. |

`docs/ai-log/01-scaffolding.txt` stays untracked and isn't part of this commit.

**Differences from my plan**
- **Action versions:** I checked the latest releases, so the workflow uses `checkout@v7`,
  `setup-node@v7`, `upload-pages-artifact@v5` and `deploy-pages@v5`, not the v3/v4 I'd mentioned.
- **Concurrency:** the group is `pages-${{ github.ref }}`. It cancels superseded PR runs only, so a deploy
  on `main` is never cancelled.
- **Everything else matches the plan.**

**Proposed commit message**
```
ci: add github actions for checks and pages deploy

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>
```

**Before the PR step.** The PR base is `main`, which doesn't exist on the remote yet. You said you'd rename
the branch yourself, so do that first:
1. Rename the branch locally and push it as `main`.
2. Set `main` as the default branch on GitHub.

Do you confirm the commit? Once you've pushed `main`, I'll push `ci/github-actions` and open the PR. I'll
then check its status through the GitHub MCP tools, since `gh` isn't installed.

## User

Commit changes and oper PR to "master"

## Claude

_Committed only `.github/workflows/ci.yml`, `vite.config.ts` and `ROADMAP.md` as
`f4354df ci: add github actions for checks and pages deploy`, pushed `ci/github-actions`, and opened PR #1
into `master` with `create_pull_request`._

The commit is pushed and the PR is open: https://github.com/rwmarmol/mtg-commander-lifecounter/pull/1. It
goes from `ci/github-actions` into `master`.

The commit is `f4354df ci: add github actions for checks and pages deploy`. It contains only the workflow,
the `vite.config.ts` change and the ROADMAP tick. The untracked ai-log file wasn't included.

**CI won't run on this PR.** The workflow only triggers on pushes and PRs for `main`, and this PR targets
`master`. So there is no run to watch. I put a note about this in the PR description. I'd suggest this
order:
1. Merge the PR.
2. Rename the branch to `main` and push it. That push triggers the first real run, including the deploy.
3. Set Pages source to GitHub Actions before that push, or the deploy job will fail.

If you'd rather see checks run on the PR itself, I can add `master` to the triggers temporarily. Say so if
you want that.

## User

_(The user selected line 5 of `ci.yml`: `branches`.)_

Also add master to branches array

## Claude

_Edited both `branches` lists to `[main, master]`, committed `c999661 ci: also run checks on master`, and
pushed it. Then polled the PR's check runs through `pull_request_read`: first none, then the `check` job
`in_progress` on three consecutive looks._

I added `master` to the `push` and `pull_request` branch lists, committed it as
`c999661 ci: also run checks on master`, and pushed it to PR #1. The `check` job started on the PR, but it
was still `in_progress` on my last three looks, so I don't have a result yet. The run is here:
https://github.com/rwmarmol/mtg-commander-lifecounter/actions/runs/44642014942

The `deploy` job is still gated on `refs/heads/main`, so pushes to `master` run the checks but never
deploy.

Once you've renamed the branch to `main`, you can remove `master` from both lists. Tell me if you want me
to re-check the run after you've looked, or to do that cleanup.

## User

export this session to docs/ai-log in MD format
Also parse to MD the latest session added (01-scaffolding)

## Claude

_Read `00-bootstrap.md` as a format reference and `01-scaffolding.txt`, then wrote
`docs/ai-log/01-scaffolding.md` and this file, `docs/ai-log/02-ci-deploy.md`. Nothing was committed._
