import Link from "next/link";

const workflowSteps = [
  {
    eyebrow: "New lead",
    title: "A new inquiry lands and gets an instant reply",
    description:
      "No one needs to jump in right away. The agent answers fast, keeps the conversation warm, and moves the lead forward.",
    messages: [
      { side: "incoming", text: "Hey, are you free for a wedding in October?" },
      { side: "agent", text: "Checking calendar and package fit now." },
      { side: "agent", text: "Best next step: lock a call for Thursday 14:00." }
    ]
  },
  {
    eyebrow: "Follow-up",
    title: "The conversation keeps moving without you chasing",
    description:
      "Pricing questions, availability checks, and next steps happen automatically, so more leads reach the booking stage.",
    messages: [
      { side: "agent", text: "Availability confirmed for 12 Oct." },
      { side: "incoming", text: "Perfect. Can you send the packages?" },
      { side: "agent", text: "Sent and nudging if no reply in 24h." }
    ]
  }
];

const capabilityCards = [
  {
    title: "Fast replies",
    description: "Leads hear back while they are still interested, not hours later when the moment is gone."
  },
  {
    title: "More booked calls",
    description: "The agent keeps conversations moving toward the next step instead of letting them stall."
  },
  {
    title: "Less admin work",
    description: "Your team stops wasting time on repetitive replies, reminders, and scheduling back-and-forth."
  },
  {
    title: "Clear visibility",
    description: "You can still see what is happening, what was sent, and which leads need attention."
  }
];

const featureShowcaseCards = [
  {
    icon: "chat",
    title: "All messengers",
    description:
      "Instagram DM, Gmail, WhatsApp, Telegram — the agent works across all platforms simultaneously.",
    type: "messengers"
  },
  {
    icon: "calendar",
    title: "Auto calendar booking",
    description: "Checks Google Calendar in real time and books slots without your involvement.",
    type: "calendar"
  },
  {
    icon: "notify",
    title: "Telegram notifications",
    description: "When a client is ready, you get a push with all the details.",
    type: "notification"
  },
  {
    icon: "doc",
    title: "Document sending",
    description: "Price lists, portfolios, PDFs — the agent sends the right files automatically.",
    type: "document"
  },
  {
    icon: "loop",
    title: "Follow-up system",
    description: "Automatic reminders after 3, 7, and 14 days if the client goes silent.",
    type: "followup"
  }
];

const comparisonRows = [
  ["Response time", "Replies right away", "Often delayed or missed"],
  ["Lead handling", "Consistent follow-up", "Depends on who is available"],
  ["Booking flow", "Moves leads to the next step", "Lots of manual back-and-forth"],
  ["Visibility", "You can see what is happening", "Updates are scattered"],
  ["Workload", "Less repetitive admin", "More inbox work every week"]
];

const pricingCards = [
  {
    tier: "Starter",
    price: "$349",
    suffix: "/month",
    note: "Best for one business that wants faster replies and a cleaner booking flow.",
    bullets: ["AI replies to new leads", "Follow-up and booking flow", "Guided setup and launch"]
  },
  {
    tier: "Growth",
    price: "$799",
    suffix: "/month",
    note: "For teams handling more volume across more than one lead channel.",
    bullets: ["Multi-channel lead handling", "Smarter qualification paths", "Priority support"],
    featured: true
  },
  {
    tier: "Custom",
    price: "Custom",
    suffix: "",
    note: "For larger teams that want a tailored rollout and deeper support.",
    bullets: ["Custom scope", "Hands-on implementation", "Built around your process"]
  }
];

function BrandMark() {
  return (
    <div className="brand-mark" aria-hidden="true">
      <span />
      <span />
      <span />
    </div>
  );
}

function SectionHeading({
  label,
  title,
  body
}: {
  label: string;
  title: string;
  body: string;
}) {
  return (
    <div className="section-heading">
      <p className="section-label">{label}</p>
      <h2>{title}</h2>
      <p className="section-copy">{body}</p>
    </div>
  );
}

