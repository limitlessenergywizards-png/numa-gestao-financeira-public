# Onboarding Domain Context

## Responsibility
Guides new users through initial setup (bank account linking, categories, transactions, team invites) and provides a gamified journey with missions, achievements, streaks, and financial personality profiling.

## Bounded Contexts
1. **Onboarding Wizard**: Multi-step setup flow (welcome -> categories -> bank accounts -> first transaction -> invitations).
2. **Journey (My Journey Page)**: Gamified experience with missions, achievements, streaks, and personality profiling.
3. **Financial Personality**: Archetype-based system (Guardiao, Estrategista, etc.) for personalized guidance.
4. **Achievement System**: Unlockable badges, XP, leveling, and weekly challenges.

## Key Decisions
- Separates onboarding flow (first-time setup) from journey (ongoing gamification).
- Implements archetype system for personalized financial guidance.
- Uses XP/leveling system with titles (e.g., "Aprendiz Financeiro" progressing to higher levels).
- Tracks daily streaks with bonus multipliers for consecutive logins.
