import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Courses from './pages/Courses';
import BlogPost from './pages/BlogPost';
import About from './pages/About';
import Category from './pages/Category';
import BareMetal from './pages/posts/BareMetal';
import MQTT from './pages/posts/MQTT';
import NILM from './pages/posts/NILM';
import './styles/global.css';

// IoT Portal imports
import { IotAuthProvider } from './iot/context/IotAuthContext';
import IotProtectedRoute from './iot/components/IotProtectedRoute';
import IotLogin from './iot/pages/IotLogin';
import IotCompanies from './iot/pages/IotCompanies';
import IotCompanyDevices from './iot/pages/IotCompanyDevices';
import IotDeviceView from './iot/pages/IotDeviceView';
import IotDataDashboard from './iot/pages/IotDataDashboard';

function App() {
  return (
    <IotAuthProvider>
      <Router>
        <Routes>
          {/* IoT Portal Routes - No main site navbar/footer */}
          <Route path="/iot/login" element={<IotLogin />} />
          <Route
            path="/iot"
            element={
              <IotProtectedRoute>
                <IotCompanies />
              </IotProtectedRoute>
            }
          />
          <Route
            path="/iot/dashboard"
            element={
              <IotProtectedRoute>
                <IotDataDashboard />
              </IotProtectedRoute>
            }
          />
          <Route
            path="/iot/company/:companyId/devices"
            element={
              <IotProtectedRoute>
                <IotCompanyDevices />
              </IotProtectedRoute>
            }
          />
          <Route
            path="/iot/device/:companyId/:deviceId"
            element={
              <IotProtectedRoute>
                <IotDeviceView />
              </IotProtectedRoute>
            }
          />

          {/* Main Site Routes */}
          <Route
            path="/*"
            element={
              <div className="app">
                <Navbar />
                <main className="main-content">
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/courses" element={<Courses />} />
                    <Route path="/blog" element={<Navigate to="/courses" replace />} />
                    <Route path="/blog/:slug" element={<BlogPost />} />
                    <Route path="/about" element={<About />} />
                    <Route path="/contact" element={<About />} />
                    {/* Category Pages */}
                    <Route path="/category/:slug" element={<Category />} />
                    {/* Static Posts (fallback) */}
                    <Route path="/posts/bare-metal" element={<BareMetal />} />
                    <Route path="/posts/mqtt" element={<MQTT />} />
                    <Route path="/posts/nilm" element={<NILM />} />
                  </Routes>
                </main>
                <Footer />
              </div>
            }
          />
        </Routes>
      </Router>
    </IotAuthProvider>
  );
}

export default App;
