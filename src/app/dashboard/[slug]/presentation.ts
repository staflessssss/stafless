import { IntegrationType } from "@prisma/client";
import type { getTenantBySlug } from "@/lib/dashboard";
import { getClientChannelTypes, getIntegrationDescription, getIntegrationGradient, getIntegrationLabel } from "@/lib/integrations";

type TenantData = NonNullable<Awaited<ReturnType<typeof getTenantBySlug>>>;

export type DisplayIntegration = {
  id: string;
  type: IntegrationType;
  label: string;
  description: string;
  gradient: string;
  status: "connected" | "attention";
  statusLabel: string;
  accountLabel: string | null;
  connectedAt: Date | null;
  ctaLabel: string;
  isConnected: boolean;
};

export type DisplayConversation = {
  id: string;
  title: string;
  channel: string;
  preview: string;
  summary: string;
  lastActivity: string;
  stage: string;
  isDemo: boolean;
};

export type DisplayActivity = {
  id: string;
  label: string;
  channel: string;
  details: string;
  createdAt: string;
  sortValue: number;
  status: string;
  isDemo: boolean;
};

export function formatFriendlyDate(value: Date | string | null | undefined) {
  if (!value) {
    return "No recent activity yet";
  }

  return new Date(value).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}

export function getClientStatusLabel(status: string) {
  switch (status.toUpperCase()) {
    case "ACTIVE":
    case "SENT":
      return "Live";
    case "PAUSED":
      return "Paused";
    case "DISABLED":
      return "Off";
    default:
      return "In progress";
  }
}

export function getConversationChannelLabel(channel: string) {
  switch (channel.toLowerCase()) {
    case "gmail":
      return "Gmail";
    case "instagram":
      return "Instagram";
    case "telegram":
      return "Telegram";
    default:
      return channel;
  }
}

export function getDisplayIntegrations(tenant: TenantData): DisplayIntegration[] {
  const integrationMap = new Map(tenant.integrations.map((integration) => [integration.type, integration]));

  return getClientChannelTypes(tenant.integrations.map((integration) => integration.type)).map((type) => {
    const integration = integrationMap.get(type);
    const isConnected = integration?.status === "ACTIVE";

    return {
      id: integration?.id ?? `virtual-${type}`,
      type,
      label: getIntegrationLabel(type),
      description: getIntegrationDescription(type),
      gradient: getIntegrationGradient(type),
      status: isConnected ? "connected" : "attention",
      statusLabel: isConnected ? "Connected" : "Ready to connect",
      accountLabel: integration?.accountLabel ?? null,
      connectedAt: integration?.connectedAt ?? null,
      ctaLabel: isConnected ? `Reconnect ${getIntegrationLabel(type)}` : `Connect ${getIntegrationLabel(type)}`,
      isConnected
    };
  });
}

export function buildConversationFeed(tenant: TenantData): DisplayConversation[] {
  if (tenant.conversations.length > 0) {
    return tenant.conversations.map((conversation) => {
      const latestMessage = conversation.messages[0];

      return {
        id: conversation.id,
        title: conversation.customerEmail ?? conversation.lead?.name ?? "New inquiry",
        channel: getConversationChannelLabel(conversation.channel),
        preview:
          latestMessage?.normalizedText ??
          latestMessage?.rawText ??
          latestMessage?.modelOutput ??
          "A new conversation started here.",
        summary: conversation.lead?.stage
          ? `Lead stage: ${conversation.lead.stage}`
          : "Waiting for the next assistant step.",
        lastActivity: formatFriendlyDate(conversation.lastMessageAt ?? conversation.updatedAt),
        stage: conversation.lead?.stage ?? "New inquiry",
        isDemo: false
      };
    });
  }

  return [
    {
      id: "demo-1",
      title: "Emma & Tyler",
      channel: "Gmail",
      preview: "Hi, we're planning a Lake Como wedding and wanted to ask about your collections for September.",
      summary: "Your assistant would reply with pricing, availability guidance, and the next step.",
      lastActivity: "Demo preview",
      stage: "New inquiry",
      isDemo: true
    },
    {
      id: "demo-2",
      title: "Sofia Morales",
      channel: "Instagram",
      preview: "Love your work. Are you available for a June wedding weekend in Mallorca?",
      summary: "Connected channels will start appearing here as soon as real messages arrive.",
      lastActivity: "Demo preview",
      stage: "Awaiting reply",
      isDemo: true
    }
  ];
}

function formatActivityLabel(label: string) {
  switch (label) {
    case "agent_reply":
      return "Sent a reply";
    case "check_availability":
      return "Checked availability";
    case "check_calendar":
      return "Checked the calendar";
    case "book_call":
      return "Booked a call";
    case "handle_incoming_message":
      return "Handled a new inquiry";
    case "send_reply":
      return "Sent a follow-up";
    default:
      return "Completed an assistant step";
  }
}

export function buildActivityFeed(tenant: TenantData): DisplayActivity[] {
  const liveActivity = tenant.conversations.flatMap((conversation) => [
    ...conversation.toolRuns.map((toolRun) => ({
      id: toolRun.id,
      label: formatActivityLabel(toolRun.toolName),
      channel: getConversationChannelLabel(conversation.channel),
      details: "Your assistant completed a behind-the-scenes action for this conversation.",
      createdAt: formatFriendlyDate(toolRun.createdAt),
      sortValue: toolRun.createdAt.getTime(),
      status: getClientStatusLabel(toolRun.status),
      isDemo: false
    })),
    ...conversation.messages
      .filter((message) => message.direction === "outbound")
      .map((message) => ({
        id: message.id,
        label: "Sent a reply",
        channel: getConversationChannelLabel(conversation.channel),
        details:
          message.modelOutput ??
          message.normalizedText ??
          message.rawText ??
          "The assistant sent a polished reply.",
        createdAt: formatFriendlyDate(message.createdAt),
        sortValue: message.createdAt.getTime(),
        status: "Sent",
        isDemo: false
      }))
  ]);

  if (liveActivity.length > 0) {
    return liveActivity.sort((left, right) => right.sortValue - left.sortValue);
  }

  return [
    {
      id: "demo-activity-1",
      label: "Prepared a first reply",
      channel: "Gmail",
      details: "When live channels are connected, your timeline will show replies, follow-ups, and bookings here.",
      createdAt: "Demo preview",
      sortValue: 0,
      status: "Ready",
      isDemo: true
    },
    {
      id: "demo-activity-2",
      label: "Queued a follow-up",
      channel: "Instagram",
      details: "This keeps the client-facing view warm and understandable even before the first live conversation arrives.",
      createdAt: "Demo preview",
      sortValue: 0,
      status: "Ready",
      isDemo: true
    }
  ];
}

export function buildBookingSummary(tenant: TenantData) {
  if (tenant.appointments.length > 0) {
    return tenant.appointments.map((appointment) => ({
      id: appointment.id,
      title: tenant.leads.find((lead) => lead.id === appointment.leadId)?.name ?? "Consultation call",
      startsAt: new Date(appointment.startAt).toLocaleString([], {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit"
      }),
      status: getClientStatusLabel(appointment.status)
    }));
  }

  return [
    {
      id: "demo-booking-1",
      title: "Consultation bookings",
      startsAt: "Will appear after the first confirmed call",
      status: "Demo"
    }
  ];
}
