export const STRIPE_PRICES = {
  starter: {
    monthly: process.env.STRIPE_PRICE_STARTER_MONTHLY!,
    name: "Starter",
    amount: 4900, // $49.00 in cents
  },
  pro: {
    monthly: process.env.STRIPE_PRICE_PRO_MONTHLY!,
    name: "Pro",
    amount: 14900,
  },
  enterprise: {
    monthly: process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY!,
    name: "Enterprise",
    amount: 39900,
  },
} as const;

export type PlanKey = keyof typeof STRIPE_PRICES;
