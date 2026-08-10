import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GoogleMap, useJsApiLoader, Marker, Polyline } from '@react-google-maps/api';
import { fetchApi } from '../services/api';
import { Package, AlertTriangle, Truck, MapPin } from 'lucide-react';
import { useToast } from '../components/ui/Toast';

const mapContainerStyle = {
  width: '100%',
  height: '100%'
};

// Default Google Maps style (light) - no custom styles needed for light theme
const lightMapStyle = [];

const riskColors = {
  low: '#10b981', // text-success-green
  medium: '#f59e0b', // text-warning-orange
  high: '#ef4444', // text-error-red
  critical: '#b91c1c' 
};

const mapOptions = {
  styles: lightMapStyle,
  disableDefaultUI: true,
  zoomControl: true,
};

const defaultCenter = { lat: 20.5937, lng: 78.9629 };

const MapView = () => {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY
  });

  const [warehouses, setWarehouses] = useState([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState(null);
  const [destinations, setDestinations] = useState([]);
  const [showDestinations, setShowDestinations] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [selectedRouteDest, setSelectedRouteDest] = useState(null);
  const [fullRoutePath, setFullRoutePath] = useState([]);
  const [animatedPath, setAnimatedPath] = useState([]);
  
  const toast = useToast();
  
  const mapRef = useRef(null);

  const fetchMapOverview = async () => {
    try {
      setLoading(warehouses.length === 0);
      const data = await fetchApi('/map/overview');
      setWarehouses(data);
      
      if (data.length > 0 && mapRef.current) {
        fitBoundsToWarehouses(data, mapRef.current);
      }
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Failed to load map data. Please try again.");
      toast.error("Failed to load map data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMapOverview();
  }, []);

  const onLoad = useCallback((map) => {
    mapRef.current = map;
    if (warehouses.length > 0) {
      fitBoundsToWarehouses(warehouses, map);
    }
  }, [warehouses]);

  const onUnmount = useCallback(() => {
    mapRef.current = null;
  }, []);

  const fitBoundsToWarehouses = (warehouseList, map) => {
    const bounds = new window.google.maps.LatLngBounds();
    warehouseList.forEach(w => {
      bounds.extend(new window.google.maps.LatLng(w.latitude, w.longitude));
    });
    map.fitBounds(bounds);
  };

  useEffect(() => {
    if (fullRoutePath.length === 0) return;
    
    let i = 0;
    const intervalMs = Math.max(8, Math.floor(1500 / fullRoutePath.length));
    
    setAnimatedPath([fullRoutePath[0]]);
    
    const interval = setInterval(() => {
      const step = Math.max(1, Math.floor(fullRoutePath.length / 60));
      i += step;
      if (i >= fullRoutePath.length) i = fullRoutePath.length - 1;
      
      setAnimatedPath(fullRoutePath.slice(0, i + 1));
      
      if (i === fullRoutePath.length - 1) {
        clearInterval(interval);
      }
    }, intervalMs);
    
    return () => clearInterval(interval);
  }, [fullRoutePath]);

  const handleWarehouseClick = (warehouse) => {
    setSelectedWarehouse(warehouse);
    setShowDestinations(false);
    setDestinations([]);
    setSelectedRouteDest(null);
    setFullRoutePath([]);
    setAnimatedPath([]);
    
    if (mapRef.current) {
      mapRef.current.panTo({ lat: warehouse.latitude, lng: warehouse.longitude });
      mapRef.current.setZoom(10);
    }
  };

  const handleDestinationClick = (dest) => {
    if (!selectedWarehouse) return;
    
    setSelectedRouteDest(dest);
    
    const directionsService = new window.google.maps.DirectionsService();
    
    directionsService.route(
      {
        origin: { lat: selectedWarehouse.latitude, lng: selectedWarehouse.longitude },
        destination: { lat: dest.latitude, lng: dest.longitude },
        travelMode: window.google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === window.google.maps.DirectionsStatus.OK) {
          const path = [];
          result.routes[0].legs[0].steps.forEach(step => {
            step.path.forEach(p => path.push({ lat: p.lat(), lng: p.lng() }));
          });
          
          setFullRoutePath(path);
          setAnimatedPath([]);
          
          if (mapRef.current) {
            mapRef.current.fitBounds(result.routes[0].bounds, 60); 
          }
        } else {
          toast.error("Could not fetch route. Ensure Directions API is enabled.");
          console.error(`Directions request failed due to ${status}`);
        }
      }
    );
  };

  const toggleDestinations = async () => {
    if (!selectedWarehouse) return;
    
    if (showDestinations) {
      setShowDestinations(false);
      setDestinations([]);
      setSelectedRouteDest(null);
      setFullRoutePath([]);
      setAnimatedPath([]);
      return;
    }

    try {
      const data = await fetchApi(`/warehouses/${selectedWarehouse._id}/destinations`);
      setDestinations(data);
      setShowDestinations(true);
      
      if (mapRef.current && data.length > 0) {
        const bounds = new window.google.maps.LatLngBounds();
        bounds.extend(new window.google.maps.LatLng(selectedWarehouse.latitude, selectedWarehouse.longitude));
        data.forEach(d => {
          bounds.extend(new window.google.maps.LatLng(d.latitude, d.longitude));
        });
        mapRef.current.fitBounds(bounds);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load destinations");
    }
  };

  const getMarkerIcon = (warehouse) => {
    const size = 30 + Math.min(20, (warehouse.atRiskKg / 10000) * 20);
    return {
      path: window.google.maps.SymbolPath.CIRCLE,
      fillColor: riskColors[warehouse.riskLevel] || riskColors.low,
      fillOpacity: 1,
      strokeColor: '#ffffff', // white outline for better visibility on light map
      strokeWeight: 3,
      scale: size / 4, 
    };
  };

  const getDestinationIcon = (type) => {
    let color = '#3b82f6'; 
    if (type === 'ngo') color = '#a855f7'; 
    if (type === 'wholesale_market') color = '#f97316'; 

    return {
      path: window.google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
      fillColor: color,
      fillOpacity: 1,
      strokeColor: '#ffffff',
      strokeWeight: 2,
      scale: 4,
    };
  };

  if (!isLoaded || loading) {
    return <div className="p-8 text-center text-text-muted">Loading map...</div>;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-6rem)] border border-border-light rounded-[24px] bg-surface shadow-sm">
        <AlertTriangle size={48} className="text-error-red mb-4" />
        <h2 className="text-lg font-bold text-text-primary mb-2">Error Loading Map Data</h2>
        <p className="text-text-secondary mb-4">{error}</p>
        <button onClick={fetchMapOverview} className="px-6 py-2.5 bg-primary hover:bg-primary-container text-white font-bold rounded-full transition-colors">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[calc(100vh-2rem)] rounded-[24px] overflow-hidden shadow-sm">
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        zoom={5}
        center={defaultCenter}
        onLoad={onLoad}
        onUnmount={onUnmount}
        options={mapOptions}
      >
        {warehouses.map(warehouse => (
          <Marker
            key={warehouse._id}
            position={{ lat: warehouse.latitude, lng: warehouse.longitude }}
            icon={getMarkerIcon(warehouse)}
            onClick={() => handleWarehouseClick(warehouse)}
            label={{
              text: warehouse.totalInventoryKg > 0 ? (warehouse.totalInventoryKg / 1000).toFixed(1) + 't' : '',
              color: '#000000',
              fontSize: '10px',
              fontWeight: 'bold'
            }}
          />
        ))}

        {showDestinations && selectedWarehouse && destinations.map(dest => (
          <React.Fragment key={dest._id}>
            <Marker
              position={{ lat: dest.latitude, lng: dest.longitude }}
              icon={getDestinationIcon(dest.type)}
              title={dest.name}
              onClick={() => handleDestinationClick(dest)}
            />
            {(!selectedRouteDest || selectedRouteDest._id !== dest._id) && (
              <Polyline
                path={[
                  { lat: selectedWarehouse.latitude, lng: selectedWarehouse.longitude },
                  { lat: dest.latitude, lng: dest.longitude }
                ]}
                options={{
                  strokeColor: '#94a3b8',
                  strokeOpacity: 0.5,
                  strokeWeight: 2,
                  geodesic: true
                }}
              />
            )}
          </React.Fragment>
        ))}

        {animatedPath.length > 0 && (
          <Polyline
            path={animatedPath}
            options={{
              strokeColor: '#3b82f6',
              strokeOpacity: 0.9,
              strokeWeight: 5,
              geodesic: true
            }}
          />
        )}
      </GoogleMap>

      {/* Side Panel Overlay */}
      {selectedWarehouse && (
        <div className="absolute top-4 left-4 w-80 bg-surface border border-border-light rounded-[24px] shadow-lg overflow-hidden flex flex-col max-h-[calc(100%-2rem)]">
          
          <div className="p-6 border-b border-border-light bg-surface">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold text-text-primary mb-1">{selectedWarehouse.name}</h2>
                <div className="flex items-center text-text-secondary text-sm gap-1 font-medium tracking-wide">
                  <MapPin size={14} />
                  <span>{selectedWarehouse.city}, {selectedWarehouse.state}</span>
                </div>
              </div>
              <button 
                onClick={() => setSelectedWarehouse(null)}
                className="text-text-muted hover:text-text-primary bg-surface-container-low rounded-full w-8 h-8 flex items-center justify-center transition-colors"
              >
                ✕
              </button>
            </div>
          </div>

          <div className="p-6 flex flex-col gap-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-surface-container-low p-4 rounded-xl border border-border-light">
                <div className="flex items-center gap-2 text-text-secondary font-bold text-[11px] uppercase tracking-widest mb-1">
                  <Package size={14} />
                  <span>Inventory</span>
                </div>
                <div className="text-2xl font-bold text-text-primary">
                  {(selectedWarehouse.totalInventoryKg / 1000).toFixed(1)}t
                </div>
                <div className="text-xs text-text-muted font-medium mt-1">{selectedWarehouse.totalBatches} batches</div>
              </div>
              
              <div className={`p-4 rounded-xl border ${selectedWarehouse.atRiskKg > 0 ? 'bg-error-container border-error-red/20' : 'bg-surface-container-low border-border-light'}`}>
                <div className={`flex items-center gap-2 font-bold text-[11px] uppercase tracking-widest mb-1 ${selectedWarehouse.atRiskKg > 0 ? 'text-error-red' : 'text-text-secondary'}`}>
                  <AlertTriangle size={14} />
                  <span>At-Risk</span>
                </div>
                <div className={`text-2xl font-bold ${selectedWarehouse.atRiskKg > 0 ? 'text-error-red' : 'text-text-primary'}`}>
                  {(selectedWarehouse.atRiskKg / 1000).toFixed(1)}t
                </div>
                <div className={`text-xs font-medium mt-1 ${selectedWarehouse.atRiskKg > 0 ? 'text-error-red/80' : 'text-text-muted'}`}>
                  {selectedWarehouse.totalInventoryKg > 0 
                    ? Math.round((selectedWarehouse.atRiskKg / selectedWarehouse.totalInventoryKg) * 100)
                    : 0}% capacity
                </div>
              </div>
            </div>

            <button 
              onClick={toggleDestinations}
              className={`w-full py-3 px-4 rounded-full font-bold transition-colors border shadow-sm ${
                showDestinations 
                  ? 'bg-surface text-text-primary border-border-light hover:bg-surface-dim' 
                  : 'bg-primary text-white border-primary hover:bg-primary-container'
              }`}
            >
              {showDestinations ? 'Hide Destinations' : 'Show Delivery Routes'}
            </button>
          </div>

          {showDestinations && (
            <div className="overflow-y-auto p-6 pt-0 flex flex-col gap-3">
              <h3 className="text-[11px] font-bold tracking-widest text-text-secondary uppercase mb-2">Nearby Destinations</h3>
              {destinations.map(dest => (
                <div 
                  key={dest._id} 
                  onClick={() => handleDestinationClick(dest)}
                  className={`flex flex-col p-4 rounded-xl border cursor-pointer transition-colors ${
                    selectedRouteDest?._id === dest._id 
                      ? 'bg-info-blue/10 border-info-blue/30 ring-1 ring-info-blue/30' 
                      : 'bg-surface border-border-light hover:bg-surface-dim shadow-sm'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-text-primary text-sm truncate pr-2" title={dest.name}>{dest.name}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface-container-low border border-border-light text-text-secondary font-bold uppercase tracking-wider whitespace-nowrap">
                      {dest.type.replace('_', ' ')}
                    </span>
                  </div>
                  {dest.address && (
                    <div className="text-[11px] font-medium text-text-secondary mb-3 truncate" title={dest.address}>
                      <MapPin size={10} className="inline mr-1" />
                      {dest.address}
                    </div>
                  )}
                  <div className="flex items-center justify-between text-xs font-bold text-text-secondary border-t border-border-light pt-2">
                    <div className="flex items-center gap-1">
                      <Truck size={12} />
                      <span>{dest.distanceFromWarehouseKm.toFixed(1)} km</span>
                    </div>
                    <span className="text-text-muted">~{dest.durationFromWarehouseMinutes} mins</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MapView;
