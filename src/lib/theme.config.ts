/**
 * Per-client theme config (brand tokens, copy, feature flags). Wired into
 * every design component that referenced these values directly (Header,
 * Footer, layout metadata, Home/Home-01 delivery-benefits strip, Product
 * delivery-policy copy, Blog/Testimonials brand-name fallbacks). Marketing
 * copy that isn't a durable brand identity (e.g. the weekly deals price)
 * stays as page content, not a theme token.
 */
export const theme = {
  brand: {
    name: "RigForge",
    tagline: "Built to Perform",
    legalName: "RigForge Ltd",
    about: "Independent UK retailer. Warehouse and workshop in Manchester, showroom open Mon–Sat.",
  },
  /** Badges shown at checkout/footer - a real client integration only
   * supports the methods they've actually set up, so this is genuinely
   * per-client rather than fixed page content. */
  paymentMethods: ["VISA", "MASTERCARD", "AMEX", "PAYPAL", "KLARNA", "APPLE PAY"],
  contact: {
    phone: "0161 496 0000",
    email: "support@ukcomputershop.example",
    address: "Trafford Park, Manchester, M17",
    openingHours: "Mon–Fri 9:00–17:30 · Sat 10:00–16:00",
  },
  social: {
    facebook: "#",
    instagram: "#",
    twitter: "#",
    youtube: "#",
  },
  features: {
    freeDeliveryThresholdGbp: 75,
    saturdayDeliveryGbp: 7.95,
    warrantyYears: 3,
    financeMonths: 12,
    financeThresholdGbp: 600,
  },
} as const;

export type Theme = typeof theme;
