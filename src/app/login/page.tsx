import Link from "next/link";
import { LoginForm } from "./login-form";

export default async function LoginPage({
  searchParams
}: {
  searchParams?: Promise<{ next?: string }>;
}) {
  const params = searchParams ? await searchParams : undefined;

  return (
    <main>
      <section style={{ padding: "24px 16px 80px" }}>
        <div style={{ maxWidth: 980, margin: "0 auto", display: "grid", gap: 16 }}>
          <Link
            href="/"
            style={{
              width: "fit-content",
              textDecoration: "none",
              color: "var(--text-soft)"
            }}
          >
            Back to website
          </Link>

          <section
            style={{
              borderRadius: 32,
              overflow: "hidden",
              border: "1px solid var(--line)",
              background: "var(--surface)",
              boxShadow: "var(--shadow)",
              display: "grid",
              gridTemplateColumns: "minmax(0,1.15fr) minmax(320px,.85fr)"
            }}
          >
            <div
              style={{
                padding: 28,
                background:
                  "radial-gradient(circle at top right, rgba(122,92,255,0.22), transparent 24%), linear-gradient(180deg, #0D1222 0%, #121A2F 100%)"
              }}
            >
              <SectionLabel>Client access</SectionLabel>
              <h1 style={{ marginTop: 12, fontSize: "clamp(2.4rem, 5vw, 4.6rem)", lineHeight: 0.95 }}>
                Your business
                <br />
                dashboard.
              </h1>
              <p style={{ marginTop: 14, maxWidth: 520, lineHeight: 1.7 }}>
                See new conversations, connected channels, upcoming bookings, and what your AI
                assistant is doing for your business.
              </p>
            </div>

            <div
              style={{
                padding: 28,
                background: "linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.04))"
              }}
            >
              <SectionLabel>Client login</SectionLabel>
              <h2 style={{ marginTop: 12, fontSize: 32 }}>Welcome back</h2>
              <p style={{ marginTop: 10, lineHeight: 1.7 }}>
                Log in to open your dashboard and manage your connected channels in one place.
              </p>
              <LoginForm next={params?.next} />
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        fontSize: 11,
        textTransform: "uppercase",
        letterSpacing: "0.18em",
        color: "#f54b64",
        fontWeight: 700
      }}
    >
      {children}
    </p>
  );
}
