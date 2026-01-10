/**
 * Sensor Types Registry v1.0
 *
 * Central configuration for all sensor types.
 * To add a new type: add one entry to SENSOR_TYPES object.
 *
 * Structure:
 * - icon: Bootstrap Icons class name (without 'bi-' prefix)
 * - label: Human-readable name
 * - category: Grouping category
 */

export const SENSOR_TYPES = {
  // Environmental
  TMP: { icon: "thermometer-half", label: "Temperature", category: "environmental", color: "#f97316" }, // orange (red reserved for alarms)
  HUM: { icon: "droplet-fill", label: "Humidity", category: "environmental", color: "#3b82f6" }, // blue
  AMB: { icon: "brightness-high", label: "Ambient Light", category: "environmental", color: "#fbbf24" }, // amber
  UV: { icon: "sun-fill", label: "UV Index", category: "environmental", color: "#f97316" }, // orange
  ATM: { icon: "globe", label: "Atmospheric Pressure", category: "environmental", color: "#6366f1" }, // indigo

  // Electrical
  VLT: { icon: "lightning-fill", label: "Voltage", category: "electrical", color: "#f59e0b" }, // amber
  CUR: { icon: "plug-fill", label: "Current", category: "electrical", color: "#eab308" }, // yellow
  PWR: { icon: "battery-charging", label: "Power", category: "electrical", color: "#22c55e" }, // green
  FRQ: { icon: "activity", label: "Frequency", category: "electrical", color: "#06b6d4" }, // cyan
  RES: { icon: "circle", label: "Resistance", category: "electrical", color: "#78716c" }, // stone
  ENG: { icon: "battery-full", label: "Energy", category: "electrical", color: "#84cc16" }, // lime

  // Air Quality
  CO2: { icon: "wind", label: "CO2", category: "air_quality", color: "#10b981" }, // emerald
  CO: { icon: "exclamation-triangle-fill", label: "Carbon Monoxide", category: "air_quality", color: "#f59e0b" }, // amber (red reserved for alarms)
  O2: { icon: "lungs-fill", label: "Oxygen", category: "air_quality", color: "#0ea5e9" }, // sky
  CH4: { icon: "fire", label: "Methane", category: "air_quality", color: "#ea580c" }, // orange-600
  PM25: { icon: "cloud-haze-fill", label: "PM 2.5", category: "air_quality", color: "#a855f7" }, // purple
  PM10: { icon: "cloud-haze", label: "PM 10", category: "air_quality", color: "#8b5cf6" }, // violet
  VOC: { icon: "droplet", label: "VOC", category: "air_quality", color: "#14b8a6" }, // teal

  // Mechanical / Flow
  PRS: { icon: "speedometer2", label: "Pressure", category: "mechanical", color: "#8b5cf6" }, // violet
  FLW: { icon: "water", label: "Flow Rate", category: "mechanical", color: "#0891b2" }, // cyan-600
  SPD: { icon: "speedometer", label: "Speed", category: "mechanical", color: "#059669" }, // emerald-600
  VIB: { icon: "phone-vibrate", label: "Vibration", category: "mechanical", color: "#d946ef" }, // fuchsia
  LVL: { icon: "rulers", label: "Level", category: "mechanical", color: "#2563eb" }, // blue-600

  // Status / Binary
  STS: { icon: "circle-fill", label: "Status", category: "status", color: "#22c55e" }, // green
  ALM: { icon: "bell-fill", label: "Alarm", category: "status", color: "#ef4444" }, // red
  BAT: { icon: "battery-half", label: "Battery", category: "status", color: "#84cc16" }, // lime
  SIG: { icon: "wifi", label: "Signal", category: "status", color: "#06b6d4" }, // cyan

  // Default / General
  GEN: { icon: "bar-chart-fill", label: "General", category: "general", color: "#6b7280" }, // gray
};

// Default fallback type
export const DEFAULT_TYPE = "GEN";

// Category labels for grouping
export const CATEGORIES = {
  environmental: { label: "Environmental", icon: "tree" },
  electrical: { label: "Electrical", icon: "lightning" },
  air_quality: { label: "Air Quality", icon: "wind" },
  mechanical: { label: "Mechanical", icon: "gear" },
  status: { label: "Status", icon: "info-circle" },
  general: { label: "General", icon: "grid" },
};

/**
 * Get sensor configuration by type code
 * @param {string} type - Type code (e.g., "TMP", "VLT")
 * @returns {object} - Sensor config with icon, label, category
 */
export const getSensorConfig = (type) => {
  const upperType = type?.toUpperCase();
  return SENSOR_TYPES[upperType] || SENSOR_TYPES[DEFAULT_TYPE];
};

/**
 * Get all sensors by category
 * @param {string} category - Category name
 * @returns {array} - Array of [typeCode, config] pairs
 */
export const getSensorsByCategory = (category) => {
  return Object.entries(SENSOR_TYPES).filter(
    ([_, config]) => config.category === category
  );
};

/**
 * Check if a type code exists
 * @param {string} type - Type code
 * @returns {boolean}
 */
export const isValidType = (type) => {
  return type?.toUpperCase() in SENSOR_TYPES;
};
