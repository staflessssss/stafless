import { IntegrationType, type Integration } from "@prisma/client";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { env } from "@/lib/env";
import { requiredIntegrationsForWorkflow } from "@/lib/integrations";
import { localWorkflowTemplates } from "@/lib/workflow-templates/registry";
import { webhookPath } from "@/lib/workflow-templates/helpers";
import type {
  WorkflowBusinessContext,
  WorkflowCredentialBinding
} from "@/lib/workflow-templates/types";

const execFileAsync = promisify(execFile);

type N8nWorkflowSummary = {
  id: string;
  name: string;
  active?: boolean;
  createdAt?: string;
  updatedAt?: string;
  tags?: Array<{ id: string; name: string }>;
};

type N8nWorkflowDetail = N8nWorkflowSummary & {
  nodes: unknown[];
  connections: Record<string, unknown>;
  settings?: Record<string, unknown>;
  staticData?: Record<string, unknown> | null;
  pinData?: Record<string, unknown> | null;
  versionId?: string;
};

type N8nWorkflowListResponse = {
  data?: N8nWorkflowSummary[];
  nextCursor?: string | null;
};

type N8nCredentialResponse = {
  id?: string;
  name?: string;
  type?: string;
  createdAt?: string;
  updatedAt?: string;
  data?: {
    id?: string;
    name?: string;
    type?: string;
    createdAt?: string;
    updatedAt?: string;
  };
};

type IntegrationSnapshot = Pick<
  Integration,
  "type" | "status" | "credentialRef" | "accountLabel"
>;

type ProvisionWorkflowInput = {
  tenantId: string;
  agentId: string;
  workflowKey: string;
  integrations?: IntegrationSnapshot[];
  businessContext?: WorkflowBusinessContext;
};

type N8nNode = {
  name?: string;
  type?: string;
  parameters?: Record<string, unknown>;
  credentials?: Record<string, { id?: string; name: string }>;
  [key: string]: unknown;
};

const integrationCredentialTypes: Partial<Record<IntegrationType, string>> = {
  [IntegrationType.GMAIL]: "gmailOAuth2",
  [IntegrationType.INSTAGRAM]: "facebookGraphApi",
  [IntegrationType.GOOGLE_CALENDAR]: "googleCalendarOAuth2Api",
  [IntegrationType.GOOGLE_SHEETS]: "googleSheetsOAuth2Api",
  [IntegrationType.GOOGLE_DRIVE]: "googleDriveOAuth2Api",
  [IntegrationType.TELEGRAM]: "telegramApi"
};

const nodeCredentialMap: Record<string, IntegrationType[]> = {
  "n8n-nodes-base.gmailTrigger": [IntegrationType.GMAIL],
  "n8n-nodes-base.gmail": [IntegrationType.GMAIL],
  "n8n-nodes-base.googleDrive": [IntegrationType.GOOGLE_DRIVE],
  "n8n-nodes-base.googleCalendar": [IntegrationType.GOOGLE_CALENDAR],
  "n8n-nodes-base.googleSheets": [IntegrationType.GOOGLE_SHEETS],
  "n8n-nodes-base.telegram": [IntegrationType.TELEGRAM]
};

function getN8nHeaders() {
  if (!env.N8N_API_KEY) {
    throw new Error("N8N_API_KEY is not configured.");
  }

  return {
    accept: "application/json",
    "Content-Type": "application/json",
    "X-N8N-API-KEY": env.N8N_API_KEY
  };
}

function getN8nApiBase() {
  if (!env.N8N_BASE_URL) {
    throw new Error("N8N_BASE_URL is not configured.");
  }

  return `${env.N8N_BASE_URL.replace(/\/$/, "")}/api/v1`;
}

async function n8nFetchAbsolute<T>(url: string, init?: RequestInit): Promise<T> {
  if (process.platform === "win32") {
    return n8nFetchViaPowerShell<T>(url, init);
  }

  const response = await fetch(url, {
    ...init,
    headers: {
      ...getN8nHeaders(),
      ...(init?.headers ?? {})
    },
    cache: "no-store"
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`n8n API error ${response.status}: ${body}`);
  }

  return (await response.json()) as T;
}

async function n8nFetchViaPowerShell<T>(
  url: string,
  init?: RequestInit
): Promise<T> {
  const method = init?.method ?? "GET";
  const headers = {
    ...getN8nHeaders(),
    ...(init?.headers ?? {})
  } as Record<string, string>;
  const body = typeof init?.body === "string" ? init.body : "";

  const headersLiteral = Object.entries(headers)
    .map(([key, value]) => `'${escapePowerShell(key)}'='${escapePowerShell(value)}'`)
    .join("; ");

  const command = [
    "$ProgressPreference='SilentlyContinue'",
    `$headers=@{${headersLiteral}}`,
    body ? `$body=@'\n${body}\n'@` : "",
    "[Console]::OutputEncoding = [System.Text.Encoding]::UTF8",
    `$response=Invoke-WebRequest -Uri '${escapePowerShell(url)}' -Method ${method} -Headers $headers${
      body ? " -Body $body -ContentType 'application/json'" : ""
    }`,
    "$response.Content"
  ]
    .filter(Boolean)
    .join("; ");

  const { stdout, stderr } = await execFileAsync(
    "powershell.exe",
    ["-NoProfile", "-Command", command],
    {
      windowsHide: true,
      maxBuffer: 10 * 1024 * 1024
    }
  );

  if (stderr?.trim()) {
    throw new Error(stderr.trim());
  }

  return JSON.parse(stdout.trim()) as T;
}

