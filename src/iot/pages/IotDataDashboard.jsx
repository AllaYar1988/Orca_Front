import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useIotAuth } from "../context/IotAuthContext";
import IotLayout from "../components/IotLayout";
import DeviceDataCard from "../components/DeviceDataCard";
import { getAllDevicesWithParameters, getUserCompanies, getCompanyDevices, getDeviceLogs } from "../api/devices";
import { SENSOR_TYPES } from "../config/sensorTypes";

/**
 * IoT Data Dashboard
 *
 * Displays all devices with their real-time parameters
 * using the new card-based design with pagination.
 */
const IotDataDashboard = () => {
  const { iotUser } = useIotAuth();
  const navigate = useNavigate();
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all"); // all, online, offline
  const [useDemoData, setUseDemoData] = useState(false);

  // Demo data for fallback/testing
  const demoDevices = [
    {
      id: 1,
      name: "Temperature Tracker 1",
      location: "Lab Room 3",
      status: "online",
      battery: 85,
      lastSeen: new Date(Date.now() - 30000).toISOString(),
      parameters: [
        { type: "TMP", name: "Temperature", value: 76.1, unit: "°F", min: 32, max: 120 },
        { type: "HUM", name: "Humidity", value: 4, unit: "%", min: 0, max: 100 },
        { type: "VLT", name: "Voltage", value: 51.1, unit: "V", min: 0, max: 60 },
        { type: "GEN", name: "PPM", value: 100, unit: "ppm", min: 0, max: 500 },
        { type: "PRS", name: "Pressure", value: 1013, unit: "hPa", min: 900, max: 1100 },
        { type: "CO2", name: "CO2 Level", value: 420, unit: "ppm", min: 0, max: 2000 },
      ],
    },
    {
      id: 2,
      name: "Power Monitor A",
      location: "Server Room",
      status: "online",
      battery: 92,
      lastSeen: new Date(Date.now() - 15000).toISOString(),
      parameters: [
        { type: "VLT", name: "Voltage", value: 220.5, unit: "V", min: 200, max: 240 },
        { type: "CUR", name: "Current", value: 15.2, unit: "A", min: 0, max: 30 },
        { type: "PWR", name: "Power", value: 3351, unit: "W", min: 0, max: 5000 },
        { type: "FRQ", name: "Frequency", value: 50.02, unit: "Hz", min: 49, max: 51 },
      ],
    },
    {
      id: 3,
      name: "Air Quality Sensor",
      location: "Office Floor 2",
      status: "warning",
      battery: 45,
      lastSeen: new Date(Date.now() - 60000).toISOString(),
      parameters: [
        { type: "CO2", name: "CO2", value: 850, unit: "ppm", min: 0, max: 2000, warning: true },
        { type: "PM25", name: "PM 2.5", value: 35, unit: "µg/m³", min: 0, max: 100 },
        { type: "VOC", name: "VOC", value: 120, unit: "ppb", min: 0, max: 500 },
        { type: "TMP", name: "Temperature", value: 24.5, unit: "°C", min: 15, max: 35 },
        { type: "HUM", name: "Humidity", value: 58, unit: "%", min: 0, max: 100 },
      ],
    },
    {
      id: 4,
      name: "Industrial Sensor B",
      location: "Warehouse A",
      status: "offline",
      battery: 12,
      lastSeen: new Date(Date.now() - 3600000).toISOString(),
      parameters: [
        { type: "TMP", name: "Temperature", value: 18.3, unit: "°C", min: -10, max: 50 },
        { type: "PRS", name: "Pressure", value: 2.4, unit: "bar", min: 0, max: 10 },
        { type: "FLW", name: "Flow Rate", value: 0, unit: "L/min", min: 0, max: 100 },
      ],
    },
    {
      id: 5,
      name: "Gas Detector Unit",
      location: "Chemical Storage",
      status: "online",
      battery: 78,
      lastSeen: new Date(Date.now() - 5000).toISOString(),
      parameters: [
        { type: "CH4", name: "Methane", value: 0.2, unit: "%", min: 0, max: 5 },
        { type: "CO", name: "CO", value: 5, unit: "ppm", min: 0, max: 50 },
        { type: "O2", name: "Oxygen", value: 20.9, unit: "%", min: 19, max: 23 },
        { type: "TMP", name: "Temperature", value: 22.1, unit: "°C", min: 0, max: 40 },
      ],
    },
    {
      id: 6,
      name: "Environmental Station",
      location: "Rooftop",
      status: "online",
      battery: 100,
      lastSeen: new Date(Date.now() - 10000).toISOString(),
      parameters: [
        { type: "TMP", name: "Temperature", value: 28.7, unit: "°C", min: -20, max: 50 },
        { type: "HUM", name: "Humidity", value: 65, unit: "%", min: 0, max: 100 },
        { type: "ATM", name: "Pressure", value: 1015.2, unit: "hPa", min: 950, max: 1050 },
        { type: "UV", name: "UV Index", value: 6, unit: "", min: 0, max: 11 },
        { type: "AMB", name: "Light", value: 45000, unit: "lux", min: 0, max: 100000 },
        { type: "SPD", name: "Wind Speed", value: 12.5, unit: "km/h", min: 0, max: 150 },
        { type: "GEN", name: "Rain", value: 0, unit: "mm", min: 0, max: 50 },
        { type: "SIG", name: "Signal", value: -65, unit: "dBm", min: -100, max: 0 },
      ],
    },
  ];

  // Transform API device data to dashboard format
  const transformDeviceData = (device, logs = []) => {
    // Group latest logs by key to get parameters
    const latestByKey = {};
    logs.forEach(log => {
      if (!latestByKey[log.log_key] || new Date(log.logged_at) > new Date(latestByKey[log.log_key].logged_at)) {
        latestByKey[log.log_key] = log;
      }
    });

    // Convert logs to parameters format
    const parameters = Object.entries(latestByKey).map(([key, log]) => {
      // Try to parse the type from the key or use GEN as default
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
      lastSeen: device.last_seen || device.updated_at,
      companyId: device.company_id,
      parameters,
    };
  };

  // Fetch devices from API
  useEffect(() => {
    const fetchDevices = async () => {
      if (!iotUser?.id) return;

      setLoading(true);
      setError(null);

      try {
        // Try to get all devices with parameters from dedicated endpoint
        const response = await getAllDevicesWithParameters();

        if (response.success && response.devices?.length > 0) {
          // Transform API data to dashboard format
          const transformedDevices = response.devices.map(device =>
            transformDeviceData(device, device.latest_readings || [])
          );
          setDevices(transformedDevices);
          setUseDemoData(false);
        } else {
          // Fallback: fetch companies and their devices manually
          const companiesRes = await getUserCompanies();

          if (companiesRes.success && companiesRes.companies?.length > 0) {
            const allDevices = [];

            for (const company of companiesRes.companies) {
              const devicesRes = await getCompanyDevices(company.id);

              if (devicesRes.success && devicesRes.devices?.length > 0) {
                for (const device of devicesRes.devices) {
                  // Get latest logs for each device
                  try {
                    const logsRes = await getDeviceLogs(device.id, { limit: 20 });
                    const logs = logsRes.success ? logsRes.logs || [] : [];
                    allDevices.push(transformDeviceData({ ...device, company_id: company.id }, logs));
                  } catch {
                    allDevices.push(transformDeviceData({ ...device, company_id: company.id }, []));
                  }
                }
              }
            }

            if (allDevices.length > 0) {
              setDevices(allDevices);
              setUseDemoData(false);
            } else {
              // No devices found, use demo data
              setDevices(demoDevices);
              setUseDemoData(true);
            }
          } else {
            // No companies, use demo data
            setDevices(demoDevices);
            setUseDemoData(true);
          }
        }
      } catch (err) {
        console.error("Error fetching devices:", err);
        // On error, fallback to demo data
        setDevices(demoDevices);
        setUseDemoData(true);
      } finally {
        setLoading(false);
      }
    };

    fetchDevices();
  }, [iotUser]);

  // Filter devices
  const filteredDevices = devices.filter((device) => {
    if (filter === "all") return true;
    if (filter === "online") return device.status === "online";
    if (filter === "offline") return device.status === "offline";
    if (filter === "warning") return device.status === "warning" || device.status === "error";
    return true;
  });

  // Stats
  const stats = {
    total: devices.length,
    online: devices.filter((d) => d.status === "online").length,
    offline: devices.filter((d) => d.status === "offline").length,
    warning: devices.filter((d) => d.status === "warning" || d.status === "error").length,
  };

  const handleDeviceClick = (device) => {
    // Navigate to device detail page
    if (device.companyId) {
      navigate(`/iot/device/${device.companyId}/${device.id}`);
    } else {
      console.log("Device clicked:", device);
    }
  };

  return (
    <IotLayout>
      {/* Page Header */}
      <div className="iot-page-header" style={{ marginBottom: "1.5rem" }}>
        <h1 className="iot-page-title">
          <i className="bi bi-grid-3x3-gap"></i>
          Data Logging Dashboard
        </h1>
        {useDemoData && (
          <span className="iot-badge info" style={{ marginLeft: "0.75rem" }}>
            Demo Data
          </span>
        )}
      </div>

      {/* Stats Grid */}
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

      {/* Filter Bar */}
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

      {/* Loading State */}
      {loading && (
        <div className="iot-loading">
          <div className="iot-spinner"></div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="iot-alert iot-alert-error">
          <i className="bi bi-exclamation-circle"></i>
          {error}
        </div>
      )}

      {/* Device Grid */}
      {!loading && !error && (
        <>
          {filteredDevices.length === 0 ? (
            <div className="iot-empty-state-large">
              <i className="bi bi-inbox"></i>
              <h3>No devices found</h3>
              <p>
                {filter === "all"
                  ? "No devices are configured yet."
                  : `No ${filter} devices at the moment.`}
              </p>
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

      {/* Sensor Types Reference (Development Only) */}
      {useDemoData && (
        <div className="iot-card" style={{ marginTop: "2rem" }}>
          <div className="iot-card-header">
            <span>
              <i className="bi bi-code-square"></i> Sensor Types Reference
            </span>
          </div>
          <div className="iot-card-body">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "0.5rem" }}>
              {Object.entries(SENSOR_TYPES).map(([code, config]) => (
                <div
                  key={code}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    padding: "0.5rem",
                    background: "var(--iot-light)",
                    borderRadius: "0.25rem",
                    fontSize: "0.8rem",
                  }}
                >
                  <i className={`bi bi-${config.icon}`} style={{ color: "var(--iot-primary)" }}></i>
                  <code style={{ fontWeight: "600" }}>{code}</code>
                  <span style={{ color: "var(--iot-gray)" }}>{config.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </IotLayout>
  );
};

export default IotDataDashboard;
