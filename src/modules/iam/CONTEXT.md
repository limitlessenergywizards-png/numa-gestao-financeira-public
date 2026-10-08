# IAM Domain Context (Identity & Access Management)

## Responsibility
Manages Authentication, Authorization, User Profiles, and Multi-tenancy (Companies).

## Bounded Contexts
1.  **Auth**: Login, Register, Password Reset (Supabase Auth).
2.  **Users**: User profile data, avatars, preferences.
3.  **Companies**: Tenant data, settings, subscription status.

## Key Decisions
-   **RLS**: Row Level Security is the primary defense mechanism.
-   **Context**: `CompanyContext` provides the current tenant ID to the entire app.
