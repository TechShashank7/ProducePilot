import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchApi } from '../services/api';
import { useToast } from '../components/ui/Toast';

const Signup = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [warehouseId, setWarehouseId] = useState('');
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingWarehouses, setFetchingWarehouses] = useState(true);
  
  const { signup } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    const loadWarehouses = async () => {
      try {
        const data = await fetchApi('/warehouses');
        setWarehouses(data);
        if (data.length > 0) {
          setWarehouseId(data[0]._id);
        }
      } catch (error) {
        console.error("Failed to load warehouses", error);
        toast.error("Failed to load warehouses.");
      } finally {
        setFetchingWarehouses(false);
      }
    };
    loadWarehouses();
  }, [toast]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await signup(email, password, 'worker', warehouseId);
      toast.success("Successfully registered as a worker!");
      navigate('/app');
    } catch (error) {
      console.error(error);
      toast.error("Failed to sign up: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-text-primary px-4">
      <div className="p-8 border border-border-light bg-surface rounded-2xl shadow-lg w-full max-w-md">
        <h1 className="text-3xl font-bold mb-2 text-center text-primary">Worker Sign Up</h1>
        <p className="text-center text-text-secondary mb-8">Join ProducePilot</p>
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-text-secondary">Email</label>
            <input 
              type="email" 
              required 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-surface-container-low border border-border-light rounded-xl px-4 py-2 focus:outline-none focus:border-primary transition-colors"
              placeholder="Enter your email"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-text-secondary">Password</label>
            <input 
              type="password" 
              required 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-surface-container-low border border-border-light rounded-xl px-4 py-2 focus:outline-none focus:border-primary transition-colors"
              placeholder="Create a password"
              minLength="6"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-text-secondary">Assigned Warehouse</label>
            <select
              value={warehouseId}
              onChange={(e) => setWarehouseId(e.target.value)}
              disabled={fetchingWarehouses}
              className="w-full bg-surface-container-low border border-border-light rounded-xl px-4 py-2 focus:outline-none focus:border-primary transition-colors"
              required
            >
              {fetchingWarehouses ? (
                <option>Loading warehouses...</option>
              ) : (
                warehouses.map(w => (
                  <option key={w._id} value={w._id}>{w.name}</option>
                ))
              )}
            </select>
          </div>
          
          <button 
            type="submit" 
            disabled={loading || fetchingWarehouses}
            className="w-full bg-primary hover:bg-primary-container text-white font-bold py-2.5 rounded-xl transition-colors mt-4 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing up...' : 'Sign Up'}
          </button>
        </form>
        
        <div className="mt-6 text-center text-sm text-text-secondary">
          Already have an account? <Link to="/login" className="text-primary hover:underline">Log in</Link>
        </div>
      </div>
    </div>
  );
};

export default Signup;
