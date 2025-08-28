import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Package, Search, Filter, Eye, Edit, Truck, X, Check, 
  AlertCircle, DollarSign, Calendar, User, MapPin, Phone,
  Mail, ChevronDown, ChevronUp, ArrowUpDown, RefreshCw,
  Bell, BellOff, ShoppingBag, Clock, CheckCircle, XCircle,
  FileText, Copy, ExternalLink, Hash, Download, Image as ImageIcon
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuthStore } from '../stores/authStore';
import { format } from 'date-fns';

const AdminOrders = () => {
  const { token } = useAuthStore();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPaymentStatus, setFilterPaymentStatus] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const notificationInterval = useRef(null);

  useEffect(() => {
    fetchOrders();
    fetchOrderStats();
    checkNotificationPermission();
    startNotificationPolling();

    return () => {
      if (notificationInterval.current) {
        clearInterval(notificationInterval.current);
      }
    };
  }, [currentPage, searchTerm, filterStatus, filterPaymentStatus, sortBy, sortOrder]);

  const checkNotificationPermission = async () => {
    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        setNotificationsEnabled(true);
      } else if (Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission();
        setNotificationsEnabled(permission === 'granted');
      }
    }
  };

  const startNotificationPolling = () => {
    // Poll for new orders every 30 seconds
    notificationInterval.current = setInterval(() => {
      fetchNewOrderNotifications();
    }, 30000);
    
    // Also fetch immediately
    fetchNewOrderNotifications();
  };

  const fetchNewOrderNotifications = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/cart-orders/notifications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.notifications && response.data.notifications.length > 0) {
        const newNotifications = response.data.notifications;
        setNotifications(newNotifications);
        
        // Show browser notification for the latest one
        if (notificationsEnabled && newNotifications.length > 0) {
          const latest = newNotifications[0];
          showBrowserNotification(latest);
        }
        
        // Mark as read after showing
        const notificationIds = newNotifications.map(n => n.id);
        await axios.post(`${import.meta.env.VITE_API_URL}/cart-orders/notifications/read`, 
          { notificationIds },
          { headers: { Authorization: `Bearer ${token}` }}
        );
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const showBrowserNotification = (notification) => {
    if (notificationsEnabled && 'Notification' in window && Notification.permission === 'granted') {
      const notif = new Notification(notification.title || '🛍️ New Order!', {
        body: notification.message || 'You have received a new order',
        icon: '/logo.png',
        badge: '/logo.png',
        vibrate: [200, 100, 200],
        tag: 'new-order',
        requireInteraction: true
      });
      
      notif.onclick = () => {
        window.focus();
        if (notification.orderId) {
          fetchOrderDetails(notification.orderId);
        }
        notif.close();
      };
      
      // Also show in-app toast
      toast.success(notification.message || 'New order received!', {
        duration: 5000,
        icon: '🛍️'
      });
    }
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/cart-orders`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          page: currentPage,
          limit: 20,
          search: searchTerm,
          status: filterStatus,
          paymentStatus: filterPaymentStatus,
          sortBy,
          sortOrder
        }
      });
      
      setOrders(response.data.orders);
      setTotalPages(response.data.pagination.pages);
      setStats(response.data.stats);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const fetchOrderStats = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/cart-orders/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Additional stats can be shown in dashboard
    } catch (error) {
      console.error('Error fetching order stats:', error);
    }
  };

  const fetchOrderDetails = async (orderId) => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/cart-orders/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSelectedOrder(response.data.order);
    } catch (error) {
      toast.error('Failed to fetch order details');
    }
  };

  const updateOrder = async (orderId, updates) => {
    try {
      await axios.patch(`${import.meta.env.VITE_API_URL}/cart-orders/${orderId}`, updates, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Order updated successfully');
      fetchOrders();
      setSelectedOrder(null);
    } catch (error) {
      toast.error('Failed to update order');
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const getStatusColor = (status) => {
    const normalizedStatus = (status || '').toLowerCase();
    switch (normalizedStatus) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'shipped': return 'bg-purple-100 text-purple-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (status) => {
    const normalizedStatus = (status || '').toLowerCase();
    switch (normalizedStatus) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'refunded': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const OrderModal = ({ order, onClose, onUpdate }) => {
    const [orderStatus, setOrderStatus] = useState(order.orderStatus || order.status || 'PENDING');
    const [trackingNumber, setTrackingNumber] = useState(order.trackingNumber || '');
    const [trackingCarrier, setTrackingCarrier] = useState(order.trackingCarrier || '');
    const [adminNotes, setAdminNotes] = useState(order.adminNotes || '');

    const handleSave = () => {
      onUpdate(order.id, {
        orderStatus,
        trackingNumber,
        trackingCarrier,
        adminNotes
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
          className="bg-white rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <Package className="w-6 h-6 text-primary-600" />
              <h2 className="text-2xl font-bold">Order Details</h2>
              <span className="text-sm text-gray-500">#{order.orderReference}</span>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Customer Information */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <User className="w-4 h-4" />
                Customer Information
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-gray-600">Name:</span>
                  <span className="font-medium">
                    {order.customerFirstName || order.user?.fullName || 'Guest'} {order.customerLastName || ''}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-3 h-3 text-gray-500" />
                  <span>{order.customerEmail || order.user?.email || 'No email'}</span>
                  <button onClick={() => copyToClipboard(order.customerEmail || order.user?.email)}>
                    <Copy className="w-3 h-3 text-gray-400 hover:text-gray-600" />
                  </button>
                </div>
                {order.customerPhone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-3 h-3 text-gray-500" />
                    <span>{order.customerPhone}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Shipping Address */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Shipping Address
              </h3>
              <div className="space-y-1 text-sm">
                <p className="font-medium">
                  {order.shippingFirstName} {order.shippingLastName}
                </p>
                <p>{order.shippingAddress}</p>
                <p>
                  {order.shippingCity}, {order.shippingCountry} {order.shippingPostalCode}
                </p>
                {order.shippingPhone && (
                  <p className="flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    {order.shippingPhone}
                  </p>
                )}
              </div>
            </div>

            {/* Order Items */}
            <div className="bg-blue-50 rounded-lg p-4 lg:col-span-2">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <ShoppingBag className="w-4 h-4" />
                Order Items
              </h3>
              <div className="space-y-2">
                {order.items && order.items.map((item, index) => {
                  const imageUrl = item.image || item.imageUrl;
                  
                  // Function to handle image download
                  const handleDownloadImage = () => {
                    if (!imageUrl) return;
                    
                    // Check if it's a Cloudinary URL
                    if (imageUrl.includes('cloudinary.com')) {
                      // Add fl_attachment to force download and set filename
                      const orderRef = order.orderReference || 'order';
                      const itemNum = index + 1;
                      const downloadUrl = imageUrl.replace('/upload/', `/upload/fl_attachment:${orderRef}_item_${itemNum}/`);
                      window.open(downloadUrl, '_blank');
                    } else {
                      // For non-Cloudinary URLs, download using fetch
                      fetch(imageUrl)
                        .then(response => response.blob())
                        .then(blob => {
                          const url = window.URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `order_${order.orderReference}_item_${index + 1}.png`;
                          document.body.appendChild(a);
                          a.click();
                          document.body.removeChild(a);
                          window.URL.revokeObjectURL(url);
                        })
                        .catch(err => {
                          console.error('Download failed:', err);
                          window.open(imageUrl, '_blank');
                        });
                    }
                  };
                  
                  const handleViewFullSize = () => {
                    if (!imageUrl) return;
                    
                    // For Cloudinary, get high quality version
                    if (imageUrl.includes('cloudinary.com')) {
                      // Remove transformations and get high quality
                      const parts = imageUrl.split('/upload/');
                      if (parts.length === 2) {
                        // Add quality auto and format auto for best results
                        const highQualityUrl = parts[0] + '/upload/q_auto:best,f_auto/' + parts[1].split('/').slice(-2).join('/');
                        window.open(highQualityUrl, '_blank');
                      } else {
                        window.open(imageUrl, '_blank');
                      }
                    } else {
                      window.open(imageUrl, '_blank');
                    }
                  };
                  
                  return (
                    <div key={index} className="flex justify-between items-center bg-white rounded p-3 gap-4">
                      <div className="flex items-center gap-3">
                        <div className="relative group">
                          {imageUrl ? (
                            <>
                              <img 
                                src={imageUrl} 
                                alt="Order item" 
                                className="w-16 h-16 object-cover rounded cursor-pointer transition-transform hover:scale-105"
                                onClick={handleViewFullSize}
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yOCAxOEwzNiAyOE0zNiAxOEwyOCAyOCIgc3Ryb2tlPSIjOUI5Q0E0IiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPgo8L3N2Zz4=';
                                }}
                              />
                              {/* Hover overlay with actions */}
                              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-all duration-200 rounded flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                                <button
                                  onClick={handleViewFullSize}
                                  className="p-1.5 bg-white rounded hover:bg-gray-100 transition-colors"
                                  title="View full size"
                                >
                                  <ExternalLink className="w-4 h-4 text-gray-700" />
                                </button>
                                <button
                                  onClick={handleDownloadImage}
                                  className="p-1.5 bg-white rounded hover:bg-gray-100 transition-colors"
                                  title="Download image"
                                >
                                  <Download className="w-4 h-4 text-gray-700" />
                                </button>
                              </div>
                            </>
                          ) : (
                            <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center">
                              <ImageIcon className="w-6 h-6 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{item.name || 'Mockup Design'}</p>
                          <p className="text-sm text-gray-600">
                            Frame: {item.frameColor || 'N/A'} | Size: {item.size || 'N/A'}
                          </p>
                          <p className="text-sm text-gray-500">Quantity: {item.quantity || 1}</p>
                          {imageUrl && (
                            <div className="flex gap-3 mt-1">
                              <button
                                onClick={handleDownloadImage}
                                className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors"
                              >
                                <Download className="w-3 h-3" />
                                Download
                              </button>
                              <button
                                onClick={handleViewFullSize}
                                className="text-xs text-gray-600 hover:text-gray-800 flex items-center gap-1 transition-colors"
                              >
                                <ExternalLink className="w-3 h-3" />
                                Full Size
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                      <p className="font-semibold whitespace-nowrap">
                        {order.currency || 'UAH'} {((item.price || 0) * (item.quantity || 1)).toFixed(2)}
                      </p>
                    </div>
                  );
                })}
                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between font-semibold">
                    <span>Total:</span>
                    <span>{order.currency} {(order.total || order.amount || 0).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Order Management */}
            <div className="bg-green-50 rounded-lg p-4 lg:col-span-2">
              <h3 className="font-semibold mb-3">Order Management</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-600">Order Status</label>
                  <select
                    value={orderStatus}
                    onChange={(e) => setOrderStatus(e.target.value)}
                    className="w-full mt-1 px-3 py-2 border rounded-lg"
                  >
                    <option value="PENDING">Pending</option>
                    <option value="PROCESSING">Processing</option>
                    <option value="SHIPPED">Shipped</option>
                    <option value="DELIVERED">Delivered</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Tracking Carrier</label>
                  <select
                    value={trackingCarrier}
                    onChange={(e) => setTrackingCarrier(e.target.value)}
                    className="w-full mt-1 px-3 py-2 border rounded-lg"
                  >
                    <option value="">Select carrier...</option>
                    <option value="ups">UPS</option>
                    <option value="fedex">FedEx</option>
                    <option value="dhl">DHL</option>
                    <option value="usps">USPS</option>
                    <option value="nova-poshta">Nova Poshta</option>
                    <option value="ukrposhta">Ukrposhta</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm text-gray-600">Tracking Number</label>
                  <input
                    type="text"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    placeholder="Enter tracking number..."
                    className="w-full mt-1 px-3 py-2 border rounded-lg"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm text-gray-600">Admin Notes</label>
                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Internal notes about this order..."
                    className="w-full mt-1 px-3 py-2 border rounded-lg"
                    rows="3"
                  />
                </div>
              </div>
            </div>

            {/* Timestamps */}
            <div className="bg-purple-50 rounded-lg p-4 lg:col-span-2">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Timeline
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Created</p>
                  <p className="font-medium">{format(new Date(order.createdAt), 'MMM dd, yyyy HH:mm')}</p>
                </div>
                {order.paidAt && (
                  <div>
                    <p className="text-gray-600">Paid</p>
                    <p className="font-medium">{format(new Date(order.paidAt), 'MMM dd, yyyy HH:mm')}</p>
                  </div>
                )}
                {order.shippedAt && (
                  <div>
                    <p className="text-gray-600">Shipped</p>
                    <p className="font-medium">{format(new Date(order.shippedAt), 'MMM dd, yyyy HH:mm')}</p>
                  </div>
                )}
                {order.deliveredAt && (
                  <div>
                    <p className="text-gray-600">Delivered</p>
                    <p className="font-medium">{format(new Date(order.deliveredAt), 'MMM dd, yyyy HH:mm')}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 mt-6">
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
        </motion.div>
      </motion.div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header with Notifications Toggle */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Package className="w-6 h-6" />
          Orders Management
        </h2>
        <button
          onClick={() => {
            if (notificationsEnabled) {
              setNotificationsEnabled(false);
              toast.success('Notifications disabled');
            } else {
              checkNotificationPermission();
            }
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
            notificationsEnabled 
              ? 'bg-green-100 text-green-700 hover:bg-green-200' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {notificationsEnabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
          {notificationsEnabled ? 'Notifications On' : 'Notifications Off'}
        </button>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg p-4 shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Orders</p>
                <p className="text-2xl font-bold">{stats.totalOrders}</p>
              </div>
              <Package className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold">₴{stats.totalRevenue?.toFixed(2)}</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Paid Orders</p>
                <p className="text-2xl font-bold">{stats.paidOrders}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold">{stats.statusBreakdown?.pending || 0}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-500" />
            </div>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by order reference, email, name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div className="flex gap-3">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <select
              value={filterPaymentStatus}
              onChange={(e) => setFilterPaymentStatus(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All Payments</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </select>
            <button
              onClick={fetchOrders}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Orders Table */}
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Order
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Payment
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Hash className="w-3 h-3 text-gray-400" />
                          <span className="text-sm font-medium">{order.orderReference}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {order.customerFirstName || order.user?.fullName || 'Guest'} {order.customerLastName || ''}
                          </div>
                          <div className="text-sm text-gray-500">
                            {order.customerEmail || order.user?.email || 'No email'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium">
                          {order.currency} {(order.total || order.amount || 0).toFixed(2)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${getPaymentStatusColor(order.paymentStatus)}`}>
                          {(order.paymentStatus || 'PENDING').toLowerCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(order.orderStatus || order.status)}`}>
                          {(order.orderStatus || order.status || 'PENDING').toLowerCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {format(new Date(order.createdAt), 'MMM dd, yyyy')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => fetchOrderDetails(order.id)}
                          className="text-primary-600 hover:text-primary-700"
                          title="View Details"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
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

      {/* Order Details Modal */}
      <AnimatePresence>
        {selectedOrder && (
          <OrderModal
            order={selectedOrder}
            onClose={() => setSelectedOrder(null)}
            onUpdate={updateOrder}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminOrders;