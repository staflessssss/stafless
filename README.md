# Stafless

Multi-tenant AI agent platform for client communication, scheduling, and workflow-backed actions.

## Recommended stack

- Next.js
- TypeScript
- Prisma
- Postgres or Supabase Postgres
- n8n API for workflow provisioning

## First tenant

The first tenant in this repository is `Myndful Films`, used as the canonical example for a wedding lead-response agent.

## Core concepts

- `tenant`: customer business
- `agent_template`: reusable niche template
- `agent`: a concrete agent instance for a tenant
- `agent_config`: tenant-specific business rules and tone
- `tool_config`: tool-level configuration
- `workflow_binding`: mapping between product workflows and n8n workflow IDs

## Product lifecycle

The canonical onboarding lifecycle for an agent is:

- `Draft`
- `Configure`
- `Validate`
- `Launch`

The current implementation details and rollout plan are documented in [docs/agent-lifecycle-spec.md](./docs/agent-lifecycle-spec.md).

## Next setup steps

1. Install Node.js 20+ and npm or pnpm.
2. Copy `.env.example` to `.env`.
3. Set `DATABASE_URL`, `N8N_BASE_URL`, and `N8N_API_KEY`.
4. Run Prisma generate and migrations.
5. Seed the database with the Myndful Films example tenant.
