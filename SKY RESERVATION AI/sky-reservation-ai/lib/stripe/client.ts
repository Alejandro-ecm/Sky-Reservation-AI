import Stripe from "stripe";

let _instance: Stripe | undefined;

export function getStripe(): Stripe {
  if (_instance) return _instance;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("[stripe] STRIPE_SECRET_KEY is not configured");
  _instance = new Stripe(key);
  return _instance;
}
