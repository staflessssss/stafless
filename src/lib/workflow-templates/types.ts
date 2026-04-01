export type N8nWorkflowTemplate = {
  name: string;
  nodes: unknown[];
  connections: Record<string, unknown>;
  settings?: Record<string, unknown>;
};

export type WorkflowTemplateContext = {
  tenantSlug: string;
  workflowKey: string;
  n8nBaseUrl: string;
  appBaseUrl?: string;
  runtimeApiKey?: string;
};

export type WorkflowCredentialBinding = {
  id?: string;
  name: string;
  credentialType: string;
};

export type WorkflowBusinessContext = {
  businessName: string;
  website: string;
  contactEmail: string;
  signature: string;
};
