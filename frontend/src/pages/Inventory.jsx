import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Filter, ArrowUpDown, AlertCircle } from 'lucide-react';
import { fetchApi } from '../services/api';
import { useWarehouse } from '../context/WarehouseContext';

const Inventory = () => {
  const navigate = useNavigate();
  const { selectedWarehouseId } = useWarehouse();
  
  const [batches, setBatches] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [products, setProducts] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filters & Pagination state
  const [productId, setProductId] = useState('all');
  const [riskCategory, setRiskCategory] = useState('all');
  const [page, setPage] = useState(1);
  const pageSize = 20;
  
  // Sorting state
  const [sortBy, setSortBy] = useState('receivedDate');
  const [order, setOrder] = useState('desc');

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    // Reset to page 1 when filters change
    setPage(1);
    fetchBatches(1);
  }, [selectedWarehouseId, productId, riskCategory, sortBy, order]);

  useEffect(() => {
    // Fetch on page change (if > 1)
    if (page > 1) fetchBatches(page);
  }, [page]);

  const fetchProducts = async () => {
    try {
      const data = await fetchApi('/products');
      setProducts(data);
    } catch (error) {
      console.error('Failed to load products', error);
    }
  };

  const fetchBatches = async (pageNum) => {
    setLoading(true);
    try {
      let url = `/batches?page=${pageNum}&pageSize=${pageSize}`;
      if (selectedWarehouseId !== 'all') url += `&warehouseId=${selectedWarehouseId}`;
      if (productId !== 'all') url += `&productId=${productId}`;
      if (riskCategory !== 'all') url += `&riskCategory=${riskCategory}`;
      url += `&sortBy=${sortBy}&order=${order}`;

      const res = await fetchApi(url);
      setBatches(res.batches || []);
      setTotalCount(res.totalCount || 0);
      setError(null);
    } catch (error) {
      console.error('Failed to load batches', error);
      setError("Failed to load inventory batches. Please try again.");
      setBatches([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (column) => {
    if (sortBy === column) {
      setOrder(order === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setOrder(column === 'receivedDate' ? 'desc' : 'asc');
    }
  };

  const getRiskBadge = (category) => {
    const styles = {
      low: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
      medium: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
      high: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
      critical: 'bg-red-500/10 text-red-500 border-red-500/20',
      unknown: 'bg-gray-500/10 text-gray-500 border-gray-500/20'
    };
    return (
      <span className={`px-2.5 py-1 text-xs rounded-full border font-medium capitalize ${styles[category] || styles.unknown}`}>
        {category}
      </span>
    );
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="p-6 max-w-7xl mx-auto flex flex-col gap-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Inventory Management</h1>
          <p className="text-text-muted mt-1">Live batch tracking and spoilage risk monitoring.</p>
        </div>
        <div className="text-sm text-text-muted">
          Showing <span className="font-medium text-text-primary">{totalCount}</span> batches
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-bg-card border border-border rounded-xl p-4 flex flex-wrap gap-4 items-end">
        <div className="flex flex-col gap-1.5 flex-1 min-w-[200px]">
          <label className="text-xs text-text-muted font-medium">Product</label>
          <div className="relative">
            <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <select
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              className="w-full bg-bg-elevated border border-border rounded-lg pl-9 pr-4 py-2 text-sm text-text-primary appearance-none focus:outline-none focus:border-brand-primary"
            >
              <option value="all">All Products</option>
              {products.map(p => (
                <option key={p._id} value={p._id}>{p.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-col gap-1.5 flex-1 min-w-[200px]">
          <label className="text-xs text-text-muted font-medium">Risk Category</label>
          <div className="relative">
            <AlertCircle size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <select
              value={riskCategory}
              onChange={(e) => setRiskCategory(e.target.value)}
              className="w-full bg-bg-elevated border border-border rounded-lg pl-9 pr-4 py-2 text-sm text-text-primary appearance-none focus:outline-none focus:border-brand-primary"
            >
              <option value="all">All Risks</option>
              <option value="low">Low Risk</option>
              <option value="medium">Medium Risk</option>
              <option value="high">High Risk</option>
              <option value="critical">Critical Risk</option>
            </select>
          </div>
        </div>
      </div>

      {/* Data Grid */}
      <div className="bg-bg-card border border-border rounded-xl overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-bg-elevated border-b border-border">
                <th className="p-4 text-xs font-medium text-text-muted uppercase tracking-wider">Batch Code</th>
                <th className="p-4 text-xs font-medium text-text-muted uppercase tracking-wider">Product</th>
                <th className="p-4 text-xs font-medium text-text-muted uppercase tracking-wider">Warehouse</th>
                <th 
                  className="p-4 text-xs font-medium text-text-muted uppercase tracking-wider cursor-pointer hover:text-text-primary select-none group"
                  onClick={() => handleSort('quantity')}
                >
                  <div className="flex items-center gap-1">
                    Quantity
                    <ArrowUpDown size={12} className={`transition-colors ${sortBy === 'quantity' ? 'text-brand-primary' : 'text-text-muted group-hover:text-text-primary'}`} />
                  </div>
                </th>
                <th 
                  className="p-4 text-xs font-medium text-text-muted uppercase tracking-wider cursor-pointer hover:text-text-primary select-none group"
                  onClick={() => handleSort('risk')}
                >
                  <div className="flex items-center gap-1">
                    Spoilage Risk
                    <ArrowUpDown size={12} className={`transition-colors ${sortBy === 'risk' ? 'text-brand-primary' : 'text-text-muted group-hover:text-text-primary'}`} />
                  </div>
                </th>
                <th className="p-4 text-xs font-medium text-text-muted uppercase tracking-wider">Days Rem.</th>
                <th 
                  className="p-4 text-xs font-medium text-text-muted uppercase tracking-wider cursor-pointer hover:text-text-primary select-none group"
                  onClick={() => handleSort('receivedDate')}
                >
                  <div className="flex items-center gap-1">
                    Received Date
                    <ArrowUpDown size={12} className={`transition-colors ${sortBy === 'receivedDate' ? 'text-brand-primary' : 'text-text-muted group-hover:text-text-primary'}`} />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {error ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-text-muted">
                    <div className="flex flex-col items-center justify-center py-6">
                      <AlertCircle size={48} className="text-risk-critical mb-3" />
                      <p className="text-lg font-medium text-text-primary mb-1">Error Loading Inventory</p>
                      <p className="text-sm mb-4">{error}</p>
                      <button onClick={() => fetchBatches(page)} className="px-4 py-2 bg-accent hover:bg-accent-hover text-white font-medium rounded transition-colors">
                        Retry
                      </button>
                    </div>
                  </td>
                </tr>
              ) : loading ? (
                // Loading Skeleton
                Array(5).fill(0).map((_, i) => (
                  <tr key={`skeleton-${i}`} className="animate-pulse bg-bg-card">
                    <td className="p-4"><div className="h-4 bg-bg-elevated rounded w-24"></div></td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-bg-elevated rounded-lg"></div>
                        <div className="h-4 bg-bg-elevated rounded w-20"></div>
                      </div>
                    </td>
                    <td className="p-4"><div className="h-4 bg-bg-elevated rounded w-32"></div></td>
                    <td className="p-4"><div className="h-4 bg-bg-elevated rounded w-16"></div></td>
                    <td className="p-4"><div className="h-6 bg-bg-elevated rounded-full w-20"></div></td>
                    <td className="p-4"><div className="h-4 bg-bg-elevated rounded w-12"></div></td>
                    <td className="p-4"><div className="h-4 bg-bg-elevated rounded w-24"></div></td>
                  </tr>
                ))
              ) : batches.length === 0 ? (
                // Empty State
                <tr>
                  <td colSpan="7" className="p-8 text-center text-text-muted">
                    <div className="flex flex-col items-center justify-center py-6">
                      <Package size={48} className="text-border mb-3" />
                      <p className="text-lg font-medium text-text-primary mb-1">No batches found</p>
                      <p className="text-sm">Adjust your filters to see more results.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                // Actual Data Rows
                batches.map(batch => (
                  <tr 
                    key={batch._id} 
                    className="bg-bg-card hover:bg-bg-elevated transition-colors cursor-pointer group"
                    onClick={() => navigate(`/app/batches/${batch._id}`)}
                  >
                    <td className="p-4 text-sm font-medium text-brand-primary group-hover:underline">
                      {batch.batchCode}
                    </td>
                    <td className="p-4 text-sm text-text-primary">
                      <div className="flex items-center gap-2">
                        {batch.productRef?.name}
                      </div>
                    </td>
                    <td className="p-4 text-sm text-text-muted">
                      {batch.warehouseRef?.name} ({batch.warehouseRef?.city})
                    </td>
                    <td className="p-4 text-sm text-text-primary">
                      {batch.quantityKg} kg
                    </td>
                    <td className="p-4">
                      {getRiskBadge(batch.riskCategory)}
                    </td>
                    <td className="p-4 text-sm text-text-muted font-medium">
                      {batch.daysRemaining}d
                    </td>
                    <td className="p-4 text-sm text-text-muted">
                      {new Date(batch.receivedDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Footer */}
        {!loading && totalPages > 1 && (
          <div className="p-4 border-t border-border flex justify-between items-center bg-bg-elevated/30">
            <button
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              className="px-4 py-2 bg-bg-card hover:bg-bg-elevated border border-border rounded-lg text-sm text-text-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <span className="text-sm text-text-muted">
              Page <span className="font-medium text-text-primary">{page}</span> of {totalPages}
            </span>
            <button
              disabled={page === totalPages}
              onClick={() => setPage(p => p + 1)}
              className="px-4 py-2 bg-bg-card hover:bg-bg-elevated border border-border rounded-lg text-sm text-text-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Inventory;
