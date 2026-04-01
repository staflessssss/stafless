import type {
  AgentConfig,
  AgentTemplate,
  Integration,
  RecordStatus,
  WorkflowBinding
} from "@prisma/client";
import { getIntegrationLabel, requiredIntegrationsForTemplate } from "@/lib/integrations";

type AgentLaunchCheckInput = {
  status: RecordStatus;
  template: Pick<AgentTemplate, "slug">;
  config: AgentConfig | null;
  integrations: Pick<Integration, "type" | "status">[];
  workflows: Pick<WorkflowBinding, "workflowKey" | "status" | "n8nWorkflowId">[];
};

export type AgentLaunchCheck = {
  stage: "Draft" | "Configure" | "Validate" | "Launch";
  canLaunch: boolean;
  blockingItems: string[];
  notes: string[];
};

function hasValue(value: string | null | undefined) {
  return Boolean(value && value.trim().length > 0);
}

export function getAgentLaunchCheck(input: AgentLaunchCheckInput): AgentLaunchCheck {
  const blockingItems: string[] = [];
  const notes: string[] = [];

  if (!input.config) {
    blockingItems.push("Business profile has not been created yet.");
  } else {
    if (!hasValue(input.config.businessName)) {
      blockingItems.push("Business name is empty.");
    }

    if (!hasValue(input.config.ownerName)) {
      blockingItems.push("Owner name is empty.");
    }

    if (!hasValue(input.config.website)) {
      blockingItems.push("Website is empty.");
    }

    if (!hasValue(input.config.contactEmail)) {
      blockingItems.push("Contact email is empty.");
    }

    if (!hasValue(input.config.signature)) {
      blockingItems.push("Email signature is empty.");
    }
  }

  const requiredIntegrations = requiredIntegrationsForTemplate(input.template.slug);

  for (const integrationType of requiredIntegrations) {
    const integration = input.integrations.find((item) => item.type === integrationType);
    const label = getIntegrationLabel(integrationType);

    if (!integration) {
      blockingItems.push(`${label} is required but has not been created yet.`);
      continue;
    }

    if (integration.status !== "ACTIVE") {
      blockingItems.push(`${label} is not connected yet.`);
    }
  }

  if (input.workflows.length === 0) {
    blockingItems.push("No workflows have been provisioned for this agent yet.");
  }

  for (const workflow of input.workflows) {
    if (!workflow.n8nWorkflowId) {
      blockingItems.push(`Workflow "${workflow.workflowKey}" does not have an n8n workflow ID yet.`);
    }

    if (workflow.status.startsWith("failed:")) {
      blockingItems.push(`Workflow "${workflow.workflowKey}" failed during provisioning.`);
    }

    if (workflow.status.includes("needs_connect")) {
      blockingItems.push(
        `Workflow "${workflow.workflowKey}" still needs a tenant integration before it can run.`
      );
    }
  }

  if (input.status === "ACTIVE") {
    notes.push("Runtime is already active.");
  }

  if (input.status === "PAUSED") {
    notes.push("Agent was launched before and is currently paused.");
  }

  if (input.status === "DISABLED") {
    notes.push("Agent is disabled and will need operator action before going live again.");
  }

  if (blockingItems.length > 0) {
    const stage = input.config ? "Configure" : "Draft";

    return {
      stage,
      canLaunch: false,
      blockingItems,
      notes
    };
  }

  if (input.status === "ACTIVE" || input.status === "PAUSED") {
    return {
      stage: "Launch",
      canLaunch: true,
      blockingItems,
      notes
    };
  }

  notes.push("Core setup looks complete. Final operator review is the next step.");

  return {
    stage: "Validate",
    canLaunch: true,
    blockingItems,
    notes
  };
}
