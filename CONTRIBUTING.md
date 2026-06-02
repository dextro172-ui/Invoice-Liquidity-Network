# Contributing to Invoice Liquidity Network

Thank you for your interest in contributing. ILN is an open-source protocol and we welcome contributions of all kinds smart contract code, frontend, documentation, research, and testing.

---

## Table of Contents

- [Ways to contribute](#ways-to-contribute)
- [Applying to work on an issue](#applying-to-work-on-an-issue)
- [Project board](#project-board)
- [Development setup](#development-setup)
- [Submitting a pull request](#submitting-a-pull-request)
- [Code standards](#code-standards)
- [Getting help](#getting-help)

---

## Ways to contribute

To contribute. We welcome:

- **Help wanted issues** — labeled `help wanted`, high priority
- **Good first issues** — labeled `good first issue`, scoped for newcomers to the codebase
- **Bug reports** — open an issue using the bug report template
- **Documentation** — improvements to README, docs/, or inline code comments
- **Security disclosures** — see [Responsible disclosure](#responsible-disclosure) below

---

## Applying to work on an issue

We use an application process to avoid duplicate work.

### Step 1 — Find an issue

Browse [open issues](../../issues) and filter by label:

|        Label       |             Meaning                |
|--------------------|------------------------------------|
| `help wanted`      | High priority, no funding attached |
| `good first issue` | Well-scoped, good entry point      |
| `in progress`      | Already claimed, do not apply      |

### Step 2 — Comment your application

Leave a comment on the issue with the following:

```
**Applying to work on this issue**

- **What I plan to build:** [brief description of your approach]
- **Relevant experience:** [links to past work, GitHub repos, or context]
- **Estimated timeline:** [how many days you need]
- **Questions / blockers:** [anything you need clarified before starting]
```

### Step 3 — Wait for assignment

A maintainer will review your application within **48 hours** and either:

- Assign the issue to you and add the `in progress` label, or
- Ask follow-up questions, or
- Let you know the issue has already been assigned

Do not start building before you are assigned.

### Step 4 — Build and submit a PR

Once assigned, fork the repo, build your solution, and open a pull request referencing the issue (e.g. `Closes #12`). See [Submitting a pull request](#submitting-a-pull-request) below.

### Step 5 — Review and merge

A maintainer will review your PR. Expect one or two rounds of feedback.

---

## Project board

The ILN organisation uses a single [GitHub Projects v2 board](https://github.com/orgs/Invoice-Liquidity-Network/projects/1) that spans all three repositories (main, frontend, smart contract).

### Board views

| View | What it shows |
|------|---------------|
| **All Open Issues** | Every open issue across all repos — start here |
| **Smart Contract Sprint** | Active Rust/Soroban work |
| **Frontend Sprint** | Active Next.js/UI work |
| **SDK / Main Sprint** | SDK, CLI, indexer, and docs work |
| **Blocked** | Issues waiting on an external dependency |

### Picking up an issue from the board

1. Open the [All Open Issues](https://github.com/orgs/Invoice-Liquidity-Network/projects/1/views/1) view and filter by `label:good-first-issue` or `label:help-wanted`.
2. Click the issue title to open it in its home repository.
3. Follow the [Applying to work on an issue](#applying-to-work-on-an-issue) process — comment your application and wait to be assigned.
4. Once assigned, the issue status updates to **In Progress** on the board automatically.
5. Open a PR with `Closes #N` in the description; on merge the issue moves to **Done**.

> If your issue is blocked by something external, apply the `blocked` label — it will move to the **Blocked** view automatically.

For maintainer setup instructions see [`docs/project-board.md`](./docs/project-board.md).

---

## Development setup

### Prerequisites

- [Rust](https://rustup.rs/) 1.74 or higher
- [Stellar CLI](https://developers.stellar.org/docs/tools/developer-tools/stellar-cli)
- A funded Stellar testnet wallet (see README quickstart)
- Node.js 18+ (for frontend contributions)

### Fork and clone

```bash
# Fork the repo on GitHub, then:
git clone https://github.com/YOUR_USERNAME/invoice-liquidity-network.git
cd invoice-liquidity-network

# Add upstream remote
git remote add upstream https://github.com/MAINTAINER_USERNAME/invoice-liquidity-network.git
```

### Build the contract

```bash
cd contracts/invoice_liquidity
cargo build --target wasm32-unknown-unknown --release
```

### Run tests

```bash
cargo test
```

All tests must pass before you open a PR. If you are adding new functionality, include tests for it.

### Keeping your fork up to date

```bash
git fetch upstream
git checkout main
git merge upstream/main
```

---

## Submitting a pull request

1. **Create a branch** named after the issue: `git checkout -b fix/issue-12-payer-verification`
2. **Make your changes** with clear, focused commits
3. **Run the test suite** and confirm everything passes
4. **Open a PR** against the `main` branch of this repo
5. **Fill in the PR template** — describe what you changed, why, and how to test it
6. **Reference the issue** in the PR description: `Closes #12`

### PR checklist

- [ ] Tests pass locally (`cargo test`)
- [ ] New functionality has test coverage
- [ ] No unnecessary dependencies added
- [ ] Code follows the style guidelines below
- [ ] Docs updated if the change affects public interfaces

---

## Code standards

### Rust / Soroban contracts

- Follow standard Rust formatting: run `cargo fmt` before committing
- Run `cargo clippy` and resolve warnings before opening a PR
- All public functions must have doc comments (`///`)
- Avoid `unwrap()` in contract code — use proper error handling with `ContractError`
- Keep functions small and focused; split logic into modules where appropriate

### Documentation

- Write in plain, clear English
- Use sentence case for headings
- Code examples must be tested and working
- Update the relevant section of `docs/` for any interface changes

### Commit messages

We follow the Conventional Commits specification. Use the format:

```
type(scope?): short description

Optional longer explanation of why the change was made,
not just what was changed.
```

Allowed types: `feat`, `fix`, `docs`, `chore`, `test`, `refactor`, `perf`, `ci`, `design`, `build`

Commit messages are validated automatically:
- Local: Husky runs `commitlint` on commit messages via the `commit-msg` hook.
- CI: Pull request titles are validated by a GitHub Action. The PR title is used as the squash commit message, so it must follow the same format.

Example: `ci: add commitlint for conventional commit enforcement`

---

## Responsible disclosure

If you discover a security vulnerability in the smart contract or any part of ILN, please **do not open a public issue**.

Email us at: `margretnursca@gmail.com` (or open a [GitHub Security Advisory](../../security/advisories/new))

Please include:
- A description of the vulnerability
- Steps to reproduce
- Your assessment of impact
- Any suggested fix if you have one

We will acknowledge your report within 48 hours and work with you on a responsible disclosure timeline.

## Getting help

- **GitHub Discussions** — for questions, ideas, and general conversation: [Discussions tab](../../discussions)
- **Issues** — for bug reports and feature requests only
- **Discord** — [invite link] *(add your community link here)*

If you are new to Soroban development, the [Stellar Developer Docs](https://developers.stellar.org/docs/build/smart-contracts/overview) are the best starting point. The [Soroban examples repo](https://github.com/stellar/soroban-examples) is also very useful for understanding contract patterns.

---

## Code of Conduct

This project follows the [Contributor Covenant](https://www.contributor-covenant.org/version/2/1/code_of_conduct/) Code of Conduct. By participating, you agree to uphold it. Maintainers reserve the right to remove anyone who violates these standards.

---

*Questions about the contribution process? Open a [Discussion](../../discussions) and we'll help.*
