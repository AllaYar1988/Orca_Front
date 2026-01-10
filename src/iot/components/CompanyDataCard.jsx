import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CompanyIcon from './CompanyIcon';
import { getCompanyConfig } from '../config/companyTypes';

/**
 * Format relative time (e.g., "2 min ago", "1 hour ago")
 */
const formatRelativeTime = (dateString) => {
  if (!dateString) return 'Never';

  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'Just now';
  if (diffMin < 60) return `${diffMin} min ago`;
  if (diffHour < 24) return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`;
  if (diffDay < 7) return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;

  return date.toLocaleDateString();
};

/**
 * CompanyDataCard Component
 *
 * Displays a company card with device list showing online status and last update.
 * Similar to DeviceDataCard but for companies.
 */
const CompanyDataCard = ({ company, onClick }) => {
  const navigate = useNavigate();
  const config = getCompanyConfig(company.type);
  const devices = company.devices || [];

  const stats = {
    total: devices.length,
    online: devices.filter(d => d.is_online).length,
    offline: devices.filter(d => !d.is_online).length,
  };

  const handleCardClick = () => {
    if (onClick) {
      onClick(company);
    } else {
      navigate(`/iot/company/${company.id}/devices`);
    }
  };

  const handleDeviceClick = (e, device) => {
    e.stopPropagation();
    navigate(`/iot/device/${company.id}/${device.id}`);
  };

  return (
    <div className="company-data-card" onClick={handleCardClick}>
      {/* Card Header */}
      <div className="company-data-card__header">
        <div className="company-data-card__icon" style={{ background: `linear-gradient(135deg, ${config.color}, ${config.color}dd)` }}>
          <CompanyIcon type={company.type} size="lg" showColor={false} />
        </div>
        <div className="company-data-card__title">
          <h3>{company.name}</h3>
          <span className="company-data-card__code">{company.code}</span>
        </div>
        <i className="bi bi-chevron-right company-data-card__arrow"></i>
      </div>

      {/* Stats Bar */}
      <div className="company-data-card__stats">
        <div className="company-data-card__stat">
          <span className="company-data-card__stat-value">{stats.total}</span>
          <span className="company-data-card__stat-label">Devices</span>
        </div>
        <div className="company-data-card__stat company-data-card__stat--online">
          <span className="company-data-card__stat-value">{stats.online}</span>
          <span className="company-data-card__stat-label">Online</span>
        </div>
        <div className="company-data-card__stat company-data-card__stat--offline">
          <span className="company-data-card__stat-value">{stats.offline}</span>
          <span className="company-data-card__stat-label">Offline</span>
        </div>
      </div>

      {/* Device List */}
      <div className="company-data-card__devices">
        {devices.length === 0 ? (
          <div className="company-data-card__empty">
            <i className="bi bi-inbox"></i>
            <span>No devices</span>
          </div>
        ) : (
          <ul className="company-data-card__device-list">
            {devices.slice(0, 5).map(device => (
              <li
                key={device.id}
                className="company-data-card__device-item"
                onClick={(e) => handleDeviceClick(e, device)}
              >
                <span className={`company-data-card__device-status ${device.is_online ? 'online' : 'offline'}`}>
                  <i className={`bi bi-circle-fill`}></i>
                </span>
                <span className="company-data-card__device-name">{device.name}</span>
                <span className="company-data-card__device-time">
                  {formatRelativeTime(device.last_seen_at || device.updated_at)}
                </span>
              </li>
            ))}
            {devices.length > 5 && (
              <li className="company-data-card__device-more">
                +{devices.length - 5} more devices
              </li>
            )}
          </ul>
        )}
      </div>
    </div>
  );
};

export default CompanyDataCard;
