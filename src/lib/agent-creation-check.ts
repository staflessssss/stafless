import type { Integration, IntegrationType } from "@prisma/client";
import {
  getIntegrationLabel,
} from "@/lib/integrations";
import {
  type AgentChannel,
  getRequiredClientIntegrationsForAgentChannel
} from "@/lib/agent-channels";

type IntegrationSnapshot = Pick<Integration, "type" | "status">;

export type AgentCreationCheck = {
  canCreateAgent: boolean;
  requiredIntegrationTypes: IntegrationType[];
  connectedIntegrationTypes: IntegrationType[];
  missingIntegrationTypes: IntegrationType[];
  missingIntegrationLabels: string[];
};

export function getAgentCreationCheck(
  templateSlug: string,
  integrations: IntegrationSnapshot[],
  channel: AgentChannel = "gmail"
): AgentCreationCheck {
  const requiredIntegrationTypes = getRequiredClientIntegrationsForAgentChannel(
    templateSlug,
    channel
  );
  const connectedIntegrationTypes = requiredIntegrationTypes.filter((integrationType) =>
    integrations.some(
      (integration) =>
        integration.type === integrationType && integration.status === "ACTIVE"
    )
  );
  const missingIntegrationTypes = requiredIntegrationTypes.filter(
    (integrationType) => !connectedIntegrationTypes.includes(integrationType)
  );

  return {
    canCreateAgent: missingIntegrationTypes.length === 0,
    requiredIntegrationTypes,
    connectedIntegrationTypes,
    missingIntegrationTypes,
    missingIntegrationLabels: missingIntegrationTypes.map((type) =>
      getIntegrationLabel(type)
    )
  };
}
