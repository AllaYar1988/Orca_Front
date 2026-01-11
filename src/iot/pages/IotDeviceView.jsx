import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useIotAuth } from '../context/IotAuthContext';
import { usePermissions } from '../hooks/usePermissions';
import { getDeviceDetails, getDeviceLogsRange, getDeviceEvents, getDeviceConfigs, getDeviceLastUpdate, getSensorConfigs, saveSensorConfig } from '../api/devices';
import IotLayout from '../components/IotLayout';
import SensorReadingCard from '../components/SensorReadingCard';
import RefreshTimer from '../components/RefreshTimer';
import ChartsTab from '../components/ChartsTab';
import { SENSOR_TYPES } from '../config/sensorTypes';
import '../styles/sensor-components.css';
import '../styles/charts.css';

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
  const { canEdit } = usePermissions();
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
  const [sensorConfigs, setSensorConfigs] = useState([]);
  const [availableKeys, setAvailableKeys] = useState([]);
  const [tabLoading, setTabLoading] = useState(false);

  // Live data refresh
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const lastFetchTime = useRef(null);
  const lastKnownUpdate = useRef(null); // Track backend's last_update timestamp

  // Fetch device details and sensor configs on initial load
  useEffect(() => {
    const fetchDeviceAndConfigs = async () => {
      try {
        // Fetch device details and sensor configs in parallel
        const [deviceRes, sensorConfigRes] = await Promise.all([
          getDeviceDetails(deviceId),
          getSensorConfigs(deviceId)
        ]);

        if (deviceRes.success) {
          setDevice(deviceRes.device);
        } else {
          setError(deviceRes.error || 'Failed to load device');
        }

        if (sensorConfigRes.success) {
          setSensorConfigs(sensorConfigRes.configs || []);
          setAvailableKeys(sensorConfigRes.available_keys || []);
        }
      } catch (err) {
        setError('Failed to load device');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchDeviceAndConfigs();
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
            // Fetch both device configs and sensor configs
            const [configRes, sensorConfigRes] = await Promise.all([
              getDeviceConfigs(deviceId),
              getSensorConfigs(deviceId)
            ]);
            if (configRes.success) setConfigs(configRes.configs || []);
            if (sensorConfigRes.success) {
              setSensorConfigs(sensorConfigRes.configs || []);
              setAvailableKeys(sensorConfigRes.available_keys || []);
            }
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
                    sensorConfigs={sensorConfigs}
                    onRefresh={refreshData}
                    isRefreshing={isRefreshing}
                    lastUpdate={lastUpdate}
                  />
                )}
            {activeTab === 'charts' && <ChartsTab device={device} logs={logs} sensorConfigs={sensorConfigs} deviceId={deviceId} />}
            {activeTab === 'logs' && <LogsTab logs={logs} sensorConfigs={sensorConfigs} deviceId={deviceId} />}
            {activeTab === 'events' && <EventsTab events={events} />}
            {activeTab === 'config' && (
              <ConfigTab
                configs={configs}
                sensorConfigs={sensorConfigs}
                availableKeys={availableKeys}
                deviceId={deviceId}
                canEdit={canEdit}
                onSensorConfigUpdate={(updated) => {
                  setSensorConfigs(prev => {
                    const idx = prev.findIndex(c => c.log_key === updated.log_key);
                    if (idx >= 0) {
                      const newConfigs = [...prev];
                      newConfigs[idx] = updated;
                      return newConfigs;
                    }
                    return [...prev, updated];
                  });
                }}
              />
            )}
          </>
        )}
      </div>
    </IotLayout>
  );
};

/**
 * Create a lookup map from sensor configs array
 * @param {Array} sensorConfigs - Array of sensor config objects
 * @returns {Object} Map of log_key -> config
 */
const createConfigMap = (sensorConfigs) => {
  const map = {};
  if (sensorConfigs && sensorConfigs.length > 0) {
    sensorConfigs.forEach(config => {
      map[config.log_key] = config;
    });
  }
  return map;
};

