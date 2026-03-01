export const PLAN_LIMITS = {
  free: { maxLeads: 10, aiQuotes: false },
  pro: { maxLeads: Infinity, aiQuotes: true },
} as const;

export type PlanType = keyof typeof PLAN_LIMITS;
