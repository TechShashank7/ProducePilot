import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GoogleMap, useJsApiLoader, Marker, Polyline, DirectionsRenderer } from '@react-google-maps/api';
import { fetchApi } from '../services/api';
import { Package, AlertTriangle, Truck, MapPin } from 'lucide-react';
import { useToast } from '../components/ui/Toast';

const mapContainerStyle = {
  width: '100%',
  height: '100%'
};

// Custom dark mode JSON style for Google Maps to match our design system
const darkMapStyle = [
  { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
  {
    featureType: "administrative.locality",
    elementType: "labels.text.fill",
    stylers: [{ color: "#d59563" }]
  },
  {
    featureType: "poi",
    elementType: "labels.text.fill",
    stylers: [{ color: "#d59563" }]
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#263c3f" }]
  },
  {
    featureType: "poi.park",
    elementType: "labels.text.fill",
    stylers: [{ color: "#6b9a76" }]
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#38414e" }]
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#212a37" }]
  },
  {
    featureType: "road",
    elementType: "labels.text.fill",
    stylers: [{ color: "#9ca5b3" }]
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#746855" }]
  },
  {
    featureType: "road.highway",
    elementType: "geometry.stroke",
    stylers: [{ color: "#1f2835" }]
  },
  {
    featureType: "road.highway",
    elementType: "labels.text.fill",
    stylers: [{ color: "#f3d19c" }]
  },
  {
    featureType: "transit",
    elementType: "geometry",
    stylers: [{ color: "#2f3948" }]
  },
  {
    featureType: "transit.station",
    elementType: "labels.text.fill",
    stylers: [{ color: "#d59563" }]
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#17263c" }]
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: "#515c6d" }]
  },
  {
    featureType: "water",
    elementType: "labels.text.stroke",
    stylers: [{ color: "#17263c" }]
  }
];

const riskColors = {
  low: '#10b981', // text-risk-low
  medium: '#f59e0b', // text-risk-medium
  high: '#ef4444', // text-risk-high
  critical: '#b91c1c' // text-risk-critical
};

