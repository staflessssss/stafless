import type { N8nWorkflowTemplate, WorkflowTemplateContext } from "./types";

export function cloneTemplate<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export function stripCredentials(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(stripCredentials);
  }

  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([key]) => key !== "credentials")
      .map(([key, innerValue]) => [key, stripCredentials(innerValue)]);

    return Object.fromEntries(entries);
  }

  return value;
}

export function webhookPath(context: WorkflowTemplateContext, suffix: string) {
  return `stafless-${context.tenantSlug}-${suffix}`;
}

export function webhookUrl(context: WorkflowTemplateContext, suffix: string) {
  return `${context.n8nBaseUrl.replace(/\/$/, "")}/webhook/${webhookPath(
    context,
    suffix
  )}`;
}

export function appApiUrl(context: WorkflowTemplateContext, path: string) {
  if (!context.appBaseUrl) {
    return "";
  }

  return `${context.appBaseUrl.replace(/\/$/, "")}/api/${path.replace(/^\/+/, "")}`;
}

export function sanitizeTemplate(
  template: N8nWorkflowTemplate
): N8nWorkflowTemplate {
  const cloned = cloneTemplate(template);
  const sanitized = stripCredentials(cloned) as N8nWorkflowTemplate;

  return sanitized;
}
