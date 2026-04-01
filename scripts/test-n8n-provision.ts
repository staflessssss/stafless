import { createN8nWorkflow } from "../src/lib/n8n";
import { buildCheckCalendarTemplate } from "../src/lib/workflow-templates/check-calendar";
import { buildBookCallTemplate } from "../src/lib/workflow-templates/book-call";

async function main() {
  const context = {
    tenantSlug: "debug-tenant",
    workflowKey: "debug",
    n8nBaseUrl: process.env.N8N_BASE_URL ?? "https://example.n8n.local"
  };

  const templates = [
    { key: "check_calendar", template: buildCheckCalendarTemplate(context) },
    { key: "book_call", template: buildBookCallTemplate(context) }
  ];

  for (const item of templates) {
    try {
      const created = await createN8nWorkflow({
        name: `debug :: ${item.key} :: ${Date.now()}`,
        nodes: item.template.nodes,
        connections: item.template.connections,
        settings: item.template.settings
      });

      console.log(item.key, "created", created.id, created.name);
    } catch (error) {
      console.error(item.key, "failed");
      console.error(error);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