const mapOptions = {
  styles: darkMapStyle,
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
  
  const [selectedRouteDest, setSelectedRouteDest] = useState(null);
  const [fullRoutePath, setFullRoutePath] = useState([]);
  const [animatedPath, setAnimatedPath] = useState([]);
  
  const toast = useToast();
  
  const mapRef = useRef(null);

  const fetchMapOverview = async () => {
    try {
      setLoading(true);
      const data = await fetchApi('/map/overview');
      setWarehouses(data);
      
      // Auto-fit bounds if we have warehouses and map is ready
      if (data.length > 0 && mapRef.current) {
        fitBoundsToWarehouses(data, mapRef.current);
      }
    } catch (err) {
      console.error(err);
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
    // Calculate speed based on route length to ensure it takes roughly 1-1.5 seconds total
    const intervalMs = Math.max(8, Math.floor(1500 / fullRoutePath.length));
    
    setAnimatedPath([fullRoutePath[0]]);
    
    const interval = setInterval(() => {
      // Dynamically skip points if the route is extremely dense to keep animation speed consistent
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
          // Extract a highly detailed path from the individual steps rather than the coarse overview_path
          // This ensures short routes (<1km) still have enough points to draw and animate properly
          const path = [];
          result.routes[0].legs[0].steps.forEach(step => {
            step.path.forEach(p => path.push({ lat: p.lat(), lng: p.lng() }));
          });
          
          setFullRoutePath(path);
          setAnimatedPath([]);
          
          // Auto-zoom to perfectly frame the route
          if (mapRef.current) {
            mapRef.current.fitBounds(result.routes[0].bounds, 60); // 60px padding
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
      
      // Fit bounds to include warehouse and destinations
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
    // Base size 30, max size 50 based on atRiskKg (cap at 10000kg for scaling)
    const size = 30 + Math.min(20, (warehouse.atRiskKg / 10000) * 20);
    return {
      path: window.google.maps.SymbolPath.CIRCLE,
      fillColor: riskColors[warehouse.riskLevel] || riskColors.low,
      fillOpacity: 1,
      strokeColor: '#1e293b', // bg-bg-elevated
      strokeWeight: 2,
      scale: size / 4, // scale is radius
    };
  };

  const getDestinationIcon = (type) => {
    let color = '#3b82f6'; // default blue
    if (type === 'ngo') color = '#a855f7'; // purple
    if (type === 'wholesale_market') color = '#f97316'; // orange

    return {
      path: window.google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
      fillColor: color,
      fillOpacity: 1,
      strokeColor: '#1e293b',
      strokeWeight: 1,
      scale: 4,
    };
  };

  if (!isLoaded || loading) {
    return <div className="p-8 text-center text-text-muted">Loading map...</div>;
  }

  return (
    <div className="relative w-full h-[calc(100vh-6rem)] rounded-xl overflow-hidden border border-border">
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        zoom={5}
        center={defaultCenter}
        onLoad={onLoad}
        onUnmount={onUnmount}
        options={mapOptions}
      >
        {/* Render Warehouses */}
        {warehouses.map(warehouse => (
          <Marker
            key={warehouse._id}
            position={{ lat: warehouse.latitude, lng: warehouse.longitude }}
            icon={getMarkerIcon(warehouse)}
            onClick={() => handleWarehouseClick(warehouse)}
            label={{
              text: warehouse.totalInventoryKg > 0 ? (warehouse.totalInventoryKg / 1000).toFixed(1) + 't' : '',
              color: '#ffffff',
              fontSize: '10px',
              fontWeight: 'bold'
            }}
          />
        ))}

        {/* Render Destinations & Lines */}
        {showDestinations && selectedWarehouse && destinations.map(dest => (
          <React.Fragment key={dest._id}>
            <Marker
              position={{ lat: dest.latitude, lng: dest.longitude }}
              icon={getDestinationIcon(dest.type)}
              title={dest.name}
              onClick={() => handleDestinationClick(dest)}
            />
            {/* Draw faint straight lines to all other non-selected destinations */}
            {(!selectedRouteDest || selectedRouteDest._id !== dest._id) && (
              <Polyline
                path={[
                  { lat: selectedWarehouse.latitude, lng: selectedWarehouse.longitude },
                  { lat: dest.latitude, lng: dest.longitude }
                ]}
                options={{
                  strokeColor: '#64748b',
                  strokeOpacity: 0.3,
                  strokeWeight: 1,
                  geodesic: true
                }}
              />
            )}
          </React.Fragment>
        ))}

        {/* Animated Real Route */}
        {animatedPath.length > 0 && (
          <Polyline
            path={animatedPath}
            options={{
              strokeColor: '#3b82f6',
              strokeOpacity: 0.9,
              strokeWeight: 4,
              geodesic: true
            }}
          />
        )}
      </GoogleMap>

      {/* Side Panel Overlay */}
      {selectedWarehouse && (
        <div className="absolute top-4 left-4 w-80 bg-bg-elevated border border-border rounded-lg shadow-2xl overflow-hidden flex flex-col max-h-[calc(100%-2rem)]">
          
          <div className="p-4 border-b border-border">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold text-text-primary mb-1">{selectedWarehouse.name}</h2>
                <div className="flex items-center text-text-muted text-sm gap-1">
                  <MapPin size={14} />
                  <span>{selectedWarehouse.city}, {selectedWarehouse.state}</span>
                </div>
              </div>
              <button 
                onClick={() => setSelectedWarehouse(null)}
                className="text-text-muted hover:text-text-primary p-1"
              >
                ✕
              </button>
            </div>
          </div>

          <div className="p-4 flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-bg-default p-3 rounded border border-border">
                <div className="flex items-center gap-2 text-text-muted text-xs mb-1">
                  <Package size={14} />
                  <span>Total Inventory</span>
                </div>
                <div className="text-lg font-semibold text-text-primary">
                  {(selectedWarehouse.totalInventoryKg / 1000).toFixed(1)}t
                </div>
                <div className="text-xs text-text-muted">{selectedWarehouse.totalBatches} batches</div>
              </div>
              
              <div className={`p-3 rounded border ${selectedWarehouse.atRiskKg > 0 ? 'bg-risk-highBg border-risk-high/30' : 'bg-bg-default border-border'}`}>
                <div className={`flex items-center gap-2 text-xs mb-1 ${selectedWarehouse.atRiskKg > 0 ? 'text-risk-high' : 'text-text-muted'}`}>
                  <AlertTriangle size={14} />
                  <span>At-Risk</span>
                </div>
                <div className={`text-lg font-semibold ${selectedWarehouse.atRiskKg > 0 ? 'text-risk-high' : 'text-text-primary'}`}>
                  {(selectedWarehouse.atRiskKg / 1000).toFixed(1)}t
                </div>
                <div className={`text-xs ${selectedWarehouse.atRiskKg > 0 ? 'text-risk-high/80' : 'text-text-muted'}`}>
                  {selectedWarehouse.totalInventoryKg > 0 
                    ? Math.round((selectedWarehouse.atRiskKg / selectedWarehouse.totalInventoryKg) * 100)
                    : 0}% of capacity
                </div>
              </div>
            </div>

            <button 
              onClick={toggleDestinations}
              className={`w-full py-2 px-4 rounded font-medium transition-colors border ${
                showDestinations 
                  ? 'bg-bg-default text-text-primary border-border hover:bg-bg-hover' 
                  : 'bg-accent/10 text-accent border-accent/20 hover:bg-accent/20'
              }`}
            >
              {showDestinations ? 'Hide Destinations' : 'Show Delivery Routes'}
            </button>
          </div>

          {showDestinations && (
            <div className="overflow-y-auto p-4 pt-0 flex flex-col gap-3">
              <h3 className="text-sm font-medium text-text-primary mb-1">Nearby Destinations</h3>
              {destinations.map(dest => (
                <div 
                  key={dest._id} 
                  onClick={() => handleDestinationClick(dest)}
                  className={`flex flex-col p-3 rounded border cursor-pointer transition-colors ${
                    selectedRouteDest?._id === dest._id 
                      ? 'bg-accent/10 border-accent/50 ring-1 ring-accent/50' 
                      : 'bg-bg-default border-border hover:bg-bg-hover'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-text-primary text-sm truncate pr-2" title={dest.name}>{dest.name}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-bg-elevated border border-border text-text-muted capitalize whitespace-nowrap">
                      {dest.type.replace('_', ' ')}
                    </span>
                  </div>
                  {dest.address && (
                    <div className="text-[10px] text-text-muted mb-2 truncate" title={dest.address}>
                      <MapPin size={10} className="inline mr-1" />
                      {dest.address}
                    </div>
                  )}
                  <div className="flex items-center justify-between text-xs text-text-muted">
                    <div className="flex items-center gap-1">
                      <Truck size={12} />
                      <span>{dest.distanceFromWarehouseKm.toFixed(1)} km</span>
                    </div>
                    <span>~{dest.durationFromWarehouseMinutes} mins</span>
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
