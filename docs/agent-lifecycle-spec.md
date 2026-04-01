# Agent Lifecycle Spec

## Purpose

This document defines the canonical product lifecycle for tenant agents:

- `Draft`
- `Configure`
- `Validate`
- `Launch`

It is intended to sit on top of the current technical implementation without breaking existing provisioning or production n8n workflows.

## Current State

The codebase currently uses `RecordStatus` for agents and related records:

- `DRAFT`
- `ACTIVE`
- `PAUSED`
- `DISABLED`

Today, agent creation already performs real setup work while the agent remains in `DRAFT`:

- creates the `Agent` record
- creates default `AgentConfig`
- creates required `Integration` placeholders
- creates `ToolConfig` records
- provisions workflow bindings from local templates into n8n

That means the product lifecycle and runtime status are not the same concept and should not be modeled as the same field going forward.

## Product Model

The canonical agent lifecycle is:

1. `Draft`
2. `Configure`
3. `Validate`
4. `Launch`

This lifecycle represents onboarding progress and operator readiness, not whether the runtime is currently processing traffic.

The runtime control state remains separate:

- `DRAFT`
- `ACTIVE`
- `PAUSED`
- `DISABLED`

## Separation Of Concerns

Use two parallel concepts:

- `lifecycleStage`: where the agent is in onboarding
- `runtimeStatus`: whether the agent is allowed to operate

Recommended rule:

- an agent can reach `Launch` only when it is ready to go live
- an agent becomes actually live only when `runtimeStatus = ACTIVE`

Examples:

- `lifecycleStage = CONFIGURE`, `runtimeStatus = DRAFT`: setup in progress
- `lifecycleStage = VALIDATE`, `runtimeStatus = DRAFT`: provisioned and under review
- `lifecycleStage = LAUNCH`, `runtimeStatus = ACTIVE`: launched and operating
- `lifecycleStage = LAUNCH`, `runtimeStatus = PAUSED`: launched before, currently paused

## Lifecycle Stages

### 1. Draft

Meaning:

- the agent record exists
- the template has been selected
- baseline provisioning may already run automatically

Expected system behavior:

- create the agent
- generate default config
- create integration placeholders
- provision workflow bindings from local templates

Operator goal:

- confirm the agent should exist for this tenant
- move into business-specific setup

Entry points:

- admin creates a new agent
- agent reprovision may refresh draft assets without changing stage

Exit condition:

- operator starts editing tenant-specific config or connects the first required integration

### 2. Configure

Meaning:

- tenant-specific business details are being completed
- required integrations are being connected
- workflow bindings may exist but are not yet considered validated for launch

Expected operator tasks:

- review and edit business profile
- review pricing, FAQ, coverage, and tone
- connect required integrations for the chosen template
- reprovision bindings when new credentials need to be injected

Readiness checks in this stage should surface:

- missing required integrations
- missing required business fields
- failed workflow bindings
- workflow bindings that still require credential connect

Exit condition:

- all minimum required setup for the template is complete

### 3. Validate

Meaning:

- the agent appears configured enough to launch
- the system and operator now verify that the setup is safe and usable

Validation should cover:

- required integrations connected and active
- required workflow bindings provisioned successfully
- no critical `failed:*` workflow binding states
- no required `needs_connect` bindings remaining
- required config fields present
- optional smoke test path available for the main channel

Recommended operator actions:

- inspect readiness summary
- run reprovision if credentials or bindings changed
- verify the primary inbound and outbound path
- confirm the launch checklist

Exit condition:

- readiness is true and operator approves launch

### 4. Launch

Meaning:

- the agent is approved for production use
- runtime can be activated

Expected system behavior:

- show the agent as launch-ready or launched
- allow `Activate agent`
- keep `Pause` and `Disable` as runtime controls, not onboarding controls

Important distinction:

- `Launch` is a product milestone
- `Activate` is the runtime action that turns processing on

## Readiness Model

Introduce a computed readiness model before introducing hard DB enforcement.

Recommended readiness shape:

