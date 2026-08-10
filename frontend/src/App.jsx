import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ErrorBoundary from './components/ui/ErrorBoundary';
import AppLayout from './components/layout/AppLayout';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Agents from './pages/Agents';
import BatchDetail from './pages/BatchDetail';
import MapView from './pages/MapView';
import Login from './pages/Login';
import { WarehouseProvider } from './context/WarehouseContext';
import { ToastProvider } from './components/ui/Toast';

function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
      <WarehouseProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            
            <Route path="/" element={<AppLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="inventory" element={<Inventory />} />
              <Route path="agents" element={<Agents />} />
              <Route path="batches/:id" element={<BatchDetail />} />
              <Route path="map" element={<MapView />} />
            </Route>
          </Routes>
        </Router>
      </WarehouseProvider>
    </ToastProvider>
    </ErrorBoundary>
  );
}

export default App;
