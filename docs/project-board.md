# ILN Cross-Repo GitHub Project Board

The ILN organisation uses a single **GitHub Projects v2** board to track work across all three repositories.

**Board URL:** https://github.com/orgs/Invoice-Liquidity-Network/projects/1

---

## Board views

| View | Filter | Purpose |
|------|--------|---------|
| **All Open Issues** | `is:open` across all repos | Unified backlog for maintainers |
| **Smart Contract Sprint** | `repo:ILN-Smart-Contract is:open` | Active Rust/Soroban work |
| **Frontend Sprint** | `repo:ILN-Frontend is:open` | Active Next.js/UI work |
| **SDK / Main Sprint** | `repo:Invoice-Liquidity-Network is:open` | SDK, CLI, indexer, docs work |
| **Blocked** | `label:blocked` | Issues waiting on external dependency |

---

## Automation rules

| Trigger | Action |
|---------|--------|
| PR merged (linked issue via `Closes #N`) | Issue moved to **Done** |
| Issue labelled `blocked` | Issue moved to **Blocked** |
| Issue opened | Added to board in **Triage** |
| PR opened | Linked issue moved to **In Review** |

Automation is handled by:
1. **GitHub built-in automation** — Projects v2 built-in "Auto-add to project" and "Item closed" rules configured in the board settings.
2. **`.github/workflows/project-board.yml`** — workflow in this repo that handles the `blocked` label and cross-repo events via `workflow_dispatch` / `repository_dispatch`.

---

## One-time setup (maintainers only)

Run this once to create the project board and wire up all three repos.

### Prerequisites

```bash
# GitHub CLI with org-level Projects scope
gh auth login
gh auth refresh -s project
```

### Create the project and views

```bash
# Create the project
PROJECT_URL=$(gh project create \
  --owner Invoice-Liquidity-Network \
  --title "ILN Sprint Board" \
  --format json | jq -r '.url')

PROJECT_NUMBER=$(echo "$PROJECT_URL" | grep -oE '[0-9]+$')
echo "Project number: $PROJECT_NUMBER"

# Add all three repos
gh project link "$PROJECT_NUMBER" \
  --owner Invoice-Liquidity-Network \
  --repo Invoice-Liquidity-Network

gh project link "$PROJECT_NUMBER" \
  --owner Invoice-Liquidity-Network \
  --repo ILN-Frontend

gh project link "$PROJECT_NUMBER" \
  --owner Invoice-Liquidity-Network \
  --repo ILN-Smart-Contract
```

> After running the above, configure the five views and automation rules manually in the project UI at the URL printed above, following the table in [Board views](#board-views) and [Automation rules](#automation-rules).

---

## For contributors

See [CONTRIBUTING.md](../CONTRIBUTING.md#project-board) for how to find and pick up issues from the board.