/**
 * Process logs to get sensor readings with history
 * @param {Array} logs - Array of log entries
 * @param {Array} sensorConfigs - Array of sensor config objects (optional)
 */
const processSensorReadings = (logs, sensorConfigs = []) => {
  if (!logs || logs.length === 0) return [];

  // Create config lookup map
  const configMap = createConfigMap(sensorConfigs);

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
    const config = configMap[key];

    // Use sensor_type from config, or try to detect from key
    let type = 'GEN';
    if (config && config.sensor_type) {
      type = config.sensor_type;
    } else {
      const typeMatch = key.match(/^([A-Z]{2,4})_?/i);
      type = typeMatch ? typeMatch[1].toUpperCase() : 'GEN';
    }
    if (!SENSOR_TYPES[type]) type = 'GEN';

    // Use label from config if available, otherwise use key
    const displayName = (config && config.label) ? config.label : key;

    // Use unit from config if available
    const unit = (config && config.unit) ? config.unit : (latest.unit || '');

    return {
      key,
      type,
      name: displayName,
      value: parseFloat(latest.log_value) || latest.log_value,
      unit: unit,
      history: keyLogs, // Pass raw logs directly with logged_at
      lastUpdate: latest.logged_at,
      config: config, // Include full config for reference
    };
  });

  // Sort by key name
  readings.sort((a, b) => a.key.localeCompare(b.key));

  return readings;
};

/**
 * Check if a sensor reading is in alarm state
 */
const checkReadingAlarm = (reading) => {
  const config = reading.config;
  if (!config || !config.alarm_enabled) return false;

  const value = parseFloat(reading.value);
  if (isNaN(value)) return false;

  const minAlarm = config.min_alarm;
  const maxAlarm = config.max_alarm;

  if (minAlarm !== null && minAlarm !== undefined && value < parseFloat(minAlarm)) {
    return true;
  }
  if (maxAlarm !== null && maxAlarm !== undefined && value > parseFloat(maxAlarm)) {
    return true;
  }
  return false;
};

/**
 * Check if device is online based on last update time
 * Device is considered offline if no data received for more than threshold minutes
 */
const OFFLINE_THRESHOLD_MINUTES = 60;

const checkDeviceOnline = (lastUpdate) => {
  if (!lastUpdate) return { isOnline: false, minutesAgo: null };

  const lastUpdateTime = new Date(lastUpdate).getTime();
  const now = Date.now();
  const diffMs = now - lastUpdateTime;
  const diffMinutes = Math.floor(diffMs / 60000);

  return {
    isOnline: diffMinutes < OFFLINE_THRESHOLD_MINUTES,
    minutesAgo: diffMinutes
  };
};

