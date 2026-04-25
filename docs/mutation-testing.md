# Mutation Testing — Invoice Liquidity Contract

## Overview

Mutation testing verifies that the test suite actually detects real bugs by
introducing small code changes ("mutations") and confirming the tests fail.
This project uses [cargo-mutants](https://mutants.rs/) against
`contracts/invoice_liquidity/src/lib.rs`.

**Target mutation score: > 70%** (≥ 70% of generated mutations caught).

---

## Running

```bash
# From the invoice_liquidity contract directory:
make mutants

# Or directly:
cargo mutants --package invoice_liquidity
```

Results are written to `mutants.out/` in the workspace root.

---

## Mutation Categories Tested

| Category | Example mutation | Killing test |
|---|---|---|
| Comparison flip | `due_date <= now` → `due_date < now` | `mt01_due_date_equal_to_now_is_rejected` |
| Equality to relational | `amount_funded == amount` → `>=` | `mt02_partial_fund_keeps_status_partially_funded` |
| Arithmetic increment | `current_score + 1` → `current_score` | `mt03_payer_score_increases_by_exactly_one_on_settlement` |
| Arithmetic decrement | `current_score - 5` → `current_score - 4` | `mt04_payer_score_decreases_by_exactly_five_on_default` |
| Guard flip | `current_score > 5` → `current_score > 0` | `mt05_payer_score_floors_at_zero_not_negative` |
| Boundary off-by-one | `discount_rate > max_rate` → `>=` | `mt06_discount_rate_at_cap_is_accepted` |
| Formula constant | `500 + (100 - score) * 5` constants mutated | `mt07_suggested_discount_rate_formula` |

---

## Known Surviving Mutations

The following mutations are **expected survivors** — they are semantically
equivalent to the original code in all reachable paths, or they affect code
paths that are intentionally left unchecked:

### 1. `notify_distribution_*` early-return branches

```rust
// In notify_distribution_funding / notify_distribution_settlement:
let Some(dist_contract) = env.storage()...get::<_, Address>(...) else {
    return; // ← mutating this early return has no observable effect in unit tests
};
```

**Why it survives:** The distribution contract is not set in unit tests.
The early return is exercised (no panic) but any mutation to it would still
pass all tests because the notification path is a fire-and-forget side effect
not directly observable in the contract's return values.

**Mitigation:** Integration/e2e tests that set a distribution contract would
catch mutations here. See `tests_distribution.rs` for partial coverage.

---

### 2. `invoice.funder = Some(funder.clone())` assignment in `fund_invoice`

```rust
invoice.funder = Some(funder.clone()); // Legacy support comment
```

**Why it survives:** The funder field is only set when `amount_funded == amount`
(full funding). Tests verify `invoice.funder == Some(t.funder)` post-fund, so
mutations that change this assignment (e.g., `None`) would be caught. However,
mutations that change the *condition* for this line (e.g., always assign vs
only on full fund) may survive if partial-fund tests don't check `funder`.

**Mitigation:** `mt02` and existing funder-field tests cover most paths.

---

### 3. `discount_rate_as_i128` cast

```rust
fn discount_rate_as_i128(rate: u32) -> i128 { rate as i128 }
```

**Why it survives:** This is a pure type cast. Mutations here (e.g., return
a constant) would be caught by existing arithmetic tests.

---

## Adding New Tests

When cargo-mutants reports a new survivor:

1. Identify the mutated line and what invariant it violates.
2. Add a targeted test to `src/tests_mutation.rs` that asserts the exact
   boundary value differentiating the original from the mutant.
3. Re-run `make mutants` to confirm the new test kills the mutation.
4. Document the mutation in the table above.
