import { db } from "../src/lib/db";
import { provisionAgent } from "../src/lib/agent-provisioning";

async function main() {
  const template = await db.agentTemplate.findUnique({
    where: { slug: "wedding-lead-agent" }
  });

  if (!template) {
    throw new Error("Template not found.");
  }

  const suffix = Date.now().toString().slice(-6);
  const tenant = await db.tenant.create({
    data: {
      name: `E2E Tenant ${suffix}`,
      slug: `e2e-tenant-${suffix}`,
      timezone: "America/New_York",
      status: "DRAFT"
    }
  });

  const agent = await provisionAgent({
    tenantId: tenant.id,
    templateId: template.id,
    name: `E2E Agent ${suffix}`
  });

  const bindings = await db.workflowBinding.findMany({
    where: {
      agentId: agent.id
    },
    orderBy: {
      workflowKey: "asc"
    }
  });

  console.log(
    JSON.stringify(
      {
        tenant: {
          id: tenant.id,
          slug: tenant.slug
        },
        agent: {
          id: agent.id,
          name: agent.name
        },
        bindings: bindings.map((binding) => ({
          workflowKey: binding.workflowKey,
          status: binding.status,
          n8nWorkflowId: binding.n8nWorkflowId
        }))
      },
      null,
      2
    )
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
