import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useIotAuth } from '../context/IotAuthContext';
import { getCompanyDevices, getDeviceLogs } from '../api/devices';
import IotLayout from '../components/IotLayout';
import DeviceDataCard from '../components/DeviceDataCard';
import { SENSOR_TYPES } from '../config/sensorTypes';

const IotCompanyDevices = () => {
  const { iotUser } = useIotAuth();
  const { companyId } = useParams();
  const navigate = useNavigate();
  const [company, setCompany] = useState(null);
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');

  // Transform API device data to card format
  const transformDeviceData = (device, logs = []) => {
    const latestByKey = {};
    logs.forEach(log => {
      if (!latestByKey[log.log_key] || new Date(log.logged_at) > new Date(latestByKey[log.log_key].logged_at)) {
        latestByKey[log.log_key] = log;
      }
    });

    const parameters = Object.entries(latestByKey).map(([key, log]) => {
      const typeMatch = key.match(/^([A-Z]{2,4})_?/i);
      const type = typeMatch ? typeMatch[1].toUpperCase() : "GEN";

      return {
        type: SENSOR_TYPES[type] ? type : "GEN",
        name: log.log_key,
        value: parseFloat(log.log_value) || log.log_value,
        unit: log.unit || "",
        min: 0,
        max: 100,
      };
    });

    return {
      id: device.id,
      name: device.name,
      location: device.location || device.description || "",
      status: device.is_online ? "online" : "offline",
      battery: device.battery_level,
      lastSeen: device.last_seen_at || device.updated_at,
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

          const devicesWithParams = [];
          for (const device of response.devices || []) {
            try {
              const logsRes = await getDeviceLogs(device.id, { limit: 20 });
              const logs = logsRes.success ? logsRes.logs || [] : [];
              devicesWithParams.push(transformDeviceData(device, logs));
            } catch {
              devicesWithParams.push(transformDeviceData(device, []));
            }
          }
          setDevices(devicesWithParams);
        }
      } catch (err) {
        setError('Failed to load devices');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchDevices();
  }, [iotUser, companyId]);

  const filteredDevices = devices.filter((device) => {
    if (filter === "all") return true;
    if (filter === "online") return device.status === "online";
    if (filter === "offline") return device.status === "offline";
    if (filter === "warning") return device.status === "warning" || device.status === "error";
    return true;
  });

  const stats = {
    total: devices.length,
    online: devices.filter((d) => d.status === "online").length,
    offline: devices.filter((d) => d.status === "offline").length,
    warning: devices.filter((d) => d.status === "warning" || d.status === "error").length,
  };

  const handleDeviceClick = (device) => {
    navigate(`/iot/device/${companyId}/${device.id}`);
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

  return (
    <IotLayout>
      <div className="iot-breadcrumb">
        <Link to="/iot"><i className="bi bi-building"></i> Companies</Link>
        <i className="bi bi-chevron-right"></i>
        <span>{company?.name || 'Company'}</span>
      </div>

      <h2 className="iot-page-title">
        <i className="bi bi-hdd-stack"></i> {company?.name} - Devices
      </h2>

      {error && <div className="iot-alert iot-alert-error">{error}</div>}

      {devices.length === 0 ? (
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
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
                <span style={{ color: "var(--iot-gray)", fontSize: "0.875rem" }}>Filter:</span>
                {["all", "online", "offline", "warning"].map((f) => (
                  <button
                    key={f}
                    className={filter === f ? "iot-btn-primary" : "iot-btn-outline"}
                    onClick={() => setFilter(f)}
                    style={{ textTransform: "capitalize", padding: "0.35rem 0.75rem", fontSize: "0.8rem" }}
                  >
                    {f === "all" ? "All Devices" : f}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {filteredDevices.length === 0 ? (
            <div className="iot-empty-state-large">
              <i className="bi bi-inbox"></i>
              <h3>No devices found</h3>
              <p>No {filter} devices at the moment.</p>
            </div>
          ) : (
            <div className="device-data-grid">
              {filteredDevices.map((device) => (
                <DeviceDataCard
                  key={device.id}
                  device={device}
                  onClick={handleDeviceClick}
                />
              ))}
            </div>
          )}
        </>
      )}
    </IotLayout>
  );
};

export default IotCompanyDevices;
