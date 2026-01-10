import { useState } from "react";
import DeviceParameterCard from "./DeviceParameterCard";

/**
 * DeviceDataCard Component
 *
 * Complete device card with header, status, and parameters.
 * Follows the design: Device name, location, status, and parameter readings.
 *
 * @param {object} device - Device object
 *   { id, name, location, status, battery, lastSeen, parameters }
 * @param {function} onClick - Click handler for card
 * @param {boolean} expanded - Whether card is expanded (default: false)
 */
const DeviceDataCard = ({ device, onClick, expanded = false }) => {
  const [isExpanded, setIsExpanded] = useState(expanded);

  // Format last seen time
  const formatLastSeen = (timestamp) => {
    if (!timestamp) return "Unknown";

    const now = new Date();
    const lastSeen = new Date(timestamp);
    const diffMs = now - lastSeen;
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSecs < 60) return `${diffSecs}s ago`;
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  // Get status class
  const getStatusClass = (status) => {
    switch (status?.toLowerCase()) {
      case "online":
        return "device-status--online";
      case "offline":
        return "device-status--offline";
      case "warning":
        return "device-status--warning";
      case "error":
      case "critical":
        return "device-status--error";
      default:
        return "device-status--unknown";
    }
  };

  // Get battery icon
  const getBatteryIcon = (level) => {
    if (level === null || level === undefined) return "battery";
    if (level > 75) return "battery-full";
    if (level > 50) return "battery-half";
    if (level > 25) return "battery";
    return "battery-warning";
  };

  const handleCardClick = () => {
    if (onClick) {
      onClick(device);
    } else {
      setIsExpanded(!isExpanded);
    }
  };

  const handleExpandToggle = (e) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  return (
    <div
      className={`device-data-card ${isExpanded ? "device-data-card--expanded" : ""}`}
    >
      {/* Card Header */}
      <div className="device-data-card__header" onClick={handleCardClick}>
        <div className="device-data-card__info">
          {/* Device Icon */}
          <div className="device-data-card__icon">
            <i className="bi bi-cpu"></i>
          </div>

          {/* Device Details */}
          <div className="device-data-card__details">
            <h4 className="device-data-card__name">{device.name || "Unknown Device"}</h4>
            {device.location && (
              <span className="device-data-card__location">
                <i className="bi bi-geo-alt"></i>
                {device.location}
              </span>
            )}
          </div>
        </div>

        {/* Status Badge */}
        <div className="device-data-card__status-area">
          <span className={`device-status ${getStatusClass(device.status)}`}>
            <span className="device-status__dot"></span>
            {device.status || "Unknown"}
          </span>
        </div>
      </div>

      {/* Meta Info Row */}
      <div className="device-data-card__meta">
        {device.battery !== undefined && (
          <span className="device-meta-item">
            <i className={`bi bi-${getBatteryIcon(device.battery)}`}></i>
            {device.battery}%
          </span>
        )}
        {device.lastSeen && (
          <span className="device-meta-item">
            <i className="bi bi-clock"></i>
            {formatLastSeen(device.lastSeen)}
          </span>
        )}
        {device.parameters?.length > 0 && (
          <span className="device-meta-item">
            <i className="bi bi-collection"></i>
            {device.parameters.length} params
          </span>
        )}
      </div>

      {/* Parameters Section */}
      {device.parameters?.length > 0 && (
        <div className="device-data-card__parameters">
          <DeviceParameterCard
            parameters={device.parameters}
            itemsPerPage={4}
            showTrend={isExpanded}
          />
        </div>
      )}

      {/* Expand Toggle */}
      {device.parameters?.length > 4 && (
        <button
          className="device-data-card__expand-btn"
          onClick={handleExpandToggle}
        >
          <i className={`bi bi-chevron-${isExpanded ? "up" : "down"}`}></i>
          {isExpanded ? "Show less" : `+${device.parameters.length - 4} more`}
        </button>
      )}
    </div>
  );
};

export default DeviceDataCard;
