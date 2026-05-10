/**
 * Industry tags applied to products. Slug strings are stored in the DB
 * (Product.industries JSONB list); the human-readable labels come from
 * i18n at `industries.<slug>` so the same slug renders in any locale.
 *
 * Adding a new industry: append a slug here, and add the matching label
 * in both en.json and ar.json under the `industries` key. No backend
 * migration needed — JSONB stores arbitrary strings.
 */
export const INDUSTRIES = [
  "public-sector",
  "financial-services",
  "energy-resources",
];

/** Convenience guard for filter inputs. */
export function isValidIndustry(slug) {
  return INDUSTRIES.includes(slug);
}
