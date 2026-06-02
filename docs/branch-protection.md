# Branch protection rules for `main`

This document describes the required GitHub branch protection settings for the `main` branch.
These settings are intended to preserve code quality, enforce review discipline, and protect the repository from unsafe history changes.

## Required settings for `main`

### 1. Protect the `main` branch

- Enable branch protection on the `main` branch.
- Do not allow direct pushes to `main` unless through a protected merge path.

### 2. Require pull request reviews before merging

- Require pull request review before merging.
- Require at least **1 approving review**.
- Require review from **CODEOWNERS**.
  - This ensures the domain experts and maintainers identified in `.github/CODEOWNERS` must sign off on changes affecting owned files.
  - If a `.github/CODEOWNERS` file is not present, add one and keep this branch protection requirement enabled.

### 3. Dismiss stale pull request approvals when new commits are pushed

- Enable **Dismiss stale pull request approvals when new commits are pushed**.
- Reason: ensures reviewers reapprove the PR after any code changes, keeping review status current.

### 4. Require linear history

- Enable **Require linear history**.
- Reason: prevents merge commits and ensures the `main` commit history remains easy to audit and backtrack.

### 5. Restrict force pushes

- Enable **Restrict force pushes** for `main`.
- Reason: prevents destructive rewrites of the branch history and preserves auditability.

### 6. Require status checks to pass before merging

Require the following GitHub Actions status checks on `main`:

- `CI / Run tests`
- `CI / Build contract`
- `CI / Lint code`
- `CI / Run Node.js tests`
- `CI / Node.js coverage (≥80%)`
- `PR title lint / lint`

Reason: these checks enforce the repository's core build, test, lint, and PR quality gates before any merge into `main`.

> Note: `E2E Nightly` is a scheduled workflow, not a required merge-time check. It still provides important nightly regression coverage, but it is not typically included as a required PR status check.

## Additional notes

- If the repository adds a `.github/CODEOWNERS` file, update it to include the teams or maintainers responsible for each area of the codebase.
- If branch protection settings are changed in the GitHub UI, this document should be updated to match those settings.
- These settings are intended for `main` only; feature branches should follow the same PR workflow but do not require the same repository-level protection rules.

## Verification

- Verify the `main` branch protection settings in GitHub repository settings.
- Confirm that the required status checks listed above appear in the branch protection rule for `main`.
