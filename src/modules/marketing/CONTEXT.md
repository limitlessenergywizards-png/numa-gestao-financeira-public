# Marketing Domain Context

## Responsibility
Attracts and converts potential customers through a marketing landing page featuring product benefits, social proof, pricing, and CTAs. Supports multiple landing page variants.

## Bounded Contexts
1. **Landing Page**: Main public entry point with hero section, features, testimonials, pricing.
2. **Pricing Section**: Plan comparison with billing period selector.
3. **Testimonials**: Social proof section with rotating testimonials.
4. **FAQ Section**: Common questions and answers.
5. **Components Library**: Glassmorphism cards, metallic badges, parallax backgrounds.

## Key Decisions
- Lazy-loads sections below the fold with `LazySection` component.
- Redirects authenticated users to home dashboard.
- Multiple landing page variants: standard, segmented, strategic luxury.
- WhatsApp button for direct messaging support.
