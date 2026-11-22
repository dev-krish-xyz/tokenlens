# TokenLens × Composal Sparks

## Prepared state

- PR: https://github.com/dev-krish-xyz/tokenlens/pull/1 — **open, intentionally failing, do not merge**.
- Branch: `demo/composal-stream-usage`; base: `dev` at `fcc74c0` (the actual GitHub default, not `main`).
- Initial verified failing CI: https://github.com/dev-krish-xyz/tokenlens/actions/runs/45033249660
- Reset checkpoint: Git tag `demo/composal-stream-usage-start` (the prepared, unfixed state).
- Local checkout: `/Users/krish/Developer/tokenlens-composal-demo`. The original checkout and its uncommitted work were left intact.
- GitHub push, PR creation, Actions and public read access verified. Composal/Slack access is **not configured or verified** here; no usable Composal connector or CLI was available.

## Bug and repository audit

TokenLens uses a Hono gateway to proxy OpenAI-compatible requests, Bun workspaces/Turborepo for tooling, Next.js/tRPC for the dashboard, and BullMQ workers for ingestion and alerts. Shared services own pricing, budget counters and repositories. Postgres stores configuration, ClickHouse stores analytics, and DragonflyDB holds counters/queues. Tests use Bun with colocated files and existing module mocks.

`gateway/src/handlers/stream.ts` parses usage independently within each network read. A valid SSE usage line split between reads is discarded by the parser, although the response reaches the client. The ingestion job then reports **0 prompt / 0 completion tokens instead of 42 / 7**. The worker calculates recorded cost from these counts and reconciles reserved spend against that cost. This is a high-impact functional accounting bug for affected streams; no production incident or critical severity is claimed.

The added test splits one event at bytes 5, 12 and 43, covering the `data:` prefix, usage key and JSON body. It also checks status 200, exact streamed output and exactly one ingestion job. The unsplit control already passes. Provider fetch and queue writes use the existing mocks; no real API calls or databases are used. **No implementation fix has been made.**

Existing CI targets `main` only. `.github/workflows/composal-demo.yml` adds two checks scoped to this demo branch/PR against `dev`: **Stream usage regression** and **Typecheck and unit tests**. It uses Bun 1.3.14, frozen dependencies, read-only Actions permissions and no deployments. Existing CI, deployment settings and secrets are untouched. Push and PR events can produce duplicate runs; inspect the latest revision.

## Reproduce

From a clean checkout of the demo branch:

```sh
bun install --frozen-lockfile
cd gateway
bun test src/handlers/stream.test.ts
```

Initial result: **6 pass / 3 fail**, all named `usage event split at byte … retains token accounting`, expected `42/7`, received `0/0`. Test: `gateway/src/handlers/stream.test.ts`.

From the repository root:

```sh
bun run typecheck
bun run test
```

Verified locally: typechecks pass in all five packages; gateway **81 pass / 3 fail**, shared **105 pass**, worker **33 pass**, web **17 pass**. GitHub's initial run also passed installation/typechecking and failed exclusively on these three cases. Use `bun run test`: bare root `bun test` additionally discovers the live-service E2E script, which is outside this demo and was not run.

## Manual Composal and Slack setup

