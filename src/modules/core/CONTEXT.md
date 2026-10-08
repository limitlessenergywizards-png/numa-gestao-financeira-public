# Core Domain Context

## Responsibility
Contains cross-cutting pages that don't belong to any specific business domain, such as error pages and fallback routes.

## Bounded Contexts
1. **NotFound Page**: 404 error page for unmatched routes.

## Key Decisions
- Kept minimal - only truly domain-agnostic pages belong here.
- Domain-specific pages should live in their respective modules.
