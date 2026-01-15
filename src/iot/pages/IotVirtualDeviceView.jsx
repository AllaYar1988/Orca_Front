import { useState, useEffect, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getVirtualDeviceDetails } from '../api/devices';
import IotLayout from '../components/IotLayout';
import RefreshTimer from '../components/RefreshTimer';
import { SENSOR_TYPES } from '../config/sensorTypes';
import { formatSecondsAgo } from '../utils/timeUtils';
import '../styles/sensor-components.css';

const IotVirtualDeviceView = () => {
  const { companyId, virtualDeviceId } = useParams();
  const [virtualDevice, setVirtualDevice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch virtual device details
  useEffect(() => {
    const fetchVirtualDevice = async () => {
      try {
        const response = await getVirtualDeviceDetails(virtualDeviceId);
        if (response.success) {
          setVirtualDevice(response.virtual_device);
        } else {
          setError(response.error || 'Failed to load virtual device');
        }
      } catch (err) {
        setError('Failed to load virtual device');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchVirtualDevice();
  }, [virtualDeviceId]);

  // Refresh data
  const refreshData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const response = await getVirtualDeviceDetails(virtualDeviceId);
      if (response.success) {
        setVirtualDevice(response.virtual_device);
      }
    } catch (err) {
      console.error('Error refreshing data:', err);
    } finally {
      setIsRefreshing(false);
    }
  }, [virtualDeviceId]);

  // Get sensor type config
  const getSensorTypeConfig = (logKey) => {
    const typeMatch = logKey?.match(/^([A-Z]{2,4})_?/i);
    const type = typeMatch ? typeMatch[1].toUpperCase() : 'GEN';
    return SENSOR_TYPES[type] || SENSOR_TYPES.GEN;
  };

  // Get status badge class
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'live':
        return 'status-badge--live';
      case 'stale':
        return 'status-badge--stale';
      case 'offline':
        return 'status-badge--offline';
      default:
        return 'status-badge--unknown';
    }
  };

  if (loading) {
    return (
      <IotLayout>
        <div className="iot-loading">
          <div className="iot-spinner"></div>
        </div>
      </IotLayout>
    );
  }

  if (error || !virtualDevice) {
    return (
      <IotLayout>
        <div className="iot-alert iot-alert-error">{error || 'Virtual device not found'}</div>
        <Link to={`/iot/company/${companyId}/devices`} className="iot-btn-primary">
          Back to Devices
        </Link>
      </IotLayout>
    );
  }

  const sensors = virtualDevice.sensors || [];
  const alarmCount = sensors.filter(s => s.status === 'warning' || s.status === 'critical').length;

  return (
    <IotLayout>
      {/* Sticky Device Header */}
      <div className="iot-device-sticky-header">
        {/* Device Header */}
        <div className="iot-device-header-large">
          <div className={`iot-device-icon-section virtual ${!virtualDevice.is_online ? 'offline' : ''}`}>
            <div className="iot-device-icon large">
              <i className="bi bi-diagram-3"></i>
            </div>
          </div>
          <div className="iot-device-info-section">
            <div className="iot-device-info-main">
              <div className="iot-device-title-row">
                <h2>{virtualDevice.name}</h2>
                <span className="virtual-device-header-badge">Virtual Device</span>
              </div>
              {virtualDevice.description && (
                <p className="iot-device-description">{virtualDevice.description}</p>
              )}
            </div>
            <div className="iot-device-live-section">
              <div className="iot-device-live-row">
                <RefreshTimer
                  interval={30}
                  onRefresh={refreshData}
                  isLoading={isRefreshing}
                  size="md"
                />
                <div className="live-indicator">
                  <span className={`live-indicator__dot ${!virtualDevice.is_online ? 'live-indicator__dot--offline' : ''}`}></span>
                  <span className="live-indicator__text">
                    {virtualDevice.is_online ? `${virtualDevice.live_count}/${virtualDevice.total_count} Online` : 'Offline'}
                  </span>
                </div>
              </div>
              {virtualDevice.seconds_ago !== null && (
                <span className="live-indicator__time">
                  Last updated: {formatSecondsAgo(virtualDevice.seconds_ago)}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="iot-stats-grid" style={{ marginTop: '1.5rem' }}>
        <div className={`iot-stat-card ${alarmCount > 0 ? 'iot-stat-card--alarm' : ''}`}>
          <div className={`iot-stat-icon ${alarmCount > 0 ? 'red' : 'green'}`}>
            <i className={`bi ${alarmCount > 0 ? 'bi-exclamation-triangle-fill' : 'bi-check-circle-fill'}`}></i>
          </div>
          <div className="iot-stat-info">
            <div className="iot-stat-value">{alarmCount}</div>
            <div className="iot-stat-label">Alarms</div>
          </div>
        </div>

        <div className="iot-stat-card">
          <div className="iot-stat-icon green">
            <i className="bi bi-wifi"></i>
          </div>
          <div className="iot-stat-info">
            <div className="iot-stat-value">{virtualDevice.live_count}</div>
            <div className="iot-stat-label">Live Sensors</div>
          </div>
        </div>

        <div className="iot-stat-card">
          <div className="iot-stat-icon" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
            <i className="bi bi-collection"></i>
          </div>
          <div className="iot-stat-info">
            <div className="iot-stat-value">{virtualDevice.total_count}</div>
            <div className="iot-stat-label">Total Sensors</div>
          </div>
        </div>

        <div className="iot-stat-card">
          <div className="iot-stat-icon blue">
            <i className="bi bi-building"></i>
          </div>
          <div className="iot-stat-info">
            <div className="iot-stat-value" style={{ fontSize: '1rem' }}>{virtualDevice.company_name}</div>
            <div className="iot-stat-label">Company</div>
          </div>
        </div>
      </div>

      {/* Aggregated Sensor Readings */}
      <div className="iot-card" style={{ marginTop: '1.5rem' }}>
        <div className="iot-card-header">
          <span><i className="bi bi-diagram-3"></i> Aggregated Sensor Readings</span>
          <span className="iot-badge info">{sensors.length} sensors</span>
        </div>
        <div className="iot-card-body">
          {sensors.length === 0 ? (
            <div className="iot-empty-state">
              <i className="bi bi-inbox"></i>
              <p>No sensors mapped to this virtual device.<br />Configure sensors in the admin panel.</p>
            </div>
          ) : (
            <div className="virtual-sensor-grid">
              {sensors.map((sensor, index) => {
                const sensorType = getSensorTypeConfig(sensor.source_log_key);
                return (
                  <div
                    key={`${sensor.source_device_id}-${sensor.source_log_key}-${index}`}
                    className={`virtual-sensor-card ${getStatusBadgeClass(sensor.status)}`}
                  >
                    <div className="virtual-sensor-card__header">
                      <div className="virtual-sensor-card__icon" style={{ background: sensorType.color }}>
                        <i className={`bi bi-${sensorType.icon}`}></i>
                      </div>
                      <div className="virtual-sensor-card__title">
                        <h4>{sensor.label}</h4>
                        <span className="virtual-sensor-card__source">
                          <i className="bi bi-cpu"></i> {sensor.source_device_name}
                        </span>
                      </div>
                      <span className={`status-badge ${getStatusBadgeClass(sensor.status)}`}>
                        {sensor.status}
                      </span>
                    </div>
                    <div className="virtual-sensor-card__body">
                      <div className="virtual-sensor-card__value">
                        <span className="value">{sensor.value !== null ? sensor.value : '--'}</span>
                        <span className="unit">{sensor.unit || ''}</span>
                      </div>
                      {sensor.seconds_ago !== null && (
                        <div className="virtual-sensor-card__time">
                          <i className="bi bi-clock"></i>
                          {formatSecondsAgo(sensor.seconds_ago)}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Back Link */}
      <div style={{ marginTop: '1.5rem' }}>
        <Link to={`/iot/company/${companyId}/devices`} className="iot-btn-outline">
          <i className="bi bi-arrow-left"></i> Back to Devices
        </Link>
      </div>
    </IotLayout>
  );
};

export default IotVirtualDeviceView;
