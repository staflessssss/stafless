import { sanitizeTemplate, webhookPath } from "./helpers";
import type { N8nWorkflowTemplate, WorkflowTemplateContext } from "./types";

export function buildBookCallTemplate(
  context: WorkflowTemplateContext
): N8nWorkflowTemplate {
  const template: N8nWorkflowTemplate = {
    name: "Template :: Book Call",
    nodes: [
      {
        parameters: {
          httpMethod: "POST",
          path: webhookPath(context, "book-call"),
          responseMode: "responseNode",
          options: {}
        },
        type: "n8n-nodes-base.webhook",
        typeVersion: 2.1,
        position: [-656, 80],
        id: "0a928d26-ee17-4e17-b69c-d0590f5b29be",
        name: "Webhook",
        webhookId: `stafless-${context.tenantSlug}-book-call`
      },
      {
        parameters: {
          jsCode:
            "const now = new Date();\nconst body = $json.body;\nconst text = (body.time_text || '').toLowerCase();\nconst couple = body.couple_name || 'Client';\nconst weddingDate = body.wedding_date || '';\nconst location = body.location || '';\nconst email = body.email || '';\nconst channel = body.channel || '';\nlet targetDate = new Date(now);\nif (text.includes('day after tomorrow')) targetDate.setDate(targetDate.getDate() + 2);\nelse if (text.includes('tomorrow')) targetDate.setDate(targetDate.getDate() + 1);\nelse if (!text.includes('today')) {\n  const days = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];\n  const foundDay = days.findIndex(d => text.includes(d));\n  if (foundDay !== -1) {\n    let diff = foundDay - targetDate.getDay();\n    if (diff <= 0) diff += 7;\n    targetDate.setDate(targetDate.getDate() + diff);\n  }\n}\nlet hours = 14;\nlet minutes = 0;\nconst timeMatch = text.match(/(\\d{1,2})(?::(\\d{2}))?\\s*(am|pm)?/i);\nif (timeMatch) {\n  hours = parseInt(timeMatch[1]);\n  minutes = parseInt(timeMatch[2] || '0');\n  const ampm = (timeMatch[3] || '').toLowerCase();\n  if (ampm === 'pm' && hours < 12) hours += 12;\n  if (ampm === 'am' && hours === 12) hours = 0;\n  if (!ampm && hours >= 1 && hours <= 7) hours += 12;\n}\nconst y = targetDate.getFullYear();\nconst m = String(targetDate.getMonth() + 1).padStart(2, '0');\nconst d = String(targetDate.getDate()).padStart(2, '0');\nconst h = String(hours).padStart(2, '0');\nconst min = String(minutes).padStart(2, '0');\nconst eventMonth = parseInt(m);\nconst isDST = eventMonth >= 3 && eventMonth <= 10;\nconst offset = isDST ? '-04:00' : '-05:00';\nconst startTime = `${y}-${m}-${d}T${h}:${min}:00${offset}`;\nconst endHours = minutes + 30 >= 60 ? hours + 1 : hours;\nconst endMinutes = (minutes + 30) % 60;\nconst endTime = `${y}-${m}-${d}T${String(endHours).padStart(2,'0')}:${String(endMinutes).padStart(2,'0')}:00${offset}`;\nconst callDate = `${y}-${m}-${d}`;\nconst callTime = `${h}:${min}`;\nconst summary = `Consultation Call with ${couple}` + (weddingDate ? ` - Wedding ${weddingDate}` : '');\nreturn [{ json: { start_time: startTime, end_time: endTime, summary, call_date: callDate, call_time: callTime, couple_name: couple, wedding_date: weddingDate, location, email, channel } }];"
        },
        type: "n8n-nodes-base.code",
        typeVersion: 2,
        position: [-448, 80],
        id: "4bfc05e0-578c-4028-bd80-78f83047b60a",
        name: "Parse Date & Time"
      },
      {
        parameters: {
          calendar: {
            __rl: true,
            value: "primary",
            mode: "list",
            cachedResultName: "primary"
          },
          start: "={{ $json.start_time }}",
          end: "={{ $json.end_time }}",
          additionalFields: {
            attendees: ["={{ $('Parse Date & Time').item.json.email }}"],
            conferenceDataUi: {
              conferenceDataValues: {
                conferenceSolution: "hangoutsMeet"
              }
            },
            sendUpdates: "all",
            summary: "={{ $json.summary }}"
          }
        },
        type: "n8n-nodes-base.googleCalendar",
        typeVersion: 1.3,
        position: [-224, 80],
        id: "aa0ad493-b8e2-4c96-8681-31f34930d1f3",
        name: "Create Calendar Event"
      },
      {
        parameters: {
          operation: "append",
          documentId: {
            __rl: true,
            value: "__LEADS_SHEET_ID__",
            mode: "id"
          },
          sheetName: "Leads",
          columns: {
            mappingMode: "defineBelow",
            value: {
              couple_name: "={{ $('Parse Date & Time').item.json.couple_name }}",
              wedding_date: "={{ $('Parse Date & Time').item.json.wedding_date }}",
              location: "={{ $('Parse Date & Time').item.json.location }}",
              call_date: "={{ $('Parse Date & Time').item.json.call_date }}",
              call_time: "={{ $('Parse Date & Time').item.json.call_time }}",
              email: "={{ $('Parse Date & Time').item.json.email }}",
              channel: "={{ $('Parse Date & Time').item.json.channel }}"
            },
            matchingColumns: [],
            schema: [
              { id: "couple_name", displayName: "couple_name", required: false, defaultMatch: false, display: true, type: "string", canBeUsedToMatch: true },
              { id: "wedding_date", displayName: "wedding_date", required: false, defaultMatch: false, display: true, type: "string", canBeUsedToMatch: true },
              { id: "location", displayName: "location", required: false, defaultMatch: false, display: true, type: "string", canBeUsedToMatch: true },
              { id: "call_date", displayName: "call_date", required: false, defaultMatch: false, display: true, type: "string", canBeUsedToMatch: true },
              { id: "call_time", displayName: "call_time", required: false, defaultMatch: false, display: true, type: "string", canBeUsedToMatch: true },
              { id: "email", displayName: "email", required: false, defaultMatch: false, display: true, type: "string", canBeUsedToMatch: true },
              { id: "channel", displayName: "channel", required: false, defaultMatch: false, display: true, type: "string", canBeUsedToMatch: true }
            ]
          },
          options: {}
        },
        type: "n8n-nodes-base.googleSheets",
        typeVersion: 4.7,
        position: [0, 0],
        id: "b22cd5c9-3e9f-4866-af14-c476ea5d34f3",
        name: "Log to Sheets"
      },
      {
        parameters: {
          chatId: "__TELEGRAM_CHAT_ID__",
          text: "=New lead: {{ $('Parse Date & Time').item.json.couple_name }} | {{ $('Parse Date & Time').item.json.email }} | {{ $('Parse Date & Time').item.json.call_date }} {{ $('Parse Date & Time').item.json.call_time }}",
          additionalFields: {
            appendAttribution: false
          }
        },
        type: "n8n-nodes-base.telegram",
        typeVersion: 1.2,
        position: [0, 160],
        id: "1e8d43d4-2aec-49de-aa9f-7c7fe61adc46",
        name: "Send Telegram",
        webhookId: `stafless-${context.tenantSlug}-book-call-telegram`
      },
      {
        parameters: {
          respondWith: "json",
          responseBody:
            "={{ JSON.stringify({ success: true, call_date: $('Parse Date & Time').item.json.call_date, call_time: $('Parse Date & Time').item.json.call_time, couple: $('Parse Date & Time').item.json.couple_name, message: 'Call booked, lead logged, owner notified' }) }}",
          options: {}
        },
        type: "n8n-nodes-base.respondToWebhook",
        typeVersion: 1.1,
        position: [224, 80],
        id: "7f0925f7-98f4-4e07-b5fe-f598a6d00af1",
        name: "Respond"
      }
    ],
    connections: {
      Webhook: { main: [[{ node: "Parse Date & Time", type: "main", index: 0 }]] },
      "Parse Date & Time": {
        main: [[{ node: "Create Calendar Event", type: "main", index: 0 }]]
      },
      "Create Calendar Event": {
        main: [
          [
            { node: "Log to Sheets", type: "main", index: 0 },
            { node: "Send Telegram", type: "main", index: 0 }
          ]
        ]
      },
      "Log to Sheets": { main: [[{ node: "Respond", type: "main", index: 0 }]] }
    }
  };

  return sanitizeTemplate(template);
}
