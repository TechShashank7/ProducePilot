import React, { useState, useEffect } from 'react';
import { Package, ShieldAlert, Eye, TrendingUp, Activity, RotateCw } from 'lucide-react';
import { fetchApi } from '../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const AgentCard = ({ agent, onClick, isSelected }) => {
  const { type, icon: Icon, title, description, stats } = agent;
  const isActive = stats?.status === 'active';

  return (
    <div 
      onClick={onClick}
      className={`relative p-5 rounded-xl border cursor-pointer transition-all ${isSelected ? 'bg-bg-elevated border-brand-primary' : 'bg-bg-card border-border hover:border-text-muted'}`}
    >
      <div className="flex justify-between items-start mb-3">
        <div className={`p-2 rounded-lg ${isSelected ? 'bg-brand-primary/20 text-brand-primary' : 'bg-bg-elevated text-text-muted'}`}>
          <Icon size={24} />
        </div>
        
        {/* Status Dot */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-muted">{isActive ? 'Active' : 'Idle'}</span>
          <div className="relative flex h-3 w-3">
            {isActive && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>}
            <span className={`relative inline-flex rounded-full h-3 w-3 ${isActive ? 'bg-green-500' : 'bg-gray-500'}`}></span>
          </div>
        </div>
      </div>
      
      <h3 className="text-lg font-semibold text-text-primary mb-1">{title}</h3>
      <p className="text-xs text-text-muted mb-4 line-clamp-2">{description}</p>
      
      <div className="space-y-2">
        <div className="flex justify-between items-center border-t border-border pt-2">
          <span className="text-xs text-text-muted">Total Actions</span>
          <span className="text-sm font-medium text-text-primary">{stats?.totalActions || 0}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs text-text-muted">Last 24h</span>
          <span className="text-sm font-medium text-text-primary">{stats?.actionsLast24h || 0}</span>
        </div>
        
        {/* Agent specific real metrics */}
        {type === 'rescue' && (
          <>
            <div className="flex justify-between items-center">
              <span className="text-xs text-text-muted">Accepted Rescues</span>
              <span className="text-sm font-medium text-text-primary">{stats?.specificStats?.totalAccepted || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-text-muted">Write-offs</span>
              <span className="text-sm font-medium text-text-primary">{stats?.specificStats?.totalWriteOffs || 0}</span>
            </div>
          </>
        )}
        {type === 'vision' && (
          <div className="flex justify-between items-center">
            <span className="text-xs text-text-muted">Valid Scans</span>
            <span className="text-sm font-medium text-text-primary">{stats?.specificStats?.validAssessments || 0}</span>
          </div>
        )}
        {type === 'demand' && (
          <div className="flex justify-between items-center">
            <span className="text-xs text-text-muted">Unique Forecasts</span>
            <span className="text-sm font-medium text-text-primary">{stats?.specificStats?.uniqueForecasts || 0}</span>
          </div>
        )}
        {type === 'inventory' && (
          <div className="flex justify-between items-center">
            <span className="text-xs text-text-muted">At-Risk Batches</span>
            <span className="text-sm font-medium text-brand-error">{stats?.specificStats?.atRiskBatches || 0}</span>
          </div>
        )}
      </div>
    </div>
  );
};

const Agents = () => {
  const [stats, setStats] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [activities, setActivities] = useState([]);
  const [selectedAgent, setSelectedAgent] = useState('all');
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [skip, setSkip] = useState(0);
  const limit = 20;

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    // When agent filter changes, reset skip and fetch activities
    setSkip(0);
    fetchActivities(true, 0);
  }, [selectedAgent]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [statsData, timelineData] = await Promise.all([
        fetchApi('/agents/stats'),
        fetchApi('/agents/activity-timeline?hours=24')
      ]);
      setStats(statsData);
      
      // Format timeline for recharts
      const formattedTimeline = timelineData.map(d => ({
        ...d,
        timeLabel: new Date(d.hour).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }));
      setTimeline(formattedTimeline);
    } catch (error) {
      console.error('Error fetching initial agent data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchActivities = async (reset = false, skipVal = 0) => {
    try {
      let url = `/activity-log?limit=${limit}&skip=${skipVal}`;
      if (selectedAgent !== 'all') {
        url += `&agentType=${selectedAgent}`;
      }
      const data = await fetchApi(url);
      
      if (reset) {
        setActivities(data);
      } else {
        setActivities(prev => [...prev, ...data]);
      }
    } catch (error) {
      console.error('Error fetching activities:', error);
    }
  };

  const loadMore = async () => {
    setLoadingMore(true);
    const newSkip = skip + limit;
    setSkip(newSkip);
    await fetchActivities(false, newSkip);
    setLoadingMore(false);
  };

  const timeAgo = (dateString) => {
    const diff = new Date() - new Date(dateString);
    const minutes = Math.floor(diff / 60000);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  const agentDefinitions = [
    { type: 'inventory', icon: Package, title: 'Inventory Agent', description: 'Monitors every batch and computes real-time spoilage risk from storage conditions and age.' },
    { type: 'rescue', icon: ShieldAlert, title: 'Rescue Agent', description: 'Evaluates at-risk food and instantly negotiates discount routing to NGOs and wholesalers.' },
    { type: 'vision', icon: Eye, title: 'Vision Agent', description: 'Analyzes visual assessments from edge devices to confirm ripeness and identify defects.' },
    { type: 'demand', icon: TrendingUp, title: 'Demand Agent', description: 'Forecasts hyper-local supply-demand spikes based on regional pricing indices.' },
  ];

  if (loading) return <div className="p-6 text-text-muted">Loading Agent Data...</div>;
  if (!stats) return <div className="p-6 text-brand-error">Failed to load agent data. Is backend running?</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto flex flex-col gap-6">
      
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Multi-Agent Architecture</h1>
          <p className="text-text-muted mt-1">Live metrics and telemetry for the autonomous agent swarm.</p>
        </div>
        <button 
          onClick={fetchInitialData}
          className="p-2 bg-bg-elevated hover:bg-bg-card border border-border rounded-lg text-text-muted hover:text-brand-primary transition-colors"
          title="Refresh Data"
        >
          <RotateCw size={20} />
        </button>
      </div>

      {/* Agent Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {agentDefinitions.map(agent => (
          <AgentCard 
            key={agent.type}
            agent={{ ...agent, stats: stats[agent.type] }}
            isSelected={selectedAgent === agent.type}
            onClick={() => setSelectedAgent(selectedAgent === agent.type ? 'all' : agent.type)}
          />
        ))}
      </div>

      {/* Activity Timeline Chart */}
      <div className="bg-bg-card border border-border rounded-xl p-5">
        <h2 className="text-lg font-medium text-text-primary mb-4">Activity Timeline (Last 24h)</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={timeline} margin={{ top: 5, right: 0, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
              <XAxis dataKey="timeLabel" stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1A1A1A', borderColor: '#333', borderRadius: '8px' }}
                itemStyle={{ color: '#E5E5E5' }}
              />
              <Legend wrapperStyle={{ paddingTop: '10px' }} />
              <Bar dataKey="inventory" name="Inventory" stackId="a" fill="#10B981" />
              <Bar dataKey="rescue" name="Rescue" stackId="a" fill="#F59E0B" />
              <Bar dataKey="vision" name="Vision" stackId="a" fill="#3B82F6" />
              <Bar dataKey="demand" name="Demand" stackId="a" fill="#8B5CF6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Activity Feed */}
      <div className="bg-bg-card border border-border rounded-xl p-5">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium text-text-primary">
            Agent Activity Log
            {selectedAgent !== 'all' && <span className="ml-2 text-sm text-brand-primary font-normal capitalize">({selectedAgent} only)</span>}
          </h2>
        </div>

        <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
          {activities.length === 0 ? (
            <div className="py-8 text-center text-text-muted">No activities found.</div>
          ) : (
            activities.map(activity => (
              <div key={activity._id} className="flex gap-4 p-3 rounded-lg border border-border/50 bg-bg-elevated/50 hover:bg-bg-elevated transition-colors">
                <div className="flex-shrink-0 mt-1">
                  <div className={`p-2 rounded-full ${
                    activity.agentType === 'inventory' ? 'bg-emerald-500/20 text-emerald-500' :
                    activity.agentType === 'rescue' ? 'bg-amber-500/20 text-amber-500' :
                    activity.agentType === 'vision' ? 'bg-blue-500/20 text-blue-500' :
                    'bg-violet-500/20 text-violet-500'
                  }`}>
                    <Activity size={16} />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                      {activity.agentType}
                    </span>
                    <span className="text-xs text-text-muted whitespace-nowrap ml-2">
                      {timeAgo(activity.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm text-text-primary font-medium mb-1 break-words">
                    {activity.action.replace(/_/g, ' ')}
                  </p>
                  <p className="text-sm text-text-muted">
                    {activity.summary}
                  </p>
                  
                  {/* Context chips */}
                  <div className="flex flex-wrap gap-2 mt-2">
                    {activity.batchCode && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-bg-card border border-border text-text-muted">
                        Batch: {activity.batchCode}
                      </span>
                    )}
                    {activity.productName && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-bg-card border border-border text-text-muted">
                        Product: {activity.productName}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
          
          {activities.length >= limit && (
            <div className="pt-4 flex justify-center">
              <button 
                onClick={loadMore}
                disabled={loadingMore}
                className="px-4 py-2 bg-bg-elevated hover:bg-bg-card border border-border rounded-lg text-sm font-medium text-text-primary transition-colors disabled:opacity-50"
              >
                {loadingMore ? 'Loading...' : 'Load More'}
              </button>
            </div>
          )}
        </div>
      </div>
      
    </div>
  );
};

export default Agents;
