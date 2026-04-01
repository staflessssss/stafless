import type { AgentConfig } from "@/types/agent-config";

export const myndfulConfig: AgentConfig = {
  businessName: "Myndful Films",
  ownerName: "Taras Mynd",
  website: "www.myndfulfilms.co",
  contactEmail: "contact@myndfulfilms.com",
  brandVoice: {
    style: "warm, personal, founder-led",
    emojiAllowlist: ["🤍", "✨", "🎥"],
    messageStyle: "short natural paragraphs",
    mirrorCustomerTone: true
  },
  signature:
    "Taras Mynd\nFounder & Creative Director / MYNDFUL FILMS LLC\nwww.myndfulfilms.co\ncontact@myndfulfilms.com",
  businessRules: {
    goal: "book_consultation_call",
    weddingDateMustBeFuture: true,
    callWindow: {
      days: ["monday", "tuesday", "wednesday", "thursday", "friday"],
      start: "09:00",
      end: "14:00",
      timezone: "America/New_York"
    },
    callDurationMinutes: 30,
    requireCheckCalendarBeforeBooking: true,
    requireCheckAvailabilityBeforeConfirmingDate: true,
    neverDiscussContracts: true,
    neverOfferDiscounts: true
  },
  coverageRules: {
    regions: [
      {
        code: "NC_SC_GA",
        label: "NC, SC, GA",
        capacity: 2
      },
      {
        code: "FL",
        label: "Florida",
        capacity: 1
      }
    ]
  },
  pricing: {
    startingPrice: 2750,
    currency: "USD",
    collectionsGuideLabel: "collections guide",
    attachmentFileKey: "myndful_pricing_pdf"
  },
  faq: {
    style:
      "Cinematic documentary with natural, real moments and no cheesy poses.",
    editingTimeline:
      "Approximately 4 months for the wedding film and cinematic clip, with a sneak peek in about 2 weeks.",
    music: "Yes, couples can choose music for their films.",
    delivery: "Private online gallery for watching, downloading, and sharing.",
    taxes: "No taxes or hidden fees. Travel may apply if the venue exceeds included mileage.",
    insurance: "Yes, COI is available for the venue or planner."
  },
  portfolioLinks: [
    "https://galleries.vidflow.co/rwjo8nz2",
    "https://galleries.vidflow.co/zm7amvvx",
    "https://galleries.vidflow.co/valeriia-and-kirk_myndful-films"
  ],
  reviewsLink: "https://maps.app.goo.gl/kVDLjvYA6zHNdo2NA"
};
