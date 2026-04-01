import type { Integration, IntegrationType } from "@prisma/client";
import {
  getIntegrationLabel,
  requiredClientIntegrationsForTemplate
} from "@/lib/integrations";

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
  integrations: IntegrationSnapshot[]
): AgentCreationCheck {
  const requiredIntegrationTypes = requiredClientIntegrationsForTemplate(templateSlug);
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
