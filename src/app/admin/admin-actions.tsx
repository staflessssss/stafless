"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { IntegrationType, RecordStatus } from "@prisma/client";
import { getAgentCreationCheck } from "@/lib/agent-creation-check";
import { getIntegrationLabel } from "@/lib/integrations";

type TemplateOption = {
  id: string;
  name: string;
  niche: string;
  slug: string;
};

type TenantOption = {
  id: string;
  name: string;
  slug: string;
  integrations: Array<{
    type: IntegrationType;
    status: RecordStatus;
  }>;
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function CreateTenantForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [timezone, setTimezone] = useState("America/New_York");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const slug = slugify(name);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    startTransition(async () => {
      const response = await fetch("/api/tenants", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name,
          slug,
          timezone
        })
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        setError(payload?.error ?? "Failed to create tenant.");
        return;
      }

      setName("");
      setTimezone("America/New_York");
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} style={{ display: "grid", gap: 14 }}>
      <div style={{ display: "grid", gap: 6 }}>
        <label htmlFor="tenant-name">Business name</label>
        <input
          id="tenant-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Example Studio"
          required
          style={inputStyle}
        />
      </div>

      <div style={{ display: "grid", gap: 6 }}>
        <label htmlFor="tenant-slug">Slug</label>
        <input
          id="tenant-slug"
          value={slug}
          readOnly
          placeholder="example-studio"
          style={{ ...inputStyle, color: "var(--muted)" }}
        />
      </div>

      <div style={{ display: "grid", gap: 6 }}>
        <label htmlFor="tenant-timezone">Timezone</label>
        <input
          id="tenant-timezone"
          value={timezone}
          onChange={(event) => setTimezone(event.target.value)}
          required
          style={inputStyle}
        />
      </div>

      {error ? <p style={{ margin: 0, color: "#8a2f2f" }}>{error}</p> : null}

      <button type="submit" disabled={isPending || !slug} style={buttonStyle}>
        {isPending ? "Creating..." : "Create tenant"}
      </button>
    </form>
  );
}

export function CreateAgentForm({
  tenants,
  templates
}: {
  tenants: TenantOption[];
  templates: TemplateOption[];
}) {
  const router = useRouter();
  const [tenantId, setTenantId] = useState(tenants[0]?.id ?? "");
  const [templateId, setTemplateId] = useState(templates[0]?.id ?? "");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const selectedTenant = tenants.find((tenant) => tenant.id === tenantId) ?? null;
  const selectedTemplate = templates.find((template) => template.id === templateId) ?? null;
  const creationCheck =
    selectedTenant && selectedTemplate
      ? getAgentCreationCheck(selectedTemplate.slug, selectedTenant.integrations)
      : null;

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    startTransition(async () => {
      const response = await fetch("/api/agents", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          tenantId,
          templateId,
          name
        })
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        setError(payload?.error ?? "Failed to create agent.");
        return;
      }

      setName("");
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} style={{ display: "grid", gap: 14 }}>
      <div
        style={{
          border: "1px solid var(--line)",
          borderRadius: 18,
          padding: 14,
          background: "rgba(255,255,255,0.5)",
          display: "grid",
          gap: 10
        }}
      >
        <p style={{ margin: 0, color: "var(--muted)", lineHeight: 1.6 }}>
          The client connects their own services in the dashboard first. Once the
          required connections are ready, agent creation becomes available here for
          the operator.
        </p>

        {selectedTemplate && creationCheck ? (
          <div style={{ display: "grid", gap: 8 }}>
            <p style={{ margin: 0, fontWeight: 700 }}>
              Required services for {selectedTemplate.name}
            </p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {creationCheck.requiredIntegrationTypes.map((integrationType) => {
                const isConnected = creationCheck.connectedIntegrationTypes.includes(
                  integrationType
                );

                return (
                  <span
                    key={integrationType}
                    style={{
                      border: "1px solid var(--line)",
                      borderRadius: 999,
                      padding: "6px 10px",
                      background: isConnected
                        ? "rgba(62,107,55,0.12)"
                        : "rgba(138,47,47,0.08)",
                      color: isConnected ? "#3e6b37" : "#8a2f2f"
                    }}
                  >
                    {getIntegrationLabel(integrationType)} {isConnected ? "connected" : "missing"}
                  </span>
                );
              })}
            </div>
            <p style={{ margin: 0, color: "var(--muted)" }}>
              {creationCheck.canCreateAgent
                ? "Everything required is connected. You can create this client's workflow set now."
                : `Still missing: ${creationCheck.missingIntegrationLabels.join(", ")}.`}
            </p>
          </div>
        ) : null}
      </div>

      <div style={{ display: "grid", gap: 6 }}>
        <label htmlFor="agent-tenant">Tenant</label>
        <select
          id="agent-tenant"
          value={tenantId}
          onChange={(event) => setTenantId(event.target.value)}
          style={inputStyle}
        >
          {tenants.map((tenant) => (
            <option key={tenant.id} value={tenant.id}>
              {tenant.name}
            </option>
          ))}
        </select>
      </div>

      <div style={{ display: "grid", gap: 6 }}>
        <label htmlFor="agent-template">Template</label>
        <select
          id="agent-template"
          value={templateId}
          onChange={(event) => setTemplateId(event.target.value)}
          style={inputStyle}
        >
          {templates.map((template) => (
            <option key={template.id} value={template.id}>
              {template.name} ({template.niche})
            </option>
          ))}
        </select>
      </div>

      <div style={{ display: "grid", gap: 6 }}>
        <label htmlFor="agent-name">Agent name</label>
        <input
          id="agent-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Front Desk Agent"
          required
          style={inputStyle}
        />
      </div>

      {error ? <p style={{ margin: 0, color: "#8a2f2f" }}>{error}</p> : null}

      <button
        type="submit"
        disabled={
          isPending ||
          !tenantId ||
          !templateId ||
          !creationCheck?.canCreateAgent
        }
        style={buttonStyle}
      >
        {isPending
          ? "Creating..."
          : creationCheck?.canCreateAgent
            ? "Create agent"
            : "Waiting for client connections"}
      </button>
    </form>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: 14,
  border: "1px solid var(--line)",
  background: "rgba(255,255,255,0.75)",
  color: "var(--ink)",
  font: "inherit"
};

const buttonStyle: React.CSSProperties = {
  border: 0,
  background: "var(--accent)",
  color: "var(--surface)",
  padding: "12px 16px",
  borderRadius: 999,
  font: "inherit",
  cursor: "pointer"
};
