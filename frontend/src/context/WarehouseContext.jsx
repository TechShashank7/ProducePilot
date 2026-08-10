import React, { createContext, useContext, useState, useEffect } from 'react';
import { fetchApi } from '../services/api';
import { useAuth } from './AuthContext';

const WarehouseContext = createContext();

export const useWarehouse = () => {
  const context = useContext(WarehouseContext);
  if (!context) {
    throw new Error('useWarehouse must be used within a WarehouseProvider');
  }
  return context;
};

export const WarehouseProvider = ({ children }) => {
  const { userRole, assignedWarehouseId } = useAuth();
  
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
          if (userRole === 'worker' && assignedWarehouseId) {
            setSelectedWarehouseId(assignedWarehouseId);
          } else {
            const storedExists = data.some(w => w._id === selectedWarehouseId);
            if (!selectedWarehouseId || !storedExists) {
              setSelectedWarehouseId(data[0]._id);
            }
          }
        }
      } catch (error) {
        console.error("Failed to load warehouses", error);
      } finally {
        setLoading(false);
      }
    };

    loadWarehouses();
  }, [userRole, assignedWarehouseId]);

  useEffect(() => {
    if (userRole === 'worker' && assignedWarehouseId) {
       if (selectedWarehouseId !== assignedWarehouseId) {
          setSelectedWarehouseId(assignedWarehouseId);
       }
    } else if (selectedWarehouseId) {
      localStorage.setItem('selectedWarehouseId', selectedWarehouseId);
    }
  }, [selectedWarehouseId, userRole, assignedWarehouseId]);

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
