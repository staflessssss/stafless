import { sanitizeTemplate, webhookPath } from "./helpers";
import type { N8nWorkflowTemplate, WorkflowTemplateContext } from "./types";

export function buildCheckAvailabilityTemplate(
  context: WorkflowTemplateContext
): N8nWorkflowTemplate {
  const template: N8nWorkflowTemplate = {
    name: "Template :: Check Availability",
    nodes: [
      {
        parameters: {
          httpMethod: "POST",
          path: webhookPath(context, "check-availability"),
          responseMode: "lastNode",
          options: {}
        },
        type: "n8n-nodes-base.webhook",
        typeVersion: 2.1,
        position: [0, 0],
        id: "0696b2db-0f7b-44d9-a669-c8bf653f0dab",
        name: "Webhook",
        webhookId: `stafless-${context.tenantSlug}-check-availability`
      },
      {
        parameters: {
          documentId: {
            __rl: true,
            value: "__BOOKINGS_SHEET_ID__",
            mode: "id"
          },
          sheetName: "Bookings",
          filtersUI: {
            values: [
              {
                lookupColumn: "date",
                lookupValue: "={{ $json.body.date }}"
              }
            ]
          },
          options: {}
        },
        type: "n8n-nodes-base.googleSheets",
        typeVersion: 4.7,
        position: [208, 0],
        id: "287a4725-188b-4336-a07a-7d47cb2520ca",
        name: "Get row(s) in sheet",
        alwaysOutputData: true
      },
      {
        parameters: {
          jsCode:
            "const items = $input.all();\nconst requestedRegion = $('Webhook').item.json.body.region;\nconst requestedDate = $('Webhook').item.json.body.date;\n\nif (!items || items.length === 0 || !items[0].json.date) {\n  return [{ json: { available: true, region: requestedRegion, date: requestedDate, booked_count: 0, reason: 'No bookings found on this date', result: `${requestedDate} is AVAILABLE in ${requestedRegion}` } }];\n}\n\nconst rows = items.map(i => i.json);\nconst bookedRows = rows.filter(row => {\n  if (row.status !== 'Booked') return false;\n  const r = (row.region || '').toLowerCase();\n  if (requestedRegion === 'FL') return r === 'fl' || r.includes('florida');\n  return r === 'nc/sc/ga' || r.includes('nc') || r.includes('ga') || r.includes('sc');\n});\n\nconst count = bookedRows.length;\nconst available = requestedRegion === 'FL' ? count === 0 : count < 2;\nconst reason = requestedRegion === 'FL'\n  ? (available ? 'No bookings in FL on this date' : `FL is fully booked (${count} booking)`)\n  : (available ? `NC/SC/GA has ${count}/2 slots used - still available` : `NC/SC/GA is fully booked (${count} bookings)`);\n\nreturn [{ json: { available, region: requestedRegion, date: requestedDate, booked_count: count, reason, result: available ? `${requestedDate} is AVAILABLE in ${requestedRegion}` : `${requestedDate} is UNAVAILABLE in ${requestedRegion}. ${reason}` } }];"
        },
        type: "n8n-nodes-base.code",
        typeVersion: 2,
        position: [416, 0],
        id: "5eb8a76e-da7e-489a-9235-7dd455832298",
        name: "Code in JavaScript",
        alwaysOutputData: true
      }
    ],
    connections: {
      Webhook: {
        main: [[{ node: "Get row(s) in sheet", type: "main", index: 0 }]]
      },
      "Get row(s) in sheet": {
        main: [[{ node: "Code in JavaScript", type: "main", index: 0 }]]
      },
      "Code in JavaScript": {
        main: [[]]
      }
    }
  };

  return sanitizeTemplate(template);
}
