"use client";

import { RecordStatus } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type Props = {
  integrationId: string;
  status: RecordStatus;
  accountLabel: string | null;
  credentialRef: string | null;
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 12,
  border: "1px solid var(--line)",
  background: "rgba(255,255,255,0.75)",
  color: "var(--ink)",
  font: "inherit"
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

export function IntegrationOperatorForm(props: Props) {
  const router = useRouter();
  const [status, setStatus] = useState<RecordStatus>(props.status);
  const [accountLabel, setAccountLabel] = useState(props.accountLabel ?? "");
  const [credentialRef, setCredentialRef] = useState(props.credentialRef ?? "");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    startTransition(async () => {
      const response = await fetch(`/api/integrations/${props.integrationId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          status,
          accountLabel,
          credentialRef
        })
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        setError(payload?.error ?? "Unable to save connection details.");
        return;
      }

      setSuccess("Connection details saved.");
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} style={{ display: "grid", gap: 10 }}>
      <div style={{ display: "grid", gap: 6 }}>
        <label>Connection status</label>
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value as RecordStatus)}
          style={inputStyle}
        >
          {Object.values(RecordStatus).map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>

      <div style={{ display: "grid", gap: 6 }}>
        <label>Account name</label>
        <input
          value={accountLabel}
          onChange={(event) => setAccountLabel(event.target.value)}
          placeholder="Myndful Gmail"
          style={inputStyle}
        />
      </div>

      <div style={{ display: "grid", gap: 6 }}>
        <label>Connection reference</label>
        <input
          value={credentialRef}
          onChange={(event) => setCredentialRef(event.target.value)}
          placeholder="gmailOAuth2:credential-id:Myndful Gmail"
          style={inputStyle}
        />
        <p style={{ margin: 0, color: "var(--muted)", fontSize: 13 }}>
          Use the secure reference created for this connected account.
        </p>
      </div>

      {error ? <p style={{ margin: 0, color: "#8a2f2f" }}>{error}</p> : null}
      {success ? <p style={{ margin: 0, color: "#3e6b37" }}>{success}</p> : null}

      <button type="submit" disabled={isPending} style={buttonStyle}>
        {isPending ? "Saving..." : "Save connection"}
      </button>
    </form>
  );
}
