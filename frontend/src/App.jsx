import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ErrorBoundary from './components/ui/ErrorBoundary';
import AppLayout from './components/layout/AppLayout';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Agents from './pages/Agents';
import BatchDetail from './pages/BatchDetail';
import MapView from './pages/MapView';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Landing from './pages/Landing';
import { WarehouseProvider } from './context/WarehouseContext';
import { ToastProvider } from './components/ui/Toast';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <AuthProvider>
          <WarehouseProvider>
            <Router>
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                
                <Route path="/app" element={
                  <ProtectedRoute>
                    <AppLayout />
                  </ProtectedRoute>
                }>
                  <Route index element={<Dashboard />} />
                  <Route path="inventory" element={<Inventory />} />
                  <Route path="agents" element={<Agents />} />
                  <Route path="batches/:id" element={<BatchDetail />} />
                  <Route path="map" element={<MapView />} />
                </Route>
              </Routes>
            </Router>
          </WarehouseProvider>
        </AuthProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}

export default App;
