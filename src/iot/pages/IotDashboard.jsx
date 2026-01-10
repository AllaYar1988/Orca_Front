import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useIotAuth } from '../context/IotAuthContext';
import { getUserDevices, getUserLogs } from '../api/devices';
import IotLayout from '../components/IotLayout';

const IotDashboard = () => {
  const { iotUser } = useIotAuth();
  const [devices, setDevices] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [devicesRes, logsRes] = await Promise.all([
          getUserDevices(iotUser.id),
          getUserLogs(iotUser.id, { limit: 10 })
        ]);

        if (devicesRes.success) {
          setDevices(devicesRes.devices);
        }
        if (logsRes.success) {
          setLogs(logsRes.logs);
        }
      } catch (err) {
        setError('Failed to load data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [iotUser.id]);

  const onlineCount = devices.filter(d => d.is_online).length;

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
      <h2 className="iot-page-title">Welcome, {iotUser.name || iotUser.username}!</h2>

      {error && <div className="iot-alert iot-alert-error">{error}</div>}

      {/* Stats Cards */}
      <div className="iot-stats-grid">
        <div className="iot-stat-card">
          <div className="iot-stat-icon blue">
            <i className="bi bi-hdd-stack"></i>
          </div>
          <div className="iot-stat-info">
            <div className="iot-stat-value">{devices.length}</div>
            <div className="iot-stat-label">My Devices</div>
          </div>
        </div>
        <div className="iot-stat-card">
          <div className="iot-stat-icon green">
            <i className="bi bi-wifi"></i>
          </div>
          <div className="iot-stat-info">
            <div className="iot-stat-value">{onlineCount}</div>
            <div className="iot-stat-label">Online Now</div>
          </div>
        </div>
        <div className="iot-stat-card">
          <div className="iot-stat-icon purple">
            <i className="bi bi-journal-text"></i>
          </div>
          <div className="iot-stat-info">
            <div className="iot-stat-value">{logs.length}</div>
            <div className="iot-stat-label">Recent Logs</div>
          </div>
        </div>
      </div>

      {/* Devices */}
      <div className="iot-card">
        <div className="iot-card-header">
          <span><i className="bi bi-hdd-stack"></i> My Devices</span>
          <Link to="/iot/devices" className="iot-btn-small">View All</Link>
        </div>
        <div className="iot-card-body">
          {devices.length === 0 ? (
            <p className="iot-empty-state">No devices assigned to your account.</p>
          ) : (
            <div className="iot-device-grid">
              {devices.slice(0, 6).map(device => (
                <div key={device.id} className="iot-device-card">
                  <div className="iot-device-header">
                    <h4>{device.name}</h4>
                    <span className={`iot-badge ${device.is_online ? 'online' : 'offline'}`}>
                      {device.is_online ? 'Online' : 'Offline'}
                    </span>
                  </div>
                  <p className="iot-device-serial"><code>{device.serial_number}</code></p>
                  {device.device_type && (
                    <span className="iot-device-type">{device.device_type}</span>
                  )}
                  <Link to={`/iot/logs?device_id=${device.id}`} className="iot-btn-outline">
                    <i className="bi bi-journal-text"></i> View Logs
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Logs */}
      <div className="iot-card">
        <div className="iot-card-header">
          <span><i className="bi bi-journal-text"></i> Recent Logs</span>
          <Link to="/iot/logs" className="iot-btn-small">View All</Link>
        </div>
        <div className="iot-card-body">
          {logs.length === 0 ? (
            <p className="iot-empty-state">No logs available yet.</p>
          ) : (
            <div className="iot-table-responsive">
              <table className="iot-table">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Device</th>
                    <th>Key</th>
                    <th>Value</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map(log => (
                    <tr key={log.id}>
                      <td>{new Date(log.logged_at).toLocaleString()}</td>
                      <td>
                        <Link to={`/iot/logs?device_id=${log.device_id}`}>
                          {log.device_name || log.serial_number}
                        </Link>
                      </td>
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
    </IotLayout>
  );
};

export default IotDashboard;
