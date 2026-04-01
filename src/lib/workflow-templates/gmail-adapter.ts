import { appApiUrl, sanitizeTemplate, webhookPath, webhookUrl } from "./helpers";
import type { N8nWorkflowTemplate, WorkflowTemplateContext } from "./types";

export function buildGmailAdapterTemplate(
  context: WorkflowTemplateContext
): N8nWorkflowTemplate {
  const runtimeMessagesUrl = context.appBaseUrl
    ? appApiUrl(context, "runtime/messages")
    : null;
  const runtimeApiKey = context.runtimeApiKey ?? "";

  const template: N8nWorkflowTemplate = {
    name: "Template :: Gmail Adapter",
    nodes: [
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
        position: [-704, 32],
        id: "bc2e0ed9-fc16-421f-a580-f79193911ab4",
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
              position: [-704, -176],
              id: "818cecf7-18c2-4048-b0c2-9137ff9baf8c",
              name: "Log Inbound Message"
            }
          ]
        : []),
      {
        parameters: {
          method: "POST",
          url: webhookUrl(context, "core-message"),
          sendBody: true,
          specBody: "json",
          jsonBody:
            "={{ JSON.stringify({ channel: 'gmail', externalThreadId: $json.threadId || $json.id, customerEmail: $json.from.value[0].address, normalizedText: $json.html ? $json.html.split('<blockquote')[0].replace(/<[^>]*>/g, '').trim() : ($json.snippet || ''), rawText: $json.html ? $json.html.split('<blockquote')[0].replace(/<[^>]*>/g, '').trim() : ($json.snippet || '') }) }}",
          options: {}
        },
        type: "n8n-nodes-base.httpRequest",
        typeVersion: 4.2,
        position: [-416, 32],
        id: "3d13b79d-c754-4159-8af7-d691c34b31ea",
        name: "Run Conversation Core"
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
                    version: 2
                  },
                  conditions: [
                    {
                      leftValue: "={{ $json.sendPricing }}",
                      rightValue: true,
                      operator: {
                        type: "boolean",
                        operation: "true"
                      }
                    }
                  ],
                  combinator: "and"
                }
              }
            ]
          },
          options: {
            fallbackOutput: "reply"
          }
        },
        type: "n8n-nodes-base.switch",
        typeVersion: 3.4,
        position: [-144, 32],
        id: "ef37aa8c-c4cf-4d40-a523-fe96af38bce1",
        name: "Needs Pricing Attachment"
      },
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
        position: [128, -96],
        id: "99b93c0f-c918-4f9e-8807-78a4d306d3c0",
        name: "Download Price"
      },
      {
        parameters: {
          operation: "reply",
          messageId: "={{ $('Get Email').item.json.id }}",
          message: "={{ $json.replyHtml.replace('collections guide', '').trim() }}",
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
        position: [384, -96],
        id: "3c3d5cde-0991-42ce-b7fd-c041fa7147e1",
        name: "Send Price Reply"
      },
      {
        parameters: {
          operation: "reply",
          messageId: "={{ $('Get Email').item.json.id }}",
          message: "={{ $json.replyHtml }}",
          options: {
            appendAttribution: false,
            replyToSenderOnly: true
          }
        },
        type: "n8n-nodes-base.gmail",
        typeVersion: 2.2,
        position: [128, 160],
        id: "afca1cbf-8f03-4fba-867c-934eb1ef10ce",
        name: "Reply Mail"
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
                      value: "={{ $json.replyText || $json.replyHtml }}"
                    },
                    {
                      name: "normalizedText",
                      value: "={{ $json.replyText || $json.replyHtml }}"
                    },
                    {
                      name: "modelOutput",
                      value: "={{ $json.replyText || $json.replyHtml }}"
                    }
                  ]
                },
                options: {}
              },
              type: "n8n-nodes-base.httpRequest",
              typeVersion: 4.2,
              position: [640, -96],
              id: "a48a9f71-4c7b-40d2-86b0-f0937560cb4e",
              name: "Log Price Reply"
            },
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
                      value: "={{ $json.replyText || $json.replyHtml }}"
                    },
                    {
                      name: "normalizedText",
                      value: "={{ $json.replyText || $json.replyHtml }}"
                    },
                    {
                      name: "modelOutput",
                      value: "={{ $json.replyText || $json.replyHtml }}"
                    }
                  ]
                },
                options: {}
              },
              type: "n8n-nodes-base.httpRequest",
              typeVersion: 4.2,
              position: [384, 160],
              id: "61643fd4-9d98-452a-bdfe-d7fd61d98d49",
              name: "Log Reply"
            }
          ]
        : [])
    ],
    connections: {
      "Get Email": {
        main: [[
          { node: "Run Conversation Core", type: "main", index: 0 },
          ...(runtimeMessagesUrl
            ? [{ node: "Log Inbound Message", type: "main", index: 0 }]
            : [])
        ]]
      },
      "Run Conversation Core": {
        main: [[{ node: "Needs Pricing Attachment", type: "main", index: 0 }]]
      },
      "Needs Pricing Attachment": {
        main: [
          [{ node: "Download Price", type: "main", index: 0 }],
          [{ node: "Reply Mail", type: "main", index: 0 }]
        ]
      },
      "Download Price": {
        main: [[{ node: "Send Price Reply", type: "main", index: 0 }]]
      },
      ...(runtimeMessagesUrl
        ? {
            "Send Price Reply": {
              main: [[{ node: "Log Price Reply", type: "main", index: 0 }]]
            },
            "Reply Mail": {
              main: [[{ node: "Log Reply", type: "main", index: 0 }]]
            }
          }
        : {})
    }
  };

  return sanitizeTemplate(template);
}
