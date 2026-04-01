"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type ConfigEditorProps = {
  agentId: string;
  businessName: string;
  ownerName: string;
  website: string;
  contactEmail: string;
  signature: string;
  startingPrice: number;
  callWindowStart: string;
  callWindowEnd: string;
  callWindowTimezone: string;
};

export function ConfigEditor(props: ConfigEditorProps) {
  const router = useRouter();
  const [form, setForm] = useState(props);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function updateField<K extends keyof ConfigEditorProps>(
    key: K,
    value: ConfigEditorProps[K]
  ) {
    setForm((current) => ({
      ...current,
      [key]: value
    }));
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    startTransition(async () => {
      const response = await fetch(`/api/agent-configs/${form.agentId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          businessName: form.businessName,
          ownerName: form.ownerName,
          website: form.website,
          contactEmail: form.contactEmail,
          signature: form.signature,
          startingPrice: form.startingPrice,
          callWindowStart: form.callWindowStart,
          callWindowEnd: form.callWindowEnd,
          callWindowTimezone: form.callWindowTimezone
        })
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        setError(payload?.error ?? "Failed to save config.");
        return;
      }

      setSuccess("Config updated.");
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} style={{ display: "grid", gap: 16 }}>
      <div style={gridStyle}>
        <div style={fieldStyle}>
          <label htmlFor="business-name">Business name</label>
          <input
            id="business-name"
            value={form.businessName}
            onChange={(event) => updateField("businessName", event.target.value)}
            style={inputStyle}
          />
        </div>

        <div style={fieldStyle}>
          <label htmlFor="owner-name">Owner name</label>
          <input
            id="owner-name"
            value={form.ownerName}
            onChange={(event) => updateField("ownerName", event.target.value)}
            style={inputStyle}
          />
        </div>

        <div style={fieldStyle}>
          <label htmlFor="website">Website</label>
          <input
            id="website"
            value={form.website}
            onChange={(event) => updateField("website", event.target.value)}
            style={inputStyle}
          />
        </div>

        <div style={fieldStyle}>
          <label htmlFor="contact-email">Contact email</label>
          <input
            id="contact-email"
            type="email"
            value={form.contactEmail}
            onChange={(event) => updateField("contactEmail", event.target.value)}
            style={inputStyle}
          />
        </div>

        <div style={fieldStyle}>
          <label htmlFor="starting-price">Starting price</label>
          <input
            id="starting-price"
            type="number"
            min={0}
            value={form.startingPrice}
            onChange={(event) =>
              updateField("startingPrice", Number(event.target.value))
            }
            style={inputStyle}
          />
        </div>

        <div style={fieldStyle}>
          <label htmlFor="call-window-timezone">Call timezone</label>
          <input
            id="call-window-timezone"
            value={form.callWindowTimezone}
            onChange={(event) =>
              updateField("callWindowTimezone", event.target.value)
            }
            style={inputStyle}
          />
        </div>

        <div style={fieldStyle}>
          <label htmlFor="call-window-start">Call window start</label>
          <input
            id="call-window-start"
            value={form.callWindowStart}
            onChange={(event) =>
              updateField("callWindowStart", event.target.value)
            }
            style={inputStyle}
          />
        </div>

        <div style={fieldStyle}>
          <label htmlFor="call-window-end">Call window end</label>
          <input
            id="call-window-end"
            value={form.callWindowEnd}
            onChange={(event) => updateField("callWindowEnd", event.target.value)}
            style={inputStyle}
          />
        </div>
      </div>

      <div style={fieldStyle}>
        <label htmlFor="signature">Signature</label>
        <textarea
          id="signature"
          value={form.signature}
          onChange={(event) => updateField("signature", event.target.value)}
          rows={5}
          style={{ ...inputStyle, resize: "vertical" }}
        />
      </div>

      {error ? <p style={{ margin: 0, color: "#8a2f2f" }}>{error}</p> : null}
      {success ? <p style={{ margin: 0, color: "#3e6b37" }}>{success}</p> : null}

      <button type="submit" disabled={isPending} style={buttonStyle}>
        {isPending ? "Saving..." : "Save config"}
      </button>
    </form>
  );
}

const gridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
  gap: 16
};

const fieldStyle: React.CSSProperties = {
  display: "grid",
  gap: 6
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
