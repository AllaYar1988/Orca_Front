import { Navigate } from 'react-router-dom';
import { useIotAuth } from '../context/IotAuthContext';

const IotProtectedRoute = ({ children }) => {
  const { iotUser, iotLoading } = useIotAuth();

  if (iotLoading) {
    return (
      <div className="iot-loading">
        <div className="iot-spinner"></div>
      </div>
    );
  }

  if (!iotUser) {
    return <Navigate to="/iot/login" replace />;
  }

  return children;
};

export default IotProtectedRoute;
