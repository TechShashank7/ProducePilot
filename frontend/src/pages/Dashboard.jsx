import React, { useState, useEffect } from 'react';
import { Package, AlertTriangle, IndianRupee, TrendingUp, Bell, Info, Check, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import MetricCard from '../components/ui/MetricCard';
import RiskBadge from '../components/ui/RiskBadge';
import EmptyState from '../components/ui/EmptyState';
import { useWarehouse } from '../context/WarehouseContext';
import { fetchApi } from '../services/api';
import { useToast } from '../components/ui/Toast';
import { useRescueAction } from '../hooks/useRescueAction';

const timeAgo = (dateInput) => {
  if (!dateInput) return '';
  const date = new Date(dateInput);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);
  
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} mins ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hours ago`;
  const days = Math.floor(hours / 24);
  return `${days} days ago`;
};

const formatINR = (value) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(value);
};

const Dashboard = () => {
  const { selectedWarehouseId } = useWarehouse();
  const toast = useToast();
  
  const [summary, setSummary] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardData = async () => {
    if (!selectedWarehouseId) return;
    
    setLoading(true);
    setError(null);
    try {
      const qs = `?warehouseId=${selectedWarehouseId}`;
      
      const [summaryData, riskData, activityData] = await Promise.all([
        fetchApi(`/dashboard/summary${qs}`),
        fetchApi(`/risk-summary${qs}&sortBy=risk&limit=6`),
        fetchApi(`/activity-log${qs}&limit=6`)
      ]);
      
      setSummary(summaryData);
      setAlerts(riskData.filter(r => r.riskCategory !== 'low'));
      setActivities(activityData);
      
    } catch (error) {
      console.error("Failed to load dashboard data", error);
      setError("Failed to load dashboard data. Please try again.");
      toast.error("Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  const refetchSummaryOnly = async () => {
    if (!selectedWarehouseId) return;
    try {
      const summaryData = await fetchApi(`/dashboard/summary?warehouseId=${selectedWarehouseId}`);
      setSummary(summaryData);
      const activityData = await fetchApi(`/activity-log?warehouseId=${selectedWarehouseId}&limit=6`);
      setActivities(activityData);
    } catch (e) {
      console.error("Failed to refetch summary", e);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [selectedWarehouseId]);

  const {
    actionInProgressId,
    handleAcceptClick,
    handleWriteOff,
    RescueActionModal
  } = useRescueAction({
    onSuccess: async (batchId) => {
      setAlerts(prev => prev.filter(a => a.batchId !== batchId));
      await refetchSummaryOnly();
    }
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-headline-page text-text-primary">Dashboard</h1>
      </div>

      {error ? (
        <div className="flex flex-col items-center justify-center p-12 bg-surface border border-border-light rounded-[24px] shadow-sm">
          <AlertTriangle size={48} className="text-error-red mb-4" />
          <h2 className="text-lg font-semibold text-text-primary mb-2">Error Loading Dashboard</h2>
          <p className="text-text-secondary mb-4">{error}</p>
          <button onClick={fetchDashboardData} className="px-6 py-2.5 bg-primary hover:bg-primary-container text-white font-semibold rounded-full transition-colors">
            Retry
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard
              label="Total Inventory"
              value={loading ? '...' : `${summary?.totalInventoryKg?.toLocaleString() || 0} kg`}
              icon={Package}
              variant="mint"
            />
            <MetricCard
              label="At Risk"
              value={loading ? '...' : `${summary?.atRiskKg?.toLocaleString() || 0} kg`}
              trend={loading ? undefined : (summary?.atRiskKg > 0 ? 'Action Req' : 'All Clear')}
              trendIsGood={summary?.atRiskKg === 0}
              icon={AlertTriangle}
              variant="rose"
            />
            <MetricCard
              label="Value at Risk"
              value={loading ? '...' : formatINR(summary?.valueAtRiskINR || 0)}
              icon={IndianRupee}
              variant="blue"
            />
            <MetricCard
              label="Value Rescued"
              value={loading ? '...' : formatINR(summary?.valueRescuedINR || 0)}
              icon={TrendingUp}
              variant="white"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4">
            <div className="lg:col-span-2 flex flex-col gap-4">
              <div className="flex justify-between items-end">
                <h2 className="text-headline-section text-text-primary">Active Alerts</h2>
                <button className="text-sm font-semibold text-primary hover:text-primary-container transition-colors">View All</button>
              </div>
              <div className="bg-surface rounded-[24px] shadow-sm overflow-hidden border border-border-light/50">
                {loading ? (
                  <div className="p-10 text-center text-text-secondary">Loading alerts...</div>
                ) : alerts.length === 0 ? (
                  <EmptyState 
                    icon={Info}
                    message="No active risk alerts for this warehouse."
                  />
                ) : (
                  <div className="divide-y divide-border-light p-4">
                    {alerts.map((alert) => (
                      <div key={alert.batchId} className="p-4 flex items-center justify-between hover:bg-surface-dim/30 rounded-xl transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-error-container flex items-center justify-center flex-shrink-0">
                            <AlertTriangle size={20} className="text-error-red" />
                          </div>
                          <div>
                            <p className="font-semibold text-text-primary">{alert.productName} ({alert.batchCode})</p>
                            <p className="text-sm text-text-secondary">{alert.warehouseName}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="flex flex-col items-end gap-1.5">
                            <RiskBadge riskPct={alert.riskPct} category={alert.riskCategory} />
                            <span className="text-xs text-text-muted">{alert.estimatedDaysRemaining} days est. remaining</span>
                          </div>
                          
                          <div className="flex flex-col gap-2">
                            {alert.hasViableCandidates ? (
                              <button
                                onClick={(e) => handleAcceptClick(e, alert.batchId)}
                                disabled={actionInProgressId === alert.batchId}
                                className="px-5 py-2 bg-primary hover:bg-primary-container text-white text-sm font-bold rounded-full transition-colors disabled:opacity-50 shadow-sm"
                              >
                                {actionInProgressId === alert.batchId ? '...' : 'Accept'}
                              </button>
                            ) : (
                              <button
                                onClick={(e) => handleWriteOff(e, alert.batchId)}
                                disabled={actionInProgressId === alert.batchId}
                                className="px-5 py-2 bg-error-red/10 text-error-red hover:bg-error-red hover:text-white border border-error-red/20 text-sm font-bold rounded-full transition-colors disabled:opacity-50"
                              >
                                {actionInProgressId === alert.batchId ? '...' : 'Write off'}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <h2 className="text-headline-section text-text-primary">Recent Activity</h2>
              <div className="bg-surface rounded-[24px] shadow-sm p-6 border border-border-light/50 h-full">
                {loading ? (
                  <div className="py-10 text-center text-text-secondary">Loading activity...</div>
                ) : activities.length === 0 ? (
                  <div className="py-10 text-center text-text-secondary">No recent activity.</div>
                ) : (
                  <div className="flex flex-col gap-6 relative">
                    <div className="absolute left-[11px] top-2 bottom-2 w-px bg-border-light"></div>
                    {activities.map((activity) => (
                      <div key={activity._id} className="flex gap-4 relative z-10">
                        <div className="mt-1">
                          <div className="w-6 h-6 rounded-full bg-surface border-2 border-primary flex items-center justify-center">
                            <div className="w-2 h-2 rounded-full bg-primary"></div>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-text-primary leading-snug">{activity.summary}</p>
                          <p className="text-xs font-semibold text-text-muted mt-1 uppercase tracking-wide">{timeAgo(activity.createdAt)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      <RescueActionModal />
    </div>
  );
};

export default Dashboard;
