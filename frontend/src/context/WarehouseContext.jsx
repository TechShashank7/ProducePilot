import React, { createContext, useContext, useState, useEffect } from 'react';
import { fetchApi } from '../services/api';

const WarehouseContext = createContext();

export const useWarehouse = () => {
  const context = useContext(WarehouseContext);
  if (!context) {
    throw new Error('useWarehouse must be used within a WarehouseProvider');
  }
  return context;
};

export const WarehouseProvider = ({ children }) => {
  const [warehouses, setWarehouses] = useState([]);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState(
    localStorage.getItem('selectedWarehouseId') || null
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadWarehouses = async () => {
      try {
        const data = await fetchApi('/warehouses');
        setWarehouses(data);
        
        if (data.length > 0) {
          // If stored ID doesn't exist in fetched data, fallback to first
          const storedExists = data.some(w => w._id === selectedWarehouseId);
          if (!selectedWarehouseId || !storedExists) {
            setSelectedWarehouseId(data[0]._id);
          }
        }
      } catch (error) {
        console.error("Failed to load warehouses", error);
      } finally {
        setLoading(false);
      }
    };

    loadWarehouses();
  }, []);

  useEffect(() => {
    if (selectedWarehouseId) {
      localStorage.setItem('selectedWarehouseId', selectedWarehouseId);
    }
  }, [selectedWarehouseId]);

  return (
    <WarehouseContext.Provider 
      value={{ 
        warehouses, 
        selectedWarehouseId, 
        setSelectedWarehouseId,
        loading 
      }}
    >
      {children}
    </WarehouseContext.Provider>
  );
};
