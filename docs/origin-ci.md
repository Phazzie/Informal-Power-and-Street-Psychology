# Origin CI

GitHub Actions is not the CI for this repository. Cursor Origin runs CI through the Depot app: GitHub Actions-syntax workflows in `.depot/workflows/` on the `depot-ubuntu-24.04` runner. Those workflows start after the repository is detached from GitHub.

`.github/workflows` is unchanged. This repository does not have that directory, and nothing was added or deleted there.

## Workflow map

| GitHub Actions workflow | Depot equivalent | Commands |
| --- | --- | --- |
| None. `main` has no files under `.github/workflows`. | [`.depot/workflows/ci.yml`](../.depot/workflows/ci.yml) | See jobs below. |

There is nothing already on GitHub Actions to port. The Depot workflow is the CI.

### `verify` (pull requests and pushes to `main`)

Locked install, then the repository's check commands:

1. `npm ci`
2. `npm run lint` (`tsc --noEmit`)
3. `npm test` (`vitest run` for `src/tests`, then `node --test scripts/ai-review.test.mjs`)
4. `npm run build` (`vite build` and the esbuild server bundle)

Node.js 22, matching the local toolchain. `npm test` calls `vitest run` so the suite does not sit in Vitest's watch mode.

### `ai-review` (pull requests only)

`node scripts/ai-review.mjs`

The job calls Grok (`grok-4.5` on `https://api.x.ai/v1/chat/completions`) when `XAI_API_KEY` is set. It posts or updates one comment with:

```bash
origin pr comment "$PR_NUMBER" --body-file "$FILE" --edit-last --create-if-none
```

`PR_NUMBER` comes from `github.event.pull_request.number`. The diff base is `github.base_ref`.

When `XAI_API_KEY` is missing, the script prints `AI review skipped: XAI_API_KEY is not set` and exits 0. When the Origin CLI is missing or the comment command fails, it prints the review to the log and exits 0. An empty diff also skips with exit 0.

If `GITHUB_TOKEN` and `GITHUB_REPOSITORY` are both set, the script comments through the GitHub API instead. Do not set those in Depot. After detach, the Origin command is the path that runs.

## GitHub-only pieces that will be dropped

Nothing in this repository is a GitHub Actions workflow, environment, or encrypted Actions secret.

These GitHub features have no Depot job and stop when the repository is detached:

- GitHub Actions runners and the Actions billing lock. Depot is the replacement, and it does not run `.github/workflows`.
- The GitHub comment path in `scripts/ai-review.mjs`. It needs `GITHUB_TOKEN` and `GITHUB_REPOSITORY`. Leave both unset in Depot.
- Dependabot. The remote still has a branch named `dependabot/npm_and_yarn/npm_and_yarn-32e07c5719`, and `main` has no `.github/dependabot.yml`. Dependabot is GitHub-only. This change does not add a dependency-update bot.
- GitHub deployment environments, OIDC tokens to GitHub, and Actions artifacts. This repository does not use them.

`github.event_name`, `github.event.pull_request.number`, and `github.base_ref` stay in the workflow file because Depot executes GitHub Actions syntax and fills those event fields. They are not a GitHub Actions runner.

## Secrets to re-enter in Depot

| Secret | Where it is used | What happens if it is absent |
| --- | --- | --- |
| `XAI_API_KEY` | `ai-review` only | The job logs a skip and exits 0. No review is posted. |

Enter `XAI_API_KEY` in the Depot project secrets. The workflow reads it as `secrets.XAI_API_KEY`. No other secret is referenced.

These application runtime values are in [`.env.example`](../.env.example). Lint, tests, and the production build pass without them, and the Depot workflow does not read them. Re-enter them on the app host, not as CI secrets:

| Name | Role |
| --- | --- |
| `GEMINI_API_KEY` | Gemini calls from the Express server. Missing key logs a warning outside of tests. |
| `APP_URL` | Hosted applet URL for links and callbacks. |

Do not copy `GITHUB_TOKEN` into Depot.
