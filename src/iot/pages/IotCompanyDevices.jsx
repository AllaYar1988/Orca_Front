import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCompanyDevices, getDeviceLogs, getDevicesStatus, getSensorConfigs, getVirtualDeviceDetails } from '../api/devices';
import IotLayout from '../components/IotLayout';
import DeviceDataCard from '../components/DeviceDataCard';
import VirtualDeviceCard from '../components/VirtualDeviceCard';
import { SENSOR_TYPES } from '../config/sensorTypes';

const IotCompanyDevices = () => {
  const { companyId } = useParams();
  const navigate = useNavigate();
  const [company, setCompany] = useState(null);
  const [devices, setDevices] = useState([]);
  const [virtualDevices, setVirtualDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [viewMode, setViewMode] = useState('all'); // 'all', 'devices', 'virtual'

  // Transform API device data to card format
  const transformDeviceData = (device, logs = [], sensorConfigs = []) => {
    const latestByKey = {};
    logs.forEach(log => {
      if (!latestByKey[log.log_key] || new Date(log.logged_at) > new Date(latestByKey[log.log_key].logged_at)) {
        latestByKey[log.log_key] = log;
      }
    });

    // Create a map of sensor configs by log_key for quick lookup
    const configMap = {};
    sensorConfigs.forEach(config => {
      configMap[config.log_key] = config;
    });

    const parameters = Object.entries(latestByKey).map(([key, log]) => {
      const typeMatch = key.match(/^([A-Z]{2,4})_?/i);
      const type = typeMatch ? typeMatch[1].toUpperCase() : "GEN";
      const config = configMap[key];
      const value = parseFloat(log.log_value) || 0;

      // Use backend status if available (calculated at ingestion time)
      // Falls back to threshold calculation for backwards compatibility
      let status = log.status || "normal";
      if (!log.status && config && config.alarm_enabled) {
        const minAlarm = parseFloat(config.min_alarm);
        const maxAlarm = parseFloat(config.max_alarm);
        if (!isNaN(minAlarm) && value < minAlarm) {
          status = "critical";
        } else if (!isNaN(maxAlarm) && value > maxAlarm) {
          status = "critical";
        }
      }

      return {
        type: SENSOR_TYPES[type] ? type : "GEN",
        name: log.log_key,
        value: value,
        unit: config?.unit || log.unit || "",
        min: config ? parseFloat(config.min_alarm) || 0 : 0,
        max: config ? parseFloat(config.max_alarm) || 100 : 100,
        status,
      };
    });

    return {
      id: device.id,
      name: device.name,
      location: device.location || device.description || "",
      status: device.is_online ? "online" : "offline",
      battery: device.battery_level,
      seconds_ago: device.seconds_ago,
      serialNumber: device.serial_number,
      deviceType: device.device_type,
      companyId: companyId,
      parameters,
    };
  };

  useEffect(() => {
    const fetchDevices = async () => {
      try {
        const response = await getCompanyDevices(companyId);
        if (response.success) {
          setCompany(response.company);

          const rawDevices = response.devices || [];
          const rawVirtualDevices = response.virtual_devices || [];

          // Fetch real-time status for all devices
          let statusMap = {};
          if (rawDevices.length > 0) {
            try {
              const statusRes = await getDevicesStatus({ company_id: companyId });
              if (statusRes.success) {
                statusRes.devices.forEach(d => {
                  statusMap[d.id] = { is_online: d.is_online, seconds_ago: d.seconds_ago };
                });
              }
            } catch {
              // Status fetch failed, keep original values
            }
          }

          const devicesWithParams = [];
          for (const device of rawDevices) {
            // Update is_online and seconds_ago from status API if available
            if (statusMap[device.id] !== undefined) {
              device.is_online = statusMap[device.id].is_online;
              device.seconds_ago = statusMap[device.id].seconds_ago;
            }

            try {
              const [logsRes, configsRes] = await Promise.all([
                getDeviceLogs(device.id, { limit: 20 }),
                getSensorConfigs(device.id)
              ]);
              const logs = logsRes.success ? logsRes.logs || [] : [];
              const configs = configsRes.success ? configsRes.configs || [] : [];
              devicesWithParams.push(transformDeviceData(device, logs, configs));
            } catch {
              devicesWithParams.push(transformDeviceData(device, [], []));
            }
          }
          setDevices(devicesWithParams);

          // Fetch virtual device details with sensor data
          const virtualDevicesWithData = [];
          for (const vd of rawVirtualDevices) {
            try {
              const vdRes = await getVirtualDeviceDetails(vd.id);
              if (vdRes.success) {
                virtualDevicesWithData.push(vdRes.virtual_device);
              } else {
                virtualDevicesWithData.push(vd);
              }
            } catch {
              virtualDevicesWithData.push(vd);
            }
          }
          setVirtualDevices(virtualDevicesWithData);
        }
      } catch (err) {
        setError('Failed to load devices');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchDevices();
  }, [companyId]);

  // Helper to check if device has any warning/critical parameters
  const hasWarningStatus = (device) => {
    if (device.status === "warning" || device.status === "error") return true;
    return device.parameters?.some(p => p.status === "warning" || p.status === "critical");
  };

  // Helper to check if virtual device has any warning/critical sensors
  const hasVirtualWarningStatus = (vd) => {
    return vd.sensors?.some(s => s.status === "warning" || s.status === "critical");
  };

  const filteredDevices = devices.filter((device) => {
    if (filter === "all") return true;
    if (filter === "online") return device.status === "online";
    if (filter === "offline") return device.status === "offline";
    if (filter === "warning") return hasWarningStatus(device);
    return true;
  });

  const filteredVirtualDevices = virtualDevices.filter((vd) => {
    if (filter === "all") return true;
    if (filter === "online") return vd.is_online;
    if (filter === "offline") return !vd.is_online;
    if (filter === "warning") return hasVirtualWarningStatus(vd);
    return true;
  });

  const stats = {
    total: devices.length + virtualDevices.length,
    online: devices.filter((d) => d.status === "online").length + virtualDevices.filter((vd) => vd.is_online).length,
    offline: devices.filter((d) => d.status === "offline").length + virtualDevices.filter((vd) => !vd.is_online).length,
    warning: devices.filter((d) => hasWarningStatus(d)).length + virtualDevices.filter((vd) => hasVirtualWarningStatus(vd)).length,
    devices: devices.length,
    virtualDevices: virtualDevices.length,
  };

  const handleDeviceClick = (device) => {
    navigate(`/iot/device/${companyId}/${device.id}`);
  };

  const handleVirtualDeviceClick = (vd) => {
    navigate(`/iot/virtual-device/${companyId}/${vd.id}`);
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

  const showDevices = viewMode === 'all' || viewMode === 'devices';
  const showVirtual = viewMode === 'all' || viewMode === 'virtual';

  return (
    <IotLayout>
      <h2 className="iot-page-title">
        <i className="bi bi-hdd-stack"></i> {company?.name} - Devices
      </h2>

      {error && <div className="iot-alert iot-alert-error">{error}</div>}

      {devices.length === 0 && virtualDevices.length === 0 ? (
        <div className="iot-card">
          <div className="iot-card-body iot-empty-state-large">
            <i className="bi bi-hdd-stack"></i>
            <h3>No Devices</h3>
            <p>No devices assigned to you in this company.</p>
          </div>
        </div>
      ) : (
        <>
          <div className="iot-stats-grid">
            <div className="iot-stat-card" onClick={() => setFilter("all")} style={{ cursor: "pointer" }}>
              <div className="iot-stat-icon blue">
                <i className="bi bi-cpu"></i>
              </div>
              <div>
                <div className="iot-stat-value">{stats.total}</div>
                <div className="iot-stat-label">Total Devices</div>
              </div>
            </div>

            <div className="iot-stat-card" onClick={() => setFilter("online")} style={{ cursor: "pointer" }}>
              <div className="iot-stat-icon green">
                <i className="bi bi-check-circle"></i>
              </div>
              <div>
                <div className="iot-stat-value">{stats.online}</div>
                <div className="iot-stat-label">Online</div>
              </div>
            </div>

            <div className="iot-stat-card" onClick={() => setFilter("offline")} style={{ cursor: "pointer" }}>
              <div className="iot-stat-icon" style={{ background: "linear-gradient(135deg, #64748b, #475569)" }}>
                <i className="bi bi-x-circle"></i>
              </div>
              <div>
                <div className="iot-stat-value">{stats.offline}</div>
                <div className="iot-stat-label">Offline</div>
              </div>
            </div>

            <div className="iot-stat-card" onClick={() => setFilter("warning")} style={{ cursor: "pointer" }}>
              <div className="iot-stat-icon" style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)" }}>
                <i className="bi bi-exclamation-triangle"></i>
              </div>
              <div>
                <div className="iot-stat-value">{stats.warning}</div>
                <div className="iot-stat-label">Warnings</div>
              </div>
            </div>
          </div>

          <div className="iot-card" style={{ marginBottom: "1.5rem" }}>
            <div className="iot-card-body" style={{ padding: "0.75rem 1rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "1.5rem", flexWrap: "wrap" }}>
                {/* Status Filter */}
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
                  <span style={{ color: "var(--iot-gray)", fontSize: "0.875rem" }}>Status:</span>
                  {["all", "online", "offline", "warning"].map((f) => (
                    <button
                      key={f}
                      className={filter === f ? "iot-btn-primary" : "iot-btn-outline"}
                      onClick={() => setFilter(f)}
                      style={{ textTransform: "capitalize", padding: "0.35rem 0.75rem", fontSize: "0.8rem" }}
                    >
                      {f === "all" ? "All" : f}
                    </button>
                  ))}
                </div>

                {/* View Mode Filter (only show if we have virtual devices) */}
                {virtualDevices.length > 0 && (
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap", borderLeft: "1px solid var(--iot-border)", paddingLeft: "1.5rem" }}>
                    <span style={{ color: "var(--iot-gray)", fontSize: "0.875rem" }}>View:</span>
                    <button
                      className={viewMode === "all" ? "iot-btn-primary" : "iot-btn-outline"}
                      onClick={() => setViewMode("all")}
                      style={{ padding: "0.35rem 0.75rem", fontSize: "0.8rem" }}
                    >
                      All ({stats.total})
                    </button>
                    <button
                      className={viewMode === "devices" ? "iot-btn-primary" : "iot-btn-outline"}
                      onClick={() => setViewMode("devices")}
                      style={{ padding: "0.35rem 0.75rem", fontSize: "0.8rem" }}
                    >
                      <i className="bi bi-cpu me-1"></i>Devices ({stats.devices})
                    </button>
                    <button
                      className={viewMode === "virtual" ? "iot-btn-primary" : "iot-btn-outline"}
                      onClick={() => setViewMode("virtual")}
                      style={{ padding: "0.35rem 0.75rem", fontSize: "0.8rem" }}
                    >
                      <i className="bi bi-diagram-3 me-1"></i>Virtual ({stats.virtualDevices})
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {filteredDevices.length === 0 && filteredVirtualDevices.length === 0 ? (
            <div className="iot-empty-state-large">
              <i className="bi bi-inbox"></i>
              <h3>No devices found</h3>
              <p>No {filter} devices at the moment.</p>
            </div>
          ) : (
            <>
              {/* Virtual Devices Section */}
              {showVirtual && filteredVirtualDevices.length > 0 && (
                <div style={{ marginBottom: "2rem" }}>
                  <h3 style={{ fontSize: "1rem", color: "var(--iot-gray)", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <i className="bi bi-diagram-3"></i>
                    Virtual Devices
                    <span style={{ background: "var(--iot-primary)", color: "white", padding: "0.15rem 0.5rem", borderRadius: "1rem", fontSize: "0.75rem" }}>
                      {filteredVirtualDevices.length}
                    </span>
                  </h3>
                  <div className="device-data-grid">
                    {filteredVirtualDevices.map((vd) => (
                      <VirtualDeviceCard
                        key={`vd-${vd.id}`}
                        virtualDevice={vd}
                        onClick={handleVirtualDeviceClick}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Physical Devices Section */}
              {showDevices && filteredDevices.length > 0 && (
                <div>
                  {showVirtual && filteredVirtualDevices.length > 0 && (
                    <h3 style={{ fontSize: "1rem", color: "var(--iot-gray)", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <i className="bi bi-cpu"></i>
                      Physical Devices
                      <span style={{ background: "var(--iot-primary)", color: "white", padding: "0.15rem 0.5rem", borderRadius: "1rem", fontSize: "0.75rem" }}>
                        {filteredDevices.length}
                      </span>
                    </h3>
                  )}
                  <div className="device-data-grid">
                    {filteredDevices.map((device) => (
                      <DeviceDataCard
                        key={device.id}
                        device={device}
                        onClick={handleDeviceClick}
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}
    </IotLayout>
  );
};

export default IotCompanyDevices;
