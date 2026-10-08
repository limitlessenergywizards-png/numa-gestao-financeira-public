# Admin Domain Context

## Responsibility
Provides super-admin capabilities for managing users, companies, billing, audit logs, and system-wide analytics across the entire platform.

## Bounded Contexts
1. **Overview**: Dashboard with key metrics (users, companies, active users, pending invitations).
2. **Companies**: CRUD operations for tenant companies, company hierarchy visualization.
3. **Users & Invitations**: User management, bulk invitations, permissions, and impersonation.
4. **Audit Logs**: Comprehensive audit trail with filtering, diff viewing, and export.
5. **Billing**: Subscription management in super-admin mode.
6. **Analytics**: User engagement, activation funnels, cohort analysis.

## Key Decisions
- Tabbed interface with keyboard shortcuts (Ctrl+U for users, Ctrl+C for invites, Ctrl+L for logs).
- `isSuperAdminMode` flag restricts billing features to super-admins only.
- Lazy-loading for heavy components (CompanyNetworkMap).