- `isReady: boolean`
- `stage: "DRAFT" | "CONFIGURE" | "VALIDATE" | "LAUNCH"`
- `blockingIssues: string[]`
- `warnings: string[]`

Recommended minimum blocking checks for v1:

- agent has config
- required config fields are not empty
- all required integrations for the template exist
- all required integrations for the template are `ACTIVE`
- all required workflow bindings exist
- no required workflow binding has status beginning with `failed:`
- no required workflow binding has a status containing `needs_connect`

Suggested derived stage logic for v1:

- `Draft`: agent exists but setup has barely started
- `Configure`: some setup is done but blocking issues remain
- `Validate`: all blocking issues resolved, awaiting operator confirmation
- `Launch`: operator confirmed go-live

## State Transitions

Allowed lifecycle transitions:

- `Draft -> Configure`
- `Configure -> Validate`
- `Validate -> Launch`
- `Validate -> Configure`
- `Launch -> Validate`

Avoid direct transitions:

- `Draft -> Launch`
- `Draft -> Validate` unless readiness is fully derived and operator explicitly confirms

Recommended runtime transitions:

- `DRAFT -> ACTIVE`
- `ACTIVE -> PAUSED`
- `PAUSED -> ACTIVE`
- `ACTIVE -> DISABLED`
- `PAUSED -> DISABLED`

Guardrail:

- block `runtimeStatus = ACTIVE` unless lifecycle is at least `Launch`
- until that rule is enforced, the UI should warn when activating an unlaunched agent

## UI Changes

### Admin Tenant Detail

Current page shows:

- agent status
- operator controls
- config editor
- workflow bindings
- integrations

Recommended additions:

- lifecycle stage badge
- readiness summary card
- checklist of blocking items
- `Move to Validate` action
- `Launch agent` action separate from `Activate agent`

Recommended button model:

- `Reprovision workflows`
- `Move to Validate`
- `Launch agent`
- `Activate agent`
- `Pause agent`
- `Disable agent`

### Create Agent Flow

Current behavior is good and should remain template-driven.

Recommended copy change:

- `Create agent` creates a draft agent and provisions its default setup

Recommended post-create result:

- redirect operator into the tenant detail page with the agent in `Draft` or derived `Configure`

## Data Model Rollout

### Phase 1: Derived Lifecycle

No breaking schema change.

Implement lifecycle as derived application logic from:

- `Agent.status`
- agent config completeness
- integration statuses
- workflow binding statuses
- launch timestamp or manual launch marker if added

Best for:

- fast iteration
- zero migration risk
- preserving current production flows

### Phase 2: Explicit Lifecycle Field

Add an explicit DB field on `Agent`, for example:

- `lifecycleStage AgentLifecycleStage @default(DRAFT)`
- optional `launchedAt DateTime?`
- optional `validatedAt DateTime?`

Recommended enum:

- `DRAFT`
- `CONFIGURE`
- `VALIDATE`
- `LAUNCH`

Keep `status` as runtime state.

### Phase 3: Enforced Launch Gates

Once the readiness computation proves stable:

- block launch when blocking issues exist
- block activation unless launched
- record who launched and when

## API Direction

Recommended future API responsibilities:

- `PATCH /api/agents/:id`
  - update runtime status
  - update lifecycle stage through explicit actions
- readiness endpoint or helper
  - returns computed readiness summary

Recommended action vocabulary:

- `reprovision`
- `move_to_validate`
- `launch`
- `activate`
- `pause`
- `disable`

This is clearer than overloading all transitions into raw status writes.

## Recommended Implementation Order

1. Add a shared readiness evaluator in the app layer.
2. Render lifecycle stage and blocking issues in the admin tenant page.
3. Separate `Launch agent` from `Activate agent` in operator controls.
4. Add explicit lifecycle persistence in Prisma only after the flow feels correct in the UI.

## Non-Goals

This spec does not require:

- changing the template-driven provisioning approach
- editing existing production workflows in place
- discovering all workflow state from live n8n as a prerequisite

The source of truth remains:

- app backend and database for agent state
- local workflow templates for provisioning
- n8n as runtime target
