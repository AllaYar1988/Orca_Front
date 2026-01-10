import { getSensorConfig } from "../config/sensorTypes";

/**
 * SensorIcon Component
 *
 * Displays the appropriate icon for a sensor type.
 * Uses Bootstrap Icons.
 *
 * @param {string} type - Sensor type code (e.g., "TMP", "VLT")
 * @param {string} size - Icon size: "sm", "md", "lg" (default: "md")
 * @param {boolean} showLabel - Show label next to icon (default: false)
 * @param {string} className - Additional CSS classes
 */
const SensorIcon = ({ type, size = "md", showLabel = false, className = "" }) => {
  const config = getSensorConfig(type);

  const sizeClasses = {
    sm: "sensor-icon--sm",
    md: "sensor-icon--md",
    lg: "sensor-icon--lg",
  };

  return (
    <span
      className={`sensor-icon ${sizeClasses[size]} ${className}`}
      title={config.label}
    >
      <i className={`bi bi-${config.icon}`}></i>
      {showLabel && <span className="sensor-icon__label">{config.label}</span>}
    </span>
  );
};

export default SensorIcon;
