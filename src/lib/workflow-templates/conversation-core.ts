import { sanitizeTemplate, webhookPath, webhookUrl } from "./helpers";
import type { N8nWorkflowTemplate, WorkflowTemplateContext } from "./types";

export function buildConversationCoreTemplate(
  context: WorkflowTemplateContext
): N8nWorkflowTemplate {
  const template: N8nWorkflowTemplate = {
    name: "Template :: Conversation Core",
    nodes: [
      {
        parameters: {
          path: webhookPath(context, "core-message"),
          responseMode: "responseNode",
          options: {}
        },
        type: "n8n-nodes-base.webhook",
        typeVersion: 2.1,
        position: [-700, 0],
        id: "b091dff1-50fd-44f7-9538-52ed82e14b70",
        name: "Incoming Message"
      },
      {
        parameters: {
          jsCode:
            "const body = $json.body ?? $json;\nconst channel = body.channel ?? 'channel';\nconst customerEmail = body.customerEmail ?? '';\nconst text = body.normalizedText ?? body.rawText ?? body.text ?? '';\nreturn [{ json: { ...body, channel, customerEmail, text, replyMode: body.replyMode ?? 'reply' } }];"
        },
        type: "n8n-nodes-base.code",
        typeVersion: 2,
        position: [-464, 0],
        id: "2c64f316-c8cb-4c13-a7e7-5b8eb7c65744",
        name: "Normalize Payload"
      },
      {
        parameters: {
          promptType: "define",
          text: "={{ $json.text + '\\n\\nChannel: ' + $json.channel + '\\nClient email: ' + ($json.customerEmail || 'unknown') }}",
          options: {
            systemMessage:
              "=# ROLE\n\nYou are the founder-style lead response agent for a service business.\n\nToday's date is {{ $now.format('yyyy-MM-dd') }}.\nAll event dates must be in the future.\n\nYou should sound warm, direct, human, and concise.\nNever sound robotic.\n\n---\n\n# GOAL\n\nMove the lead from first contact to a booked consultation call.\n\n---\n\n# RULES\n\nAsk for missing lead details naturally.\nAlways use tools for availability and scheduling.\nNever invent availability.\nNever book a consultation without checking the calendar first.\nNever confirm a time outside the allowed consultation window from business policy.\nAlways end with a clear next step.\n\nIf the lead asks for pricing or collections, include the phrase 'collections guide' in your answer.\n\n---\n\n# TOOLS\n\nCheck_Availability: use when you have the target date and region.\nCheck_Calendar: use when the lead suggests a consultation time.\nBook_Call: use only after a specific time has been confirmed.\n\n---"
          }
        },
        type: "@n8n/n8n-nodes-langchain.agent",
        typeVersion: 3.1,
        position: [-64, 0],
        id: "d20a64db-8645-4d97-84c7-46f01f31fe7d",
        name: "AI Agent"
      },
      {
        parameters: {
          model: {
            __rl: true,
            value: "gpt-4o-mini",
            mode: "list",
            cachedResultName: "gpt-4o-mini"
          },
          builtInTools: {},
          options: {}
        },
        type: "@n8n/n8n-nodes-langchain.lmChatOpenAi",
        typeVersion: 1.3,
        position: [-176, 192],
        id: "e5b8bc3f-fcb9-49d0-b0e1-faf1f46ab05d",
        name: "OpenAI Chat Model"
      },
      {
        parameters: {
          sessionIdType: "customKey",
          sessionKey: "={{ $json.customerEmail || $json.externalThreadId || $json.channel }}",
          contextWindowLength: 50
        },
        type: "@n8n/n8n-nodes-langchain.memoryPostgresChat",
        typeVersion: 1.3,
        position: [64, 192],
        id: "fb05b35c-840c-43fd-a28f-2574c25810d4",
        name: "Postgres Chat Memory"
      },
      {
        parameters: {
          toolDescription:
            "Check date availability. Use when a date and region are known.",
          method: "POST",
          url: webhookUrl(context, "check-availability"),
          sendBody: true,
          bodyParameters: {
            parameters: [
              {
                name: "date",
                value:
                  "={{ $fromAI('date', 'Event date to check in YYYY-MM-DD format', 'string') }}"
              },
              {
                name: "region",
                value:
                  "={{ $fromAI('region', 'Coverage region code or label', 'string') }}"
              }
            ]
          },
          options: {}
        },
        type: "n8n-nodes-base.httpRequestTool",
        typeVersion: 4.4,
        position: [240, 192],
        id: "cbf43dfb-0579-41e5-9b0d-f0d31edf65cd",
        name: "Check_Availability"
      },
      {
        parameters: {
          toolDescription:
            "Check whether a consultation time is available and return nearby alternatives if needed.",
          method: "POST",
          url: webhookUrl(context, "check-calendar"),
          sendBody: true,
          bodyParameters: {
            parameters: [
              {
                name: "time_text",
                value:
                  "={{ $fromAI('time_text', 'Client exact words about when to call', 'string') }}"
              }
            ]
          },
          options: {}
        },
        type: "n8n-nodes-base.httpRequestTool",
        typeVersion: 4.4,
        position: [416, 192],
        id: "4d5ba7d4-b570-4921-9f15-8ccce86eabdb",
        name: "Check_Calendar"
      },
      {
        parameters: {
          toolDescription:
            "Book a consultation call once the client confirms a specific time.",
          method: "POST",
          url: webhookUrl(context, "book-call"),
          sendBody: true,
          bodyParameters: {
            parameters: [
              {
                name: "time_text",
                value:
                  "={{ $fromAI('time_text', 'Client exact words about when to call', 'string') }}"
              },
              {
                name: "couple_name",
                value:
                  "={{ $fromAI('couple_name', 'Names of the couple or lead', 'string') }}"
              },
              {
                name: "wedding_date",
                value:
                  "={{ $fromAI('wedding_date', 'Event date YYYY-MM-DD', 'string') }}"
              },
              {
                name: "location",
                value:
                  "={{ $fromAI('location', 'Event location or region', 'string') }}"
              },
              {
                name: "email",
                value:
                  "={{ $fromAI('email', 'Client email address', 'string') }}"
              },
              {
                name: "channel",
                value: "={{ $json.channel }}"
              }
            ]
          },
          options: {}
        },
        type: "n8n-nodes-base.httpRequestTool",
        typeVersion: 4.4,
        position: [592, 192],
        id: "cd78e509-6e7d-4a57-94ec-a64c6e75f4e4",
        name: "Book_Call"
      },
      {
        parameters: {
          jsCode:
            "const output = $json.output ?? '';\nconst sendPricing = output.toLowerCase().includes('collections guide');\nlet html = output.replace(/\\n\\n/g, '<br><br>').replace(/\\n/g, '<br>');\nhtml = html.replace(/\\[([^\\]]+)\\]\\((https?:\\/\\/[^)]+)\\)/g, '<a href=\"$2\">$1</a>');\nhtml = html.replace(/(https?:\\/\\/[^\\s<]+)/g, function(match, url, offset, str) {\n  if (str.substring(Math.max(0, offset - 6), offset) === 'href=\"') return match;\n  return '<a href=\"' + url + '\">' + url + '</a>';\n});\nif (!html.includes('__SIGNATURE_NAME__')) {\n  html += '<br><br>__SIGNATURE_NAME__<br>__SIGNATURE_TITLE__<br><a href=\"__BUSINESS_WEBSITE__\">__BUSINESS_WEBSITE__</a><br><a href=\"mailto:__BUSINESS_EMAIL__\">__BUSINESS_EMAIL__</a>';\n}\nreturn [{ json: { ...$json, sendPricing, replyText: output, replyHtml: html } }];"
        },
        type: "n8n-nodes-base.code",
        typeVersion: 2,
        position: [176, 0],
        id: "b53dd0b8-3515-4d3e-a979-b1f76977feaa",
        name: "Prepare Reply"
      },
      {
        parameters: {
          respondWith: "json",
          responseBody:
            "={{ JSON.stringify({ replyText: $json.replyText, replyHtml: $json.replyHtml, sendPricing: $json.sendPricing, customerEmail: $json.customerEmail, externalThreadId: $json.externalThreadId, channel: $json.channel }) }}"
        },
        type: "n8n-nodes-base.respondToWebhook",
        typeVersion: 1.1,
        position: [432, 0],
        id: "8c457d4e-d16b-4ac1-9d4f-92e353c5283e",
        name: "Respond"
      }
    ],
    connections: {
      "Incoming Message": {
        main: [[{ node: "Normalize Payload", type: "main", index: 0 }]]
      },
      "Normalize Payload": {
        main: [[{ node: "AI Agent", type: "main", index: 0 }]]
      },
      "OpenAI Chat Model": {
        ai_languageModel: [[{ node: "AI Agent", type: "ai_languageModel", index: 0 }]]
      },
      "Postgres Chat Memory": {
        ai_memory: [[{ node: "AI Agent", type: "ai_memory", index: 0 }]]
      },
      Check_Availability: {
        ai_tool: [[{ node: "AI Agent", type: "ai_tool", index: 0 }]]
      },
      Check_Calendar: {
        ai_tool: [[{ node: "AI Agent", type: "ai_tool", index: 0 }]]
      },
      Book_Call: {
        ai_tool: [[{ node: "AI Agent", type: "ai_tool", index: 0 }]]
      },
      "AI Agent": {
        main: [[{ node: "Prepare Reply", type: "main", index: 0 }]]
      },
      "Prepare Reply": {
        main: [[{ node: "Respond", type: "main", index: 0 }]]
      }
    }
  };

  return sanitizeTemplate(template);
}
