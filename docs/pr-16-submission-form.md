# PR Prep For Issue #16

## Suggested Commit Message

`feat: add freelancer invoice submission form with Freighter integration`

## Suggested PR Title

`feat: add freelancer invoice submission form with Freighter integration`

## Suggested PR Body

```md
## Summary

- add the freelancer invoice submission form to the landing page
- connect Freighter wallet state for testnet invoice creation
- validate invoice inputs, show live payout and LP yield preview, and surface returned invoice IDs
- harden Soroban transaction handling and fix related frontend type/runtime compatibility issues found during verification

## Screenshots

Desktop:
![Desktop submission form](./frontend/public/pr-screenshots/submission-form-desktop.png)

Mobile:
![Mobile submission form](./frontend/public/pr-screenshots/submission-form-mobile.png)

## Testing

- `cd frontend && npm test`
- `cd frontend && npm run build`

Closes #16
```

## Screenshot Files

- [submission-form-desktop.png](/Users/marvellous/Desktop/Invoice-Liquidity-Network/frontend/public/pr-screenshots/submission-form-desktop.png)
- [submission-form-mobile.png](/Users/marvellous/Desktop/Invoice-Liquidity-Network/frontend/public/pr-screenshots/submission-form-mobile.png)
