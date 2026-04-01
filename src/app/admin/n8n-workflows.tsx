"use client";

import { useEffect, useState } from "react";

type Workflow = {
  id: string;
  name: string;
  active?: boolean;
};

type WorkflowState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; workflows: Workflow[]; nextCursor: string | null };

export function N8nWorkflowPanel() {
  const [state, setState] = useState<WorkflowState>({ status: "loading" });

  useEffect(() => {
    async function loadWorkflows() {
      try {
        const response = await fetch("/api/n8n/workflows");

        const payload = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(payload?.error ?? "Failed to load workflows.");
        }

        setState({
          status: "ready",
          workflows: payload?.workflows ?? [],
          nextCursor: payload?.nextCursor ?? null
        });
      } catch (error) {
        setState({
          status: "error",
          message:
            error instanceof Error ? error.message : "Unknown n8n loading error."
        });
      }
    }

    loadWorkflows();
  }, []);

  return (
    <section
      style={{
        border: "1px solid var(--line)",
        borderRadius: 24,
        background: "var(--surface)",
        padding: 24
      }}
    >
      <h2 style={{ marginTop: 0, fontSize: 24 }}>n8n workflows</h2>
      <p style={{ color: "var(--muted)", lineHeight: 1.6 }}>
        Connected to your n8n instance. Use these workflow IDs next to map
        template workflows for provisioning.
      </p>

      {state.status === "loading" ? (
        <p style={{ margin: 0, color: "var(--muted)" }}>Loading workflows...</p>
      ) : null}

      {state.status === "error" ? (
        <p style={{ margin: 0, color: "#8a2f2f" }}>
          Could not load workflows from n8n: {state.message}
        </p>
      ) : null}

      {state.status === "ready" ? (
        <>
          <div
            style={{ display: "grid", gap: 12, maxHeight: 420, overflow: "auto" }}
          >
            {state.workflows.map((workflow) => (
              <div
                key={workflow.id}
                style={{
                  border: "1px solid var(--line)",
                  borderRadius: 16,
                  padding: 16
                }}
              >
                <p style={{ margin: 0, fontWeight: 700 }}>{workflow.name}</p>
                <p style={{ margin: "6px 0 0", color: "var(--muted)" }}>
                  ID: {workflow.id}
                </p>
                <p style={{ margin: "6px 0 0", color: "var(--muted)" }}>
                  Active: {workflow.active ? "yes" : "no"}
                </p>
              </div>
            ))}
          </div>
          {state.nextCursor ? (
            <p style={{ margin: "14px 0 0", color: "var(--muted)" }}>
              More workflows exist in n8n. We are intentionally loading only the
              first page here for speed.
            </p>
          ) : null}
        </>
      ) : null}
    </section>
  );
}
