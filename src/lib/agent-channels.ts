import { IntegrationType } from "@prisma/client";

export type AgentChannel = "gmail" | "instagram";

const sharedSalesIntegrations = [
  IntegrationType.GOOGLE_CALENDAR,
  IntegrationType.GOOGLE_DRIVE,
  IntegrationType.GOOGLE_SHEETS
];

export function getSupportedAgentChannels(templateSlug: string): AgentChannel[] {
  if (templateSlug === "wedding-lead-agent") {
    return ["gmail", "instagram"];
  }

  return ["gmail"];
}

export function getAgentChannelLabel(channel: AgentChannel) {
  switch (channel) {
    case "gmail":
      return "Gmail agent";
    case "instagram":
      return "Instagram agent";
    default:
      return channel;
  }
}

export function getDefaultAgentName(channel: AgentChannel, tenantName: string) {
  switch (channel) {
    case "gmail":
      return `${tenantName} Gmail Agent`;
    case "instagram":
      return `${tenantName} Instagram Agent`;
    default:
      return `${tenantName} Agent`;
  }
}

export function getRequiredClientIntegrationsForAgentChannel(
  templateSlug: string,
  channel: AgentChannel
) {
  if (templateSlug !== "wedding-lead-agent") {
    return [IntegrationType.GMAIL];
  }

  if (channel === "instagram") {
    return [IntegrationType.INSTAGRAM, ...sharedSalesIntegrations];
  }

  return [IntegrationType.GMAIL, ...sharedSalesIntegrations];
}

export function getDefaultChannelsForAgentChannel(channel: AgentChannel) {
  return [channel];
}
