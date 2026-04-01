import Link from "next/link";
import { LogoutButton } from "./logout-button";

type NavItem = {
  href: string;
  label: string;
  active?: boolean;
};

function getNavDescription(label: string) {
  switch (label) {
    case "Overview":
      return "Your live business snapshot";
    case "Conversations":
      return "All client messages in one place";
    case "Activity":
      return "Everything your assistant has handled";
    case "Integrations":
      return "Channels connected to your assistant";
    case "Business Settings":
      return "Your core business details";
    default:
      return "";
  }
}

export function DashboardShell(props: {
  tenantName: string;
  tenantSlug: string;
  title: string;
  description: string;
  nav: NavItem[];
  children: React.ReactNode;
}) {
  return (
    <main style={{ padding: "28px 18px 72px" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", display: "grid", gap: 22 }}>
        <section
          style={{
            position: "relative",
            overflow: "hidden",
            border: "1px solid var(--line)",
            borderRadius: 34,
            background:
              "radial-gradient(circle at top left, rgba(255,111,97,0.16), transparent 26%), radial-gradient(circle at 88% 16%, rgba(255,255,255,0.08), transparent 18%), linear-gradient(180deg, rgba(24,31,47,0.98), rgba(15,19,31,0.98))",
            boxShadow: "var(--shadow)",
            padding: "28px 28px 22px"
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: "auto -80px -120px auto",
              width: 280,
              height: 280,
              borderRadius: 999,
              background: "radial-gradient(circle, rgba(255,111,97,0.24), transparent 68%)",
              pointerEvents: "none"
            }}
          />

          <div
            style={{
              position: "relative",
              display: "flex",
              justifyContent: "space-between",
              gap: 18,
              alignItems: "flex-start",
              flexWrap: "wrap"
            }}
          >
            <div style={{ maxWidth: 760 }}>
              <p
                style={{
                  margin: 0,
                  textTransform: "uppercase",
                  letterSpacing: "0.18em",
                  fontSize: 11,
                  color: "rgba(255,255,255,0.62)",
                  fontWeight: 700
                }}
              >
                Client Dashboard
              </p>
              <h1 style={{ margin: "14px 0 10px", fontSize: "clamp(2.5rem, 5vw, 4.3rem)" }}>
                {props.tenantName}
              </h1>
              <p style={{ margin: 0, maxWidth: 680, lineHeight: 1.7, fontSize: 17 }}>
                {props.description}
              </p>
            </div>

            <div
              style={{
                display: "flex",
                gap: 10,
                alignItems: "center",
                flexWrap: "wrap"
              }}
            >
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 14px",
                  borderRadius: 999,
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.08)"
                }}
              >
                <span
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 999,
                    background: "#8fb3ff",
                    boxShadow: "0 0 0 6px rgba(143,179,255,0.18)"
                  }}
                />
                <span style={{ color: "var(--text)", fontWeight: 700 }}>Private client view</span>
              </div>
              <LogoutButton />
            </div>
          </div>
        </section>

        <nav
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: 12
          }}
        >
          {props.nav.map((item) => (
            <Link
              key={item.href}
              href={item.href as never}
              style={{
                textDecoration: "none",
                padding: "16px 18px",
                borderRadius: 24,
                border: item.active ? "1px solid rgba(255,111,97,0.28)" : "1px solid var(--line)",
                background: item.active
                  ? "linear-gradient(180deg, rgba(255,111,97,0.18), rgba(255,111,97,0.08))"
                  : "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))",
                boxShadow: item.active ? "0 16px 36px rgba(255,111,97,0.16)" : "none",
                display: "grid",
                gap: 6
              }}
            >
              <span
                style={{
                  color: item.active ? "#fff0ed" : "var(--text)",
                  fontWeight: 700,
                  fontSize: 15
                }}
              >
                {item.label}
              </span>
              <span style={{ color: "var(--muted)", fontSize: 13, lineHeight: 1.5 }}>
                {getNavDescription(item.label)}
              </span>
            </Link>
          ))}
        </nav>

        <section
          style={{
            border: "1px solid var(--line)",
            borderRadius: 30,
            background: "linear-gradient(180deg, rgba(24,31,47,0.96), rgba(18,23,36,0.98))",
            boxShadow: "var(--shadow-soft)",
            padding: 28
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 14,
              alignItems: "flex-end",
              flexWrap: "wrap"
            }}
          >
            <div>
              <p
                style={{
                  margin: 0,
                  textTransform: "uppercase",
                  letterSpacing: "0.16em",
                  fontSize: 11,
                  color: "var(--muted)"
                }}
              >
                {props.title}
              </p>
              <h2 style={{ marginTop: 10, fontSize: "clamp(1.7rem, 3vw, 2.6rem)" }}>
                {props.title}
              </h2>
            </div>
          </div>
          <div style={{ marginTop: 22 }}>{props.children}</div>
        </section>
      </div>
    </main>
  );
}
