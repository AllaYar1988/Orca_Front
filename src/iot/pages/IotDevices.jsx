import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useIotAuth } from '../context/IotAuthContext';
import { getUserDevices } from '../api/devices';
import IotLayout from '../components/IotLayout';

const IotDevices = () => {
  const { iotUser } = useIotAuth();
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDevices = async () => {
      try {
        const response = await getUserDevices(iotUser.id);
        if (response.success) {
          setDevices(response.devices);
        }
      } catch (err) {
        setError('Failed to load devices');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchDevices();
  }, [iotUser.id]);

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
      <h2 className="iot-page-title">
        <i className="bi bi-hdd-stack"></i> My Devices
      </h2>

      {error && <div className="iot-alert iot-alert-error">{error}</div>}

      {devices.length === 0 ? (
        <div className="iot-card">
          <div className="iot-card-body iot-empty-state-large">
            <i className="bi bi-hdd-stack"></i>
            <h3>No Devices Assigned</h3>
            <p>You don't have any devices assigned to your account yet.<br />Please contact your administrator.</p>
          </div>
        </div>
      ) : (
        <div className="iot-device-grid large">
          {devices.map(device => (
            <div key={device.id} className="iot-device-card large">
              <div className="iot-device-icon">
                <i className="bi bi-router"></i>
              </div>
              <div className="iot-device-header">
                <h4>{device.name}</h4>
                <span className={`iot-badge ${device.is_online ? 'online' : 'offline'}`}>
                  {device.is_online ? 'Online' : 'Offline'}
                </span>
              </div>
              <p className="iot-device-serial"><code>{device.serial_number}</code></p>
              {device.description && (
                <p className="iot-device-description">{device.description}</p>
              )}
              {device.device_type && (
                <span className="iot-device-type">{device.device_type}</span>
              )}
              <div className="iot-device-meta">
                <i className="bi bi-clock"></i>
                Last seen: {device.last_seen_at
                  ? new Date(device.last_seen_at).toLocaleString()
                  : 'Never'}
              </div>
              <Link to={`/iot/logs?device_id=${device.id}`} className="iot-btn-primary full">
                <i className="bi bi-journal-text"></i> View Logs
              </Link>
            </div>
          ))}
        </div>
      )}
    </IotLayout>
  );
};

export default IotDevices;
