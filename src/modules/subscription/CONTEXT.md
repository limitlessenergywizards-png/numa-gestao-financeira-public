# Subscription Domain Context

## Responsibility
Manages subscription plans, billing periods, payment processing, and trial lifecycle. Supports multiple pricing tiers with period discounts.

## Bounded Contexts
1. **Pricing Pages**: Plan display with billing period options (monthly, quarterly, semiannual, yearly).
2. **Checkout**: Modal-based checkout flow integrated with Stripe.
3. **Trial Management**: Trial tracking, TrialExpired page for expired trials.
4. **Payment Methods**: Payment method selector and validation.

## Key Decisions
- Single-plan focus (Estrategista) on dedicated pricing page with multiple billing periods.
- Billing period discounts calculated dynamically.
- 7-day money-back guarantee and cancel-anytime messaging.
- Stripe integration for secure payment processing.
