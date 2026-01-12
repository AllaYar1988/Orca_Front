import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useIotAuth } from '../context/IotAuthContext';
import { iotLogin as apiLogin } from '../api/auth';
import { TbNetwork } from 'react-icons/tb';
import { FiUser, FiLock, FiLogIn, FiArrowLeft } from 'react-icons/fi';
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
      {/* Background circuit pattern */}
      <div className="iot-login-circuit"></div>

      {/* Floating particles */}
      <div className="iot-login-particles">
        <span></span><span></span><span></span>
        <span></span><span></span><span></span>
      </div>

      <div className="iot-login-card">
        <div className="iot-login-header">
          <div className="iot-login-icon">
            <TbNetwork />
          </div>
          <h1><span className="text-white">Myco</span><span className="text-green">Grid</span> IoT</h1>
          <p>Secure Portal Access</p>
        </div>

        <div className="iot-login-body">
          {error && (
            <div className="iot-alert iot-alert-error">
              <span>{error}</span>
              <button onClick={() => setError('')}>&times;</button>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="iot-form-group">
              <label htmlFor="username">
                <FiUser /> Username
              </label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                required
                autoFocus
              />
            </div>

            <div className="iot-form-group">
              <label htmlFor="password">
                <FiLock /> Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />
            </div>

            <button type="submit" className="iot-login-btn" disabled={loading}>
              {loading ? (
                <>
                  <span className="iot-spinner-small"></span>
                  Authenticating...
                </>
              ) : (
                <>
                  <FiLogIn />
                  Sign In
                </>
              )}
            </button>
          </form>

          <div className="iot-login-footer">
            <Link to="/">
              <FiArrowLeft /> Back to MycoGrid
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IotLogin;
