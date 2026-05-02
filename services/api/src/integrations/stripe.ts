/**
 * Mock Stripe Treasury rail. The real Stripe call would be:
 *   stripe.treasury.outboundPayments.create({ financial_account, amount, destination_payment_method, ... })
 * Here we just simulate success + return an id.
 */

export const StripeRail = {
  async executePayment(opts: {
    orgId: string;
    agentId: string;
    amountCents: number;
    currency: string;
    vendor: string;
    idempotencyKey: string;
  }) {
    // Deterministic-ish id from idempotency key.
    return {
      id: "obp_" + opts.idempotencyKey.slice(0, 18),
      status: "posted" as const,
      amountCents: opts.amountCents,
      currency: opts.currency,
      postedAt: Date.now(),
    };
  },
  async reverse(externalCallId: string) {
    return { id: "rev_" + externalCallId.slice(4), status: "reversed" as const };
  },
};
