import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, CreditCard, Image, Activity, Search, Filter, 
  ChevronDown, Eye, Edit, TrendingUp, Calendar, 
  Mail, Shield, Sparkles, Database, RefreshCw,
  X, Check, AlertCircle, UserCheck, DollarSign,
  Trash2, ChevronUp, ArrowUpDown, Bell
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuthStore } from '../stores/authStore';
import { format } from 'date-fns';
import NotificationSettings from '../components/NotificationSettings';

const AdminDashboard = () => {
  const { token } = useAuthStore();
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPlan, setFilterPlan] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [activeTab, setActiveTab] = useState('users');

  useEffect(() => {
    fetchUsers();
    fetchDashboardStats();
  }, [currentPage, searchTerm, filterPlan, sortBy, sortOrder]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/admin/users`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          page: currentPage,
          limit: 20,
          search: searchTerm,
          plan: filterPlan,
          sortBy,
          sortOrder
        }
      });
      
      setUsers(response.data.users);
      setStats(response.data.stats);
      setTotalPages(response.data.pagination.pages);
    } catch (error) {
      console.error('Error fetching users:', error);
      if (error.response?.status === 403) {
        toast.error('Admin access required');
      } else {
        toast.error('Failed to fetch users');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchDashboardStats = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/admin/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDashboardStats(response.data);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    }
  };

  const fetchUserDetails = async (userId) => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/admin/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSelectedUser(response.data);
    } catch (error) {
      toast.error('Failed to fetch user details');
    }
  };

  const updateUser = async (userId, updates) => {
    try {
      await axios.patch(`${import.meta.env.VITE_API_URL}/admin/users/${userId}`, updates, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('User updated successfully');
      fetchUsers();
      setSelectedUser(null);
    } catch (error) {
      toast.error('Failed to update user');
    }
  };

  const deleteUser = async (userId, username) => {
    if (!confirm(`Are you sure you want to delete user "${username}"? This action cannot be undone.`)) {
      return;
    }
    
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/admin/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('User deleted successfully');
      fetchUsers();
    } catch (error) {
      toast.error('Failed to delete user');
    }
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const SortableHeader = ({ field, children }) => {
    const isActive = sortBy === field;
    const isAsc = isActive && sortOrder === 'asc';
    const isDesc = isActive && sortOrder === 'desc';
    
    return (
      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort(field)}>
        <div className="flex items-center space-x-1">
          <span>{children}</span>
          <div className="flex flex-col">
            {isActive ? (
              isAsc ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
            ) : (
              <ArrowUpDown className="w-3 h-3 opacity-50" />
            )}
          </div>
        </div>
      </th>
    );
  };

  const StatCard = ({ icon: Icon, label, value, color, trend }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl p-6 shadow-lg border border-gray-100"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm mb-1">{label}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {trend && (
            <div className="flex items-center mt-2 text-sm">
              <TrendingUp className={`w-4 h-4 mr-1 ${trend > 0 ? 'text-green-500' : 'text-red-500'}`} />
              <span className={trend > 0 ? 'text-green-500' : 'text-red-500'}>
                {trend > 0 ? '+' : ''}{trend}%
              </span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </motion.div>
  );

  const UserModal = ({ user, onClose, onUpdate }) => {
    const [credits, setCredits] = useState(user.totalCredits);
    const [verified, setVerified] = useState(user.emailVerified);
    const [plan, setPlan] = useState(user.subscription?.plan || 'FREE');
    const [status, setStatus] = useState(user.subscription?.status || 'ACTIVE');

    const handleSave = () => {
      onUpdate(user.id, {
        totalCredits: credits,
        emailVerified: verified,
        subscription: { plan, status }
      });
    };

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0.9 }}
          className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">User Details</h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-6">
            {/* User Info */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold mb-3">User Information</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Email</p>
                  <p className="font-medium">{user.email}</p>
                </div>
                <div>
                  <p className="text-gray-600">Username</p>
                  <p className="font-medium">{user.username}</p>
                </div>
                <div>
                  <p className="text-gray-600">Full Name</p>
                  <p className="font-medium">{user.fullName || 'Not set'}</p>
                </div>
                <div>
                  <p className="text-gray-600">Joined</p>
                  <p className="font-medium">{format(new Date(user.createdAt), 'MMM dd, yyyy')}</p>
                </div>
              </div>
            </div>

            {/* Editable Fields */}
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="font-semibold mb-3">Admin Controls</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-600">Credits</label>
                  <input
                    type="number"
                    value={credits}
                    onChange={(e) => setCredits(parseInt(e.target.value))}
                    className="w-full mt-1 px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600">Email Verified</label>
                  <select
                    value={verified}
                    onChange={(e) => setVerified(e.target.value === 'true')}
                    className="w-full mt-1 px-3 py-2 border rounded-lg"
                  >
                    <option value="true">Verified</option>
                    <option value="false">Not Verified</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Subscription Plan</label>
                  <select
                    value={plan}
                    onChange={(e) => setPlan(e.target.value)}
                    className="w-full mt-1 px-3 py-2 border rounded-lg"
                  >
                    <option value="FREE">Free</option>
                    <option value="STARTER">Starter</option>
                    <option value="PRO">Pro</option>
                    <option value="BUSINESS">Business</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Subscription Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full mt-1 px-3 py-2 border rounded-lg"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="CANCELLED">Cancelled</option>
                    <option value="EXPIRED">Expired</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Statistics */}
            <div className="bg-green-50 rounded-lg p-4">
              <h3 className="font-semibold mb-3">User Statistics</h3>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{user._count?.images || 0}</p>
                  <p className="text-gray-600">Images</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">{user._count?.generations || 0}</p>
                  <p className="text-gray-600">Generations</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-600">{user._count?.payments || 0}</p>
                  <p className="text-gray-600">Payments</p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                Save Changes
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Shield className="w-8 h-8 text-primary-600" />
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              {/* Tab Navigation */}
              <div className="flex items-center bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setActiveTab('users')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition ${activeTab === 'users' ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
                >
                  <Users className="w-4 h-4 mr-2 inline" />
                  Users
                </button>
                <button
                  onClick={() => setActiveTab('notifications')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition ${activeTab === 'notifications' ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
                >
                  <Bell className="w-4 h-4 mr-2 inline" />
                  Notifications
                </button>
              </div>
              <button
                onClick={() => {
                  fetchUsers();
                  fetchDashboardStats();
                }}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'users' && (
          <>
            {/* Stats Grid */}
            {dashboardStats && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard
                  icon={Users}
                  label="Total Users"
                  value={dashboardStats.users.total}
                  color="bg-blue-500"
                  trend={12}
                />
                <StatCard
                  icon={CreditCard}
                  label="Total Credits"
                  value={dashboardStats.users.totalCredits?.toLocaleString()}
                  color="bg-green-500"
                />
                <StatCard
                  icon={Image}
                  label="Generations"
                  value={dashboardStats.generations.total}
                  color="bg-purple-500"
                />
                <StatCard
                  icon={DollarSign}
                  label="Revenue"
                  value={`$${dashboardStats.payments.revenue?.toFixed(2)}`}
                  color="bg-yellow-500"
                />
              </div>
            )}

            {/* Search and Filters */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by email, username, or name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div className="flex gap-3">
                  <select
                    value={filterPlan}
                    onChange={(e) => setFilterPlan(e.target.value)}
                    className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">All Plans</option>
                    <option value="FREE">Free</option>
                    <option value="STARTER">Starter</option>
                    <option value="PRO">Pro</option>
                    <option value="BUSINESS">Business</option>
                  </select>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="createdAt">Join Date</option>
                    <option value="totalCredits">Credits</option>
                    <option value="username">Username</option>
                    <option value="email">Email</option>
                  </select>
                  <button
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                  >
                    {sortOrder === 'asc' ? '↑' : '↓'}
                  </button>
                </div>
              </div>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <SortableHeader field="username">User</SortableHeader>
                          <SortableHeader field="totalCredits">Credits</SortableHeader>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Plan
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Stats
                          </th>
                          <SortableHeader field="createdAt">Joined</SortableHeader>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {users.map((user) => (
                          <tr key={user.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <div className="text-sm font-medium text-gray-900">{user.username}</div>
                                <div className="text-sm text-gray-500">{user.email}</div>
                                {user.fullName && (
                                  <div className="text-xs text-gray-400">{user.fullName}</div>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <Sparkles className="w-4 h-4 text-yellow-500 mr-1" />
                                <span className="text-sm font-medium">{user.totalCredits}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                user.subscription?.plan === 'PRO' ? 'bg-purple-100 text-purple-800' :
                                user.subscription?.plan === 'BUSINESS' ? 'bg-blue-100 text-blue-800' :
                                user.subscription?.plan === 'STARTER' ? 'bg-green-100 text-green-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {user.subscription?.plan || 'FREE'}
                              </span>
                              {user.subscription?.status && user.subscription.status !== 'ACTIVE' && (
                                <span className="ml-2 px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">
                                  {user.subscription.status}
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <div className="flex items-center space-x-3">
                                <div className="flex items-center">
                                  <Image className="w-4 h-4 mr-1" />
                                  <span>{user._count?.images || 0}</span>
                                </div>
                                <div className="flex items-center">
                                  <Activity className="w-4 h-4 mr-1" />
                                  <span>{user._count?.generations || 0}</span>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {format(new Date(user.createdAt), 'MMM dd, yyyy')}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => fetchUserDetails(user.id)}
                                  className="text-primary-600 hover:text-primary-700"
                                  title="View Details"
                                >
                                  <Eye className="w-5 h-5" />
                                </button>
                                <button
                                  onClick={() => deleteUser(user.id, user.username)}
                                  className="text-red-600 hover:text-red-700"
                                  title="Delete User"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  <div className="px-6 py-4 bg-gray-50 border-t flex items-center justify-between">
                    <div className="text-sm text-gray-700">
                      Page {currentPage} of {totalPages}
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1 border rounded-lg hover:bg-gray-100 disabled:opacity-50"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1 border rounded-lg hover:bg-gray-100 disabled:opacity-50"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </>
        )}

        {activeTab === 'notifications' && (
          <NotificationSettings />
        )}

        {/* User Details Modal */}
        <AnimatePresence>
          {selectedUser && (
            <UserModal
              user={selectedUser}
              onClose={() => setSelectedUser(null)}
              onUpdate={updateUser}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AdminDashboard;