Follow [Composal's current setup documentation](https://composal.com/docs/persistent-agents); these are manual steps, not completed integrations.

1. Create active Sparks **Fixer** and **Reviewer** in one workspace. Select working models; allow them to contact each other.
2. **Agents → Integrations → GitHub**: connect the account; allow only `dev-krish-xyz/tokenlens`. Assign it to both Sparks. Request branch-limited writes for Fixer and read access for Reviewer through repository-access cards; inspect the approved grants. Default repository selection can grant writes on every branch.
3. For each Spark: **Setup → Slack → Set up**; connect the shared app and your account. Choose **Prepare → Create app in Slack**; install its generated manifest in your workspace. Put the bot OAuth token and signing secret only into Composal's protected form. **Connect bot → Open Event Subscriptions**; enable, verify the prefilled URL, save, then **Check connection**. Enable public-channel replies, save, and publish `#tokenlens-demo`. Repeat for the other Spark.
4. Paste the role instructions below. Save their actual agent handles. Use Slack's mention picker for their actual bots.

Before recording, make these task-specific checks:

- Each Spark can list TokenLens among its assigned repositories and read PR #1 plus Actions logs. Fixer's GitHub identity must support authenticated pushes to the demo branch and reading checks. Reviewer must independently fetch the same commit. If Composal cannot enforce a branch restriction, inspect the actual grant and keep the role's branch-only instruction explicit.
- Use the connected GitHub App/user identity for pushes, rather than an Actions `GITHUB_TOKEN`, so checks start automatically ([GitHub trigger rules](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/trigger-a-workflow)).
- Both coding environments have Bun **1.3.14** and Git. Use `bun install --frozen-lockfile` in their separate checkouts; do not copy local `.env` files or connect TokenLens databases, provider keys or deployment services.
- Send harmless pings before recording; verify replies from both distinct bots. Verify native peer messaging reaches Reviewer and authorized Slack posts work. Do not assume bot-authored Slack mentions trigger another bot: the instructions use native peer messaging to start the review and Slack for the visible handoff.
- Leave broad PR/CI autofix subscriptions and auto-merge workflows off. Wait for the recording trigger to start the actual fix. Do not run a fix rehearsal against this PR first.

## Fixer standing instructions

Paste into Fixer; substitute Reviewer's actual Composal handle for `@Reviewer` if different:

```text
You are Fixer for dev-krish-xyz/tokenlens PR #1:
https://github.com/dev-krish-xyz/tokenlens/pull/1
Wait for the user's Slack trigger. Work only on demo/composal-stream-usage.
Read CLAUDE.md and COMPOSAL_DEMO.md. Fetch the actual PR head and failed CI
logs; reproduce with Bun 1.3.14, bun install --frozen-lockfile, then from
gateway run bun test src/handlers/stream.test.ts. Investigate the cause and
implement the smallest correction. Preserve all existing regression
assertions, immediate streaming and existing error behavior. Do not hide
failures, change CI to pass, or alter dependencies, credentials, deployments,
data, main or dev. Never merge or enable auto-merge.
From the root run bun run typecheck and bun run test. Commit and push the fix
to this same branch, then inspect checks for that exact SHA. Report failures
honestly. Post a short handoff in the originating Slack thread with the PR,
full SHA, changed files, actual test results and CI links; mention Reviewer
using its real Slack identity. Also invoke Composal's native teammate
messaging to @Reviewer with that evidence, the Slack channel/thread identity
and a request to independently review and reply there. A Slack post alone
does not prove delivery. Verify receipts; do not duplicate an uncertain send.
If Reviewer finds a problem, correct it, rerun checks and hand off the new SHA.
Finish only after Reviewer reports a verdict; leave PR #1 open.
```

## Reviewer standing instructions

```text
You are Reviewer for dev-krish-xyz/tokenlens PR #1:
https://github.com/dev-krish-xyz/tokenlens/pull/1
Wait for Fixer's native peer handoff. Work independently in a separate
checkout with Bun 1.3.14. Read CLAUDE.md and COMPOSAL_DEMO.md, fetch the actual
PR head and verify it equals the handed-off SHA. Inspect the full PR diff and
Fixer's implementation, not just its summary. Ensure the original regression
assertions remain and the fix handles fragmented usage without delaying
streaming or changing existing behavior. Inspect the relevant worker usage
path. Install frozen dependencies and independently run the focused stream
test, bun run typecheck and bun run test. Inspect GitHub check results and
their associated commit; an older green run is insufficient. If the head
changes, review the new head before issuing a verdict.
Do not modify code, push, merge, deploy or enable auto-merge. Report PASS,
CHANGES REQUESTED or BLOCKED in the supplied Slack thread, with the reviewed
SHA, concrete findings, observed test counts and check links. Only say PASS
when your tests and current demo CI pass. If evidence/access is missing,
say BLOCKED. Send findings back to Fixer through native peer messaging too;
if changes are needed, request them and re-review the resulting SHA. Check
Slack delivery before claiming the verdict was posted. A Slack verdict is
the review artifact; do not fabricate a GitHub approval or agent identity.
```

## One Slack trigger

In `#tokenlens-demo`, select Fixer's real bot using Slack autocomplete and send:

```text
@Fixer Fix TokenLens PR https://github.com/dev-krish-xyz/tokenlens/pull/1.
Investigate the red stream-usage tests, make the minimal fix on
demo/composal-stream-usage, run tests and push to that same PR. Hand the exact
commit to Reviewer through native teammate messaging and show the handoff
here. Reviewer must independently verify the diff, tests and current CI,
then report its verdict in this thread. You are both authorized to exchange
this task's handoff and findings here. Leave the PR open; do not merge or deploy.
```

## 34-second storyboard

Record the real session, then edit elapsed work into 34 seconds. Label cuts or speed-ups; agent work and CI may take minutes. Only show outcomes that actually happened. Keep OAuth setup, credentials and unrelated Slack messages out of the recording. Retain the sponsored disclosure in the final video/post.

| Time | Shot / narration |
| --- | --- |
| 0–5s | PR #1 red check, expected 42/7 vs actual 0/0. “TokenLens is losing streamed token usage.” |
| 5–10s | Send the single Slack trigger. “I give two Composal Sparks the job.” |
| 10–18s | Real Fixer activity: investigation, small diff and test output. Label the elapsed-time cut. |
| 18–24s | Actual Slack handoff with commit SHA; open Reviewer's independent session. |
| 24–30s | Latest PR checks green, matching SHA; Reviewer publishes its evidence-backed verdict. |
| 30–34s | PR still open plus Slack verdict. “Fixed and independently reviewed. Ready for my decision.” |

If checks or review fail, show that outcome and continue the actual correction loop. There is no prepared green result, staged conversation or prewritten verdict.

## Reset for another take

Stop both Sparks' active tasks and wait for outstanding pushes/messages to finish. Use only this dedicated, clean worktree. Preserve the previous take's evidence; the following creates a new reset commit, with no force push:

```sh
cd /Users/krish/Developer/tokenlens-composal-demo
git switch demo/composal-stream-usage
git status --short
git pull --ff-only origin demo/composal-stream-usage
git fetch origin tag demo/composal-stream-usage-start
git restore --source=demo/composal-stream-usage-start -- gateway/src/handlers/stream.ts gateway/src/handlers/stream.test.ts .github/workflows/composal-demo.yml
git diff --stat
git diff --check
git add gateway/src/handlers/stream.ts gateway/src/handlers/stream.test.ts .github/workflows/composal-demo.yml
git commit -m 'test(gateway): reset Composal demo to verified failing checkpoint'
git push origin demo/composal-stream-usage
```

Proceed only with no unrelated local changes. If the fix added helper files, inspect and remove only those demo helpers as needed before committing. If already at the checkpoint, there is nothing to commit. Re-run the focused test: expect **6 pass / 3 fail**. Wait for new red CI on the reset SHA. Reuse open PR #1, start a fresh Slack thread and tell the Sparks to fetch that new head and ignore prior verdicts. Re-running old Actions does not reset fixed code. Never merge this demo PR into `dev` or `main`.
