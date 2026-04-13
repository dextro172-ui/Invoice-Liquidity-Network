#![cfg(test)]

use super::*;
use soroban_sdk::{
    testutils::{Address as _, Ledger},
    token::{Client as TokenClient, StellarAssetClient},
    Address, Env,
};

// ----------------------------------------------------------------
// Test helpers — shared setup used across all tests
// ----------------------------------------------------------------

/// All the actors and contract references a test needs
struct TestEnv {
    env:        Env,
    contract:   InvoiceLiquidityContractClient<'static>,
    token:      TokenClient<'static>,
    freelancer: Address,
    payer:      Address,
    funder:     Address,
    usdc_admin: Address,
}

/// Standard invoice values reused across tests
const INVOICE_AMOUNT:   i128 = 1_000_000_000; // 100 USDC in stroops (1 USDC = 10_000_000)
const DISCOUNT_RATE:    u32  = 300;            // 3.00% in basis points
const DUE_DATE_OFFSET:  u64  = 60 * 60 * 24 * 30; // 30 days from now

fn setup() -> TestEnv {
    let env = Env::default();

    // Skip auth checks in tests — we test auth separately
    env.mock_all_auths();

    // ---- Deploy a mock USDC token contract ----
    let usdc_admin = Address::generate(&env);
    let usdc_contract_id = env.register_stellar_asset_contract_v2(usdc_admin.clone());
    let usdc_address = usdc_contract_id.address();

    let token      = TokenClient::new(&env, &usdc_address);
    let token_admin = StellarAssetClient::new(&env, &usdc_address);

    // ---- Generate test wallets ----
    let freelancer = Address::generate(&env);
    let payer      = Address::generate(&env);
    let funder     = Address::generate(&env);

    // ---- Mint USDC to the actors who need it ----
    // Funder needs enough to cover the invoice
    token_admin.mint(&funder, &(INVOICE_AMOUNT * 10));
    // Payer needs enough to settle the invoice
    token_admin.mint(&payer,  &(INVOICE_AMOUNT * 10));

    // ---- Deploy the ILN contract ----
    let contract_id = env.register(InvoiceLiquidityContract, ());
    let contract    = InvoiceLiquidityContractClient::new(&env, &contract_id);

    // Initialize with mock token address
    contract.initialize(&usdc_address);

    // ---- Set ledger timestamp to a known baseline ----
    let mut ledger_info = env.ledger().get();
    ledger_info.timestamp = 1_700_000_000;
    env.ledger().set(ledger_info);

    TestEnv { env, contract, token, freelancer, payer, funder, usdc_admin }
}

/// Helper: submit a standard invoice and return its ID
fn submit_standard_invoice(t: &TestEnv) -> u64 {
    let due_date = t.env.ledger().timestamp() + DUE_DATE_OFFSET;
    t.contract
        .submit_invoice(
            &t.freelancer,
            &t.payer,
            &INVOICE_AMOUNT,
            &due_date,
            &DISCOUNT_RATE,
        )
}

// ----------------------------------------------------------------
// submit_invoice — happy path
// ----------------------------------------------------------------

#[test]
fn test_submit_invoice_returns_id() {
    let t = setup();
    let id = submit_standard_invoice(&t);

    // First invoice should always be ID 1
    assert_eq!(id, 1);
}

#[test]
fn test_submit_invoice_stores_correct_fields() {
    let t = setup();
    let due_date = t.env.ledger().timestamp() + DUE_DATE_OFFSET;

    let id = t.contract
        .submit_invoice(
            &t.freelancer,
            &t.payer,
            &INVOICE_AMOUNT,
            &due_date,
            &DISCOUNT_RATE,
        );

    let invoice = t.contract.get_invoice(&id);

    assert_eq!(invoice.id,            id);
    assert_eq!(invoice.freelancer,    t.freelancer);
    assert_eq!(invoice.payer,         t.payer);
    assert_eq!(invoice.amount,        INVOICE_AMOUNT);
    assert_eq!(invoice.due_date,      due_date);
    assert_eq!(invoice.discount_rate, DISCOUNT_RATE);
    assert_eq!(invoice.status,        InvoiceStatus::Pending);
    assert!(invoice.funder.is_none());
    assert!(invoice.funded_at.is_none());
}

