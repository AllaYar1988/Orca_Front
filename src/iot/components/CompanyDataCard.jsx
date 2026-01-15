import { useNavigate } from 'react-router-dom';
import CompanyIcon from './CompanyIcon';
import { getCompanyConfig } from '../config/companyTypes';
import { formatSecondsAgo } from '../utils/timeUtils';

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
  const virtualDevices = company.virtualDevices || [];

  // Combine physical and virtual devices for stats
  const stats = {
    total: devices.length + virtualDevices.length,
    online: devices.filter(d => d.is_online).length + virtualDevices.filter(vd => vd.is_online).length,
    offline: devices.filter(d => !d.is_online).length + virtualDevices.filter(vd => !vd.is_online).length,
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

  const handleVirtualDeviceClick = (e, vd) => {
    e.stopPropagation();
    navigate(`/iot/virtual-device/${company.id}/${vd.id}`);
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
        {devices.length === 0 && virtualDevices.length === 0 ? (
          <div className="company-data-card__empty">
            <i className="bi bi-inbox"></i>
            <span>No devices</span>
          </div>
        ) : (
          <ul className="company-data-card__device-list">
            {/* Virtual devices first */}
            {virtualDevices.slice(0, 5).map(vd => (
              <li
                key={`vd-${vd.id}`}
                className="company-data-card__device-item"
                onClick={(e) => handleVirtualDeviceClick(e, vd)}
              >
                <span className={`company-data-card__device-status ${vd.is_online ? 'online' : 'offline'}`}>
                  <i className="bi bi-diagram-3"></i>
                </span>
                <span className="company-data-card__device-name">{vd.name}</span>
                <span className="company-data-card__device-time">
                  {formatSecondsAgo(vd.seconds_ago)}
                </span>
              </li>
            ))}
            {/* Physical devices */}
            {devices.slice(0, Math.max(0, 5 - virtualDevices.length)).map(device => (
              <li
                key={device.id}
                className="company-data-card__device-item"
                onClick={(e) => handleDeviceClick(e, device)}
              >
                <span className={`company-data-card__device-status ${device.is_online ? 'online' : 'offline'}`}>
                  <i className="bi bi-circle-fill"></i>
                </span>
                <span className="company-data-card__device-name">{device.name}</span>
                <span className="company-data-card__device-time">
                  {formatSecondsAgo(device.seconds_ago)}
                </span>
              </li>
            ))}
            {(devices.length + virtualDevices.length) > 5 && (
              <li className="company-data-card__device-more">
                +{devices.length + virtualDevices.length - 5} more devices
              </li>
            )}
          </ul>
        )}
      </div>
    </div>
  );
};

export default CompanyDataCard;
