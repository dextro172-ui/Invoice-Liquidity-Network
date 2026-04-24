import type { Invoice } from "../../utils/soroban";

export const FIXTURE_ADDRESSES = {
  freelancerAlpha: "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF",
  freelancerBeta: "GBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBRY",
  freelancerGamma: "GCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC6",
  payerAlpha: "GDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD2",
  payerBeta: "GEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEF",
  lp: "GFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF",
};

export const invoiceFixtures: Record<string, Invoice> = {
  pending: {
    id: 1n,
    freelancer: FIXTURE_ADDRESSES.freelancerAlpha,
    payer: FIXTURE_ADDRESSES.payerAlpha,
    amount: 1_500_000_000n,
    due_date: 1_810_353_600n,
    discount_rate: 250,
    status: "Pending",
    token: "token-usdc",
  },
  funded: {
    id: 2n,
    freelancer: FIXTURE_ADDRESSES.freelancerBeta,
    payer: FIXTURE_ADDRESSES.payerAlpha,
    amount: 2_250_000_000n,
    due_date: 1_808_798_400n,
    discount_rate: 400,
    status: "Funded",
    funder: FIXTURE_ADDRESSES.lp,
    funded_at: 1_777_363_200n,
    token: "token-eurc",
  },
  partiallyFunded: {
    id: 3n,
    freelancer: FIXTURE_ADDRESSES.freelancerGamma,
    payer: FIXTURE_ADDRESSES.payerBeta,
    amount: 3_100_000_000n,
    due_date: 1_809_316_800n,
    discount_rate: 525,
    status: "PartiallyFunded",
    funder: FIXTURE_ADDRESSES.lp,
    funded_at: 1_777_536_000n,
    token: "token-usdc",
  },
  paid: {
    id: 4n,
    freelancer: FIXTURE_ADDRESSES.freelancerAlpha,
    payer: FIXTURE_ADDRESSES.payerBeta,
    amount: 975_000_000n,
    due_date: 1_778_400_000n,
    discount_rate: 300,
    status: "Paid",
    funder: FIXTURE_ADDRESSES.lp,
    funded_at: 1_746_964_800n,
    token: "token-eurc",
  },
  defaulted: {
    id: 5n,
    freelancer: FIXTURE_ADDRESSES.freelancerBeta,
    payer: FIXTURE_ADDRESSES.payerAlpha,
    amount: 4_500_000_000n,
    due_date: 1_772_352_000n,
    discount_rate: 650,
    status: "Defaulted",
    funder: FIXTURE_ADDRESSES.lp,
    funded_at: 1_740_916_800n,
    token: "token-usdc",
  },
};

export const allInvoiceFixtures = Object.values(invoiceFixtures);
