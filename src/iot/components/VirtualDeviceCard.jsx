import { useState } from "react";
import { formatSecondsAgo } from "../utils/timeUtils";

/**
 * VirtualDeviceCard Component
 *
 * Card for displaying virtual device with aggregated sensor data.
 * Shows sensors from multiple physical devices grouped together.
 *
 * @param {object} virtualDevice - Virtual device object from API
 *   { id, name, description, is_online, all_online, live_count, total_count, seconds_ago, sensors }
 * @param {function} onClick - Click handler for card
 */
const VirtualDeviceCard = ({ virtualDevice, onClick }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleCardClick = () => {
    if (onClick) {
      onClick(virtualDevice);
    }
  };

  const handleExpandToggle = (e) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  // Get status class based on sensor status
  const getSensorStatusClass = (status) => {
    switch (status?.toLowerCase()) {
      case "live":
        return "sensor-status--live";
      case "stale":
        return "sensor-status--stale";
      case "offline":
        return "sensor-status--offline";
      default:
        return "sensor-status--unknown";
    }
  };

  const sensors = virtualDevice.sensors || [];
  const displaySensors = isExpanded ? sensors : sensors.slice(0, 4);

  return (
    <div className={`device-data-card virtual-device-card ${isExpanded ? "device-data-card--expanded" : ""}`}>
      {/* Card Header */}
      <div className="device-data-card__header" onClick={handleCardClick}>
        <div className="device-data-card__info">
          {/* Virtual Device Icon */}
          <div className="device-data-card__icon virtual-device-icon">
            <i className="bi bi-diagram-3"></i>
          </div>

          {/* Device Details */}
          <div className="device-data-card__details">
            <h4 className="device-data-card__name">
              {virtualDevice.name || "Virtual Device"}
              <span className="virtual-device-badge">Virtual</span>
            </h4>
            {virtualDevice.description && (
              <span className="device-data-card__location">
                <i className="bi bi-info-circle"></i>
                {virtualDevice.description}
              </span>
            )}
          </div>
        </div>

        {/* Status Badge */}
        <div className="device-data-card__status-area">
          <span className={`device-status ${virtualDevice.is_online ? "device-status--online" : "device-status--offline"}`}>
            <span className="device-status__dot"></span>
            {virtualDevice.is_online ? "Online" : "Offline"}
          </span>
        </div>
      </div>

      {/* Meta Info Row */}
      <div className="device-data-card__meta">
        <span className="device-meta-item">
          <i className="bi bi-collection"></i>
          {virtualDevice.live_count}/{virtualDevice.total_count} sensors online
        </span>
        {virtualDevice.seconds_ago !== null && virtualDevice.seconds_ago !== undefined && (
          <span className="device-meta-item">
            <i className="bi bi-clock"></i>
            {formatSecondsAgo(virtualDevice.seconds_ago)}
          </span>
        )}
      </div>

      {/* Sensors Section */}
      {sensors.length > 0 && (
        <div className="virtual-device-sensors">
          {displaySensors.map((sensor, index) => (
            <div key={`${sensor.source_device_id}-${sensor.source_log_key}-${index}`} className="virtual-sensor-item">
              <div className="virtual-sensor-info">
                <span className="virtual-sensor-label">{sensor.label}</span>
                <span className="virtual-sensor-source">
                  <i className="bi bi-cpu"></i>
                  {sensor.source_device_name}
                </span>
              </div>
              <div className="virtual-sensor-value">
                <span className={`virtual-sensor-reading ${getSensorStatusClass(sensor.status)}`}>
                  {sensor.value !== null ? sensor.value : "--"}
                  {sensor.unit && <span className="virtual-sensor-unit">{sensor.unit}</span>}
                </span>
                <span className={`virtual-sensor-status-dot ${getSensorStatusClass(sensor.status)}`}></span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Expand Toggle */}
      {sensors.length > 4 && (
        <button
          className="device-data-card__expand-btn"
          onClick={handleExpandToggle}
        >
          <i className={`bi bi-chevron-${isExpanded ? "up" : "down"}`}></i>
          {isExpanded ? "Show less" : `+${sensors.length - 4} more sensors`}
        </button>
      )}
    </div>
  );
};

export default VirtualDeviceCard;
