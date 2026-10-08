# Support Domain Context

## Responsibility
Provides self-service support through a searchable help center with articles, documentation, and legal pages organized by category.

## Bounded Contexts
1. **Help Home**: Category-based article discovery with search.
2. **Help Articles**: Individual article pages with content.
3. **Documentation Page**: Comprehensive product documentation.
4. **Legal Page**: Terms, privacy, and legal notices.

## Key Decisions
- Static help content defined in `help-content.ts` for easy maintenance.
- Search-first UX with prominent search bar on home.
- ArticleViewer component handles markdown-like content rendering.
