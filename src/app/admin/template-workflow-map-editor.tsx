"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type Props = {
  templateId: string;
  templateName: string;
  initialMap: {
    handle_incoming_message?: string;
    check_availability?: string;
    check_calendar?: string;
    book_call?: string;
    send_reply?: string;
  };
};

export function TemplateWorkflowMapEditor({
  templateId,
  templateName,
  initialMap
}: Props) {
  const router = useRouter();
  const [form, setForm] = useState({
    handle_incoming_message: initialMap.handle_incoming_message ?? "",
    check_availability: initialMap.check_availability ?? "",
    check_calendar: initialMap.check_calendar ?? "",
    book_call: initialMap.book_call ?? "",
    send_reply: initialMap.send_reply ?? ""
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function setField(key: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    startTransition(async () => {
      const response = await fetch(
        `/api/templates/${templateId}/workflow-map`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(form)
        }
      );

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        setError(payload?.error ?? "Failed to save workflow map.");
        return;
      }

      setSuccess("Workflow template map updated.");
      router.refresh();
    });
  }

  return (
    <section
      style={{
        border: "1px solid var(--line)",
        borderRadius: 24,
        background: "var(--surface)",
        padding: 24,
        marginBottom: 28
      }}
    >
      <h2 style={{ marginTop: 0, fontSize: 24 }}>Template workflow mapping</h2>
      <p style={{ color: "var(--muted)", lineHeight: 1.6 }}>
        Assign n8n template workflow IDs to <strong>{templateName}</strong>. New
        agents created from this template will clone these workflows automatically.
      </p>

      <form onSubmit={onSubmit} style={{ display: "grid", gap: 14 }}>
        {Object.entries(form).map(([key, value]) => (
          <div key={key} style={{ display: "grid", gap: 6 }}>
            <label htmlFor={key}>{key}</label>
            <input
              id={key}
              value={value}
              onChange={(event) =>
                setField(key as keyof typeof form, event.target.value)
              }
              placeholder="n8n workflow ID"
              style={{
                width: "100%",
                padding: "12px 14px",
                borderRadius: 14,
                border: "1px solid var(--line)",
                background: "rgba(255,255,255,0.75)",
                color: "var(--ink)",
                font: "inherit"
              }}
            />
          </div>
        ))}

        {error ? <p style={{ margin: 0, color: "#8a2f2f" }}>{error}</p> : null}
        {success ? <p style={{ margin: 0, color: "#3e6b37" }}>{success}</p> : null}

        <button
          type="submit"
          disabled={isPending}
          style={{
            border: 0,
            background: "var(--accent)",
            color: "var(--surface)",
            padding: "12px 16px",
            borderRadius: 999,
            font: "inherit",
            cursor: "pointer",
            width: "fit-content"
          }}
        >
          {isPending ? "Saving..." : "Save workflow mapping"}
        </button>
      </form>
    </section>
  );
}
