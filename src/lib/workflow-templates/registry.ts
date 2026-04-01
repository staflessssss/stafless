import type { WorkflowTemplateRole } from "@/types/workflow-template-map";
import type {
  N8nWorkflowTemplate,
  WorkflowTemplateContext
} from "./types";
import { buildConversationCoreTemplate } from "./conversation-core";
import { buildGmailAdapterTemplate } from "./gmail-adapter";
import { buildCheckAvailabilityTemplate } from "./check-availability";
import { buildCheckCalendarTemplate } from "./check-calendar";
import { buildBookCallTemplate } from "./book-call";

type WorkflowTemplateBuilder = (
  context: WorkflowTemplateContext
) => N8nWorkflowTemplate;

export const localWorkflowTemplates: Partial<
  Record<WorkflowTemplateRole, WorkflowTemplateBuilder>
> = {
  handle_incoming_message: buildConversationCoreTemplate,
  gmail_adapter: buildGmailAdapterTemplate,
  check_availability: buildCheckAvailabilityTemplate,
  check_calendar: buildCheckCalendarTemplate,
  book_call: buildBookCallTemplate
};
