# ILN Portfolio Reporting Script

A script for LPs and freelancers to generate reports on their activity within the Invoice Liquidity Network programmatically. It fetches on-chain event data using the `@iln/indexer` package and exports a summary of positions, earnings, and invoice states in either JSON or CSV format.

## Prerequisites

- Node.js 18+
- pnpm

## Installation

Ensure you have run the root setup for the monorepo:

```bash
pnpm install
pnpm build
```

Then in this directory:

```bash
# If running isolated
pnpm install
```

## Usage

You can run the script using `ts-node` via the `start` script.

```bash
pnpm start -- -w <YOUR_WALLET_ADDRESS> [options]
```

### Options

| Option | Description | Default |
| --- | --- | --- |
| `-w, --wallet <address>` | Wallet address (Stellar public key) | **Required** |
| `-n, --network <url>` | Horizon network URL | `https://horizon-testnet.stellar.org` |
| `-c, --contract <id>` | ILN contract ID | `CC7Q5X...` (Testnet placeholder) |
| `-f, --format <type>` | Output format: `json` or `csv` | `json` |
| `--start-date <date>` | Start date (ISO format, e.g. `2024-01-01`) | Beginning of time |
| `--end-date <date>` | End date (ISO format, e.g. `2024-12-31`) | Current date |

### Examples

**Export as JSON (Default):**
```bash
pnpm start -- -w GADDR1234567890 -c CTESTCONTRACT -n https://horizon-testnet.stellar.org
```

**Export as CSV:**
```bash
pnpm start -- -w GADDR1234567890 -c CTESTCONTRACT -f csv
```

**Filter by Date Range:**
```bash
pnpm start -- -w GADDR1234567890 -c CTESTCONTRACT --start-date 2024-01-01 --end-date 2024-03-31
```
