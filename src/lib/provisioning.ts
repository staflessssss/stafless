import { db } from "@/lib/db";
import { applyAgentSetup } from "@/lib/agent-provisioning";
import { myndfulConfig } from "@/lib/myndful-config";
import { weddingLeadAgentBasePrompt } from "@/lib/prompt-templates";

export async function createMyndfulTenantSetup() {
  const template = await db.agentTemplate.upsert({
    where: { slug: "wedding-lead-agent" },
    update: {},
    create: {
      name: "Wedding Lead Agent",
      slug: "wedding-lead-agent",
      niche: "wedding",
      basePrompt: weddingLeadAgentBasePrompt,
      defaultTools: ["check_availability", "check_calendar", "book_call"],
      defaultChannels: ["gmail", "instagram"],
      workflowTemplateMap: {}
    }
  });

  const tenant = await db.tenant.upsert({
    where: { slug: "myndful-films" },
    update: {
      name: "Myndful Films",
      timezone: "America/New_York",
      status: "ACTIVE"
    },
    create: {
      name: "Myndful Films",
      slug: "myndful-films",
      timezone: "America/New_York",
      status: "ACTIVE"
    }
  });

  const agent = await db.agent.upsert({
    where: {
      tenantId_name: {
        tenantId: tenant.id,
        name: "Taras Sales Agent"
      }
    },
    update: {
      templateId: template.id,
      status: "ACTIVE"
    },
    create: {
      tenantId: tenant.id,
      templateId: template.id,
      name: "Taras Sales Agent",
      status: "ACTIVE"
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
    },
    configOverrides: myndfulConfig,
    additionalWorkflowKeys: ["send_reply"]
  });

  return {
    tenant,
    template,
    agent
  };
}
