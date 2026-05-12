export const SALES_FORM_SECTIONS = [
  { key: "INTERIOR", label: "Interior", kind: "spec" as const },
  { key: "KITCHEN", label: "Kitchen", kind: "spec" as const },
  { key: "ELECTRICAL", label: "Electrical", kind: "spec" as const },
  { key: "WALL_COLOR", label: "Wall Color", kind: "color" as const },
  { key: "FLOOR_COLOR", label: "Floor Color", kind: "color" as const },
  { key: "CABIN_ADDONS", label: "Cabin Add-Ons", kind: "addon" as const },
  { key: "MISC_ADDONS", label: "Misc Add-Ons", kind: "addon" as const },
  { key: "HVAC", label: "HVAC", kind: "spec" as const },
  { key: "GARAGE", label: "Garage", kind: "spec" as const },
  { key: "EXTERIOR", label: "Exterior", kind: "spec" as const },
  { key: "EXTERIOR_ADDONS", label: "Exterior Add-Ons", kind: "addon" as const },
] as const;

export const BUILD_FORM_SECTIONS = [
  { key: "INTERIOR_PACKAGE", label: "Interior Package" },
  { key: "HVAC", label: "HVAC" },
  { key: "WINDOWS", label: "Windows" },
  { key: "SLEEPING", label: "Sleeping" },
  { key: "LIGHTING", label: "Lighting" },
  { key: "KITCHEN", label: "Kitchen" },
  { key: "WATER_SYSTEM", label: "Water System" },
  { key: "STORAGE", label: "Storage" },
  { key: "ELECTRICAL", label: "Electrical" },
  { key: "SAFETY_PACKAGE", label: "Safety Package" },
  { key: "EXTERIOR", label: "Exterior" },
] as const;

export type SalesSectionKey = (typeof SALES_FORM_SECTIONS)[number]["key"];
export type BuildSectionKey = (typeof BUILD_FORM_SECTIONS)[number]["key"];

export const ROLES = ["admin", "user"] as const;
export type Role = (typeof ROLES)[number];

export const SUPABASE_BUCKET = "vanworks";
