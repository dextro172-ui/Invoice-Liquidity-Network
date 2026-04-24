export type Role = 'freelancer' | 'lp' | 'payer';

export interface OnboardingStep {
  title: string;
  content: string;
  targetId?: string;
  route?: string; // If we need to navigate the user to a specific route
}

export const FREELANCER_STEPS: OnboardingStep[] = [
  {
    title: "Welcome to ILN!",
    content: "The Invoice Liquidity Network (ILN) lets you submit invoices and get paid instantly by Liquidity Providers. Let's see how it works.",
  },
  {
    title: "Submit an Invoice",
    content: "Fill out this form to publish a USDC invoice. You will see an instant yield preview that shows what Liquidity Providers will earn.",
    targetId: "submit-invoice-form",
    route: "/",
  },
  {
    title: "Wait for Funding",
    content: "Once submitted, your invoice appears in the LP Discovery Table. A Liquidity Provider will fund it, sending USDC directly to your wallet.",
  },
  {
    title: "Share with Payer",
    content: "You will receive an Invoice ID. Share this ID with the payer so they can settle the invoice on-chain when the due date arrives.",
  }
];

export const LP_STEPS: OnboardingStep[] = [
  {
    title: "Welcome to ILN!",
    content: "As a Liquidity Provider, you can earn yield by funding pending invoices. Let's explore your dashboard.",
  },
  {
    title: "Browse Invoices",
    content: "This table lists all pending invoices. You can see the amount, discount rate, due date, and your estimated yield.",
    targetId: "discovery-table",
    route: "/",
  },
  {
    title: "Check Risk Badges",
    content: "Keep an eye on the discount rates and payer histories to evaluate risk before you fund.",
    targetId: "risk-badge",
    route: "/",
  },
  {
    title: "Fund an Invoice",
    content: "Click 'Fund' to review the transaction details and approve USDC. Once funded, the invoice is yours!",
    targetId: "fund-button",
    route: "/",
  }
];

export const PAYER_STEPS: OnboardingStep[] = [
  {
    title: "Welcome to ILN!",
    content: "As a payer, your role is to settle invoices on-chain when they become due.",
  },
  {
    title: "How to Settle",
    content: "All funded invoices assigned to your wallet will appear here. Click 'Settle' to pay the Liquidity Provider and clear your obligation.",
    targetId: "payer-settlement-page",
    route: "/payer",
  }
];

export const STEPS_BY_ROLE: Record<Role, OnboardingStep[]> = {
  freelancer: FREELANCER_STEPS,
  lp: LP_STEPS,
  payer: PAYER_STEPS,
};