async function n8nFetch<T>(path: string, init?: RequestInit): Promise<T> {
  return n8nFetchAbsolute<T>(`${getN8nApiBase()}${path}`, init);
}

function escapePowerShell(value: string) {
  return value.replace(/'/g, "''");
}

function parseCredentialRef(
  integration: IntegrationSnapshot
): WorkflowCredentialBinding | null {
  const defaultCredentialType =
    integrationCredentialTypes[integration.type] ?? undefined;

  if (!defaultCredentialType) {
    return null;
  }

  if (integration.credentialRef) {
    const parts = integration.credentialRef.split(":");

    if (parts.length >= 3) {
      const [credentialType, id, ...nameParts] = parts;
      return {
        credentialType,
        id: id || undefined,
        name: nameParts.join(":") || integration.accountLabel || id
      };
    }

    if (parts.length === 2) {
      const [credentialType, name] = parts;
      return {
        credentialType,
        name
      };
    }

    return {
      credentialType: defaultCredentialType,
      name: integration.credentialRef
    };
  }

  if (integration.accountLabel) {
    return {
      credentialType: defaultCredentialType,
      name: integration.accountLabel
    };
  }

  return null;
}

function buildIntegrationMap(integrations: IntegrationSnapshot[]) {
  return new Map(
    integrations.map((integration) => [integration.type, integration] as const)
  );
}

function findMissingIntegrations(
  workflowKey: string,
  integrations: IntegrationSnapshot[]
) {
  const integrationMap = buildIntegrationMap(integrations);

  return requiredIntegrationsForWorkflow(workflowKey).filter((type) => {
    const integration = integrationMap.get(type);
    return (
      !integration ||
      integration.status !== "ACTIVE" ||
      !parseCredentialRef(integration)
    );
  });
}

function replacePlaceholdersInValue(
  value: unknown,
  replacements: Record<string, string>
): unknown {
  if (typeof value === "string") {
    return Object.entries(replacements).reduce(
      (current, [placeholder, replacement]) =>
        current.split(placeholder).join(replacement),
      value
    );
  }

  if (Array.isArray(value)) {
    return value.map((item) => replacePlaceholdersInValue(item, replacements));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, innerValue]) => [
        key,
        replacePlaceholdersInValue(innerValue, replacements)
      ])
    );
  }

  return value;
}

function buildBusinessPlaceholderMap(businessContext?: WorkflowBusinessContext) {
  if (!businessContext) {
    return {} as Record<string, string>;
  }

  const signatureLines = businessContext.signature
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  return {
    "__BUSINESS_NAME__": businessContext.businessName,
    "__BUSINESS_WEBSITE__": businessContext.website,
    "__BUSINESS_EMAIL__": businessContext.contactEmail,
    "__SIGNATURE_NAME__": signatureLines[0] ?? businessContext.businessName,
    "__SIGNATURE_TITLE__": signatureLines[1] ?? businessContext.businessName
  };
}

function injectCredentialsIntoNodes(
  nodes: unknown[],
  integrations: IntegrationSnapshot[]
) {
  const integrationMap = buildIntegrationMap(integrations);

  return nodes.map((node) => {
    if (!node || typeof node !== "object") {
      return node;
    }

    const typedNode = { ...(node as N8nNode) };
    const mappedTypes = typedNode.type ? nodeCredentialMap[typedNode.type] ?? [] : [];
    const credentials = { ...(typedNode.credentials ?? {}) };

    for (const integrationType of mappedTypes) {
      const integration = integrationMap.get(integrationType);
      const credential = integration ? parseCredentialRef(integration) : null;

      if (!credential) {
        continue;
      }

      credentials[credential.credentialType] = {
        name: credential.name,
        ...(credential.id ? { id: credential.id } : {})
      };
    }

    if (Object.keys(credentials).length > 0) {
      typedNode.credentials = credentials;
    }

    return typedNode;
  });
}

function hasActiveCredential(
  integrations: IntegrationSnapshot[],
  type: IntegrationType
) {
  const integration = buildIntegrationMap(integrations).get(type);
  return Boolean(
    integration &&
      integration.status === "ACTIVE" &&
      parseCredentialRef(integration)
  );
}

function stripOptionalNodes(input: {
  workflowKey: string;
  nodes: unknown[];
  connections: Record<string, unknown>;
  integrations: IntegrationSnapshot[];
}) {
  if (
    input.workflowKey === "book_call" &&
    !hasActiveCredential(input.integrations, IntegrationType.TELEGRAM)
  ) {
    const nodes = input.nodes.filter((node) => {
      if (!node || typeof node !== "object") {
        return true;
      }

      return (node as { name?: string }).name !== "Send Telegram";
    });

    return {
      nodes,
      connections: {
        ...input.connections,
        "Create Calendar Event": {
          main: [[{ node: "Log to Sheets", type: "main", index: 0 }]]
        }
      }
    };
  }

  return {
    nodes: input.nodes,
    connections: input.connections
  };
}

