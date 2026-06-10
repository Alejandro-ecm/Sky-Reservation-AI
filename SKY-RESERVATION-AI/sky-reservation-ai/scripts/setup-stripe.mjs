/**
 * One-shot script to create Stripe products/prices and write the IDs back to .env.local.
 *
 * Usage:
 *   1. Add STRIPE_SECRET_KEY=sk_test_... to .env.local
 *   2. node scripts/setup-stripe.mjs
 *   3. Restart the dev server
 */

import Stripe from "stripe";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// ---------------------------------------------------------------------------
// Bootstrap: load .env.local manually (no dotenv needed — one extra dep)
// ---------------------------------------------------------------------------

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, "../.env.local");

function parseEnvFile(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");
  const map = {};
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim();
    map[key] = val;
  }
  return map;
}

function writeEnvValue(filePath, key, value) {
  let content = fs.readFileSync(filePath, "utf8");
  const regex = new RegExp(`^(${key}=).*$`, "m");
  if (regex.test(content)) {
    content = content.replace(regex, `$1${value}`);
  } else {
    content += `\n${key}=${value}`;
  }
  fs.writeFileSync(filePath, content, "utf8");
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const env = parseEnvFile(envPath);
const secretKey = env["STRIPE_SECRET_KEY"];

if (!secretKey) {
  console.error("ERROR: STRIPE_SECRET_KEY is empty in .env.local");
  console.error("  1. Go to https://dashboard.stripe.com/test/apikeys");
  console.error("  2. Copy the Secret key (sk_test_...)");
  console.error("  3. Paste it into .env.local as: STRIPE_SECRET_KEY=sk_test_...");
  process.exit(1);
}

const stripe = new Stripe(secretKey);

const PLANS = [
  { key: "STRIPE_PRICE_STARTER_MONTHLY", name: "Sky AI Starter", amount: 4900 },
  { key: "STRIPE_PRICE_PRO_MONTHLY",     name: "Sky AI Pro",     amount: 14900 },
  { key: "STRIPE_PRICE_ENTERPRISE_MONTHLY", name: "Sky AI Enterprise", amount: 39900 },
];

console.log("Connecting to Stripe...\n");

for (const plan of PLANS) {
  const existingPriceId = env[plan.key];

  // Skip if already set to a real price ID
  if (existingPriceId && existingPriceId.startsWith("price_")) {
    console.log(`✓ ${plan.key} already configured: ${existingPriceId}`);
    continue;
  }

  try {
    // Create product
    const product = await stripe.products.create({
      name: plan.name,
      metadata: { sky_plan: plan.key.replace("STRIPE_PRICE_", "").replace("_MONTHLY", "").toLowerCase() },
    });

    // Create monthly price
    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: plan.amount,
      currency: "usd",
      recurring: { interval: "month" },
      metadata: { sky_plan: product.metadata.sky_plan },
    });

    // Write back to .env.local
    writeEnvValue(envPath, plan.key, price.id);
    console.log(`✓ Created ${plan.name}: ${price.id}`);
  } catch (err) {
    console.error(`✗ Failed to create ${plan.name}:`, err.message);
    process.exit(1);
  }
}

console.log("\nDone! .env.local has been updated with the Stripe price IDs.");
console.log("Restart your dev server for the changes to take effect.");
console.log("\nNext step — set up webhook forwarding (development):");
console.log("  stripe listen --forward-to localhost:3000/api/billing/webhooks/stripe");
console.log("  Copy the webhook signing secret (whsec_...) to STRIPE_WEBHOOK_SECRET in .env.local");
