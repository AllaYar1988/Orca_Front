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
  TMP: { icon: "thermometer-half", label: "Temperature", category: "environmental" },
  HUM: { icon: "droplet-fill", label: "Humidity", category: "environmental" },
  AMB: { icon: "brightness-high", label: "Ambient Light", category: "environmental" },
  UV: { icon: "sun-fill", label: "UV Index", category: "environmental" },
  ATM: { icon: "globe", label: "Atmospheric Pressure", category: "environmental" },

  // Electrical
  VLT: { icon: "lightning-fill", label: "Voltage", category: "electrical" },
  CUR: { icon: "plug-fill", label: "Current", category: "electrical" },
  PWR: { icon: "battery-charging", label: "Power", category: "electrical" },
  FRQ: { icon: "activity", label: "Frequency", category: "electrical" },
  RES: { icon: "circle", label: "Resistance", category: "electrical" },
  ENG: { icon: "battery-full", label: "Energy", category: "electrical" },

  // Air Quality
  CO2: { icon: "wind", label: "CO2", category: "air_quality" },
  CO: { icon: "exclamation-triangle-fill", label: "Carbon Monoxide", category: "air_quality" },
  O2: { icon: "lungs-fill", label: "Oxygen", category: "air_quality" },
  CH4: { icon: "fire", label: "Methane", category: "air_quality" },
  PM25: { icon: "cloud-haze-fill", label: "PM 2.5", category: "air_quality" },
  PM10: { icon: "cloud-haze", label: "PM 10", category: "air_quality" },
  VOC: { icon: "droplet", label: "VOC", category: "air_quality" },

  // Mechanical / Flow
  PRS: { icon: "speedometer2", label: "Pressure", category: "mechanical" },
  FLW: { icon: "water", label: "Flow Rate", category: "mechanical" },
  SPD: { icon: "speedometer", label: "Speed", category: "mechanical" },
  VIB: { icon: "phone-vibrate", label: "Vibration", category: "mechanical" },
  LVL: { icon: "rulers", label: "Level", category: "mechanical" },

  // Status / Binary
  STS: { icon: "circle-fill", label: "Status", category: "status" },
  ALM: { icon: "bell-fill", label: "Alarm", category: "status" },
  BAT: { icon: "battery-half", label: "Battery", category: "status" },
  SIG: { icon: "wifi", label: "Signal", category: "status" },

  // Default / General
  GEN: { icon: "bar-chart-fill", label: "General", category: "general" },
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