#[test]
fn test_submit_multiple_invoices_increment_ids() {
    let t = setup();

    let id1 = submit_standard_invoice(&t);
    let id2 = submit_standard_invoice(&t);
    let id3 = submit_standard_invoice(&t);

    assert_eq!(id1, 1);
     assert_eq!(id2, 2);
    assert_eq!(id3, 3);
}

// ----------------------------------------------------------------
// submit_invoice — validation errors
// ----------------------------------------------------------------

#[test]
fn test_submit_rejects_zero_amount() {
    let t = setup();
    let due_date = t.env.ledger().timestamp() + DUE_DATE_OFFSET;

    let result = t.contract.try_submit_invoice(
        &t.freelancer,
        &t.payer,
        &0,
        &due_date,
        &DISCOUNT_RATE,
    );

    assert_eq!(result, Err(Ok(ContractError::InvalidAmount)));
}

#[test]
fn test_submit_rejects_negative_amount() {
    let t = setup();
    let due_date = t.env.ledger().timestamp() + DUE_DATE_OFFSET;

    let result = t.contract.try_submit_invoice(
        &t.freelancer,
        &t.payer,
        &-1,
        &due_date,
        &DISCOUNT_RATE,
    );

    assert_eq!(result, Err(Ok(ContractError::InvalidAmount)));
}

#[test]
fn test_submit_rejects_past_due_date() {
    let t = setup();
    let past_due_date = t.env.ledger().timestamp() - 1; // 1 second in the past

    let result = t.contract.try_submit_invoice(
        &t.freelancer,
        &t.payer,
        &INVOICE_AMOUNT,
        &past_due_date,
        &DISCOUNT_RATE,
    );

    assert_eq!(result, Err(Ok(ContractError::InvalidDueDate)));
}

#[test]
fn test_submit_rejects_zero_discount_rate() {
    let t = setup();
    let due_date = t.env.ledger().timestamp() + DUE_DATE_OFFSET;

    let result = t.contract.try_submit_invoice(
        &t.freelancer,
        &t.payer,
        &INVOICE_AMOUNT,
        &due_date,
        &0,
    );

    assert_eq!(result, Err(Ok(ContractError::InvalidDiscountRate)));
}

#[test]
fn test_submit_rejects_discount_rate_above_50_percent() {
    let t = setup();
    let due_date = t.env.ledger().timestamp() + DUE_DATE_OFFSET;

    let result = t.contract.try_submit_invoice(
        &t.freelancer,
        &t.payer,
        &INVOICE_AMOUNT,
        &due_date,
        &5_001, // 50.01% — just over the cap
    );

    assert_eq!(result, Err(Ok(ContractError::InvalidDiscountRate)));
}

// ----------------------------------------------------------------
// fund_invoice — happy path
// ----------------------------------------------------------------

#[test]
fn test_fund_invoice_transfers_correct_amounts() {
    let t = setup();
    let id = submit_standard_invoice(&t);

    let funder_balance_before     = t.token.balance(&t.funder);
    let freelancer_balance_before = t.token.balance(&t.freelancer);

    t.contract.fund_invoice(&t.funder, &id);

    let funder_balance_after     = t.token.balance(&t.funder);
    let freelancer_balance_after = t.token.balance(&t.freelancer);

    // discount_amount = 1_000_000_000 * 300 / 10_000 = 30_000_000 (3 USDC)
    let discount_amount    = INVOICE_AMOUNT * DISCOUNT_RATE as i128 / 10_000;
    let freelancer_payout  = INVOICE_AMOUNT - discount_amount;

    // LP sent the full invoice amount
    assert_eq!(
        funder_balance_before - funder_balance_after,
        INVOICE_AMOUNT,
        "LP should have sent the full invoice amount"
    );

    // Freelancer received amount minus discount
    assert_eq!(
        freelancer_balance_after - freelancer_balance_before,
        freelancer_payout,
        "Freelancer should receive amount minus discount"
    );
}

#[test]
fn test_fund_invoice_updates_status_to_funded() {
    let t = setup();
    let id = submit_standard_invoice(&t);

    t.contract.fund_invoice(&t.funder, &id);

    let invoice = t.contract.get_invoice(&id);

    assert_eq!(invoice.status, InvoiceStatus::Funded);
    assert_eq!(invoice.funder, Some(t.funder.clone()));
    assert!(invoice.funded_at.is_some());
}

#[test]
fn test_fund_invoice_sets_funded_at_timestamp() {
    let t = setup();
    let id  = submit_standard_invoice(&t);
    let now = t.env.ledger().timestamp();

    t.contract.fund_invoice(&t.funder, &id);

    let invoice = t.contract.get_invoice(&id);
    assert_eq!(invoice.funded_at, Some(now));
}

