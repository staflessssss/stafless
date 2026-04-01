import type { Prisma, RecordStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { requiredIntegrationsForTemplate } from "@/lib/integrations";
import { provisionWorkflowBinding } from "@/lib/n8n";
import { buildDefaultAgentConfig } from "@/lib/templates";
import type { AgentConfig } from "@/types/agent-config";

type AgentSetupDefaults = ReturnType<typeof buildDefaultAgentConfig>;

type AgentSetupInput = {
  tenant: {
    id: string;
    name: string;
    slug: string;
  };
  agent: {
    id: string;
    name: string;
  };
  template: {
    id: string;
    slug: string;
    defaultTools: Prisma.JsonValue;
  };
  configOverrides?: AgentConfig;
  additionalWorkflowKeys?: string[];
};

function normalizeToolNames(defaultTools: Prisma.JsonValue) {
  return Array.isArray(defaultTools)
    ? defaultTools.filter((tool): tool is string => typeof tool === "string")
    : [];
}

function buildWorkflowKeys(input: {
  defaultTools: Prisma.JsonValue;
  additionalWorkflowKeys?: string[];
}) {
  return Array.from(
    new Set([
      "handle_incoming_message",
      ...normalizeToolNames(input.defaultTools),
      ...(input.additionalWorkflowKeys ?? [])
    ])
  );
}

function normalizeConfig(config: AgentSetupDefaults | AgentConfig): AgentSetupDefaults {
  return {
    businessName: config.businessName,
    ownerName: config.ownerName,
    website: config.website,
    contactEmail: config.contactEmail,
    signature: config.signature,
    brandVoice: config.brandVoice,
    businessRules: config.businessRules,
    coverageRules: config.coverageRules,
    pricing: config.pricing,
    faq: config.faq,
    portfolioLinks: config.portfolioLinks,
    reviewsLink: config.reviewsLink ?? null
  };
}

export async function applyAgentSetup(input: AgentSetupInput) {
  const defaults = normalizeConfig(
    input.configOverrides ??
      buildDefaultAgentConfig({
        tenantName: input.tenant.name,
        templateSlug: input.template.slug
      })
  );

  await db.agentConfig.upsert({
    where: { agentId: input.agent.id },
    update: {
      businessName: defaults.businessName,
      ownerName: defaults.ownerName,
      website: defaults.website,
      contactEmail: defaults.contactEmail,
      signature: defaults.signature,
      brandVoice: defaults.brandVoice,
      businessRules: defaults.businessRules,
      coverageRules: defaults.coverageRules,
      pricing: defaults.pricing,
      faq: defaults.faq,
      portfolioLinks: defaults.portfolioLinks,
      reviewsLink: defaults.reviewsLink
    },
    create: {
      agentId: input.agent.id,
      businessName: defaults.businessName,
      ownerName: defaults.ownerName,
      website: defaults.website,
      contactEmail: defaults.contactEmail,
      signature: defaults.signature,
      brandVoice: defaults.brandVoice,
      businessRules: defaults.businessRules,
      coverageRules: defaults.coverageRules,
      pricing: defaults.pricing,
      faq: defaults.faq,
      portfolioLinks: defaults.portfolioLinks,
      reviewsLink: defaults.reviewsLink
    }
  });

  const requiredIntegrations = requiredIntegrationsForTemplate(input.template.slug);

  const integrations = await Promise.all(
    requiredIntegrations.map((type) =>
      db.integration.upsert({
        where: {
          tenantId_type: {
            tenantId: input.tenant.id,
            type
          }
        },
        update: {},
        create: {
          tenantId: input.tenant.id,
          type,
          status: "DRAFT"
        }
      })
    )
  );

  const toolNames = normalizeToolNames(input.template.defaultTools);

  await Promise.all(
    toolNames.map((toolName) =>
      db.toolConfig.upsert({
        where: {
          agentId_toolName: {
            agentId: input.agent.id,
            toolName
          }
        },
        update: {
          enabled: true,
          config: {}
        },
        create: {
          agentId: input.agent.id,
          toolName,
          enabled: true,
          config: {}
        }
      })
    )
  );

  const workflowKeys = buildWorkflowKeys({
    defaultTools: input.template.defaultTools,
    additionalWorkflowKeys: input.additionalWorkflowKeys
  });

  await Promise.all(
    workflowKeys.map(async (workflowKey) => {
      try {
        const provisioned = await provisionWorkflowBinding({
          tenantId: input.tenant.id,
          agentId: input.agent.id,
          workflowKey,
          tenantSlug: input.tenant.slug,
          agentName: input.agent.name,
          integrations,
          businessContext: {
            businessName: defaults.businessName,
            website: defaults.website,
            contactEmail: defaults.contactEmail,
            signature: defaults.signature
          }
        });

        await db.workflowBinding.upsert({
          where: {
            agentId_workflowKey: {
              agentId: input.agent.id,
              workflowKey
            }
          },
          update: {
            tenantId: input.tenant.id,
            n8nWorkflowId: provisioned.n8nWorkflowId,
            status: provisioned.status
          },
          create: {
            tenantId: input.tenant.id,
            agentId: input.agent.id,
            workflowKey,
            n8nWorkflowId: provisioned.n8nWorkflowId,
            status: provisioned.status
          }
        });
      } catch (error) {
        const message =
          error instanceof Error ? error.message.slice(0, 180) : "Unknown error";

        await db.workflowBinding.upsert({
          where: {
            agentId_workflowKey: {
              agentId: input.agent.id,
              workflowKey
            }
          },
          update: {
            tenantId: input.tenant.id,
            n8nWorkflowId: null,
            status: `failed:${message}`
          },
          create: {
            tenantId: input.tenant.id,
            agentId: input.agent.id,
            workflowKey,
            n8nWorkflowId: null,
            status: `failed:${message}`
          }
        });
      }
    })
  );
}

export async function provisionAgent(params: {
  tenantId: string;
  templateId: string;
  name: string;
  status?: RecordStatus;
}) {
  const tenant = await db.tenant.findUnique({
    where: { id: params.tenantId }
  });

  if (!tenant) {
    throw new Error("Tenant not found.");
  }

  const template = await db.agentTemplate.findUnique({
    where: { id: params.templateId }
  });

  if (!template) {
    throw new Error("Template not found.");
  }

  const agent = await db.agent.create({
    data: {
      tenantId: params.tenantId,
      templateId: params.templateId,
      name: params.name,
      status: params.status ?? "DRAFT"
    }
  });

  await applyAgentSetup({
    tenant: {
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug
    },
    agent: {
      id: agent.id,
      name: agent.name
    },
    template: {
      id: template.id,
      slug: template.slug,
      defaultTools: template.defaultTools
    }
  });

  return agent;
}

export async function reprovisionAgent(params: {
  agentId: string;
  workflowKeys?: string[];
}) {
  const agent = await db.agent.findUnique({
    where: { id: params.agentId },
    include: {
      tenant: true,
      template: true,
      config: true
    }
  });

  if (!agent) {
    throw new Error("Agent not found.");
  }

  await applyAgentSetup({
    tenant: {
      id: agent.tenant.id,
      name: agent.tenant.name,
      slug: agent.tenant.slug
    },
    agent: {
      id: agent.id,
      name: agent.name
    },
    template: {
      id: agent.template.id,
      slug: agent.template.slug,
      defaultTools: agent.template.defaultTools
    },
    configOverrides: agent.config
      ? {
          businessName: agent.config.businessName,
          ownerName: agent.config.ownerName,
          website: agent.config.website,
          contactEmail: agent.config.contactEmail,
          signature: agent.config.signature,
          brandVoice: agent.config.brandVoice as AgentConfig["brandVoice"],
          businessRules: agent.config.businessRules as AgentConfig["businessRules"],
          coverageRules: agent.config.coverageRules as AgentConfig["coverageRules"],
          pricing: agent.config.pricing as AgentConfig["pricing"],
          faq: agent.config.faq as AgentConfig["faq"],
          portfolioLinks: agent.config.portfolioLinks as AgentConfig["portfolioLinks"],
          reviewsLink: agent.config.reviewsLink ?? undefined
        }
      : undefined,
    additionalWorkflowKeys: params.workflowKeys
  });

  return db.agent.findUnique({
    where: { id: agent.id },
    include: {
      workflows: {
        orderBy: {
          workflowKey: "asc"
        }
      }
    }
  });
}
