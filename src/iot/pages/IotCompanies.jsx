import { useState, useEffect } from 'react';
import { useIotAuth } from '../context/IotAuthContext';
import { getUserCompanies, getCompanyDevices, getDevicesStatus } from '../api/devices';
import IotLayout from '../components/IotLayout';
import CompanyDataCard from '../components/CompanyDataCard';
import '../styles/sensor-components.css';

const IotCompanies = () => {
  const { iotUser } = useIotAuth();
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCompaniesWithDevices = async () => {
      try {
        const response = await getUserCompanies();
        if (response.success) {
          // Fetch devices for each company
          const companiesWithDevices = await Promise.all(
            response.companies.map(async (company) => {
              try {
                const devicesRes = await getCompanyDevices(company.id);
                const devices = devicesRes.success ? devicesRes.devices || [] : [];

                // Fetch real-time status for devices
                if (devices.length > 0) {
                  try {
                    const statusRes = await getDevicesStatus({ company_id: company.id });
                    if (statusRes.success) {
                      // Update device is_online from status API
                      const statusMap = {};
                      statusRes.devices.forEach(d => {
                        statusMap[d.id] = d.is_online;
                      });
                      devices.forEach(device => {
                        if (statusMap[device.id] !== undefined) {
                          device.is_online = statusMap[device.id];
                        }
                      });
                    }
                  } catch {
                    // Status fetch failed, keep original values
                  }
                }

                return {
                  ...company,
                  devices
                };
              } catch {
                return { ...company, devices: [] };
              }
            })
          );
          setCompanies(companiesWithDevices);
        }
      } catch (err) {
        setError('Failed to load companies');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchCompaniesWithDevices();
  }, [iotUser]);

  // Calculate overall stats
  const stats = {
    totalCompanies: companies.length,
    totalDevices: companies.reduce((sum, c) => sum + (c.devices?.length || 0), 0),
    onlineDevices: companies.reduce((sum, c) => sum + (c.devices?.filter(d => d.is_online).length || 0), 0),
    offlineDevices: companies.reduce((sum, c) => sum + (c.devices?.filter(d => !d.is_online).length || 0), 0),
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
      <h2 className="iot-page-title">
        <i className="bi bi-building"></i> Installations
      </h2>

      {error && <div className="iot-alert iot-alert-error">{error}</div>}

      {/* Stats Overview */}
      {companies.length > 0 && (
        <div className="iot-stats-grid">
          <div className="iot-stat-card" style={{ '--stat-color': '#3b82f6', '--stat-color-dark': '#1d4ed8' }}>
            <div className="iot-stat-icon blue">
              <i className="bi bi-building"></i>
            </div>
            <div className="iot-stat-info">
              <div className="iot-stat-value">{stats.totalCompanies}</div>
              <div className="iot-stat-label">Companies</div>
            </div>
          </div>

          <div className="iot-stat-card" style={{ '--stat-color': '#8b5cf6', '--stat-color-dark': '#7c3aed' }}>
            <div className="iot-stat-icon purple">
              <i className="bi bi-cpu"></i>
            </div>
            <div className="iot-stat-info">
              <div className="iot-stat-value">{stats.totalDevices}</div>
              <div className="iot-stat-label">Total Devices</div>
            </div>
          </div>

          <div className="iot-stat-card" style={{ '--stat-color': '#10b981', '--stat-color-dark': '#059669' }}>
            <div className="iot-stat-icon green">
              <i className="bi bi-check-circle-fill"></i>
            </div>
            <div className="iot-stat-info">
              <div className="iot-stat-value">{stats.onlineDevices}</div>
              <div className="iot-stat-label">Online</div>
            </div>
          </div>

          <div className="iot-stat-card" style={{ '--stat-color': '#64748b', '--stat-color-dark': '#475569' }}>
            <div className="iot-stat-icon gray">
              <i className="bi bi-x-circle-fill"></i>
            </div>
            <div className="iot-stat-info">
              <div className="iot-stat-value">{stats.offlineDevices}</div>
              <div className="iot-stat-label">Offline</div>
            </div>
          </div>
        </div>
      )}

      {companies.length === 0 ? (
        <div className="iot-card">
          <div className="iot-card-body iot-empty-state-large">
            <i className="bi bi-building"></i>
            <h3>No Companies Assigned</h3>
            <p>You don't have access to any companies yet.<br />Please contact your administrator.</p>
          </div>
        </div>
      ) : (
        <div className="company-data-grid">
          {companies.map(company => (
            <CompanyDataCard
              key={company.id}
              company={company}
            />
          ))}
        </div>
      )}
    </IotLayout>
  );
};

export default IotCompanies;