function PhoneMockup() {
  return (
    <div className="phone-shell">
      <div className="phone-glow" />
      <div className="phone-screen">
        <div className="phone-topbar">
          <div>
            <p className="phone-title">Sales assistant</p>
            <p className="phone-subtitle">Lead flow is active</p>
          </div>
          <span className="status-pill status-pill-live">online</span>
        </div>

        <div className="phone-panel">
          <div className="mini-stat">
            <span className="mini-stat-label">Today</span>
            <strong>12 replies</strong>
          </div>
          <div className="mini-stat">
            <span className="mini-stat-label">Booked</span>
            <strong>3 calls</strong>
          </div>
        </div>

        <div className="chat-stack">
          <div className="bubble bubble-incoming bubble-animated bubble-delay-1">
            Need pricing for a brand shoot next week.
          </div>
          <div className="bubble bubble-agent bubble-animated bubble-delay-2">
            Checking calendar and package fit.
          </div>
          <div className="bubble bubble-agent bubble-strong bubble-animated bubble-delay-3">
            Slot open on Tuesday. Sending details and booking link.
          </div>
          <div className="phone-tag-row">
            <span className="tag">gmail</span>
            <span className="tag">qualified</span>
            <span className="tag">follow-up on</span>
          </div>
        </div>

        <div className="phone-timeline">
          <div className="timeline-item">
            <span className="timeline-dot" />
            <div>
              <strong>Availability checked</strong>
              <p>Calendar workflow returned three open slots.</p>
            </div>
          </div>
          <div className="timeline-item">
            <span className="timeline-dot" />
            <div>
              <strong>Proposal sent</strong>
              <p>Agent shared the right package and next-step CTA.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function WorkflowCard({
  eyebrow,
  title,
  description,
  messages
}: {
  eyebrow: string;
  title: string;
  description: string;
  messages: Array<{ side: string; text: string }>;
}) {
  return (
    <article className="story-card">
      <div className="story-copy">
        <p className="section-label">{eyebrow}</p>
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
      <div className="story-chat">
        {messages.map((message) => (
          <div
            key={message.text}
            className={message.side === "incoming" ? "bubble bubble-incoming" : "bubble bubble-agent"}
          >
            {message.text}
          </div>
        ))}
      </div>
    </article>
  );
}

function InstagramLogo() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3.25" y="3.25" width="17.5" height="17.5" rx="5.25" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="4.1" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="17.35" cy="6.75" r="1.2" fill="currentColor" />
    </svg>
  );
}

function GmailLogo() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M4 7.25 12 13l8-5.75V18a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7.25Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M4 8.25V6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v1.75L12 14 4 8.25Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M4.75 19V9.3" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M19.25 19V9.3" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function WhatsAppLogo() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 4a8 8 0 0 0-6.96 11.94L4 20l4.2-1.01A8 8 0 1 0 12 4Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M9.45 8.85c.2-.45.43-.46.64-.47h.55c.18 0 .42.07.53.33.13.31.43 1.06.47 1.14.05.08.08.18.02.28-.06.1-.1.18-.2.27-.1.1-.2.22-.29.3-.1.08-.2.17-.08.35.12.18.54.88 1.15 1.42.8.71 1.47.93 1.68 1.04.2.1.32.08.43-.05.12-.13.5-.57.63-.76.13-.2.27-.16.45-.1.19.06 1.19.56 1.39.66.2.1.33.15.38.24.05.08.05.5-.12.98-.16.47-.96.92-1.33.96-.34.03-.77.15-2.5-.53-2.08-.83-3.43-2.88-3.53-3.02-.1-.13-.84-1.12-.84-2.13 0-1 .52-1.5.7-1.71Z"
        fill="currentColor"
      />
    </svg>
  );
}

function TelegramLogo() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M19.45 5.36 4.98 10.95c-.98.4-.97.95-.18 1.2l3.72 1.16 1.44 4.55c.19.52.1.73.65.73.43 0 .62-.2.86-.44l2.1-2.04 4.36 3.22c.8.44 1.37.21 1.57-.74l2.46-11.6c.28-1.16-.42-1.7-1.51-1.23Z"
        fill="currentColor"
      />
    </svg>
  );
}

