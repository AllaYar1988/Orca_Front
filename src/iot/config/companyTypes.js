/**
 * Company Types Registry
 *
 * Central registry for company/industry type icons.
 * Backend sends type code (e.g., "MFG", "AGR"), frontend maps to icon.
 *
 * Usage:
 *   import { getCompanyConfig, COMPANY_TYPES } from '../config/companyTypes';
 *   const config = getCompanyConfig(company.type);
 *   // config.icon = "factory", config.label = "Manufacturing"
 */

export const COMPANY_TYPES = {
  // Manufacturing & Industrial
  MFG: { icon: "building-gear", label: "Manufacturing", color: "#6366f1" },
  IND: { icon: "gear-wide-connected", label: "Industrial", color: "#8b5cf6" },
  FAC: { icon: "building-fill-gear", label: "Factory", color: "#7c3aed" },

  // Energy & Utilities
  ENR: { icon: "lightning-charge-fill", label: "Energy", color: "#f59e0b" },
  UTL: { icon: "plug-fill", label: "Utilities", color: "#eab308" },
  PWR: { icon: "battery-charging", label: "Power", color: "#fbbf24" },
  SOL: { icon: "sun-fill", label: "Solar", color: "#facc15" },
  WND: { icon: "wind", label: "Wind Energy", color: "#22d3d8" },

  // Agriculture & Environment
  AGR: { icon: "tree-fill", label: "Agriculture", color: "#22c55e" },
  FRM: { icon: "flower1", label: "Farm", color: "#16a34a" },
  GRN: { icon: "moisture", label: "Greenhouse", color: "#4ade80" },
  ENV: { icon: "globe-americas", label: "Environmental", color: "#10b981" },

  // Healthcare & Science
  MED: { icon: "hospital-fill", label: "Medical/Healthcare", color: "#ef4444" },
  LAB: { icon: "eyedropper", label: "Laboratory", color: "#ec4899" },
  PHA: { icon: "capsule", label: "Pharmaceutical", color: "#f43f5e" },
  BIO: { icon: "virus", label: "Biotech", color: "#db2777" },

  // Commercial & Retail
  RET: { icon: "shop", label: "Retail", color: "#3b82f6" },
  COM: { icon: "building", label: "Commercial", color: "#2563eb" },
  OFF: { icon: "building-fill", label: "Office", color: "#1d4ed8" },
  HOT: { icon: "building-fill-check", label: "Hospitality", color: "#0ea5e9" },

  // Logistics & Transportation
  LOG: { icon: "truck", label: "Logistics", color: "#64748b" },
  WHS: { icon: "box-seam-fill", label: "Warehouse", color: "#475569" },
  TRN: { icon: "train-front-fill", label: "Transportation", color: "#334155" },
  PRT: { icon: "water", label: "Port/Maritime", color: "#0284c7" },

  // Food & Beverage
  FNB: { icon: "cup-hot-fill", label: "Food & Beverage", color: "#ea580c" },
  RST: { icon: "egg-fried", label: "Restaurant", color: "#f97316" },
  BRW: { icon: "cup-straw", label: "Brewery", color: "#fb923c" },

  // Technology & Data
  TEC: { icon: "cpu-fill", label: "Technology", color: "#06b6d4" },
  DAT: { icon: "server", label: "Data Center", color: "#0891b2" },
  TEL: { icon: "broadcast-pin", label: "Telecom", color: "#14b8a6" },

  // Construction & Real Estate
  CON: { icon: "cone-striped", label: "Construction", color: "#f97316" },
  RES: { icon: "houses-fill", label: "Real Estate", color: "#84cc16" },
  MIN: { icon: "minecart-loaded", label: "Mining", color: "#a3a3a3" },

  // Education & Government
  EDU: { icon: "mortarboard-fill", label: "Education", color: "#8b5cf6" },
  GOV: { icon: "bank2", label: "Government", color: "#6366f1" },

  // Default
  GEN: { icon: "building", label: "General", color: "#64748b" },
};

export const DEFAULT_TYPE = "GEN";

/**
 * Get company configuration by type code
 * @param {string} type - Company type code (e.g., "MFG", "AGR")
 * @returns {object} - { icon, label, color }
 */
export const getCompanyConfig = (type) => {
  const upperType = type?.toUpperCase();
  return COMPANY_TYPES[upperType] || COMPANY_TYPES[DEFAULT_TYPE];
};

/**
 * Get all companies by category
 * @returns {object} - Grouped by category
 */
export const getCompaniesByCategory = () => {
  return {
    industrial: ["MFG", "IND", "FAC"],
    energy: ["ENR", "UTL", "PWR", "SOL", "WND"],
    agriculture: ["AGR", "FRM", "GRN", "ENV"],
    healthcare: ["MED", "LAB", "PHA", "BIO"],
    commercial: ["RET", "COM", "OFF", "HOT"],
    logistics: ["LOG", "WHS", "TRN", "PRT"],
    food: ["FNB", "RST", "BRW"],
    technology: ["TEC", "DAT", "TEL"],
    construction: ["CON", "RES", "MIN"],
    public: ["EDU", "GOV"],
    general: ["GEN"],
  };
};

/**
 * Check if type code is valid
 * @param {string} type - Type code to validate
 * @returns {boolean}
 */
export const isValidCompanyType = (type) => {
  return type?.toUpperCase() in COMPANY_TYPES;
};

/**
 * Get all available type codes
 * @returns {string[]}
 */
export const getAllCompanyTypes = () => Object.keys(COMPANY_TYPES);