export async function listN8nWorkflows() {
  const response = await n8nFetch<N8nWorkflowListResponse>(
    "/workflows?limit=10"
  );

  return {
    workflows: response.data ?? [],
    nextCursor: response.nextCursor ?? null
  };
}

export async function getN8nWorkflow(id: string) {
  return n8nFetch<N8nWorkflowDetail>(`/workflows/${id}`);
}

export async function createN8nWorkflow(input: {
  name: string;
  nodes: unknown[];
  connections: Record<string, unknown>;
  settings?: Record<string, unknown>;
}) {
  return n8nFetch<N8nWorkflowDetail>("/workflows", {
    method: "POST",
    body: JSON.stringify({
      name: input.name,
      nodes: input.nodes,
      connections: input.connections,
      settings: input.settings ?? {}
    })
  });
}

export async function cloneN8nWorkflow(input: {
  sourceWorkflowId: string;
  newName: string;
}) {
  const source = await getN8nWorkflow(input.sourceWorkflowId);

  return createN8nWorkflow({
    name: input.newName,
    nodes: source.nodes,
    connections: source.connections,
    settings: source.settings
  });
}

export async function createN8nCredential(input: {
  name: string;
  type: string;
  nodesAccess: Array<{
    nodeType: string;
    nodeTypeVersion?: number;
  }>;
  data: Record<string, unknown>;
}) {
  const credential = await n8nFetch<N8nCredentialResponse>("/credentials", {
    method: "POST",
    body: JSON.stringify({
      name: input.name,
      type: input.type,
      nodesAccess: input.nodesAccess,
      data: input.data
    })
  });

  const resolvedId = credential.id ?? credential.data?.id;

  if (!resolvedId) {
    throw new Error("n8n credential created without an ID in the API response.");
  }

  return {
    ...credential,
    id: resolvedId,
    name: credential.name ?? credential.data?.name ?? input.name,
    type: credential.type ?? credential.data?.type ?? input.type
  };
}

export async function provisionWorkflowBinding(
  input: ProvisionWorkflowInput & {
    tenantSlug?: string;
    agentName?: string;
  }
) {
  if (!env.N8N_BASE_URL || !env.N8N_API_KEY) {
    return {
      workflowKey: input.workflowKey,
      n8nWorkflowId: null,
      status: "pending_credentials"
    };
  }

  const localTemplate =
    localWorkflowTemplates[input.workflowKey as keyof typeof localWorkflowTemplates];

  if (localTemplate) {
    const builtTemplate = localTemplate({
      tenantSlug: input.tenantSlug ?? input.tenantId,
      workflowKey: input.workflowKey,
      n8nBaseUrl: env.N8N_BASE_URL,
      appBaseUrl: env.APP_URL,
      runtimeApiKey: env.N8N_API_KEY
    });
    const replacements = buildBusinessPlaceholderMap(input.businessContext);
    const hydratedNodes = injectCredentialsIntoNodes(
      replacePlaceholdersInValue(builtTemplate.nodes, replacements) as unknown[],
      input.integrations ?? []
    );
    const hydratedConnections = replacePlaceholdersInValue(
      builtTemplate.connections,
      replacements
    ) as Record<string, unknown>;
    const strippedTemplate = stripOptionalNodes({
      workflowKey: input.workflowKey,
      nodes: hydratedNodes,
      connections: hydratedConnections,
      integrations: input.integrations ?? []
    });
    const hydratedSettings = replacePlaceholdersInValue(
      builtTemplate.settings ?? {},
      replacements
    ) as Record<string, unknown>;
    const missingIntegrations = findMissingIntegrations(
      input.workflowKey,
      input.integrations ?? []
    );

    const created = await createN8nWorkflow({
      name: `${input.tenantSlug ?? input.tenantId} :: ${input.agentName ?? input.agentId} :: ${input.workflowKey}`,
      nodes: strippedTemplate.nodes,
      connections: strippedTemplate.connections,
      settings: hydratedSettings
    });

    const webhookSuffix =
      input.workflowKey === "handle_incoming_message"
        ? "core-message"
        : input.workflowKey === "check_availability"
          ? "check-availability"
          : input.workflowKey === "check_calendar"
            ? "check-calendar"
            : "book-call";

    return {
      workflowKey: input.workflowKey,
      n8nWorkflowId: created.id,
      status:
        missingIntegrations.length > 0
          ? `provisioned_missing_integrations:${missingIntegrations.join(",")}`
          : `provisioned_webhook:${webhookPath(
                {
                  tenantSlug: input.tenantSlug ?? input.tenantId,
                  workflowKey: input.workflowKey,
                  n8nBaseUrl: env.N8N_BASE_URL
                },
                webhookSuffix
              )}`
    };
  }

  return {
    workflowKey: input.workflowKey,
    n8nWorkflowId: null,
    status: "pending_local_template"
  };
}
