"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export function LoginForm({ next }: { next?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("client@myndfulfilms.com");
  const [password, setPassword] = useState("stafless-demo");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    startTransition(async () => {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email,
          password,
          next: next ?? ""
        })
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        setError(payload?.error ?? "Unable to sign in.");
        return;
      }

      router.push(payload.redirectTo ?? "/");
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} style={{ display: "grid", gap: 14, marginTop: 22 }}>
      <div style={{ display: "grid", gap: 6 }}>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="email"
          required
          style={inputStyle}
        />
      </div>

      <div style={{ display: "grid", gap: 6 }}>
        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="current-password"
          required
          style={inputStyle}
        />
      </div>

      <p style={{ margin: 0, color: "var(--text-soft)", fontSize: 14, lineHeight: 1.6 }}>
        Demo credentials are prefilled so we can test the full client dashboard flow end to end.
      </p>

      {error ? <p style={{ margin: 0, color: "#ff9a9a" }}>{error}</p> : null}

      <button type="submit" disabled={isPending} style={buttonStyle}>
        {isPending ? "Signing in..." : "Login to dashboard"}
      </button>
    </form>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: 14,
  border: "1px solid var(--line)",
  background: "rgba(255,255,255,0.06)",
  color: "#fff",
  font: "inherit"
};

const buttonStyle: React.CSSProperties = {
  border: 0,
  background: "linear-gradient(135deg,#f54b64,#7a5cff)",
  color: "#fff",
  padding: "12px 16px",
  borderRadius: 999,
  font: "inherit",
  fontWeight: 700,
  cursor: "pointer"
};
