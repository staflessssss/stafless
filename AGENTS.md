# Project Instructions

## Product Direction

This project is a multi-tenant AI agent platform for service businesses.
The first canonical tenant is Myndful Films.

The core product model is:
- one reusable agent template
- tenant-specific config
- shared tool workflows
- channel adapters such as Gmail and Instagram
- n8n as the workflow runtime and provisioning target

## Workflow Strategy

Do not treat each new client as a custom automation project.

Prefer:
- template-driven provisioning
- tenant config in the application database
- workflow creation from known template assets
- minimal tenant-specific edits to workflow JSON

Avoid:
- manually cloning and editing workflows per tenant
- hardcoding client data in app logic
- depending on live n8n UI inspection for normal provisioning

## Current State

Provisioning currently creates these workflow roles from local templates:
- handle_incoming_message
- check_availability
- check_calendar
- book_call

The application stores workflow bindings per tenant and agent.

## Priorities

When making changes, prioritize:
1. reliability of create-agent provisioning
2. tenant config and template architecture
3. safe integration with n8n API
4. preserving existing user workflows

## Safety

Never modify or delete existing production workflows unless explicitly requested.
Prefer creating new workflows or new workflow versions for testing.
