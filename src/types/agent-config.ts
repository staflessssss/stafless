export type BrandVoice = {
  style: string;
  emojiAllowlist: string[];
  messageStyle: string;
  mirrorCustomerTone: boolean;
};

export type CallWindowRule = {
  days: string[];
  start: string;
  end: string;
  timezone: string;
};

export type BusinessRules = {
  goal: string;
  weddingDateMustBeFuture: boolean;
  callWindow: CallWindowRule;
  callDurationMinutes: number;
  requireCheckCalendarBeforeBooking: boolean;
  requireCheckAvailabilityBeforeConfirmingDate: boolean;
  neverDiscussContracts: boolean;
  neverOfferDiscounts: boolean;
};

export type CoverageRegion = {
  code: string;
  label: string;
  capacity: number;
};

export type PricingConfig = {
  startingPrice: number;
  currency: string;
  collectionsGuideLabel: string;
  attachmentFileKey?: string;
};

export type AgentConfig = {
  businessName: string;
  ownerName: string;
  website: string;
  contactEmail: string;
  brandVoice: BrandVoice;
  signature: string;
  businessRules: BusinessRules;
  coverageRules: {
    regions: CoverageRegion[];
  };
  pricing: PricingConfig;
  faq: Record<string, string>;
  portfolioLinks: string[];
  reviewsLink?: string;
};
