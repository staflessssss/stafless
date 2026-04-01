"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type TemplateOption = {
  id: string;
  name: string;
  niche: string;
};

type Props = {
  tenantId: string;
  tenantName: string;
  templates: TemplateOption[];
};

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
  cursor: "pointer",
  width: "fit-content"
};

export function TenantCreateAgentForm({
  tenantId,
  tenantName,
  templates
}: Props) {
  const router = useRouter();
  const [templateId, setTemplateId] = useState(templates[0]?.id ?? "");
  const [name, setName] = useState(`${tenantName} Agent`);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

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

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        setError(payload?.error ?? "Failed to create agent.");
        return;
      }

      setSuccess("Agent created with this tenant's connected accounts.");
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} style={{ display: "grid", gap: 14 }}>
      <div style={{ display: "grid", gap: 6 }}>
        <label htmlFor="tenant-agent-template">Template</label>
        <select
          id="tenant-agent-template"
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
        <label htmlFor="tenant-agent-name">Agent name</label>
        <input
          id="tenant-agent-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Myndful Films Agent"
          required
          style={inputStyle}
        />
      </div>

      {error ? <p style={{ margin: 0, color: "#8a2f2f" }}>{error}</p> : null}
      {success ? <p style={{ margin: 0, color: "#3e6b37" }}>{success}</p> : null}

      <button
        type="submit"
        disabled={isPending || !templateId || !name.trim()}
        style={buttonStyle}
      >
        {isPending ? "Creating..." : "Create agent and workflows"}
      </button>
    </form>
  );
}
