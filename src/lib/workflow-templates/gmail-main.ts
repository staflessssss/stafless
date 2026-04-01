import { appApiUrl, sanitizeTemplate, webhookUrl } from "./helpers";
import type { N8nWorkflowTemplate, WorkflowTemplateContext } from "./types";

export function buildGmailMainTemplate(
  context: WorkflowTemplateContext
): N8nWorkflowTemplate {
  const runtimeMessagesUrl = context.appBaseUrl
    ? appApiUrl(context, "runtime/messages")
    : null;
  const runtimeApiKey = context.runtimeApiKey ?? "";

  const template: N8nWorkflowTemplate = {
    name: "Template :: Gmail Main Agent",
    nodes: [
      {
        parameters: {
          promptType: "define",
          text: "={{ $('Get Email').item.json.html.split('<blockquote')[0].replace(/<[^>]*>/g, '').trim() + '\\n\\nClient email: ' + $('Get Email').item.json.from.value[0].address }}",
          options: {
            systemMessage:
              "=# ROLE\n\nYou are the founder-style lead response agent for a service business.\n\nToday's date is {{ $now.format('yyyy-MM-dd') }}.\nAll event dates must be in the future.\n\nYou should sound warm, direct, human, and concise.\nNever sound robotic.\n\n---\n\n# GOAL\n\nMove the lead from first contact to a booked consultation call.\n\n---\n\n# RULES\n\nAsk for missing lead details naturally.\nAlways use tools for availability and scheduling.\nNever invent availability.\nNever book a consultation without checking the calendar first.\nNever confirm a time outside the allowed consultation window from business policy.\nAlways end with a clear next step.\n\n---\n\n# TOOLS\n\nCheck_Availability: use when you have the target date and region.\nCheck_Calendar: use when the lead suggests a consultation time.\nBook_Call: use only after a specific time has been confirmed.\n\n---"
          }
        },
        type: "@n8n/n8n-nodes-langchain.agent",
        typeVersion: 3.1,
        position: [208, -16],
        id: "ceb4f3df-3d1b-410f-9971-ebe28b59a2b9",
        name: "AI Agent"
      },
      {
        parameters: {
          rules: {
            values: [
              {
                conditions: {
                  options: {
                    caseSensitive: true,
                    leftValue: "",
                    typeValidation: "strict",
                    version: 3
                  },
                  conditions: [
                    {
                      leftValue: "={{ $json.output }}",
                      rightValue: "collections guide",
                      operator: {
                        type: "string",
                        operation: "contains"
                      },
                      id: "f13e1192-14f4-4164-b673-2a8192bf23f6"
                    }
                  ],
                  combinator: "and"
                }
              },
              {
                conditions: {
                  options: {
                    caseSensitive: true,
                    leftValue: "",
                    typeValidation: "strict",
                    version: 3
                  },
                  conditions: [
                    {
                      id: "9ae7db65-98a5-4b86-9bcc-5f39da167f3f",
                      leftValue: "",
                      rightValue: "",
                      operator: {
                        type: "string",
                        operation: "equals",
                        name: "filter.operator.equals"
                      }
                    }
                  ],
                  combinator: "and"
                }
              }
            ]
          },
          options: {}
        },
        type: "n8n-nodes-base.switch",
        typeVersion: 3.4,
        position: [736, -16],
        id: "d68b29a3-3042-424a-b506-ebff4c71d6b3",
        name: "Switch"
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
        position: [112, 176],
        id: "f34f6aed-9d9c-4089-8db9-230fc0167a21",
        name: "OpenAI Chat Model"
      },
      {
        parameters: {
          pollTimes: {
            item: [
              {
                mode: "everyX",
                unit: "minutes"
              }
            ]
          },
          simple: false,
          filters: {},
          options: {}
        },
        type: "n8n-nodes-base.gmailTrigger",
        typeVersion: 1.3,
        position: [-512, 0],
        id: "8c2435be-d6d0-4366-beaa-35617f8b8a64",
        name: "Get Email"
      },
      ...(runtimeMessagesUrl
        ? [
            {
              parameters: {
                method: "POST",
                url: runtimeMessagesUrl,
                sendHeaders: true,
                headerParameters: {
                  parameters: [
                    {
                      name: "x-runtime-key",
                      value: runtimeApiKey
                    }
                  ]
                },
                sendBody: true,
                bodyParameters: {
                  parameters: [
                    { name: "tenantSlug", value: context.tenantSlug },
                    { name: "channel", value: "gmail" },
                    {
                      name: "externalThreadId",
                      value: "={{ $json.threadId || $json.id }}"
                    },
                    {
                      name: "customerEmail",
                      value: "={{ $json.from.value[0].address }}"
                    },
                    { name: "direction", value: "inbound" },
                    { name: "senderType", value: "customer" },
                    {
                      name: "rawText",
                      value:
                        "={{ $json.html ? $json.html.split('<blockquote')[0].replace(/<[^>]*>/g, '').trim() : ($json.snippet || '') }}"
                    },
                    {
                      name: "normalizedText",
                      value:
                        "={{ $json.html ? $json.html.split('<blockquote')[0].replace(/<[^>]*>/g, '').trim() : ($json.snippet || '') }}"
                    }
                  ]
                },
                options: {}
              },
              type: "n8n-nodes-base.httpRequest",
              typeVersion: 4.2,
              position: [-512, -208],
              id: "0bb39e52-00f9-4ff8-aec5-40f3e8fd8ef1",
              name: "Log Inbound Message"
            }
          ]
        : []),
      {
        parameters: {
          operation: "download",
          fileId: {
            __rl: true,
            value: "__PRICE_GUIDE_FILE_ID__",
            mode: "id"
          },
          options: {
            binaryPropertyName: "price"
          }
        },
        type: "n8n-nodes-base.googleDrive",
        typeVersion: 3,
        position: [960, -32],
        id: "750fc4cc-9fa2-4014-b577-73b6de2ea3e4",
        name: "Download Price"
      },
      {
        parameters: {
          operation: "reply",
          messageId: "={{ $('Get Email').item.json.id }}",
          message: "={{ $json.output.replace('send_pricing()', '').trim() }}",
          options: {
            attachmentsUi: {
              attachmentsBinary: [
                {
                  property: "price"
                }
              ]
            }
          }
        },
        type: "n8n-nodes-base.gmail",
        typeVersion: 2.2,
        position: [1360, -32],
        id: "4199fdc6-9ade-4141-b8d5-27c28d33cbc8",
        name: "Send price",
        webhookId: `stafless-${context.tenantSlug}-send-price`
      },
      ...(runtimeMessagesUrl
        ? [
            {
              parameters: {
                method: "POST",
                url: runtimeMessagesUrl,
                sendHeaders: true,
                headerParameters: {
                  parameters: [
                    {
                      name: "x-runtime-key",
                      value: runtimeApiKey
                    }
                  ]
                },
                sendBody: true,
                bodyParameters: {
                  parameters: [
                    { name: "tenantSlug", value: context.tenantSlug },
                    { name: "channel", value: "gmail" },
                    {
                      name: "externalThreadId",
                      value: "={{ $('Get Email').item.json.threadId || $('Get Email').item.json.id }}"
                    },
                    {
                      name: "customerEmail",
                      value: "={{ $('Get Email').item.json.from.value[0].address }}"
                    },
                    { name: "direction", value: "outbound" },
                    { name: "senderType", value: "agent" },
                    {
                      name: "rawText",
                      value: "={{ $json.output }}"
                    },
                    {
                      name: "normalizedText",
                      value: "={{ $json.output }}"
                    },
                    {
                      name: "modelOutput",
                      value: "={{ $json.output }}"
                    }
                  ]
                },
                options: {}
              },
              type: "n8n-nodes-base.httpRequest",
              typeVersion: 4.2,
              position: [1584, -32],
              id: "a90fb7dd-f72b-4413-b567-d2ef2fe82e09",
              name: "Log Price Reply"
            }
          ]
        : []),
      {
        parameters: {
          operation: "reply",
          messageId: "={{ $('Get Email').item.json.id }}",
          message: "={{ $json.output }}",
          options: {
            appendAttribution: false,
            replyToSenderOnly: true
          }
        },
        type: "n8n-nodes-base.gmail",
        typeVersion: 2.2,
        position: [960, 208],
        id: "cadf9c04-48b5-4d6b-be97-7865eb81c4ec",
        name: "Reply mail",
        webhookId: `stafless-${context.tenantSlug}-reply-mail`
      },
      ...(runtimeMessagesUrl
        ? [
            {
              parameters: {
                method: "POST",
                url: runtimeMessagesUrl,
                sendHeaders: true,
                headerParameters: {
                  parameters: [
                    {
                      name: "x-runtime-key",
                      value: runtimeApiKey
                    }
                  ]
                },
                sendBody: true,
                bodyParameters: {
                  parameters: [
                    { name: "tenantSlug", value: context.tenantSlug },
                    { name: "channel", value: "gmail" },
                    {
                      name: "externalThreadId",
                      value: "={{ $('Get Email').item.json.threadId || $('Get Email').item.json.id }}"
                    },
                    {
                      name: "customerEmail",
                      value: "={{ $('Get Email').item.json.from.value[0].address }}"
                    },
                    { name: "direction", value: "outbound" },
                    { name: "senderType", value: "agent" },
                    {
                      name: "rawText",
                      value: "={{ $json.output }}"
                    },
                    {
                      name: "normalizedText",
                      value: "={{ $json.output }}"
                    },
                    {
                      name: "modelOutput",
                      value: "={{ $json.output }}"
                    }
                  ]
                },
                options: {}
              },
              type: "n8n-nodes-base.httpRequest",
              typeVersion: 4.2,
              position: [1184, 208],
              id: "8d6c42ad-a0ba-4827-8e68-069e7d4b4908",
              name: "Log Reply Message"
            }
          ]
        : []),
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
        position: [-336, 160],
        id: "1916bfcc-3dd3-4f1b-ac1c-e7ebc8304827",
        name: "OpenAI Chat Model1"
      },
      {
        parameters: {
          promptType: "define",
          text: "=Classify this email. Reply with ONLY one word: client or other.\n\nRules:\n- If clearly automated or spam, return other.\n- Real human messages should return client.\n- Short replies should return client.\n- When in doubt return client.\n\nFrom: {{$('Get Email').item.json.from.value[0].address}}\nSubject: {{$('Get Email').item.json.subject}}\nBody: {{$('Get Email').item.json.html.split('<blockquote')[0].replace(/<[^>]*>/g, '').trim().slice(0, 500)}}",
          batching: {}
        },
        type: "@n8n/n8n-nodes-langchain.chainLlm",
        typeVersion: 1.9,
        position: [-336, 0],
        id: "13117c74-84f5-48fd-80f6-a7a4eb5fe636",
        name: "Basic LLM Chain"
      },
      {
        parameters: {
          rules: {
            values: [
              {
                conditions: {
                  options: {
                    caseSensitive: true,
                    leftValue: "",
                    typeValidation: "strict",
                    version: 3
                  },
                  conditions: [
                    {
                      leftValue: "={{ $json.text }}",
                      rightValue: "client",
                      operator: {
                        type: "string",
                        operation: "contains"
                      },
                      id: "fbd41639-711e-4666-8663-6a05636f4e2e"
                    }
                  ],
                  combinator: "and"
                }
              }
            ]
          },
          options: {
            fallbackOutput: "extra"
          }
        },
        type: "n8n-nodes-base.switch",
        typeVersion: 3.4,
        position: [-16, 0],
        id: "6b79114f-f44e-4b42-babb-b0cc70733040",
        name: "Switch1"
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
        position: [96, 352],
        id: "7746c920-c737-4f44-b67f-2f4c27688a7c",
        name: "Check_availability"
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
        position: [240, 352],
        id: "ebeb5ee3-4d26-4034-8695-c9a056a63513",
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
                value: "gmail"
              }
            ]
          },
          options: {}
        },
        type: "n8n-nodes-base.httpRequestTool",
        typeVersion: 4.4,
        position: [368, 352],
        id: "acb98ebf-0023-4d24-b0c2-64d6424f0653",
        name: "Book_call"
      },
      {
        parameters: {
          sessionIdType: "customKey",
          sessionKey: "={{ $('Get Email').item.json.from.value[0].address }}",
          contextWindowLength: 50
        },
        type: "@n8n/n8n-nodes-langchain.memoryPostgresChat",
        typeVersion: 1.3,
        position: [240, 176],
        id: "ec4c0a6a-66de-4a40-ab3d-d8e7b86d5403",
        name: "Postgres Chat Memory"
      },
      {
        parameters: {
          jsCode:
            "const output = $input.item.json.output;\nlet html = output.replace(/\\n\\n/g, '<br><br>').replace(/\\n/g, '<br>');\nhtml = html.replace(/\\[([^\\]]+)\\]\\((https?:\\/\\/[^)]+)\\)/g, '<a href=\"$2\">$1</a>');\nhtml = html.replace(/(https?:\\/\\/[^\\s<]+)/g, function(match, url, offset, str) {\n  if (str.substring(Math.max(0, offset - 6), offset) === 'href=\"') return match;\n  return '<a href=\"' + url + '\">' + url + '</a>';\n});\nif (!html.includes('__SIGNATURE_NAME__')) {\n  html += '<br><br>__SIGNATURE_NAME__<br>__SIGNATURE_TITLE__<br><a href=\"__BUSINESS_WEBSITE__\">__BUSINESS_WEBSITE__</a><br><a href=\"mailto:__BUSINESS_EMAIL__\">__BUSINESS_EMAIL__</a>';\n}\nreturn [{ json: { ...$input.item.json, output: html } }];"
        },
        type: "n8n-nodes-base.code",
        typeVersion: 2,
        position: [560, -16],
        id: "1a6424e1-71f3-468b-b6cb-e5a044bfc5f1",
        name: "Code in JavaScript"
      },
      {
        parameters: {
          jsCode:
            "const item = $input.item;\nconst output = item.json.output;\nlet html = output.replace(/\\n\\n/g, '<br><br>').replace(/\\n/g, '<br>');\nhtml = html.replace(/\\[([^\\]]+)\\]\\((https?:\\/\\/[^)]+)\\)/g, '<a href=\"$2\">$1</a>');\nhtml = html.replace(/(https?:\\/\\/[^\\s<]+)/g, function(match, url, offset, str) {\n  if (str.substring(Math.max(0, offset - 6), offset) === 'href=\"') return match;\n  return '<a href=\"' + url + '\">' + url + '</a>';\n});\nif (!html.includes('__SIGNATURE_NAME__')) {\n  html += '<br><br>__SIGNATURE_NAME__<br>__SIGNATURE_TITLE__<br><a href=\"__BUSINESS_WEBSITE__\">__BUSINESS_WEBSITE__</a><br><a href=\"mailto:__BUSINESS_EMAIL__\">__BUSINESS_EMAIL__</a>';\n}\nreturn [{ json: { ...item.json, output: html }, binary: item.binary }];"
        },
        type: "n8n-nodes-base.code",
        typeVersion: 2,
        position: [1152, -32],
        id: "5842a760-cd81-4017-80d5-11ff20769e00",
        name: "Code in JavaScript1"
      }
    ],
    connections: {
      "AI Agent": {
        main: [[{ node: "Code in JavaScript", type: "main", index: 0 }]]
      },
      Switch: {
        main: [
          [{ node: "Download Price", type: "main", index: 0 }],
          [{ node: "Reply mail", type: "main", index: 0 }]
        ]
      },
      "OpenAI Chat Model": {
        ai_languageModel: [[{ node: "AI Agent", type: "ai_languageModel", index: 0 }]]
      },
      "Get Email": {
        main: [[
          { node: "Basic LLM Chain", type: "main", index: 0 },
          ...(runtimeMessagesUrl
            ? [{ node: "Log Inbound Message", type: "main", index: 0 }]
            : [])
        ]]
      },
      "Download Price": {
        main: [[{ node: "Code in JavaScript1", type: "main", index: 0 }]]
      },
      "OpenAI Chat Model1": {
        ai_languageModel: [[{ node: "Basic LLM Chain", type: "ai_languageModel", index: 0 }]]
      },
      "Basic LLM Chain": {
        main: [[{ node: "Switch1", type: "main", index: 0 }]]
      },
      Switch1: {
        main: [[{ node: "AI Agent", type: "main", index: 0 }]]
      },
      Check_availability: {
        ai_tool: [[{ node: "AI Agent", type: "ai_tool", index: 0 }]]
      },
      Check_Calendar: {
        ai_tool: [[{ node: "AI Agent", type: "ai_tool", index: 0 }]]
      },
      Book_call: {
        ai_tool: [[{ node: "AI Agent", type: "ai_tool", index: 0 }]]
      },
      "Postgres Chat Memory": {
        ai_memory: [[{ node: "AI Agent", type: "ai_memory", index: 0 }]]
      },
      "Code in JavaScript": {
        main: [[{ node: "Switch", type: "main", index: 0 }]]
      },
      "Code in JavaScript1": {
        main: [[{ node: "Send price", type: "main", index: 0 }]]
      },
      ...(runtimeMessagesUrl
        ? {
            "Send price": {
              main: [[{ node: "Log Price Reply", type: "main", index: 0 }]]
            },
            "Reply mail": {
              main: [[{ node: "Log Reply Message", type: "main", index: 0 }]]
            }
          }
        : {})
    }
  };

  return sanitizeTemplate(template);
}
