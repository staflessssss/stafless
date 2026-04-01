import { sanitizeTemplate, webhookPath } from "./helpers";
import type { N8nWorkflowTemplate, WorkflowTemplateContext } from "./types";

export function buildCheckCalendarTemplate(
  context: WorkflowTemplateContext
): N8nWorkflowTemplate {
  const template: N8nWorkflowTemplate = {
    name: "Template :: Check Calendar",
    nodes: [
      {
        parameters: {
          httpMethod: "POST",
          path: webhookPath(context, "check-calendar"),
          responseMode: "responseNode",
          options: {}
        },
        type: "n8n-nodes-base.webhook",
        typeVersion: 2.1,
        position: [-272, -80],
        id: "9a2cef20-b62a-4edd-906e-1a38e13eea9c",
        name: "Webhook",
        webhookId: `stafless-${context.tenantSlug}-check-calendar`
      },
      {
        parameters: {
          jsCode:
            "const now = new Date();\nconst text = ($json.body.time_text || '').toLowerCase();\nlet targetDate = new Date(now);\nif (text.includes('day after tomorrow')) targetDate.setDate(targetDate.getDate() + 2);\nelse if (text.includes('tomorrow')) targetDate.setDate(targetDate.getDate() + 1);\nelse if (!text.includes('today')) {\n  const days = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];\n  const foundDay = days.findIndex(d => text.includes(d));\n  if (foundDay !== -1) {\n    let diff = foundDay - targetDate.getDay();\n    if (diff <= 0) diff += 7;\n    targetDate.setDate(targetDate.getDate() + diff);\n  }\n}\nlet hours = 14;\nlet minutes = 0;\nconst timeMatch = text.match(/(\\d{1,2})(?::(\\d{2}))?\\s*(am|pm)?/i);\nif (timeMatch) {\n  hours = parseInt(timeMatch[1]);\n  minutes = parseInt(timeMatch[2] || '0');\n  const ampm = (timeMatch[3] || '').toLowerCase();\n  if (ampm === 'pm' && hours < 12) hours += 12;\n  if (ampm === 'am' && hours === 12) hours = 0;\n  if (!ampm && hours >= 1 && hours <= 7) hours += 12;\n}\nconst y = targetDate.getFullYear();\nconst m = String(targetDate.getMonth() + 1).padStart(2, '0');\nconst d = String(targetDate.getDate()).padStart(2, '0');\nreturn [{ json: { date: `${y}-${m}-${d}`, time: `${String(hours).padStart(2,'0')}:${String(minutes).padStart(2,'0')}` } }];"
        },
        type: "n8n-nodes-base.code",
        typeVersion: 2,
        position: [-48, -80],
        id: "1d751b53-9467-477d-b862-2b412b7024c8",
        name: "Parse Date"
      },
      {
        parameters: {
          operation: "getAll",
          calendar: {
            __rl: true,
            value: "primary",
            mode: "list",
            cachedResultName: "primary"
          },
          timeMin: "={{ $json.date }}T00:00:00-05:00",
          timeMax: "={{ $json.date }}T23:59:59-05:00",
          options: {
            timeZone: {
              __rl: true,
              value: "America/New_York",
              mode: "list",
              cachedResultName: "America/New_York"
            }
          }
        },
        type: "n8n-nodes-base.googleCalendar",
        typeVersion: 1.3,
        position: [176, -80],
        id: "7fbfe5bb-4c6e-407a-8069-547ee557131d",
        name: "Get Events for Date",
        alwaysOutputData: true
      },
      {
        parameters: {
          jsCode:
            "const body = $('Parse Date').item.json;\nconst requestedDate = body.date;\nconst requestedTime = body.time;\nconst items = $input.all();\nconst events = items.map(item => item.json).filter(e => e.start && e.start.dateTime);\nconst [reqH, reqM] = requestedTime.split(':').map(Number);\nconst reqStart = reqH * 60 + reqM;\nconst reqEnd = reqStart + 30;\nconst busySlots = events.map(e => {\n  const startMatch = e.start.dateTime.match(/T(\\d{2}):(\\d{2})/);\n  const endMatch = e.end.dateTime.match(/T(\\d{2}):(\\d{2})/);\n  const startMin = parseInt(startMatch[1]) * 60 + parseInt(startMatch[2]);\n  const endMin = parseInt(endMatch[1]) * 60 + parseInt(endMatch[2]);\n  return { start: startMin, end: endMin, summary: e.summary || '' };\n});\nconst hasConflict = busySlots.some(slot => reqStart < slot.end && reqEnd > slot.start);\nif (!hasConflict) return [{ json: { available: true, date: requestedDate, time: requestedTime, message: `${requestedTime} on ${requestedDate} is available.` } }];\nconst suggestions = [];\nconst checkSlots = [reqStart - 60, reqStart - 30, reqStart + 30, reqStart + 60, reqStart + 90, reqStart + 120];\nfor (const slotStart of checkSlots) {\n  if (slotStart < 9 * 60 || slotStart >= 21 * 60) continue;\n  const slotEnd = slotStart + 30;\n  const conflict = busySlots.some(b => slotStart < b.end && slotEnd > b.start);\n  if (!conflict) {\n    const h = String(Math.floor(slotStart / 60)).padStart(2, '0');\n    const m = String(slotStart % 60).padStart(2, '0');\n    suggestions.push(`${h}:${m}`);\n    if (suggestions.length >= 3) break;\n  }\n}\nreturn [{ json: { available: false, date: requestedDate, requested_time: requestedTime, suggested_times: suggestions, message: `${requestedTime} is busy. Available nearby: ${suggestions.join(', ')}` } }];"
        },
        type: "n8n-nodes-base.code",
        typeVersion: 2,
        position: [400, -80],
        id: "8a3bba42-8e7d-40a5-b292-ad77d0088630",
        name: "Check Conflicts"
      },
      {
        parameters: {
          respondWith: "json",
          responseBody: "={{ JSON.stringify($json) }}",
          options: {}
        },
        type: "n8n-nodes-base.respondToWebhook",
        typeVersion: 1.1,
        position: [608, -80],
        id: "57213e99-e329-40b4-b594-629e671e2427",
        name: "Respond"
      }
    ],
    connections: {
      Webhook: { main: [[{ node: "Parse Date", type: "main", index: 0 }]] },
      "Parse Date": {
        main: [[{ node: "Get Events for Date", type: "main", index: 0 }]]
      },
      "Get Events for Date": {
        main: [[{ node: "Check Conflicts", type: "main", index: 0 }]]
      },
      "Check Conflicts": {
        main: [[{ node: "Respond", type: "main", index: 0 }]]
      }
    }
  };

  return sanitizeTemplate(template);
}