// ----------------------------------------------------------------
// fund_invoice — error cases
// ----------------------------------------------------------------

#[test]
fn test_fund_nonexistent_invoice_fails() {
    let t = setup();

    let result = t.contract.try_fund_invoice(&t.funder, &999);
    assert_eq!(result, Err(Ok(ContractError::InvoiceNotFound)));
}

#[test]
fn test_fund_already_funded_invoice_fails() {
    let t = setup();
    let id = submit_standard_invoice(&t);

    t.contract.fund_invoice(&t.funder, &id);

    // Second funder tries to fund the same invoice
    let second_funder = Address::generate(&t.env);
    let result = t.contract.try_fund_invoice(&second_funder, &id);

    assert_eq!(result, Err(Ok(ContractError::AlreadyFunded)));
}

// ----------------------------------------------------------------
// mark_paid — happy path
// ----------------------------------------------------------------

#[test]
fn test_mark_paid_releases_full_amount_to_lp() {
    let t = setup();
    let id = submit_standard_invoice(&t);

    t.contract.fund_invoice(&t.funder, &id);

    let funder_balance_before = t.token.balance(&t.funder);

    t.contract.mark_paid(&id);

    let funder_balance_after = t.token.balance(&t.funder);

    // LP should receive the full invoice amount + their escrowed discount
    let discount_amount = INVOICE_AMOUNT * DISCOUNT_RATE as i128 / 10_000;
    assert_eq!(
        funder_balance_after - funder_balance_before,
        INVOICE_AMOUNT + discount_amount,
        "LP should receive the full invoice amount + yield when invoice is paid"
    );
}

#[test]
fn test_mark_paid_updates_status() {
    let t = setup();
    let id = submit_standard_invoice(&t);

    t.contract.fund_invoice(&t.funder, &id);
    t.contract.mark_paid(&id);

    let invoice = t.contract.get_invoice(&id);
    assert_eq!(invoice.status, InvoiceStatus::Paid);
}

#[test]
fn test_full_lifecycle_lp_earns_correct_yield() {
    let t = setup();
    let id = submit_standard_invoice(&t);

    // Record LP balance before the entire flow
    let lp_start = t.token.balance(&t.funder);

    // LP funds the invoice
    t.contract.fund_invoice(&t.funder, &id);

    // Payer settles
    t.contract.mark_paid(&id);

    let lp_end = t.token.balance(&t.funder);

    // LP net gain = discount amount = 3% of invoice
    let expected_yield = INVOICE_AMOUNT * DISCOUNT_RATE as i128 / 10_000;

    assert_eq!(
        lp_end - lp_start,
        expected_yield,
        "LP net yield should equal the discount amount"
    );
}

#[test]
fn test_full_lifecycle_payer_balance_reduces_correctly() {
    let t = setup();
    let id = submit_standard_invoice(&t);

    let payer_start = t.token.balance(&t.payer);

    t.contract.fund_invoice(&t.funder, &id);
    t.contract.mark_paid(&id);

    let payer_end = t.token.balance(&t.payer);

    // Payer should have paid the full invoice amount
    assert_eq!(
        payer_start - payer_end,
        INVOICE_AMOUNT,
        "Payer should have paid the full invoice amount"
    );
}

// ----------------------------------------------------------------
// mark_paid — error cases
// ----------------------------------------------------------------

#[test]
fn test_mark_paid_on_pending_invoice_fails() {
    let t = setup();
    let id = submit_standard_invoice(&t);

    // Try to mark paid without funding first
    let result = t.contract.try_mark_paid(&id);
    assert_eq!(result, Err(Ok(ContractError::NotFunded)));
}

#[test]
fn test_mark_paid_twice_fails() {
    let t = setup();
    let id = submit_standard_invoice(&t);

    t.contract.fund_invoice(&t.funder, &id);
    t.contract.mark_paid(&id);

    // Paying again should fail
    let result = t.contract.try_mark_paid(&id);
    assert_eq!(result, Err(Ok(ContractError::AlreadyPaid)));
}

#[test]
fn test_mark_paid_nonexistent_invoice_fails() {
    let t = setup();

    let result = t.contract.try_mark_paid(&999);
    assert_eq!(result, Err(Ok(ContractError::InvoiceNotFound)));
}
