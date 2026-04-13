use soroban_sdk::{contracttype, Address, Env};

// ----------------------------------------------------------------
// Status enum — tracks the lifecycle of every invoice
// ----------------------------------------------------------------

#[contracttype]
#[derive(Clone, Debug, PartialEq)]
pub enum InvoiceStatus {
    Pending,   // submitted, waiting for a liquidity provider to fund it
    Funded,    // LP has funded it, freelancer has been paid out
    Paid,      // payer has settled in full, LP has been released
    Defaulted, // past due_date and still unpaid
}

// ----------------------------------------------------------------
// Invoice struct
// ----------------------------------------------------------------

#[contracttype]
#[derive(Clone, Debug)]
pub struct Invoice {
    pub id:            u64,
    pub freelancer:    Address,  // who submitted the invoice (receives liquidity)
    pub payer:         Address,  // the client who owes the money
    pub amount:        i128,     // full invoice value in stroops (1 USDC = 10_000_000)
    pub due_date:      u64,      // Unix timestamp — when the payer must settle by
    pub discount_rate: u32,      // basis points, e.g. 300 = 3.00%
    pub status:        InvoiceStatus,
    pub funder:        Option<Address>, // set when an LP funds the invoice
    pub funded_at:     Option<u64>,     // ledger timestamp when funding occurred
}

// ----------------------------------------------------------------
// Storage key — one key type per stored entity keeps storage clean
// ----------------------------------------------------------------

#[contracttype]
pub enum StorageKey {
    Invoice(u64),   // Invoice by ID
    InvoiceCount,   // auto-increment counter for IDs
    Token,          // USDC token address
}

// ----------------------------------------------------------------
// Storage helpers
// ----------------------------------------------------------------

/// Save an invoice to contract storage
pub fn save_invoice(env: &Env, invoice: &Invoice) {
    env.storage()
        .persistent()
        .set(&StorageKey::Invoice(invoice.id), invoice);
}

/// Load an invoice by ID — panics if not found
pub fn load_invoice(env: &Env, id: u64) -> Invoice {
    env.storage()
        .persistent()
        .get(&StorageKey::Invoice(id))
        .expect("invoice not found")
}

/// Check whether an invoice exists without panicking
pub fn invoice_exists(env: &Env, id: u64) -> bool {
    env.storage()
        .persistent()
        .has(&StorageKey::Invoice(id))
}

/// Get the next invoice ID and increment the counter
pub fn next_invoice_id(env: &Env) -> u64 {
    let current: u64 = env
        .storage()
        .persistent()
        .get(&StorageKey::InvoiceCount)
        .unwrap_or(0);
    let next = current + 1;
    env.storage()
        .persistent()
        .set(&StorageKey::InvoiceCount, &next);
    next
}
