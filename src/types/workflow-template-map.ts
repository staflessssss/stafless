export type WorkflowTemplateRole =
  | "handle_incoming_message"
  | "gmail_adapter"
  | "instagram_adapter"
  | "check_availability"
  | "check_calendar"
  | "book_call"
  | "send_reply";

export type WorkflowTemplateMap = Partial<Record<WorkflowTemplateRole, string>>;
