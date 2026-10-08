# src/

See [ARCHITECTURE.md](../ARCHITECTURE.md) for full documentation.

## Quick Reference

| Directory | Purpose |
|:---|:---|
| `features/` | Domain modules — all business logic lives here |
| `shared/` | Reusable hooks, utils, components |
| `ui/` | Design system primitives (shadcn/ui) |
| `infrastructure/` | Supabase, caching, monitoring, i18n |
| `pages/` | Route entry points (thin wrappers) |
| `app/` | App shell, routing, providers |

## Creating a New Feature

```bash
mkdir -p src/features/my-feature/{components,hooks,services}
touch src/features/my-feature/index.ts
touch src/features/my-feature/types.ts
```

Export everything through `index.ts` — that's the only file other modules can import from.
