import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useIotAuth } from '../context/IotAuthContext';
import { usePermissions } from '../hooks/usePermissions';
import { getUserCompanies, getCompanyDevices } from '../api/devices';
import CompanyIcon from './CompanyIcon';
import orcaLogo from '../../assets/orca.png';
import '../styles/iot.css';
import '../styles/sensor-components.css';

const IotLayout = ({ children }) => {
  const { iotUser, iotLogout } = useIotAuth();
  const { roleLabel, isAdmin, isViewer } = usePermissions();
  const [companies, setCompanies] = useState([]);
  const [expandedCompanies, setExpandedCompanies] = useState({});
  const [companyDevices, setCompanyDevices] = useState({});
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Fetch user's companies on mount
  useEffect(() => {
    if (iotUser?.id) {
      fetchCompanies();
    }
  }, [iotUser]);

  const fetchCompanies = async () => {
    try {
      const data = await getUserCompanies();
      if (data.success) {
        setCompanies(data.companies || []);
      }
    } catch (err) {
      console.error('Error fetching companies:', err);
    }
  };

  const toggleCompany = async (companyId) => {
    const isExpanded = expandedCompanies[companyId];

    setExpandedCompanies(prev => ({
      ...prev,
      [companyId]: !isExpanded
    }));

    // Fetch devices if not already loaded
    if (!isExpanded && !companyDevices[companyId]) {
      try {
        const data = await getCompanyDevices(companyId);
        if (data.success) {
          setCompanyDevices(prev => ({
            ...prev,
            [companyId]: data.devices || []
          }));
        }
      } catch (err) {
        console.error('Error fetching devices:', err);
      }
    }
  };

  const handleCompanyClick = (companyId) => {
    navigate(`/iot/company/${companyId}/devices`);
  };

  const handleDeviceClick = (companyId, deviceId) => {
    navigate(`/iot/device/${companyId}/${deviceId}`);
  };

  const isCompanyActive = (companyId) => {
    return location.pathname === `/iot/company/${companyId}/devices`;
  };

  const isDeviceActive = (companyId, deviceId) => {
    return location.pathname === `/iot/device/${companyId}/${deviceId}`;
  };

  return (
    <div className="iot-app">
      <nav className="iot-navbar">
        <div className="iot-navbar-container">
          <div className="iot-navbar-left">
            {/* Mobile hamburger menu - only visible on mobile */}
            <button
              className="iot-mobile-menu-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              <i className={`bi bi-${mobileMenuOpen ? 'x-lg' : 'list'}`}></i>
            </button>
          </div>

          <div className="iot-user-menu">
            <div className="iot-user-info">
              <i className="bi bi-person-circle"></i>
              <span>{iotUser?.name || iotUser?.username}</span>
              <span className={`iot-role-badge ${isAdmin ? 'admin' : isViewer ? 'viewer' : 'user'}`}>
                {roleLabel}
              </span>
            </div>
            <button className="iot-logout-btn" onClick={iotLogout}>
              <i className="bi bi-box-arrow-right"></i>
              <span>Logout</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div
          className="iot-mobile-overlay"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <div className="iot-main-wrapper">
        {/* Sidebar - always visible on desktop, slide-in on mobile */}
        <aside className={`iot-sidebar ${mobileMenuOpen ? 'mobile-open' : ''}`}>
          <div className="iot-sidebar-brand">
            <img src={orcaLogo} alt="Orca" className="iot-sidebar-logo" />
          </div>
          <div
            className="iot-sidebar-header clickable"
            onClick={() => navigate('/iot')}
            style={{ cursor: 'pointer' }}
          >
            <i className="bi bi-building"></i>
            <span>Installations</span>
          </div>

          <div className="iot-sidebar-content">
            {companies.length === 0 ? (
              <div className="iot-sidebar-empty">
                <i className="bi bi-info-circle"></i>
                <span>No companies assigned</span>
              </div>
            ) : (
              <ul className="iot-company-list">
                {companies.map(company => (
                  <li key={company.id} className="iot-company-item">
                    <div className={`iot-company-header ${isCompanyActive(company.id) ? 'active' : ''}`}>
                      <i
                        className={`bi bi-chevron-${expandedCompanies[company.id] ? 'down' : 'right'} iot-company-toggle`}
                        onClick={(e) => { e.stopPropagation(); toggleCompany(company.id); }}
                      ></i>
                      <div className="iot-company-link" onClick={() => handleCompanyClick(company.id)}>
                        <CompanyIcon type={company.type} size="sm" />
                        <span>{company.name}</span>
                      </div>
                      <small className="iot-company-code">{company.code}</small>
                    </div>

                    {expandedCompanies[company.id] && (
                      <ul className="iot-device-list">
                        {!companyDevices[company.id] ? (
                          <li className="iot-device-loading">
                            <i className="bi bi-arrow-repeat spinning"></i>
                            Loading...
                          </li>
                        ) : companyDevices[company.id].length === 0 ? (
                          <li className="iot-device-empty">No devices</li>
                        ) : (
                          companyDevices[company.id].map(device => (
                            <li
                              key={device.id}
                              className={`iot-device-item ${isDeviceActive(company.id, device.id) ? 'active' : ''}`}
                              onClick={() => handleDeviceClick(company.id, device.id)}
                            >
                              <i className={`bi bi-${device.is_online ? 'circle-fill text-success' : 'circle text-muted'}`}></i>
                              <span>{device.name}</span>
                            </li>
                          ))
                        )}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            )}

            {/* Navigation */}
            <div className="iot-sidebar-section">
              <div className="iot-sidebar-section-header">
                <span>Navigation</span>
              </div>
              <ul className="iot-sidebar-menu">
                <li className="iot-sidebar-menu-item" onClick={() => navigate('/iot/settings')}>
                  <i className="bi bi-gear"></i>
                  <span>Settings</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Logout at bottom */}
          <div className="iot-sidebar-footer">
            <button className="iot-sidebar-logout" onClick={iotLogout}>
              <i className="bi bi-box-arrow-left"></i>
              <span>Logout</span>
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <div className="iot-content with-sidebar">
          {children}
        </div>
      </div>

      <footer className="iot-footer">
        <p>&copy; {new Date().getFullYear()} Orca IoT Platform</p>
        <Link to="/">Back to MycoGrid</Link>
      </footer>
    </div>
  );
};

export default IotLayout;
