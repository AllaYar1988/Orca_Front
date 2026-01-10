import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useIotAuth } from '../context/IotAuthContext';
import { iotLogin as apiLogin } from '../api/auth';
import orcaLogo from '../../assets/orca.png';
import '../styles/iot.css';

const IotLogin = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { iotLogin, iotUser } = useIotAuth();
  const navigate = useNavigate();

  // Redirect if already logged in
  if (iotUser) {
    navigate('/iot');
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await apiLogin(username, password);

      if (response.success) {
        iotLogin(response.user, response.token, response.expires_at);
        navigate('/iot');
      } else {
        setError(response.error || 'Login failed');
      }
    } catch (err) {
      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError('Failed to connect to server');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="iot-login-page">
      <div className="iot-login-card">
        <div className="iot-login-header">
          <img src={orcaLogo} alt="Orca" className="iot-login-logo" />
          <h1>Orca IoT</h1>
          <p>User Portal</p>
        </div>

        <div className="iot-login-body">
          {error && (
            <div className="iot-alert iot-alert-error">
              <i className="bi bi-exclamation-circle"></i>
              <span>{error}</span>
              <button onClick={() => setError('')}>&times;</button>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="iot-form-group">
              <label htmlFor="username">
                <i className="bi bi-person"></i> Username
              </label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="iot-form-group">
              <label htmlFor="password">
                <i className="bi bi-lock"></i> Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="iot-btn-primary" disabled={loading}>
              {loading ? (
                <>
                  <span className="iot-spinner-small"></span>
                  Logging in...
                </>
              ) : (
                <>
                  <i className="bi bi-box-arrow-in-right"></i>
                  Login
                </>
              )}
            </button>
          </form>

          <div className="iot-login-footer">
            <Link to="/">Back to MycoGrid</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IotLogin;
