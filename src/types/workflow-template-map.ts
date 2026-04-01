export type WorkflowTemplateRole =
  | "handle_incoming_message"
  | "check_availability"
  | "check_calendar"
  | "book_call"
  | "send_reply";

export type WorkflowTemplateMap = Partial<Record<WorkflowTemplateRole, string>>;