function FeatureVisual({ type }: { type: string }) {
  if (type === "messengers") {
    const messengerItems: Array<{
      label: string;
      brand: string;
      icon: React.ReactNode;
    }> = [
      { label: "Instagram", brand: "instagram", icon: <InstagramLogo /> },
      { label: "Gmail", brand: "gmail", icon: <GmailLogo /> },
      { label: "WhatsApp", brand: "whatsapp", icon: <WhatsAppLogo /> },
      { label: "Telegram", brand: "telegram", icon: <TelegramLogo /> }
    ];

    return (
      <div className="feature-visual messenger-grid">
        {messengerItems.map((item) => (
          <div key={item.label} className="messenger-tile">
            <div className="messenger-tile-frame">
              <div className={`messenger-logo messenger-logo-${item.brand}`}>{item.icon}</div>
            </div>
            <span className="messenger-label">{item.label}</span>
          </div>
        ))}
      </div>
    );
  }

  if (type === "calendar") {
    return (
      <div className="feature-visual calendar-visual">
        <div className="calendar-grid">
          {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((day) => (
            <span key={day} className="calendar-day calendar-day-head">
              {day}
            </span>
          ))}
          {Array.from({ length: 28 }, (_, index) => {
            const day = index + 1;
            return (
              <span key={day} className={day === 15 ? "calendar-day calendar-day-active" : "calendar-day"}>
                {day}
              </span>
            );
          })}
        </div>
      </div>
    );
  }

  if (type === "notification") {
    return (
      <div className="feature-visual notification-visual">
        <div className="notification-card">
          <div className="notification-badge">
            <TelegramLogo />
          </div>
          <div>
            <strong>New booking!</strong>
            <p>Anna K. - manicure, Sat 1pm</p>
          </div>
        </div>
      </div>
    );
  }

  if (type === "document") {
    return (
      <div className="feature-visual document-visual">
        <div className="document-card">
          <div className="document-badge">PDF</div>
          <div>
            <strong>Price List 2025.pdf</strong>
            <p>245 KB</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="feature-visual followup-visual">
      <div className="followup-row">
        <span className="followup-dot followup-dot-sent" />
        <strong>After 3 days</strong>
        <em>Sent</em>
      </div>
      <div className="followup-row">
        <span className="followup-dot followup-dot-pending" />
        <strong>After 7 days</strong>
        <em>Pending</em>
      </div>
      <div className="followup-row">
        <span className="followup-dot" />
        <strong>After 14 days</strong>
        <em>Scheduled</em>
      </div>
    </div>
  );
}

function FeatureShowcaseCard({
  icon,
  title,
  description,
  type
}: {
  icon: string;
  title: string;
  description: string;
  type: string;
}) {
  return (
    <article className={`showcase-card showcase-card-${type}`}>
      <div className={`showcase-icon showcase-icon-${icon}`} aria-hidden="true" />
      <h3>{title}</h3>
      <p>{description}</p>
      <FeatureVisual type={type} />
    </article>
  );
}

export default function HomePage() {
  return (
    <main className="landing-page">
      <section className="landing-shell">
        <header className="topbar">
          <Link href="/" className="brand-lockup">
            <BrandMark />
            <div>
              <p className="brand-name">Staffless</p>
              <p className="brand-note">AI sales assistant for service businesses</p>
            </div>
          </Link>

          <nav className="topnav">
            <a href="#how">How it works</a>
            <a href="#stack">What you get</a>
            <a href="#pricing">Pricing</a>
            <Link href="/login" className="nav-button nav-button-secondary">
              Login
            </Link>
            <a href="#contact" className="nav-button nav-button-primary">
              Book a demo
            </a>
          </nav>
        </header>

        <section className="hero-panel">
          <div className="hero-copy">
            <p className="section-label">AI agent that sells for you 24/7</p>
            <h1>AI agent that replies fast and helps you book more calls.</h1>
            <p className="hero-text">
              Staffless helps service businesses answer new leads, follow up automatically, and
              keep more conversations moving without adding more admin work.
            </p>

            <div className="hero-actions">
              <a href="#contact" className="nav-button nav-button-primary">
                Start with one tenant
              </a>
              <a href="#stack" className="nav-button nav-button-secondary">
                See features
              </a>
            </div>

            <div className="hero-proof">
              <span className="status-pill">Fast lead replies</span>
              <span className="status-pill">Automatic follow-up</span>
              <span className="status-pill">More booked calls</span>
            </div>
          </div>

          <PhoneMockup />
        </section>

        <section id="how" className="content-section">
          <SectionHeading
            label="How it works"
            title="One agent handles the early sales conversation for you."
            body="The point is simple: leads get a fast response, the conversation keeps moving, and your team steps in only when it matters."
          />

          <div className="story-grid">
            {workflowSteps.map((step) => (
              <WorkflowCard key={step.title} {...step} />
            ))}
          </div>
        </section>

        <section className="metrics-band">
          <div className="metric-card">
            <strong>24/7</strong>
            <p>Replies and follow-up, even when your team is offline.</p>
          </div>
          <div className="metric-card">
            <strong>&lt;30 min</strong>
            <p>Warm leads moved toward the next step instead of sitting in the inbox.</p>
          </div>
          <div className="metric-card">
            <strong>Less admin</strong>
            <p>Fewer repetitive replies, reminders, and scheduling messages.</p>
          </div>
        </section>

        <section id="stack" className="content-section">
          <SectionHeading
            label="What the AI agent can do"
            title="It answers leads, follows up, and helps turn interest into bookings."
            body="You still have visibility into the conversations, but the repetitive work no longer sits on your team."
          />

          <div className="capability-grid">
            {capabilityCards.map((card) => (
              <article key={card.title} className="capability-card">
                <div className="capability-icon" aria-hidden="true" />
                <h3>{card.title}</h3>
                <p>{card.description}</p>
              </article>
            ))}
          </div>

          <div className="dashboard-board">
            <div className="board-sidebar">
              <button className="board-tab board-tab-active">Overview</button>
              <button className="board-tab">Conversations</button>
              <button className="board-tab">Activity</button>
              <button className="board-tab">Integrations</button>
            </div>
            <div className="board-main">
              <div className="board-summary">
                <div className="board-kpi">
                  <span>Live leads</span>
                  <strong>18</strong>
                </div>
                <div className="board-kpi">
                  <span>Booked this week</span>
                  <strong>7</strong>
                </div>
                <div className="board-kpi">
                  <span>Escalations</span>
                  <strong>2</strong>
                </div>
              </div>
              <div className="board-table">
                <div className="table-row table-row-head">
                  <span>Lead</span>
                  <span>Status</span>
                  <span>Channel</span>
                  <span>Next step</span>
                </div>
                <div className="table-row">
                  <span>Sasha M.</span>
                  <span className="table-pill">Qualified</span>
                  <span>Instagram</span>
                  <span>Call booked</span>
                </div>
                <div className="table-row">
                  <span>Oak Studio</span>
                  <span className="table-pill table-pill-warm">Proposal</span>
                  <span>Gmail</span>
                  <span>Follow-up tomorrow</span>
                </div>
                <div className="table-row">
                  <span>Naomi K.</span>
                  <span className="table-pill">New</span>
                  <span>Website</span>
                  <span>Availability check</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="content-section">
          <SectionHeading
            label="Core features"
            title="The exact jobs that usually eat your time."
            body="This block is closer to the reference you sent: larger visual cards, clearer feature names, and obvious business outcomes."
          />

          <div className="showcase-grid">
            {featureShowcaseCards.map((card) => (
              <FeatureShowcaseCard key={card.title} {...card} />
            ))}
          </div>
        </section>

        <section className="content-section">
          <SectionHeading
            label="Why teams switch"
            title="It is easier than handling every lead manually."
            body="Most businesses do not need more inbox chaos. They need faster replies and a simpler path from inquiry to booked call."
          />

          <div className="comparison-card">
            <div className="comparison-head">
              <span>Staffless system</span>
              <span>Typical manual process</span>
            </div>
            {comparisonRows.map(([label, platform, manual]) => (
              <div key={label} className="comparison-row">
                <strong>{label}</strong>
                <span>{platform}</span>
                <span>{manual}</span>
              </div>
            ))}
          </div>
        </section>

        <section id="pricing" className="content-section">
          <SectionHeading
            label="Simple pricing"
            title="Start with one setup, then grow when the volume is there."
            body="Pick the level that matches your lead volume and how much support you want from us."
          />

          <div className="pricing-grid">
            {pricingCards.map((card) => (
              <article
                key={card.tier}
                className={card.featured ? "price-card price-card-featured" : "price-card"}
              >
                <p className="price-tier">{card.tier}</p>
                <div className="price-line">
                  <strong>{card.price}</strong>
                  {card.suffix ? <span>{card.suffix}</span> : null}
                </div>
                <p className="price-note">{card.note}</p>
                <div className="price-list">
                  {card.bullets.map((bullet) => (
                    <p key={bullet}>{bullet}</p>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section id="contact" className="cta-panel">
          <div>
            <p className="section-label section-label-light">Free strategy call</p>
            <h2>We show you where leads are being lost and how the agent can fix it.</h2>
            <p className="section-copy cta-copy">
              If the fit is right, we help you launch fast, reduce admin work, and create a
              smoother path from first message to booked call.
            </p>
          </div>

          <div className="cta-actions">
            <a href="mailto:hello@staffless.ai" className="nav-button cta-button-primary">
              hello@staffless.ai
            </a>
            <Link href="/admin" className="nav-button cta-button-secondary">
              Operator access
            </Link>
          </div>
        </section>
      </section>
    </main>
  );
}
