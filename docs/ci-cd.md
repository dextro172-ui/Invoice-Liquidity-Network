# CI/CD and GitHub Environments

This repository uses GitHub Environments to protect deployment secrets and ensure audit control over network deployments. Shared CI steps for Stellar testnet and pnpm are provided as **reusable workflows** (`workflow_call`) so the main repo, [ILN-Smart-Contract](https://github.com/Invoice-Liquidity-Network/ILN-Smart-Contract), and [ILN-Frontend](https://github.com/Invoice-Liquidity-Network/ILN-Frontend) can reuse the same logic.

## Reusable workflow templates

| Workflow | File | Purpose |
| -------- | ---- | ------- |
| Stellar setup | `.github/workflows/reusable-stellar-setup.yml` | Install Stellar CLI, configure testnet, create a funded identity |
| pnpm cache | `.github/workflows/reusable-cache-pnpm.yml` | Warm the pnpm store with lockfile-scoped cache keys |
| Testnet health | `.github/workflows/reusable-testnet-health.yml` | Probe Horizon testnet and expose a `healthy` flag |

### `reusable-stellar-setup.yml`

Installs the Stellar CLI via `cargo install`, registers the public testnet endpoints, and generates a funded identity (Friendbot on testnet).

**Inputs**

| Input | Default | Description |
| ----- | ------- | ----------- |
| `identity-name` | `ci-test` | CLI identity alias |
| `network` | `testnet` | Network alias (`stellar network use`) |
| `fund-identity` | `true` | Fund via Friendbot when `true` |
| `horizon-url` | `https://horizon-testnet.stellar.org` | Used for custom testnet registration |
| `rpc-url` | `https://soroban-testnet.stellar.org` | Soroban RPC for testnet registration |
| `network-passphrase` | `Test SDF Network ; September 2015` | Testnet passphrase |
| `stellar-cli-features` | `opt` | Cargo features for `stellar-cli` |

**Outputs**

| Output | Description |
| ------ | ----------- |
| `identity-name` | Identity alias written to the CLI config |
| `public-key` | `G…` address for the identity |
| `network` | Network alias in use |

**Example (same repository)**

```yaml
jobs:
  stellar-setup:
    uses: ./.github/workflows/reusable-stellar-setup.yml
    with:
      identity-name: ci-deployer

  deploy-contract:
    needs: stellar-setup
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      # Re-install CLI in this job (cached via cargo) or colocate deploy steps in one job.
      - run: echo "Deployer=${{ needs.stellar-setup.outputs.public-key }}"
```

**Example (sibling repository)**

```yaml
jobs:
  stellar-setup:
    uses: Invoice-Liquidity-Network/Invoice-Liquidity-Network/.github/workflows/reusable-stellar-setup.yml@main
    with:
      identity-name: contract-ci
```

> **Note:** Reusable workflows run in an isolated job. The Stellar CLI binary is not available on other runners unless you install it again (cargo install is fast when the cache hits) or keep deploy/test steps in the same callable workflow.

### `reusable-cache-pnpm.yml`

Checks out the repo, restores or populates the pnpm store cache, and optionally runs `pnpm install`. Use it as an early job so later jobs benefit from a warm store when they use the same cache keys.

**Inputs**

| Input | Default | Description |
| ----- | ------- | ----------- |
| `node-version` | `20` | Node.js version |
| `pnpm-version` | `9` | pnpm version |
| `lockfile-path` | `pnpm-lock.yaml` | Lockfile hashed into the cache key |
| `cache-key-prefix` | `iln` | Prefix for `actions/cache` keys |
| `install-dependencies` | `false` | Run `pnpm install` when `true` |
| `install-args` | `--frozen-lockfile` | Arguments for `pnpm install` |

**Outputs**

| Output | Description |
| ------ | ----------- |
| `cache-hit` | `true` when the primary cache key matched |

**Cache key format**

```text
{cache-key-prefix}-{runner.os}-pnpm-{hashFiles(lockfile-path)}
```

Restore key prefix: `{cache-key-prefix}-{runner.os}-pnpm-`

**Example**

```yaml
jobs:
  pnpm-cache:
    uses: ./.github/workflows/reusable-cache-pnpm.yml

  unit-tests:
    needs: pnpm-cache
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: ./.github/actions/setup-pnpm
        with:
          install-args: --frozen-lockfile
      - run: pnpm test
```

The composite action [`.github/actions/setup-pnpm`](../.github/actions/setup-pnpm/action.yml) uses the same cache keys as the reusable workflow so caller jobs stay in sync without duplicating YAML.

### `reusable-testnet-health.yml`

Requests `/.well-known/stellar.json` from Horizon and sets `healthy` to `true` when the response contains a valid network passphrase.

**Inputs**

| Input | Default | Description |
| ----- | ------- | ----------- |
| `horizon-url` | `https://horizon-testnet.stellar.org` | Horizon base URL |
| `max-attempts` | `3` | Retry count |
| `retry-delay-seconds` | `5` | Delay between attempts |

**Outputs**

| Output | Description |
| ------ | ----------- |
| `healthy` | `true` or `false` (string) |

**Example — gate testnet integration**

```yaml
jobs:
  testnet-health:
    uses: ./.github/workflows/reusable-testnet-health.yml

  sdk-testnet-integration:
    needs: testnet-health
    if: needs.testnet-health.outputs.healthy == 'true'
    runs-on: ubuntu-latest
    steps:
      - run: pnpm test:integration:testnet
```

When `healthy` is `false`, dependent jobs are skipped and the workflow logs a warning from the health job.

---

## Required environments

Create the following environments in GitHub repository settings:

- `testnet`
  - Secrets:
    - `TESTNET_DEPLOYER_SECRET`
    - `TESTNET_HORIZON_URL`
  - Approval: automatic approval

- `mainnet`
  - Secrets:
    - `MAINNET_DEPLOYER_SECRET`
    - `MAINNET_HORIZON_URL`
  - Approval: require at least 2 maintainers as reviewers

> Environments are configured in GitHub repository settings under `Settings > Environments`.

## Why this matters

Using GitHub Environments ensures that:

- deployment secrets are only available to jobs that explicitly reference the environment
- mainnet deployments require human review before running
- audit trails are preserved for protected release operations

Reusable workflows reduce duplicated Stellar and pnpm setup across ILN repositories and keep cache keys consistent.

## Deployment workflow

The repository includes a protected deployment workflow at `.github/workflows/deploy.yml`.

The workflow is triggered manually via `workflow_dispatch` and uses the selected environment:

- `testnet` environment for testnet deployments
- `mainnet` environment for mainnet deployments

### How secrets are loaded

The deployment workflow maps the selected network to environment secrets:

- `TESTNET_DEPLOYER_SECRET`
- `TESTNET_HORIZON_URL`
- `MAINNET_DEPLOYER_SECRET`
- `MAINNET_HORIZON_URL`

The workflow also sets `environment: ${{ github.event.inputs.network }}` to ensure GitHub applies the correct environment guard.

## Setup steps

1. Open `Settings > Environments` in the GitHub repository.
2. Create a new environment named `testnet`.
3. Add the required secret values.
4. Configure approval rules for `testnet` to allow automatic approval.
5. Create a new environment named `mainnet`.
6. Add the required secret values.
7. Configure approval rules for `mainnet` and require at least two maintainers as reviewers.
8. Confirm the deployment workflow references the environment in `.github/workflows/deploy.yml`.

## Notes

- Environment settings cannot be committed to the repository; they must be created in the GitHub UI.
- If `mainnet` is selected, GitHub will block the deployment until required reviewers approve the workflow run.
- Sibling repos should pin reusable workflow refs (`@main` or a release tag) rather than floating branches in production CI.
