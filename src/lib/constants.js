export const CREATOR_CATEGORIES = [
  "Beauty", "Fashion", "Fitness & Wellness", "Food & Beverage", "Travel", "Technology",
  "Gaming", "Parenting", "Finance", "Lifestyle", "Home & Interiors", "Education",
];

export const INDUSTRIES = [
  "Beauty & Personal Care", "Fashion & Apparel", "Health & Wellness", "Food & Beverage",
  "Travel & Hospitality", "Technology", "Consumer Electronics", "Finance & Insurance",
  "Education", "Home & Living", "Automotive", "Retail & E-commerce",
];

export const LANGUAGES = [
  "English", "Hindi", "Tamil", "Telugu", "Bengali", "Marathi", "Kannada",
  "Malayalam", "Gujarati", "Punjabi", "Urdu",
];

export const LOCATIONS = [
  "Mumbai", "Delhi NCR", "Bengaluru", "Hyderabad", "Chennai", "Pune", "Kolkata",
  "Ahmedabad", "Jaipur", "Dubai", "Singapore", "London", "Remote",
];

export const COLLAB_TYPES = [
  "Sponsored post", "Video integration", "Brand ambassador", "Product review",
  "Event appearance", "Affiliate", "UGC only", "Long-term partnership",
];

export const PLATFORMS = [
  { value: "youtube", label: "YouTube" },
  { value: "instagram", label: "Instagram" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "facebook", label: "Facebook" },
  { value: "x", label: "X" },
  { value: "tiktok", label: "TikTok" },
  { value: "other", label: "Other" },
];

/** @param {string} value */
export const platformLabel = (value) =>
  PLATFORMS.find((p) => p.value === value)?.label || value || "—";

export const DOCUMENT_TYPES = [
  { value: "identity", label: "Identity document", category: "identity" },
  { value: "business_registration", label: "Business registration", category: "business" },
  { value: "lab_report", label: "Laboratory test report", category: "product_document" },
  { value: "license", label: "License", category: "product_document" },
  { value: "certificate", label: "Certificate", category: "product_document" },
  { value: "product_document", label: "Other product document", category: "product_document" },
  { value: "campaign_evidence", label: "Campaign evidence", category: "performance" },
  { value: "other", label: "Other", category: "identity" },
];

export const VERIFICATION_CATEGORIES = [
  { key: "identity", label: "Identity", description: "Government ID matched to your profile name.", subject: "creator" },
  { key: "business", label: "Business", description: "Company registration and address records.", subject: "brand" },
  { key: "social", label: "Social accounts", description: "Platform data pulled from an official API or reviewed by our team.", subject: "creator" },
  { key: "product_document", label: "Product documents", description: "Lab reports, licenses and certificates checked by an administrator.", subject: "brand" },
  { key: "collaboration", label: "Collaborations", description: "A completed campaign confirmed by both parties.", subject: "creator" },
  { key: "performance", label: "Performance", description: "Reach, clicks and revenue supported by campaign evidence.", subject: "creator" },
];

export const VERIFICATION_CATEGORY_LABEL = VERIFICATION_CATEGORIES.reduce((acc, c) => {
  acc[c.key] = c.label;
  return acc;
}, /** @type {Record<string, string>} */ ({}));

export const ATTRIBUTION_METHODS = [
  "Platform analytics",
  "Unique discount code",
  "Tracked affiliate link",
  "UTM campaign tracking",
  "Brand-side order data",
  "Mixed sources",
];

export const EVIDENCE_LEVELS = [
  { value: "brand_provided", label: "Brand-provided claim" },
  { value: "independently_tested", label: "Independently tested" },
  { value: "regulatory_approved", label: "Regulatory approval" },
];

/** @param {string} value */
export const evidenceLevelLabel = (value) =>
  EVIDENCE_LEVELS.find((e) => e.value === value)?.label || "Brand-provided claim";

export const CONSENT_TYPES = [
  { key: "data_processing", label: "Core platform processing", description: "Store and display your profile, documents and collaboration records." },
  { key: "document_sharing", label: "Share verification summaries", description: "Show verification outcomes (never raw files) on your public profile." },
  { key: "analytics", label: "Product analytics", description: "Aggregated usage data used to improve the platform." },
  { key: "marketing", label: "Product updates", description: "Occasional emails about new features." },
];