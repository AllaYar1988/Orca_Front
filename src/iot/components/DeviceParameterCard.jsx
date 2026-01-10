import { useState } from "react";
import SensorIcon from "./SensorIcon";
import { getSensorConfig } from "../config/sensorTypes";
import "../styles/sensor-components.css";

/**
 * DeviceParameterCard Component
 *
 * Displays device parameters with hybrid pagination (dots + swipe).
 * Shows a fixed number of parameters per page with dot navigation.
 *
 * @param {array} parameters - Array of parameter objects
 *   Each parameter: { type, name, value, unit, trend? }
 * @param {number} itemsPerPage - Number of items per page (default: 4)
 * @param {boolean} showTrend - Show sparkline trend (default: false)
 */
const DeviceParameterCard = ({
  parameters = [],
  itemsPerPage = 4,
  showTrend = false,
}) => {
  const [currentPage, setCurrentPage] = useState(0);

  // Calculate pagination
  const totalPages = Math.ceil(parameters.length / itemsPerPage);
  const startIndex = currentPage * itemsPerPage;
  const visibleParameters = parameters.slice(startIndex, startIndex + itemsPerPage);

  // Handle dot click
  const handleDotClick = (pageIndex) => {
    setCurrentPage(pageIndex);
  };

  // Handle swipe (touch events)
  const [touchStart, setTouchStart] = useState(null);

  const handleTouchStart = (e) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchEnd = (e) => {
    if (!touchStart) return;

    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchStart - touchEnd;

    // Swipe threshold
    if (Math.abs(diff) > 50) {
      if (diff > 0 && currentPage < totalPages - 1) {
        // Swipe left - next page
        setCurrentPage((prev) => prev + 1);
      } else if (diff < 0 && currentPage > 0) {
        // Swipe right - previous page
        setCurrentPage((prev) => prev - 1);
      }
    }

    setTouchStart(null);
  };

  // Get status color based on value thresholds (can be customized)
  const getValueStatus = (param) => {
    if (param.status) return param.status;
    if (param.warning) return "warning";
    if (param.critical) return "critical";
    return "normal";
  };

  // Render progress bar for value visualization
  const renderProgressBar = (param) => {
    const min = param.min ?? 0;
    const max = param.max ?? 100;
    const value = parseFloat(param.value) || 0;
    const percentage = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));

    const status = getValueStatus(param);
    const statusClass = `parameter-progress--${status}`;

    return (
      <div className="parameter-progress">
        <div
          className={`parameter-progress__bar ${statusClass}`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    );
  };

  if (parameters.length === 0) {
    return (
      <div className="device-parameters device-parameters--empty">
        <p>No parameters available</p>
      </div>
    );
  }

  return (
    <div
      className="device-parameters"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Parameters List */}
      <div className="device-parameters__list">
        {visibleParameters.map((param, index) => {
          const config = getSensorConfig(param.type);
          const status = getValueStatus(param);

          return (
            <div
              key={`${param.type}-${index}`}
              className={`parameter-item parameter-item--${status}`}
            >
              <div className="parameter-item__header">
                <SensorIcon type={param.type} size="sm" />
                <span className="parameter-item__name">
                  {param.name || config.label}
                </span>
              </div>

              <div className="parameter-item__value">
                <span className="parameter-item__number">{param.value}</span>
                <span className="parameter-item__unit">{param.unit}</span>
              </div>

              {renderProgressBar(param)}

              {showTrend && param.trend && (
                <div className="parameter-item__trend">
                  {/* Simple sparkline representation */}
                  <svg viewBox="0 0 50 20" className="sparkline">
                    <polyline
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      points={param.trend
                        .map((v, i) => `${(i / (param.trend.length - 1)) * 50},${20 - (v / Math.max(...param.trend)) * 18}`)
                        .join(" ")}
                    />
                  </svg>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Pagination Dots */}
      {totalPages > 1 && (
        <div className="device-parameters__pagination">
          {Array.from({ length: totalPages }, (_, index) => (
            <button
              key={index}
              className={`pagination-dot ${
                index === currentPage ? "pagination-dot--active" : ""
              }`}
              onClick={() => handleDotClick(index)}
              aria-label={`Page ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default DeviceParameterCard;
