"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

export function LogoutButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      onClick={() =>
        startTransition(async () => {
          await fetch("/api/auth/logout", {
            method: "POST"
          });
          router.push("/login");
          router.refresh();
        })
      }
      disabled={isPending}
      style={{
        border: "1px solid var(--line)",
        borderRadius: 999,
        padding: "10px 14px",
        background: "rgba(255,255,255,0.52)",
        color: "var(--ink)",
        font: "inherit",
        cursor: "pointer"
      }}
    >
      {isPending ? "Signing out..." : "Logout"}
    </button>
  );
}
