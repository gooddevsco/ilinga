export const planSeeds = [
  { code: 'free', displayName: 'Free', monthlyUsdCents: 0, monthlyCredits: 30, seats: 1 },
  { code: 'studio', displayName: 'Studio', monthlyUsdCents: 4900, monthlyCredits: 500, seats: 3 },
  { code: 'pro', displayName: 'Pro', monthlyUsdCents: 14900, monthlyCredits: 2000, seats: 8 },
  { code: 'firm', displayName: 'Firm', monthlyUsdCents: 39900, monthlyCredits: 10000, seats: 25 },
  {
    code: 'enterprise',
    displayName: 'Enterprise',
    monthlyUsdCents: 0,
    monthlyCredits: 0,
    seats: 0,
  },
] as const;

export const creditPackSeeds = [
  { code: 'pack100', credits: 100, usdCents: 1900 },
  { code: 'pack500', credits: 500, usdCents: 7900 },
  { code: 'pack2k', credits: 2000, usdCents: 26900 },
  { code: 'pack10k', credits: 10000, usdCents: 109900 },
] as const;
