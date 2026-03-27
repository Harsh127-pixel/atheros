'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';
import { 
  Shield, 
  Settings, 
  Users, 
  Database, 
  Search, 
  Filter, 
  Ban, 
  Zap, 
  Loader2, 
  AlertTriangle,
  RefreshCw,
  LogOut
} from 'lucide-react';

export default function AdminDashboard() {
  const { user, loading, isAdmin, getToken, logout } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'settings' | 'deployments' | 'users'>('settings');
  
  // Data States
  const [settings, setSettings] = useState<any>(null);
  const [deployments, setDeployments] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchData = async () => {
    setIsDataLoading(true);
    const token = await getToken();
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';
    
    try {
      // Fetch Stats anyway
      const statsRes = await fetch(`${backendUrl}/api/admin/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (statsRes.ok) setStats(await statsRes.json());

      if (activeTab === 'settings') {
        const res = await fetch(`${backendUrl}/api/admin/settings`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        setSettings(await res.json());
      } else if (activeTab === 'deployments') {
        const res = await fetch(`${backendUrl}/api/deployments`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        setDeployments(await res.json());
      } else if (activeTab === 'users') {
        const res = await fetch(`${backendUrl}/api/admin/users`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        setUsers(await res.json());
      }
    } catch (error) {
      console.error('Failed to fetch admin data', error);
    } finally {
      setIsDataLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) fetchData();
  }, [activeTab, isAdmin]);

  useEffect(() => {
    if (!loading && !isAdmin) {
      router.push('/');
    }
  }, [loading, isAdmin, router]);

  const toggleSetting = async (key: string, value: boolean) => {
    const token = await getToken();
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';
    try {
      const newSettings = { ...settings, [key]: value };
      const res = await fetch(`${backendUrl}/api/admin/settings`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newSettings)
      });
      setSettings(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  const handleUserAction = async (userId: string, action: 'ban' | 'upgrade' | 'role', value: any) => {
    const token = await getToken();
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';
    try {
      const endpoint = action;
      const body = action === 'ban' ? { isBanned: value } : action === 'upgrade' ? { level: value } : { role: value };
      await fetch(`${backendUrl}/api/admin/users/${userId}/${endpoint}`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });
      fetchData(); // Refresh user list
    } catch (e) {
      console.error(e);
    }
  };

  if (loading || (isAdmin && isDataLoading && !settings && users.length === 0)) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-primary-DEFAULT animate-spin" />
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-[#020203] text-slate-200">
      {/* Sidebar / Nav */}
      <div className="fixed left-0 top-0 bottom-0 w-64 border-r border-white/5 bg-[#09090b] flex flex-col p-6 space-y-8 z-50">
        <div className="flex items-center space-x-2">
           <Shield className="text-primary-DEFAULT w-8 h-8" />
           <span className="text-xl font-bold tracking-tight text-white">God Mode</span>
        </div>

        <nav className="flex-1 space-y-2">
          <button 
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition ${activeTab === 'settings' ? 'bg-primary-DEFAULT/10 text-primary-light border border-primary-DEFAULT/20' : 'hover:bg-white/5 text-slate-400'}`}
          >
            <Settings className="w-5 h-5" />
            <span className="font-medium">System Settings</span>
          </button>
          <button 
            onClick={() => setActiveTab('deployments')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition ${activeTab === 'deployments' ? 'bg-primary-DEFAULT/10 text-primary-light border border-primary-DEFAULT/20' : 'hover:bg-white/5 text-slate-400'}`}
          >
            <Database className="w-5 h-5" />
            <span className="font-medium">Deployment Monitor</span>
          </button>
          <button 
            onClick={() => setActiveTab('users')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition ${activeTab === 'users' ? 'bg-primary-DEFAULT/10 text-primary-light border border-primary-DEFAULT/20' : 'hover:bg-white/5 text-slate-400'}`}
          >
            <Users className="w-5 h-5" />
            <span className="font-medium">User Management</span>
          </button>
        </nav>

        <div className="pt-6 border-t border-white/5">
           <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold ring-2 ring-primary-DEFAULT">ADMIN</div>
              <div className="overflow-hidden">
                <p className="text-xs font-semibold text-white truncate">{user?.email}</p>
                <p className="text-[10px] text-primary-light uppercase tracking-widest">Root Access</p>
              </div>
           </div>
           <button onClick={() => logout()} className="w-full flex items-center justify-center space-x-2 py-2 text-red-500 hover:bg-red-500/10 rounded-lg transition text-sm">
             <LogOut className="w-4 h-4" />
             <span>Exit Terminal</span>
           </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="ml-64 p-12 max-w-6xl">
        <header className="flex justify-between items-center mb-12">
           <div>
             <h1 className="text-4xl font-extrabold text-white tracking-tight capitalize">{activeTab.replace('-', ' ')}</h1>
             <p className="text-slate-500 mt-2">Global system override and intelligence dashboard.</p>
           </div>
           <button onClick={fetchData} className="p-2 glass rounded-full hover:rotate-180 transition-transform duration-500">
             <RefreshCw className="w-5 h-5" />
           </button>
        </header>

        {/* Global Statistics Grid */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
            <div className="glass p-6 rounded-2xl border-white/5 space-y-1">
              <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Total Users</p>
              <h4 className="text-3xl font-extrabold text-white">{stats.userCount}</h4>
            </div>
            <div className="glass p-6 rounded-2xl border-white/5 space-y-1">
              <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Total Deploys</p>
              <h4 className="text-3xl font-extrabold text-white">{stats.deploymentCount}</h4>
            </div>
            <div className="glass p-6 rounded-2xl border-white/5 space-y-1">
              <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Success Rate</p>
              <h4 className="text-3xl font-extrabold text-green-400">
                {stats.deploymentCount > 0 ? ((stats.successCount / stats.deploymentCount) * 100).toFixed(1) : 100}%
              </h4>
            </div>
            <div className="glass p-6 rounded-2xl border-white/5 space-y-1">
              <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">System Health</p>
              <h4 className="text-3xl font-extrabold text-primary-light">{stats.health}</h4>
            </div>
          </div>
        )}

        {/* Tab Content: Settings */}
        {activeTab === 'settings' && settings && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="glass p-8 rounded-3xl border-white/5 space-y-6">
               <h3 className="text-xl font-bold flex items-center space-x-2">
                 <Zap className="text-primary-light w-5 h-5" />
                 <span>Global Toggles</span>
               </h3>
               
               <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-white/5 rounded-2xl">
                    <div>
                      <p className="font-semibold">Maintenance Mode</p>
                      <p className="text-xs text-slate-500">Locks the platform for all non-admins</p>
                    </div>
                    <button 
                      onClick={() => toggleSetting('maintenanceMode', !settings.maintenanceMode)}
                      className={`w-12 h-6 rounded-full transition-colors relative ${settings.maintenanceMode ? 'bg-red-500' : 'bg-slate-700'}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${settings.maintenanceMode ? 'left-7' : 'left-1'}`} />
                    </button>
                  </div>

                  <div className="flex justify-between items-center p-4 bg-white/5 rounded-2xl">
                    <div>
                      <p className="font-semibold">Free Tier Availability</p>
                      <p className="text-xs text-slate-500">Toggle new free user deployments</p>
                    </div>
                    <button 
                      onClick={() => toggleSetting('freeTierEnabled', !settings.freeTierEnabled)}
                      className={`w-12 h-6 rounded-full transition-colors relative ${settings.freeTierEnabled ? 'bg-green-500' : 'bg-slate-700'}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${settings.freeTierEnabled ? 'left-7' : 'left-1'}`} />
                    </button>
                  </div>

                  <div className="flex justify-between items-center p-4 bg-white/5 rounded-2xl">
                    <div>
                      <p className="font-semibold">Subscription Engine</p>
                      <p className="text-xs text-slate-500">Disable all payment processing</p>
                    </div>
                    <button 
                      onClick={() => toggleSetting('subscriptionModelOn', !settings.subscriptionModelOn)}
                      className={`w-12 h-6 rounded-full transition-colors relative ${settings.subscriptionModelOn ? 'bg-primary-DEFAULT' : 'bg-slate-700'}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${settings.subscriptionModelOn ? 'left-7' : 'left-1'}`} />
                    </button>
                  </div>
               </div>
            </div>

            <div className="glass p-8 rounded-3xl border-white/5 flex flex-col justify-center items-center text-center space-y-4">
               <div className="w-16 h-16 bg-primary-DEFAULT/20 rounded-2xl flex items-center justify-center">
                  <Shield className="w-8 h-8 text-primary-light" />
               </div>
               <h3 className="text-2xl font-bold">System Status: SECURE</h3>
               <p className="text-slate-400 text-sm max-w-xs">
                 The AetherOS core engine is currently processing at 0.4ms latency. No anomalies detected.
               </p>
            </div>
          </div>
        )}

        {/* Tab Content: Deployments */}
        {activeTab === 'deployments' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="flex space-x-4 mb-6">
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
                  <input 
                    type="text" 
                    placeholder="Search by Repo, User, or ID..." 
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 outline-none focus:ring-2 focus:ring-primary-DEFAULT"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <button className="glass px-6 rounded-2xl flex items-center space-x-2 hover:bg-white/10 transition">
                  <Filter className="w-5 h-5" />
                  <span>Filters</span>
                </button>
             </div>

             <div className="glass rounded-3xl overflow-hidden border-white/5">
                <table className="w-full text-left">
                   <thead className="bg-white/5 text-slate-400 text-xs font-bold uppercase tracking-widest">
                      <tr>
                         <th className="px-6 py-4">Status</th>
                         <th className="px-6 py-4">Repository</th>
                         <th className="px-6 py-4">Provider</th>
                         <th className="px-6 py-4">Date</th>
                         <th className="px-6 py-4">Score</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-white/5">
                      {deployments.filter(d => 
                        d.repoUrl.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        d.status.toLowerCase().includes(searchTerm.toLowerCase())
                      ).map(d => (
                        <tr key={d.id} className="hover:bg-white/5 transition group">
                           <td className="px-6 py-4 text-sm font-semibold">
                              <span className={`px-2 py-1 rounded-md text-[10px] uppercase font-bold ${
                                d.status === 'SUCCESS' ? 'bg-green-500/20 text-green-400' : 
                                d.status === 'FAILED' ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'
                              }`}>
                                {d.status}
                              </span>
                           </td>
                           <td className="px-6 py-4 font-mono text-sm text-slate-300 truncate max-w-[200px]">{d.repoUrl}</td>
                           <td className="px-6 py-4 text-sm font-medium">{d.cloudProvider}</td>
                           <td className="px-6 py-4 text-sm text-slate-500">{new Date(d.createdAt).toLocaleDateString()}</td>
                           <td className="px-6 py-4">
                              <div className="flex items-center space-x-2">
                                 <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden min-w-[60px]">
                                    <div className="bg-primary-DEFAULT h-full" style={{ width: `${d.securityScore}%` }} />
                                 </div>
                                 <span className="text-xs font-bold">{d.securityScore}%</span>
                              </div>
                           </td>
                        </tr>
                      ))}
                   </tbody>
                </table>
             </div>
          </div>
        )}

        {/* Tab Content: Users */}
        {activeTab === 'users' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="glass rounded-3xl overflow-hidden border-white/5">
                <table className="w-full text-left">
                   <thead className="bg-white/5 text-slate-400 text-xs font-bold uppercase tracking-widest">
                      <tr>
                         <th className="px-6 py-4">User</th>
                         <th className="px-6 py-4">Role</th>
                         <th className="px-6 py-4">Level</th>
                         <th className="px-6 py-4">Status</th>
                         <th className="px-6 py-4">Actions</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-white/5">
                      {users.map(u => (
                        <tr key={u.id} className="hover:bg-white/5 transition">
                           <td className="px-6 py-4">
                              <p className="font-semibold text-white">{u.email}</p>
                              <p className="text-[10px] text-slate-500 font-mono">{u.id}</p>
                           </td>
                           <td className="px-6 py-4">
                              <select 
                                onChange={(e) => handleUserAction(u.id, 'role', e.target.value)}
                                value={u.role}
                                disabled={u.email === 'admin@gaurangjadoun.in'}
                                className={`text-[10px] font-bold uppercase px-2 py-1 rounded-md bg-transparent border border-white/10 outline-none ${u.role === 'ADMIN' ? 'text-purple-400' : 'text-slate-400'}`}
                              >
                                <option value="USER" className="bg-[#09090b]">User</option>
                                <option value="ADMIN" className="bg-[#09090b]">Admin</option>
                              </select>
                           </td>
                           <td className="px-6 py-4">
                              <select 
                                onChange={(e) => handleUserAction(u.id, 'upgrade', e.target.value)}
                                value={u.upgradeLevel}
                                className="bg-transparent border border-white/10 rounded-lg text-xs p-1 outline-none"
                              >
                                <option value="0">Free</option>
                                <option value="1">Pro</option>
                                <option value="2">Enterprise</option>
                              </select>
                           </td>
                           <td className="px-6 py-4">
                              {u.isBanned ? (
                                <span className="flex items-center text-red-500 text-xs space-x-1 font-bold">
                                  <AlertTriangle className="w-3 h-3" />
                                  <span>BANNED</span>
                                </span>
                              ) : (
                                <span className="text-green-500 text-xs font-bold uppercase">Active</span>
                              )}
                           </td>
                           <td className="px-6 py-4">
                              <button 
                                onClick={() => handleUserAction(u.id, 'ban', !u.isBanned)}
                                className={`p-2 rounded-lg transition ${u.isBanned ? 'bg-green-500/10 text-green-500 hover:bg-green-500/20' : 'bg-red-500/10 text-red-500 hover:bg-red-500/20'}`}
                              >
                                {u.isBanned ? <RefreshCw className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                              </button>
                           </td>
                        </tr>
                      ))}
                   </tbody>
                </table>
             </div>
          </div>
        )}
      </main>
    </div>
  );
}
