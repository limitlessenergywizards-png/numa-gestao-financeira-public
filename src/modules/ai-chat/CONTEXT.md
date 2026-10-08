# AI Chat Domain Context

## Responsibility
Implements an AI-powered financial consultant that provides real-time analysis and recommendations based on company financial data using multi-turn conversations.

## Bounded Contexts
1. **Chat Interface**: Multi-message conversation with AI, conversation history sidebar.
2. **Proactive Alerts**: Context-aware financial warnings (cash risk, overdue accounts).
3. **Suggested Questions**: Pre-built prompts for common financial queries.
4. **Conversation Management**: Create, rename, archive, delete conversations with persistent storage.

## Key Decisions
- Integrates real-time financial context from the company's data (balance, payables, receivables).
- Provides 6 suggested question categories focused on actionable financial problems.
- Shows proactive alerts when critical conditions are detected.
