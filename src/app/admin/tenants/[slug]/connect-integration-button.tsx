"use client";

import { useTransition } from "react";

type Props = {
  tenantSlug: string;
  integrationType: string;
  ctaLabel?: string;
  connected?: boolean;
  compact?: boolean;
};

function getButtonStyle(connected: boolean, compact: boolean): React.CSSProperties {
  return {
    border: 0,
    background: connected
      ? "linear-gradient(180deg, rgba(255,255,255,0.16), rgba(255,255,255,0.08))"
      : "linear-gradient(180deg,#ff9f72,#ff6f61)",
    color: connected ? "#fff" : "#171d2c",
    padding: compact ? "11px 14px" : "12px 16px",
    borderRadius: 999,
    font: "inherit",
    fontWeight: 700,
    cursor: "pointer",
    width: "fit-content",
    boxShadow: connected ? "none" : "0 14px 30px rgba(255,111,97,0.24)",
    opacity: 1
  };
}

export function ConnectIntegrationButton({
  tenantSlug,
  integrationType,
  ctaLabel,
  connected = false,
  compact = false
}: Props) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() =>
        startTransition(() => {
          window.location.assign(
            `/api/dashboard/${tenantSlug}/integrations/${integrationType}/connect`
          );
        })
      }
      style={getButtonStyle(connected, compact)}
    >
      {isPending
        ? "Opening secure connect..."
        : ctaLabel ?? `Connect ${integrationType}`}
    </button>
  );
}