// Dashboard Tab
const DashboardTab = ({ device, logs, sensorConfigs, onRefresh, isRefreshing, lastUpdate }) => {
  const sensorReadings = processSensorReadings(logs, sensorConfigs);

  // Count alarms
  const alarmCount = sensorReadings.filter(checkReadingAlarm).length;

  // Check device online status based on last update time
  const onlineStatus = checkDeviceOnline(lastUpdate);

  return (
    <div className="iot-dashboard-tab">
      {/* Live Data Header */}
      <div className="data-refresh-header">
        <div className="live-indicator">
          <span className={`live-indicator__dot ${!onlineStatus.isOnline ? 'live-indicator__dot--offline' : ''}`}></span>
          <span className="live-indicator__text">{onlineStatus.isOnline ? 'Live' : 'Offline'}</span>
          {lastUpdate && (
            <span className="live-indicator__time">
              Last updated: {onlineStatus.minutesAgo === 0
                ? 'just now'
                : onlineStatus.minutesAgo < 60
                  ? `${onlineStatus.minutesAgo} min ago`
                  : `${Math.floor(onlineStatus.minutesAgo / 60)}h ${onlineStatus.minutesAgo % 60}m ago`
              }
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
        <div className={`iot-stat-card ${!onlineStatus.isOnline ? 'iot-stat-card--offline' : ''}`}>
          <div className={`iot-stat-icon ${onlineStatus.isOnline ? 'green' : 'gray'}`}>
            <i className={`bi ${onlineStatus.isOnline ? 'bi-wifi' : 'bi-wifi-off'}`}></i>
          </div>
          <div className="iot-stat-info">
            <div className="iot-stat-value">{onlineStatus.isOnline ? 'Online' : 'Offline'}</div>
            <div className="iot-stat-label">Status</div>
          </div>
        </div>
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
                  sensorConfig={reading.config}
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

// Charts Tab is now imported from components/ChartsTab.jsx

// Logs Tab with pagination and date range selection
const LogsTab = ({ logs: todayLogs, sensorConfigs, deviceId }) => {
  // Create config lookup map
  const configMap = createConfigMap(sensorConfigs);

  // Date and pagination state
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
  const [dateFrom, setDateFrom] = useState(today);
  const [dateTo, setDateTo] = useState(today);
  const [logs, setLogs] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const limit = 50;

  // Check if viewing only today's data (both from and to are today)
  const isToday = dateFrom === today && dateTo === today;

  // Fetch logs for selected date range
  useEffect(() => {
    const fetchLogs = async () => {
      // If viewing only today, use the real-time logs from parent
      if (isToday) {
        // Sort by time descending (newest first) and paginate
        const sortedLogs = [...todayLogs].sort((a, b) =>
          new Date(b.logged_at) - new Date(a.logged_at)
        );
        setTotalCount(sortedLogs.length);
        const startIdx = (page - 1) * limit;
        setLogs(sortedLogs.slice(startIdx, startIdx + limit));
        return;
      }

      // Fetch historical data for date range
      setLoading(true);
      try {
        const from = `${dateFrom}T00:00:00`;
        const to = `${dateTo}T23:59:59`;

        const response = await getDeviceLogsRange(deviceId, from, to, {
          limit,
          offset: (page - 1) * limit
        });

        if (response.success) {
          // Sort by time descending (newest first)
          const sortedLogs = (response.logs || []).sort((a, b) =>
            new Date(b.logged_at) - new Date(a.logged_at)
          );
          setLogs(sortedLogs);
          setTotalCount(response.total || 0);
        }
      } catch (err) {
        console.error('Failed to fetch logs:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, [dateFrom, dateTo, page, isToday, todayLogs, deviceId]);

  // Handle date from change
  const handleDateFromChange = (e) => {
    const newFrom = e.target.value;
    setDateFrom(newFrom);
    // If from date is after to date, adjust to date
    if (newFrom > dateTo) {
      setDateTo(newFrom);
    }
    setPage(1);
  };

  // Handle date to change
  const handleDateToChange = (e) => {
    const newTo = e.target.value;
    setDateTo(newTo);
    // If to date is before from date, adjust from date
    if (newTo < dateFrom) {
      setDateFrom(newTo);
    }
    setPage(1);
  };

  // Go to today
  const handleGoToToday = () => {
    setDateFrom(today);
    setDateTo(today);
    setPage(1);
  };

  // Get display name for a log key
  const getDisplayName = (logKey) => {
    const config = configMap[logKey];
    if (config && config.label) {
      return config.label;
    }
    return logKey;
  };

  // Get unit for a log key
  const getUnit = (logKey) => {
    const config = configMap[logKey];
    if (config && config.unit) {
      return config.unit;
    }
    return '';
  };

  // Check if log value is in alarm state
  const checkLogAlarm = (logKey, logValue) => {
    const config = configMap[logKey];
    if (!config || !config.alarm_enabled) {
      return { isAlarm: false, type: null };
    }

    const value = parseFloat(logValue);
    if (isNaN(value)) {
      return { isAlarm: false, type: null };
    }

    const minAlarm = config.min_alarm;
    const maxAlarm = config.max_alarm;

    if (minAlarm !== null && minAlarm !== undefined && value < parseFloat(minAlarm)) {
      return { isAlarm: true, type: 'low' };
    }
    if (maxAlarm !== null && maxAlarm !== undefined && value > parseFloat(maxAlarm)) {
      return { isAlarm: true, type: 'high' };
    }

    return { isAlarm: false, type: null };
  };

  const totalPages = Math.ceil(totalCount / limit);

  // Generate page numbers to show
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (page <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      } else if (page >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = page - 1; i <= page + 1; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      }
    }
    return pages;
  };

  return (
    <div className="iot-logs-tab">
      <div className="iot-card">
        <div className="iot-card-header">
          <span>Recent Logs</span>
          <span className="iot-badge info">{totalCount.toLocaleString()} entries</span>
        </div>
        <div className="iot-card-body">
          {/* Date Filter */}
          <div className="logs-date-filter">
            <div className="date-picker-group">
              <label>From:</label>
              <input
                type="date"
                value={dateFrom}
                onChange={handleDateFromChange}
                max={today}
                className="iot-input date-input"
              />
              <label>To:</label>
              <input
                type="date"
                value={dateTo}
                onChange={handleDateToChange}
                min={dateFrom}
                max={today}
                className="iot-input date-input"
              />
              {!isToday && (
                <button
                  className="iot-btn-sm iot-btn-outline"
                  onClick={handleGoToToday}
                >
                  Today
                </button>
              )}
            </div>
            {isToday && (
              <span className="live-badge">
                <span className="live-dot"></span> Live
              </span>
            )}
          </div>

          {loading ? (
            <div className="iot-loading">
              <div className="iot-spinner"></div>
            </div>
          ) : logs.length === 0 ? (
            <p className="iot-empty-state">No logs available for this date range.</p>
          ) : (
            <>
              <div className="iot-table-responsive">
                <table className="iot-table">
                  <thead>
                    <tr>
                      <th>Time</th>
                      <th>Sensor</th>
                      <th>Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map(log => {
                      const displayName = getDisplayName(log.log_key);
                      const unit = getUnit(log.log_key);
                      const hasLabel = displayName !== log.log_key;
                      const alarmStatus = checkLogAlarm(log.log_key, log.log_value);

                      return (
                        <tr key={log.id} className={alarmStatus.isAlarm ? 'log-row--alarm' : ''}>
                          <td className="iot-nowrap">{new Date(log.logged_at).toLocaleString()}</td>
                          <td>
                            {hasLabel ? (
                              <span className="log-sensor-name">
                                {displayName}
                                <code className="log-sensor-key">{log.log_key}</code>
                              </span>
                            ) : (
                              <code>{log.log_key || '-'}</code>
                            )}
                          </td>
                          <td className="iot-truncate">
                            <span className={alarmStatus.isAlarm ? 'log-value--alarm' : ''}>
                              {log.log_value || '-'}
                              {unit && <span className="log-unit"> {unit}</span>}
                            </span>
                            {alarmStatus.isAlarm && (
                              <span className={`log-alarm-badge log-alarm-badge--${alarmStatus.type}`}>
                                <i className="bi bi-exclamation-triangle-fill"></i>
                                {alarmStatus.type === 'low' ? 'LOW' : 'HIGH'}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="iot-pagination">
                  <button
                    className="iot-btn-outline iot-btn-sm"
                    onClick={() => setPage(page - 1)}
                    disabled={page <= 1}
                  >
                    <i className="bi bi-chevron-left"></i>
                  </button>

                  <div className="page-numbers">
                    {getPageNumbers().map((p, idx) =>
                      p === '...' ? (
                        <span key={`ellipsis-${idx}`} className="page-ellipsis">...</span>
                      ) : (
                        <button
                          key={p}
                          className={`page-btn ${page === p ? 'active' : ''}`}
                          onClick={() => setPage(p)}
                        >
                          {p}
                        </button>
                      )
                    )}
                  </div>

                  <button
                    className="iot-btn-outline iot-btn-sm"
                    onClick={() => setPage(page + 1)}
                    disabled={page >= totalPages}
                  >
                    <i className="bi bi-chevron-right"></i>
                  </button>

                  <span className="page-info">
                    Page {page} of {totalPages}
                  </span>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

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

// Config Tab with Sensor Configuration
const ConfigTab = ({ configs, sensorConfigs, availableKeys, deviceId, canEdit, onSensorConfigUpdate }) => {
  const [editingKey, setEditingKey] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  // Start editing a sensor config
  const handleEdit = (config) => {
    setEditingKey(config.log_key);
    setEditForm({
      device_id: deviceId,
      log_key: config.log_key,
      data_type: config.data_type || 'real',
      zero_value: config.zero_value || 0,
      span_value: config.span_value || 100,
      unit: config.unit || '',
      decimals: config.decimals || 2,
      min_alarm: config.min_alarm ?? '',
      max_alarm: config.max_alarm ?? '',
      alarm_enabled: config.alarm_enabled || false,
      label: config.label || '',
      sensor_type: config.sensor_type || 'GEN'
    });
    setMessage(null);
  };

  // Start creating a new sensor config
  const handleAddNew = (logKey) => {
    setEditingKey(logKey);
    setEditForm({
      device_id: deviceId,
      log_key: logKey,
      data_type: 'real',
      zero_value: 0,
      span_value: 100,
      unit: '',
      decimals: 2,
      min_alarm: '',
      max_alarm: '',
      alarm_enabled: false,
      label: '',
      sensor_type: 'GEN'
    });
    setMessage(null);
  };

  // Cancel editing
  const handleCancel = () => {
    setEditingKey(null);
    setEditForm({});
    setMessage(null);
  };

  // Save sensor config
  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      // Prepare data - convert empty strings to null for optional fields
      const saveData = {
        ...editForm,
        min_alarm: editForm.min_alarm === '' ? null : parseFloat(editForm.min_alarm),
        max_alarm: editForm.max_alarm === '' ? null : parseFloat(editForm.max_alarm),
        zero_value: parseFloat(editForm.zero_value) || 0,
        span_value: parseFloat(editForm.span_value) || 100,
        decimals: parseInt(editForm.decimals) || 2
      };

      const result = await saveSensorConfig(saveData);
      if (result.success) {
        onSensorConfigUpdate(result.config);
        setEditingKey(null);
        setEditForm({});
        setMessage({ type: 'success', text: 'Configuration saved!' });
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to save' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Error saving configuration' });
    } finally {
      setSaving(false);
    }
  };

  // Get sensor type options
  const sensorTypeOptions = Object.entries(SENSOR_TYPES).map(([code, cfg]) => ({
    value: code,
    label: `${code} - ${cfg.label}`
  }));

  // Find unconfigured keys (available but not yet configured)
  const configuredKeys = sensorConfigs.map(c => c.log_key);
  const unconfiguredKeys = availableKeys.filter(k => !configuredKeys.includes(k));

  return (
    <div className="iot-config-tab">
      {/* Status Message */}
      {message && (
        <div className={`iot-alert ${message.type === 'success' ? 'iot-alert-success' : 'iot-alert-error'}`}>
          {message.text}
        </div>
      )}

      {/* Sensor Configurations */}
      <div className="iot-card">
        <div className="iot-card-header">
          <span><i className="bi bi-sliders"></i> Sensor Configurations</span>
          <span className="iot-badge info">{sensorConfigs.length} configured</span>
        </div>
        <div className="iot-card-body">
          {sensorConfigs.length === 0 && unconfiguredKeys.length === 0 ? (
            <div className="iot-empty-state">
              <i className="bi bi-gear"></i>
              <p>No sensor data received yet.<br />Configurations will appear after the device sends data.</p>
            </div>
          ) : (
            <div className="sensor-config-list">
              {/* Configured sensors */}
              {sensorConfigs.map(config => (
                <div key={config.log_key} className="sensor-config-item">
                  {editingKey === config.log_key && canEdit ? (
                    // Edit Form
                    <SensorConfigForm
                      form={editForm}
                      setForm={setEditForm}
                      onSave={handleSave}
                      onCancel={handleCancel}
                      saving={saving}
                      sensorTypeOptions={sensorTypeOptions}
                    />
                  ) : (
                    // Display View
                    <SensorConfigDisplay
                      config={config}
                      onEdit={() => handleEdit(config)}
                      canEdit={canEdit}
                    />
                  )}
                </div>
              ))}

              {/* Unconfigured sensors */}
              {unconfiguredKeys.map(key => (
                <div key={key} className="sensor-config-item unconfigured">
                  {editingKey === key && canEdit ? (
                    <SensorConfigForm
                      form={editForm}
                      setForm={setEditForm}
                      onSave={handleSave}
                      onCancel={handleCancel}
                      saving={saving}
                      sensorTypeOptions={sensorTypeOptions}
                    />
                  ) : (
                    <div className="sensor-config-unconfigured">
                      <div className="sensor-config-key">
                        <code>{key}</code>
                        <span className="iot-badge warning">Not configured</span>
                      </div>
                      {canEdit && (
                        <button
                          className="iot-btn-sm iot-btn-primary"
                          onClick={() => handleAddNew(key)}
                        >
                          <i className="bi bi-plus"></i> Configure
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Device Configs (legacy) */}
      {configs.length > 0 && (
        <div className="iot-card" style={{ marginTop: '1rem' }}>
          <div className="iot-card-header">
            <span>Device Configuration (Legacy)</span>
          </div>
          <div className="iot-card-body">
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
          </div>
        </div>
      )}
    </div>
  );
};

// Sensor Config Display Component
const SensorConfigDisplay = ({ config, onEdit, canEdit }) => {
  const sensorType = SENSOR_TYPES[config.sensor_type] || SENSOR_TYPES.GEN;

  return (
    <div className="sensor-config-display">
      <div className="sensor-config-header">
        <div className="sensor-config-title">
          <i className={`bi bi-${sensorType.icon}`} style={{ color: sensorType.color }}></i>
          <code className="sensor-config-key">{config.log_key}</code>
          {config.label && <span className="sensor-config-label">{config.label}</span>}
        </div>
        {canEdit && (
          <button className="iot-btn-sm iot-btn-outline" onClick={onEdit}>
            <i className="bi bi-pencil"></i> Edit
          </button>
        )}
      </div>

      <div className="sensor-config-details">
        <div className="sensor-config-row">
          <span className="config-label">Data Type:</span>
          <span className={`iot-badge ${config.data_type === '4-20' ? 'warning' : 'info'}`}>
            {config.data_type === '4-20' ? '4-20 mA' : 'Real Value'}
          </span>
        </div>

        {config.data_type === '4-20' && (
          <div className="sensor-config-row">
            <span className="config-label">Zero-Span:</span>
            <span className="config-value">
              {config.zero_value} → {parseFloat(config.zero_value) + parseFloat(config.span_value)} {config.unit}
            </span>
          </div>
        )}

        <div className="sensor-config-row">
          <span className="config-label">Unit:</span>
          <span className="config-value">{config.unit || '—'}</span>
        </div>

        <div className="sensor-config-row">
          <span className="config-label">Alarms:</span>
          {config.alarm_enabled ? (
            <span className="config-value alarm-values">
              {config.min_alarm !== null && <span className="alarm-min">Min: {config.min_alarm}</span>}
              {config.max_alarm !== null && <span className="alarm-max">Max: {config.max_alarm}</span>}
            </span>
          ) : (
            <span className="config-value disabled">Disabled</span>
          )}
        </div>
      </div>
    </div>
  );
};

// Sensor Config Edit Form
const SensorConfigForm = ({ form, setForm, onSave, onCancel, saving, sensorTypeOptions }) => (
  <div className="sensor-config-form">
    <div className="sensor-config-form-header">
      <code>{form.log_key}</code>
    </div>

    <div className="sensor-config-form-grid">
      {/* Data Type */}
      <div className="form-group">
        <label>Data Type</label>
        <select
          value={form.data_type}
          onChange={e => setForm({ ...form, data_type: e.target.value })}
          className="iot-input"
        >
          <option value="real">Real Value</option>
          <option value="4-20">4-20 mA</option>
        </select>
      </div>

      {/* Sensor Type */}
      <div className="form-group">
        <label>Sensor Type</label>
        <select
          value={form.sensor_type}
          onChange={e => setForm({ ...form, sensor_type: e.target.value })}
          className="iot-input"
        >
          {sensorTypeOptions.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* Zero-Span (only for 4-20mA) */}
      {form.data_type === '4-20' && (
        <>
          <div className="form-group">
            <label>Zero Value (at 4mA)</label>
            <input
              type="number"
              step="any"
              value={form.zero_value}
              onChange={e => setForm({ ...form, zero_value: e.target.value })}
              className="iot-input"
            />
          </div>
          <div className="form-group">
            <label>Span (range)</label>
            <input
              type="number"
              step="any"
              value={form.span_value}
              onChange={e => setForm({ ...form, span_value: e.target.value })}
              className="iot-input"
            />
          </div>
        </>
      )}

      {/* Unit */}
      <div className="form-group">
        <label>Unit</label>
        <input
          type="text"
          value={form.unit}
          onChange={e => setForm({ ...form, unit: e.target.value })}
          className="iot-input"
          placeholder="°C, ppm, bar, etc."
        />
      </div>

      {/* Decimals */}
      <div className="form-group">
        <label>Decimal Places</label>
        <input
          type="number"
          min="0"
          max="6"
          value={form.decimals}
          onChange={e => setForm({ ...form, decimals: e.target.value })}
          className="iot-input"
        />
      </div>

      {/* Label */}
      <div className="form-group form-group-full">
        <label>Custom Label (optional)</label>
        <input
          type="text"
          value={form.label}
          onChange={e => setForm({ ...form, label: e.target.value })}
          className="iot-input"
          placeholder="Override default label"
        />
      </div>

      {/* Alarm Settings */}
      <div className="form-group form-group-full">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={form.alarm_enabled}
            onChange={e => setForm({ ...form, alarm_enabled: e.target.checked })}
          />
          Enable Alarms
        </label>
      </div>

      {form.alarm_enabled && (
        <>
          <div className="form-group">
            <label>Min Alarm</label>
            <input
              type="number"
              step="any"
              value={form.min_alarm}
              onChange={e => setForm({ ...form, min_alarm: e.target.value })}
              className="iot-input"
              placeholder="Low threshold"
            />
          </div>
          <div className="form-group">
            <label>Max Alarm</label>
            <input
              type="number"
              step="any"
              value={form.max_alarm}
              onChange={e => setForm({ ...form, max_alarm: e.target.value })}
              className="iot-input"
              placeholder="High threshold"
            />
          </div>
        </>
      )}
    </div>

    <div className="sensor-config-form-actions">
      <button
        className="iot-btn-sm iot-btn-outline"
        onClick={onCancel}
        disabled={saving}
      >
        Cancel
      </button>
      <button
        className="iot-btn-sm iot-btn-primary"
        onClick={onSave}
        disabled={saving}
      >
        {saving ? 'Saving...' : 'Save Configuration'}
      </button>
    </div>
  </div>
);

export default IotDeviceView;
