import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useIotAuth } from '../context/IotAuthContext';
import { getDeviceDetails, getDeviceLogsRange, getDeviceEvents, getDeviceConfigs, getDeviceLastUpdate } from '../api/devices';
import IotLayout from '../components/IotLayout';
import SensorReadingCard from '../components/SensorReadingCard';
import RefreshTimer from '../components/RefreshTimer';
import { SENSOR_TYPES } from '../config/sensorTypes';
import '../styles/sensor-components.css';

/**
 * Get start of today in ISO format
 */
const getTodayStart = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today.toISOString();
};

/**
 * Get current time in ISO format
 */
const getNow = () => {
  return new Date().toISOString();
};

const IotDeviceView = () => {
  const { iotUser } = useIotAuth();
  const { companyId, deviceId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();

  const [device, setDevice] = useState(null);
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'dashboard');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Tab-specific data
  const [logs, setLogs] = useState([]);
  const [events, setEvents] = useState([]);
  const [configs, setConfigs] = useState([]);
  const [tabLoading, setTabLoading] = useState(false);

  // Live data refresh
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const lastFetchTime = useRef(null);
  const lastKnownUpdate = useRef(null); // Track backend's last_update timestamp

  // Fetch device details
  useEffect(() => {
    const fetchDevice = async () => {
      try {
        const response = await getDeviceDetails(deviceId);
        if (response.success) {
          setDevice(response.device);
        } else {
          setError(response.error || 'Failed to load device');
        }
      } catch (err) {
        setError('Failed to load device');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchDevice();
  }, [deviceId]);

  // Smart refresh - check if new data exists before fetching
  const refreshData = useCallback(async () => {
    if (!device || !lastFetchTime.current) return;

    setIsRefreshing(true);
    try {
      // First, check if there's new data
      const updateCheck = await getDeviceLastUpdate(deviceId);

      if (!updateCheck.success) {
        console.error('Failed to check for updates');
        setIsRefreshing(false);
        return;
      }

      // If no new data since last known update, skip fetching
      if (updateCheck.last_update === lastKnownUpdate.current) {
        console.log('No new data, skipping fetch');
        setIsRefreshing(false);
        return;
      }

      // New data exists - fetch it
      const from = lastFetchTime.current;
      const to = getNow();

      const [deviceRes, logsRes] = await Promise.all([
        getDeviceDetails(deviceId),
        getDeviceLogsRange(deviceId, from, to)
      ]);

      if (deviceRes.success) {
        setDevice(deviceRes.device);
      }

      if (logsRes.success && logsRes.logs && logsRes.logs.length > 0) {
        // Append new logs to existing logs
        setLogs(prevLogs => {
          const existingIds = new Set(prevLogs.map(l => l.id));
          const newLogs = logsRes.logs.filter(l => !existingIds.has(l.id));
          return [...prevLogs, ...newLogs];
        });
      }

      // Update tracking refs
      lastFetchTime.current = to;
      lastKnownUpdate.current = updateCheck.last_update;
      setLastUpdate(updateCheck.last_update); // Use backend's timestamp
    } catch (err) {
      console.error('Error refreshing data:', err);
    } finally {
      setIsRefreshing(false);
    }
  }, [device, deviceId]);

  // Initial fetch - load entire day's data and get last update timestamp
  useEffect(() => {
    const fetchTodayLogs = async () => {
      if (!device) return;
      try {
        const from = getTodayStart();
        const to = getNow();

        // Fetch logs and last update timestamp in parallel
        const [logsRes, updateRes] = await Promise.all([
          getDeviceLogsRange(deviceId, from, to),
          getDeviceLastUpdate(deviceId)
        ]);

        if (logsRes.success) {
          setLogs(logsRes.logs || []);
          lastFetchTime.current = to;
        }

        if (updateRes.success) {
          lastKnownUpdate.current = updateRes.last_update;
          setLastUpdate(updateRes.last_update); // Use backend's timestamp
        }
      } catch (err) {
        console.error(err);
      }
    };

    fetchTodayLogs();
  }, [device, deviceId]);

  // Fetch tab-specific data
  useEffect(() => {
    const fetchTabData = async () => {
      if (!device) return;

      setTabLoading(true);
      try {
        switch (activeTab) {
          case 'events':
            const eventsRes = await getDeviceEvents(deviceId);
            if (eventsRes.success) setEvents(eventsRes.events || []);
            break;
          case 'config':
            const configRes = await getDeviceConfigs(deviceId);
            if (configRes.success) setConfigs(configRes.configs || []);
            break;
        }
      } catch (err) {
        console.error(err);
      } finally {
        setTabLoading(false);
      }
    };

    fetchTabData();
  }, [activeTab, device, deviceId]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
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

  if (error || !device) {
    return (
      <IotLayout>
        <div className="iot-alert iot-alert-error">{error || 'Device not found'}</div>
        <Link to="/iot" className="iot-btn-primary">Back to Companies</Link>
      </IotLayout>
    );
  }

  return (
    <IotLayout>
      <div className="iot-breadcrumb">
        <Link to="/iot"><i className="bi bi-building"></i> Companies</Link>
        <i className="bi bi-chevron-right"></i>
        <Link to={`/iot/company/${device.company_id}/devices`}>{device.company_name}</Link>
        <i className="bi bi-chevron-right"></i>
        <span>{device.name}</span>
      </div>

      {/* Device Header */}
      <div className="iot-device-header-large">
        <div className="iot-device-icon large">
          <i className="bi bi-hdd"></i>
        </div>
        <div className="iot-device-info-large">
          <h2>{device.name}</h2>
          <p><code>{device.serial_number}</code></p>
          <div className="iot-device-meta-row">
            <span className={`iot-badge ${device.is_online ? 'online' : 'offline'}`}>
              {device.is_online ? 'Online' : 'Offline'}
            </span>
            {device.device_type && <span className="iot-device-type">{device.device_type}</span>}
            <span className="iot-device-meta">
              <i className="bi bi-clock"></i> Last seen: {device.last_seen_at
                ? new Date(device.last_seen_at).toLocaleString()
                : 'Never'}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="iot-tabs">
        <button
          className={`iot-tab ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => handleTabChange('dashboard')}
        >
          <i className="bi bi-speedometer2"></i> Dashboard
        </button>
        <button
          className={`iot-tab ${activeTab === 'charts' ? 'active' : ''}`}
          onClick={() => handleTabChange('charts')}
        >
          <i className="bi bi-graph-up"></i> Charts
        </button>
        <button
          className={`iot-tab ${activeTab === 'logs' ? 'active' : ''}`}
          onClick={() => handleTabChange('logs')}
        >
          <i className="bi bi-journal-text"></i> Logs
        </button>
        <button
          className={`iot-tab ${activeTab === 'events' ? 'active' : ''}`}
          onClick={() => handleTabChange('events')}
        >
          <i className="bi bi-bell"></i> Events
        </button>
        <button
          className={`iot-tab ${activeTab === 'config' ? 'active' : ''}`}
          onClick={() => handleTabChange('config')}
        >
          <i className="bi bi-gear"></i> Config
        </button>
      </div>

      {/* Tab Content */}
      <div className="iot-tab-content">
        {tabLoading ? (
          <div className="iot-loading">
            <div className="iot-spinner"></div>
          </div>
        ) : (
          <>
            {activeTab === 'dashboard' && (
                  <DashboardTab
                    device={device}
                    logs={logs}
                    onRefresh={refreshData}
                    isRefreshing={isRefreshing}
                    lastUpdate={lastUpdate}
                  />
                )}
            {activeTab === 'charts' && <ChartsTab device={device} logs={logs} />}
            {activeTab === 'logs' && <LogsTab logs={logs} />}
            {activeTab === 'events' && <EventsTab events={events} />}
            {activeTab === 'config' && <ConfigTab configs={configs} />}
          </>
        )}
      </div>
    </IotLayout>
  );
};

/**
 * Process logs to get sensor readings with history
 */
const processSensorReadings = (logs) => {
  if (!logs || logs.length === 0) return [];

  // Group logs by key
  const logsByKey = {};
  logs.forEach(log => {
    const key = log.log_key;
    if (!logsByKey[key]) {
      logsByKey[key] = [];
    }
    logsByKey[key].push(log);
  });

  // Sort each group by time (oldest first for sparkline)
  Object.keys(logsByKey).forEach(key => {
    logsByKey[key].sort((a, b) => new Date(a.logged_at) - new Date(b.logged_at));
  });

  // Create sensor readings
  const readings = Object.entries(logsByKey).map(([key, keyLogs]) => {
    const latest = keyLogs[keyLogs.length - 1];

    // Try to detect sensor type from key
    const typeMatch = key.match(/^([A-Z]{2,4})_?/i);
    let type = typeMatch ? typeMatch[1].toUpperCase() : 'GEN';
    if (!SENSOR_TYPES[type]) type = 'GEN';

    return {
      key,
      type,
      name: key,
      value: parseFloat(latest.log_value) || latest.log_value,
      unit: latest.unit || '',
      history: keyLogs, // Pass raw logs directly with logged_at
      lastUpdate: latest.logged_at,
    };
  });

  // Sort by key name
  readings.sort((a, b) => a.key.localeCompare(b.key));

  return readings;
};

// Dashboard Tab
const DashboardTab = ({ device, logs, onRefresh, isRefreshing, lastUpdate }) => {
  const sensorReadings = processSensorReadings(logs);

  return (
    <div className="iot-dashboard-tab">
      {/* Live Data Header */}
      <div className="data-refresh-header">
        <div className="live-indicator">
          <span className="live-indicator__dot"></span>
          <span className="live-indicator__text">Live</span>
          {lastUpdate && (
            <span className="live-indicator__time">
              Last updated: {new Date(lastUpdate).toLocaleTimeString()}
            </span>
          )}
        </div>
        <RefreshTimer
          interval={10}
          onRefresh={onRefresh}
          isLoading={isRefreshing}
          size="md"
        />
      </div>

      {/* Quick Stats */}
      <div className="iot-stats-grid">
        <div className="iot-stat-card">
          <div className="iot-stat-icon blue">
            <i className="bi bi-activity"></i>
          </div>
          <div className="iot-stat-info">
            <div className="iot-stat-value">{device.is_online ? 'Online' : 'Offline'}</div>
            <div className="iot-stat-label">Status</div>
          </div>
        </div>
        <div className="iot-stat-card">
          <div className="iot-stat-icon green">
            <i className="bi bi-clock-history"></i>
          </div>
          <div className="iot-stat-info">
            <div className="iot-stat-value">{device.last_seen_at ? 'Active' : 'Never Seen'}</div>
            <div className="iot-stat-label">Activity</div>
          </div>
        </div>
        <div className="iot-stat-card">
          <div className="iot-stat-icon purple">
            <i className="bi bi-hdd"></i>
          </div>
          <div className="iot-stat-info">
            <div className="iot-stat-value">{device.device_type || 'Sensor'}</div>
            <div className="iot-stat-label">Type</div>
          </div>
        </div>
        <div className="iot-stat-card">
          <div className="iot-stat-icon" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
            <i className="bi bi-speedometer2"></i>
          </div>
          <div className="iot-stat-info">
            <div className="iot-stat-value">{sensorReadings.length}</div>
            <div className="iot-stat-label">Parameters</div>
          </div>
        </div>
      </div>

      {/* Sensor Readings */}
      <div className="iot-card" style={{ marginTop: '1.5rem' }}>
        <div className="iot-card-header">
          <span><i className="bi bi-thermometer-half"></i> Sensor Readings</span>
          <span className="iot-badge info">{sensorReadings.length} parameters</span>
        </div>
        <div className="iot-card-body">
          {sensorReadings.length === 0 ? (
            <div className="iot-empty-state">
              <i className="bi bi-inbox"></i>
              <p>No sensor data available yet.<br />Connect your device to see real-time readings.</p>
            </div>
          ) : (
            <div className="sensor-reading-grid">
              {sensorReadings.map(reading => (
                <SensorReadingCard
                  key={reading.key}
                  type={reading.type}
                  name={reading.name}
                  value={reading.value}
                  unit={reading.unit}
                  history={reading.history}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {device.description && (
        <div className="iot-card" style={{ marginTop: '1rem' }}>
          <div className="iot-card-header">Description</div>
          <div className="iot-card-body">{device.description}</div>
        </div>
      )}
    </div>
  );
};

// Charts Tab
const ChartsTab = ({ device, logs }) => (
  <div className="iot-charts-tab">
    <div className="iot-card">
      <div className="iot-card-body iot-empty-state">
        <i className="bi bi-graph-up"></i>
        <p>Full charts visualization coming soon.<br />Use the Dashboard tab to see sparkline trends.</p>
      </div>
    </div>
  </div>
);

// Logs Tab
const LogsTab = ({ logs }) => (
  <div className="iot-logs-tab">
    <div className="iot-card">
      <div className="iot-card-header">
        <span>Recent Logs</span>
        <span className="iot-badge info">{logs.length} entries</span>
      </div>
      <div className="iot-card-body">
        {logs.length === 0 ? (
          <p className="iot-empty-state">No logs available.</p>
        ) : (
          <div className="iot-table-responsive">
            <table className="iot-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Key</th>
                  <th>Value</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(log => (
                  <tr key={log.id}>
                    <td className="iot-nowrap">{new Date(log.logged_at).toLocaleString()}</td>
                    <td><code>{log.log_key || '-'}</code></td>
                    <td className="iot-truncate">{log.log_value || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  </div>
);

// Events Tab
const EventsTab = ({ events }) => (
  <div className="iot-events-tab">
    <div className="iot-card">
      <div className="iot-card-header">
        <span>Device Events</span>
        <span className="iot-badge info">{events.length} events</span>
      </div>
      <div className="iot-card-body">
        {events.length === 0 ? (
          <p className="iot-empty-state">No events recorded.</p>
        ) : (
          <div className="iot-events-list">
            {events.map(event => (
              <div key={event.id} className={`iot-event-item severity-${event.severity}`}>
                <div className="iot-event-icon">
                  <i className={`bi bi-${event.severity === 'critical' ? 'exclamation-triangle-fill' :
                    event.severity === 'error' ? 'x-circle-fill' :
                    event.severity === 'warning' ? 'exclamation-circle-fill' : 'info-circle-fill'}`}></i>
                </div>
                <div className="iot-event-content">
                  <div className="iot-event-type">{event.event_type}</div>
                  <div className="iot-event-message">{event.event_message}</div>
                  <div className="iot-event-time">{new Date(event.created_at).toLocaleString()}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  </div>
);

// Config Tab
const ConfigTab = ({ configs }) => (
  <div className="iot-config-tab">
    <div className="iot-card">
      <div className="iot-card-header">
        <span>Device Configuration</span>
      </div>
      <div className="iot-card-body">
        {configs.length === 0 ? (
          <p className="iot-empty-state">No configuration settings.</p>
        ) : (
          <div className="iot-config-list">
            {configs.map(config => (
              <div key={config.id} className="iot-config-item">
                <div className="iot-config-key">{config.config_key}</div>
                <div className="iot-config-value">
                  <code>{config.config_value}</code>
                </div>
                <div className="iot-config-type">{config.config_type}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  </div>
);

export default IotDeviceView;
