"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { AgentChannel } from "@/lib/agent-channels";
import { getAgentChannelLabel } from "@/lib/agent-channels";

type TemplateOption = {
  id: string;
  name: string;
  niche: string;
};

type ChannelOption = {
  value: AgentChannel;
  label: string;
  missingLabels: string[];
  canCreate: boolean;
};

type Props = {
  tenantId: string;
  tenantName: string;
  templates: TemplateOption[];
  channels: ChannelOption[];
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
  templates,
  channels
}: Props) {
  const router = useRouter();
  const [templateId, setTemplateId] = useState(templates[0]?.id ?? "");
  const [channel, setChannel] = useState<AgentChannel>(channels[0]?.value ?? "gmail");
  const [name, setName] = useState(`${tenantName} Gmail Agent`);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const selectedChannel = channels.find((item) => item.value === channel) ?? null;

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
          name,
          channel
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

      <div style={{ display: "grid", gap: 6 }}>
        <label htmlFor="tenant-agent-channel">Channel</label>
        <select
          id="tenant-agent-channel"
          value={channel}
          onChange={(event) => {
            const nextChannel = event.target.value as AgentChannel;
            setChannel(nextChannel);
            setName(
              nextChannel === "instagram"
                ? `${tenantName} Instagram Agent`
                : `${tenantName} Gmail Agent`
            );
          }}
          style={inputStyle}
        >
          {channels.map((option) => (
            <option key={option.value} value={option.value}>
              {getAgentChannelLabel(option.value)}
            </option>
          ))}
        </select>
      </div>

      {selectedChannel ? (
        <p style={{ margin: 0, color: "var(--muted)" }}>
          {selectedChannel.canCreate
            ? `${selectedChannel.label} is ready to create with this client's connected accounts.`
            : `Still needed for ${selectedChannel.label.toLowerCase()}: ${selectedChannel.missingLabels.join(", ")}.`}
        </p>
      ) : null}

      {error ? <p style={{ margin: 0, color: "#8a2f2f" }}>{error}</p> : null}
      {success ? <p style={{ margin: 0, color: "#3e6b37" }}>{success}</p> : null}

      <button
        type="submit"
        disabled={
          isPending ||
          !templateId ||
          !name.trim() ||
          !selectedChannel?.canCreate
        }
        style={buttonStyle}
      >
        {isPending ? "Creating..." : "Create agent and workflows"}
      </button>
    </form>
  );
}
