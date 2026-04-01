import { IntegrationType } from "@prisma/client";
import type { WorkflowTemplateRole } from "@/types/workflow-template-map";

export function parseIntegrationType(value: string) {
  const normalized = value.trim().toUpperCase();
  return Object.values(IntegrationType).find((type) => type === normalized) ?? null;
}

export function getIntegrationLabel(type: IntegrationType | string) {
  switch (type) {
    case IntegrationType.GMAIL:
      return "Gmail";
    case IntegrationType.INSTAGRAM:
      return "Instagram";
    case IntegrationType.GOOGLE_CALENDAR:
      return "Google Calendar";
    case IntegrationType.GOOGLE_SHEETS:
      return "Google Sheets";
    case IntegrationType.GOOGLE_DRIVE:
      return "Google Drive";
    case IntegrationType.TELEGRAM:
      return "Telegram";
    default:
      return String(type);
  }
}

export function getIntegrationDescription(type: IntegrationType | string) {
  switch (type) {
    case IntegrationType.GMAIL:
      return "Reply to new email inquiries in one polished inbox.";
    case IntegrationType.INSTAGRAM:
      return "Bring Instagram leads and DMs into the same client view.";
    case IntegrationType.GOOGLE_CALENDAR:
      return "Keep bookings and consultation slots aligned.";
    case IntegrationType.GOOGLE_SHEETS:
      return "Use your existing availability sheet behind the scenes.";
    case IntegrationType.GOOGLE_DRIVE:
      return "Share guides, pricing, and documents faster.";
    case IntegrationType.TELEGRAM:
      return "Receive fast assistant alerts and internal updates.";
    default:
      return "Connect this channel to your assistant.";
  }
}

export function getIntegrationGradient(type: IntegrationType | string) {
  switch (type) {
    case IntegrationType.GMAIL:
      return "linear-gradient(180deg,#ff7a7a,#ef4444)";
    case IntegrationType.INSTAGRAM:
      return "linear-gradient(180deg,#ff69b4,#d946ef)";
    case IntegrationType.GOOGLE_CALENDAR:
      return "linear-gradient(180deg,#60a5fa,#2563eb)";
    case IntegrationType.GOOGLE_SHEETS:
      return "linear-gradient(180deg,#4ade80,#16a34a)";
    case IntegrationType.GOOGLE_DRIVE:
      return "linear-gradient(180deg,#fbbf24,#f59e0b)";
    case IntegrationType.TELEGRAM:
      return "linear-gradient(180deg,#5b9dff,#3b82f6)";
    default:
      return "linear-gradient(180deg,#7b879d,#586377)";
  }
}

export function getClientChannelTypes(existingTypes: IntegrationType[]) {
  return Array.from(
    new Set([IntegrationType.GMAIL, IntegrationType.INSTAGRAM, ...existingTypes])
  );
}

export function requiredIntegrationsForTemplate(templateSlug: string) {
  if (templateSlug === "wedding-lead-agent") {
    return [
      IntegrationType.GMAIL,
      IntegrationType.INSTAGRAM,
      IntegrationType.GOOGLE_CALENDAR,
      IntegrationType.GOOGLE_DRIVE,
      IntegrationType.GOOGLE_SHEETS,
      IntegrationType.TELEGRAM
    ];
  }

  return [IntegrationType.GMAIL];
}

export function requiredIntegrationsForWorkflow(workflowKey: string) {
  switch (workflowKey as WorkflowTemplateRole) {
    case "handle_incoming_message":
      return [IntegrationType.GOOGLE_DRIVE];
    case "gmail_adapter":
      return [IntegrationType.GMAIL];
    case "instagram_adapter":
      return [IntegrationType.INSTAGRAM];
    case "check_availability":
      return [IntegrationType.GOOGLE_SHEETS];
    case "check_calendar":
      return [IntegrationType.GOOGLE_CALENDAR];
    case "book_call":
      return [
        IntegrationType.GOOGLE_CALENDAR,
        IntegrationType.GOOGLE_SHEETS,
        IntegrationType.TELEGRAM
      ];
    case "send_reply":
      return [IntegrationType.GMAIL];
    default:
      return [];
  }
}
