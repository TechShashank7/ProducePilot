import React, { useState, useEffect } from 'react';
import { Package, AlertTriangle, IndianRupee, Activity, Bell, Info } from 'lucide-react';
import { Link } from 'react-router-dom';
import MetricCard from '../components/ui/MetricCard';
import RiskBadge from '../components/ui/RiskBadge';
import Card from '../components/ui/Card';
import EmptyState from '../components/ui/EmptyState';
import { useWarehouse } from '../context/WarehouseContext';
import { fetchApi } from '../services/api';
import { useToast } from '../components/ui/Toast';
import { useRescueAction } from '../hooks/useRescueAction';

// Helper to format relative time
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

// Formatter for currency
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

  const fetchDashboardData = async () => {
    if (!selectedWarehouseId) return;
    
    setLoading(true);
    try {
      const qs = `?warehouseId=${selectedWarehouseId}`;
      
      const [summaryData, riskData, activityData] = await Promise.all([
        fetchApi(`/dashboard/summary${qs}`),
        fetchApi(`/risk-summary${qs}&sortBy=risk&limit=6`),
        fetchApi(`/activity-log${qs}&limit=6`)
      ]);
      
      setSummary(summaryData);
      
      // Filter out low risk from alerts
      setAlerts(riskData.filter(r => r.riskCategory !== 'low'));
      setActivities(activityData);
      
    } catch (error) {
      console.error("Failed to load dashboard data", error);
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
      
      // Also optionally refetch activity log to show the new entry, 
      // but the user only explicitly requested /dashboard/summary. 
      // I will fetch activity log too since they just created a new log entry.
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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-text-primary">Dashboard</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          label="Total Inventory"
          value={loading ? '...' : `${summary?.totalInventoryKg?.toLocaleString() || 0} kg`}
          icon={Package}
        />
        <MetricCard
          label="At Risk"
          value={loading ? '...' : `${summary?.atRiskKg?.toLocaleString() || 0} kg`}
          trend={loading ? undefined : (summary?.atRiskKg > 0 ? 'Requires Action' : 'All Clear')}
          trendIsGood={summary?.atRiskKg === 0}
          icon={AlertTriangle}
        />
        <MetricCard
          label="Value at Risk"
          value={loading ? '...' : formatINR(summary?.valueAtRiskINR || 0)}
          icon={IndianRupee}
        />
        <MetricCard
          label="Value Rescued"
          value={loading ? '...' : formatINR(summary?.valueRescuedINR || 0)}
          icon={Activity}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-2">
        <div className="lg:col-span-2 flex flex-col gap-4">
          <h2 className="text-lg font-medium text-text-primary">Active Alerts</h2>
          <Card className="p-0 overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-text-muted">Loading alerts...</div>
            ) : alerts.length === 0 ? (
              <EmptyState 
                icon={Info}
                message="No active risk alerts for this warehouse."
              />
            ) : (
              <div className="divide-y divide-border">
                {alerts.map((alert) => (
                  <Link 
                    to={`/batches/${alert.batchId}`}
                    key={alert.batchId} 
                    className="p-4 flex items-center justify-between hover:bg-bg-hover transition-colors block"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-bg-elevated flex items-center justify-center">
                        <Bell size={18} className="text-text-muted" />
                      </div>
                      <div>
                        <p className="font-medium text-text-primary">{alert.productName} ({alert.batchCode})</p>
                        <p className="text-sm text-text-secondary">{alert.warehouseName}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex flex-col items-end gap-1">
                        <RiskBadge riskPct={alert.riskPct} category={alert.riskCategory} />
                        <span className="text-xs text-text-muted">{alert.estimatedDaysRemaining} days est. remaining</span>
                      </div>
                      
                      {alert.hasViableCandidates ? (
                        <button
                          onClick={(e) => handleAcceptClick(e, alert.batchId)}
                          disabled={actionInProgressId === alert.batchId}
                          className="ml-2 px-3 py-1.5 bg-accent hover:bg-accent-hover text-white text-sm font-medium rounded transition-colors disabled:opacity-50"
                        >
                          {actionInProgressId === alert.batchId ? 'Processing...' : 'Accept'}
                        </button>
                      ) : (
                        <button
                          onClick={(e) => handleWriteOff(e, alert.batchId)}
                          disabled={actionInProgressId === alert.batchId}
                          className="ml-2 px-3 py-1.5 bg-risk-criticalBg text-risk-critical hover:bg-risk-critical hover:text-white border border-risk-critical text-sm font-medium rounded transition-colors disabled:opacity-50"
                        >
                          {actionInProgressId === alert.batchId ? 'Processing...' : 'Write off'}
                        </button>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </Card>
        </div>

        <div className="flex flex-col gap-4">
          <h2 className="text-lg font-medium text-text-primary">Recent Activity</h2>
          <Card>
            {loading ? (
              <div className="py-4 text-center text-text-muted">Loading activity...</div>
            ) : activities.length === 0 ? (
              <div className="py-4 text-center text-text-muted">No recent activity.</div>
            ) : (
              <div className="flex flex-col gap-4">
                {activities.map((activity) => (
                  <div key={activity._id} className="flex gap-3">
                    <div className="mt-1">
                      <div className="w-2 h-2 rounded-full bg-accent"></div>
                    </div>
                    <div>
                      <p className="text-sm text-text-primary">{activity.summary}</p>
                      <p className="text-xs text-text-muted mt-1">{timeAgo(activity.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      <RescueActionModal />
    </div>
  );
};

export default Dashboard;
