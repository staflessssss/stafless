"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type Props = {
  agentId: string;
  status: "DRAFT" | "ACTIVE" | "PAUSED" | "DISABLED";
};

const buttonStyle: React.CSSProperties = {
  border: 0,
  background: "var(--accent)",
  color: "var(--surface)",
  padding: "10px 14px",
  borderRadius: 999,
  font: "inherit",
  cursor: "pointer",
  width: "fit-content"
};

const secondaryButtonStyle: React.CSSProperties = {
  ...buttonStyle,
  background: "rgba(15, 23, 42, 0.82)"
};

export function AgentOperatorPanel({ agentId, status }: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function runRequest(body: Record<string, unknown>, successMessage: string) {
    setError(null);
    setSuccess(null);

    startTransition(async () => {
      const response = await fetch(`/api/agents/${agentId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        setError(payload?.error ?? "Operator action failed.");
        return;
      }

      setSuccess(successMessage);
      router.refresh();
    });
  }

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        {status !== "ACTIVE" ? (
          <button
            type="button"
            disabled={isPending}
            style={buttonStyle}
            onClick={() =>
              runRequest({ status: "ACTIVE" }, "Agent set to ACTIVE.")
            }
          >
            {isPending ? "Working..." : "Activate agent"}
          </button>
        ) : null}
        {status !== "PAUSED" ? (
          <button
            type="button"
            disabled={isPending}
            style={secondaryButtonStyle}
            onClick={() =>
              runRequest({ status: "PAUSED" }, "Agent set to PAUSED.")
            }
          >
            {isPending ? "Working..." : "Pause agent"}
          </button>
        ) : null}
        {status !== "DISABLED" ? (
          <button
            type="button"
            disabled={isPending}
            style={secondaryButtonStyle}
            onClick={() =>
              runRequest({ status: "DISABLED" }, "Agent set to DISABLED.")
            }
          >
            {isPending ? "Working..." : "Disable agent"}
          </button>
        ) : null}
        <button
          type="button"
          disabled={isPending}
          style={buttonStyle}
          onClick={() =>
            runRequest({ action: "reprovision" }, "Agent reprovision finished.")
          }
        >
          {isPending ? "Working..." : "Reprovision workflows"}
        </button>
      </div>

      {error ? <p style={{ margin: 0, color: "#8a2f2f" }}>{error}</p> : null}
      {success ? <p style={{ margin: 0, color: "#3e6b37" }}>{success}</p> : null}
    </div>
  );
}
