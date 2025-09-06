import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShoppingCart, Search, Eye, X, Clock, TrendingUp, 
  AlertCircle, DollarSign, Package, User, Calendar,
  RefreshCw, ShoppingBag, XCircle, CheckCircle,
  BarChart, Activity, Hash, MapPin, Download, Image
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuthStore } from '../stores/authStore';
import { format, formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';

const AdminCarts = () => {
  const { token } = useAuthStore();
  const [carts, setCarts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCart, setSelectedCart] = useState(null);
  const [stats, setStats] = useState(null);
  const [cartStats, setCartStats] = useState(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [sortBy, setSortBy] = useState('lastActivityAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [refreshInterval, setRefreshInterval] = useState(null);

  useEffect(() => {
    fetchCarts();
    fetchCartStats();
    
    // Автообновление каждые 30 секунд
    const interval = setInterval(() => {
      fetchCarts();
      fetchCartStats();
    }, 30000);
    
    setRefreshInterval(interval);
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [currentPage, filterStatus, sortBy, sortOrder]);

  const fetchCarts = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/carts`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          page: currentPage,
          limit: 20,
          status: filterStatus,
          sortBy,
          sortOrder
        }
      });
      
      setCarts(response.data.carts);
      setStats(response.data.stats);
      setTotalPages(response.data.pagination.pages);
    } catch (error) {
      console.error('Ошибка получения корзин:', error);
      toast.error('Не удалось загрузить корзины');
    } finally {
      setLoading(false);
    }
  };

  const fetchCartStats = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/carts/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCartStats(response.data.stats);
    } catch (error) {
      console.error('Ошибка получения статистики:', error);
    }
  };

  const fetchCartDetails = async (cartId) => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/carts/${cartId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSelectedCart(response.data.cart);
    } catch (error) {
      toast.error('Не удалось загрузить детали корзины');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'abandoned': return 'bg-yellow-100 text-yellow-800';
      case 'converted': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': return <ShoppingCart className="w-4 h-4" />;
      case 'abandoned': return <XCircle className="w-4 h-4" />;
      case 'converted': return <CheckCircle className="w-4 h-4" />;
      default: return <ShoppingCart className="w-4 h-4" />;
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const CartModal = ({ cart, onClose }) => {
    if (!cart) return null;

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
              <ShoppingCart className="w-6 h-6 text-primary-600" />
              <h2 className="text-2xl font-bold">Детали корзины</h2>
              <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(cart.status)}`}>
                {cart.status === 'active' ? 'Активная' : 
                 cart.status === 'abandoned' ? 'Брошенная' : 'Оплачена'}
              </span>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Информация о пользователе */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <User className="w-4 h-4" />
                Информация о пользователе
              </h3>
              <div className="space-y-2 text-sm">
                {cart.user ? (
                  <>
                    <div>
                      <span className="text-gray-600">Имя:</span>
                      <span className="ml-2 font-medium">{cart.user.fullName || cart.user.username}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Email:</span>
                      <span className="ml-2 font-medium">{cart.user.email}</span>
                    </div>
                  </>
                ) : (
                  <p className="text-gray-500">Анонимный пользователь</p>
                )}
                {cart.userIp && (
                  <div>
                    <span className="text-gray-600">IP:</span>
                    <span className="ml-2 font-mono text-xs">{cart.userIp}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Временные метки */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Временная информация
              </h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-600">Создана:</span>
                  <span className="ml-2">{format(new Date(cart.createdAt), 'dd.MM.yyyy HH:mm')}</span>
                </div>
                <div>
                  <span className="text-gray-600">Последняя активность:</span>
                  <span className="ml-2">
                    {formatDistanceToNow(new Date(cart.lastActivityAt), { addSuffix: true, locale: ru })}
                  </span>
                </div>
                {cart.abandonedAt && (
                  <div>
                    <span className="text-gray-600">Брошена:</span>
                    <span className="ml-2">{format(new Date(cart.abandonedAt), 'dd.MM.yyyy HH:mm')}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Товары в корзине */}
            <div className="bg-blue-50 rounded-lg p-4 lg:col-span-2">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <ShoppingBag className="w-4 h-4" />
                Товары в корзине ({cart.itemCount} шт.)
              </h3>
              <div className="space-y-3">
                {cart.items && cart.items.map((item, index) => {
                  const imageUrl = item.image || item.imageUrl;
                  
                  const handleViewImage = () => {
                    if (!imageUrl) return;
                    
                    if (imageUrl.startsWith('data:')) {
                      try {
                        const base64Data = imageUrl.split(',')[1];
                        const mimeMatch = imageUrl.match(/data:([^;]+);/);
                        const mimeType = mimeMatch ? mimeMatch[1] : 'image/png';
                        
                        const byteCharacters = atob(base64Data);
                        const byteNumbers = new Array(byteCharacters.length);
                        for (let i = 0; i < byteCharacters.length; i++) {
                          byteNumbers[i] = byteCharacters.charCodeAt(i);
                        }
                        const byteArray = new Uint8Array(byteNumbers);
                        const blob = new Blob([byteArray], { type: mimeType });
                        const url = window.URL.createObjectURL(blob);
                        window.open(url, '_blank');
                      } catch (err) {
                        console.error('Failed to open base64 image:', err);
                      }
                    } else {
                      window.open(imageUrl, '_blank');
                    }
                  };

                  return (
                    <div key={index} className="flex gap-3 items-center bg-white rounded-lg p-3">
                      {/* Превью изображения */}
                      <div className="flex-shrink-0">
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt={`Item ${index + 1}`}
                            className="w-16 h-16 rounded-lg object-cover cursor-pointer hover:opacity-80 transition-opacity border"
                            onClick={handleViewImage}
                            title="Нажмите для просмотра в полном размере"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiBmaWxsPSIjRjNGNEY2IiByeD0iOCIvPgo8cGF0aCBkPSJNMjAgMjBMMzIgMzJNMzIgMjBMMjAgMzIiIHN0cm9rZT0iIzlCOUNBNCIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KPC9zdmc+';
                            }}
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center border">
                            <Image className="w-6 h-6 text-gray-400" />
                          </div>
                        )}
                      </div>
                      
                      {/* Информация о товаре */}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">
                          Frame Poster #{index + 1}
                        </p>
                        <div className="text-sm text-gray-500 mt-1 space-y-1">
                          <div className="flex flex-wrap gap-x-3 gap-y-1">
                            <span className="flex items-center gap-1">
                              <div className="w-3 h-3 rounded-full border" style={{backgroundColor: item.frameColor || '#ccc'}}></div>
                              Цвет: {item.frameColorName || item.frameColor}
                            </span>
                            <span>Размер: {item.sizeName || item.size}</span>
                            <span>Кол-во: {item.quantity}</span>
                          </div>
                          {item.description && (
                            <p className="text-xs text-gray-400 truncate">{item.description}</p>
                          )}
                        </div>
                      </div>
                      
                      {/* Цена */}
                      <div className="flex-shrink-0 text-right">
                        <p className="font-semibold text-gray-900">
                          {formatCurrency(item.price * item.quantity)}
                        </p>
                        {item.quantity > 1 && (
                          <p className="text-xs text-gray-500">
                            {formatCurrency(item.price)} × {item.quantity}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
                
                {/* Итоговая сумма */}
                <div className="border-t pt-3 mt-3 bg-white rounded-lg p-3">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-gray-900">Итого:</span>
                    <span className="text-xl font-bold text-primary-600">
                      {formatCurrency(cart.totalAmount)} {cart.currency || 'UAH'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Статус конверсии */}
            {cart.convertedToOrderId && (
              <div className="bg-green-50 rounded-lg p-4 lg:col-span-2">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Корзина оплачена
                </h3>
                <p className="text-sm text-gray-600">
                  Заказ: <span className="font-mono">{cart.convertedToOrderId}</span>
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <ShoppingCart className="w-6 h-6" />
          Мониторинг корзин
        </h2>
        <button
          onClick={() => {
            fetchCarts();
            fetchCartStats();
            toast.success('Данные обновлены');
          }}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          <RefreshCw className="w-4 h-4" />
          Обновить
        </button>
      </div>

      {/* Статистика */}
      {cartStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white rounded-lg p-4 shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Всего корзин</p>
                <p className="text-2xl font-bold">{cartStats.totalCarts}</p>
              </div>
              <ShoppingCart className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-4 shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Активные</p>
                <p className="text-2xl font-bold text-green-600">{cartStats.activeCarts}</p>
              </div>
              <Activity className="w-8 h-8 text-green-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-4 shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Брошенные</p>
                <p className="text-2xl font-bold text-yellow-600">{cartStats.abandonedCarts}</p>
              </div>
              <XCircle className="w-8 h-8 text-yellow-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-4 shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Конверсия</p>
                <p className="text-2xl font-bold text-blue-600">{cartStats.conversionRate}%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-4 shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Потенциальный доход</p>
                <p className="text-xl font-bold text-purple-600">
                  {formatCurrency(cartStats.potentialRevenue)}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-purple-500" />
            </div>
          </div>
        </div>
      )}

      {/* Дополнительная статистика */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg p-4 shadow-sm border">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <BarChart className="w-4 h-4" />
              Текущие показатели
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Активные корзины:</span>
                <span className="font-medium">{stats.activeCarts}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Сумма активных:</span>
                <span className="font-medium">{formatCurrency(stats.activeCartValue)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Товаров в корзинах:</span>
                <span className="font-medium">{stats.activeItems}</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-4 shadow-sm border">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Брошенные корзины (7 дней)
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Количество:</span>
                <span className="font-medium">{stats.abandonedCarts}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Потерянная сумма:</span>
                <span className="font-medium text-red-600">{formatCurrency(stats.abandonedValue)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Средний чек:</span>
                <span className="font-medium">
                  {stats.abandonedCarts > 0 
                    ? formatCurrency(stats.abandonedValue / stats.abandonedCarts)
                    : formatCurrency(0)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Фильтры */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Все корзины</option>
              <option value="active">Активные</option>
              <option value="abandoned">Брошенные</option>
              <option value="converted">Оплаченные</option>
            </select>
          </div>
          <div className="flex gap-3">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="lastActivityAt">Последняя активность</option>
              <option value="createdAt">Дата создания</option>
              <option value="totalAmount">Сумма</option>
              <option value="itemCount">Кол-во товаров</option>
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

      {/* Таблица корзин */}
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
                      ID сессии
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Пользователь
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Товары
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Сумма
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Статус
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Активность
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Действия
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {carts.map((cart) => (
                    <tr key={cart.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Hash className="w-3 h-3 text-gray-400" />
                          <span className="text-xs font-mono">{cart.sessionId.slice(0, 20)}...</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {cart.user ? (
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {cart.user.fullName || cart.user.username}
                            </div>
                            <div className="text-sm text-gray-500">{cart.user.email}</div>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">Анонимный</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <ShoppingBag className="w-4 h-4 text-gray-400" />
                          <span className="text-sm font-medium">{cart.itemCount}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium">
                          {formatCurrency(cart.totalAmount)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full flex items-center gap-1 w-fit ${getStatusColor(cart.status)}`}>
                          {getStatusIcon(cart.status)}
                          {cart.status === 'active' ? 'Активная' : 
                           cart.status === 'abandoned' ? 'Брошенная' : 'Оплачена'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDistanceToNow(new Date(cart.lastActivityAt), { addSuffix: true, locale: ru })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          {/* Image Preview and Download */}
                          {cart.items && cart.items.length > 0 && (() => {
                            const item = cart.items[0];
                            const imageUrl = item.image || item.imageUrl;
                            
                            const handleDownloadImage = (e) => {
                              e.stopPropagation();
                              if (!imageUrl) return;
                              
                              const fileName = `cart_${cart.sessionId || 'unknown'}_item_1`;
                              
                              // Check if it's a base64 data URL
                              if (imageUrl.startsWith('data:')) {
                                try {
                                  const base64Data = imageUrl.split(',')[1];
                                  const mimeMatch = imageUrl.match(/data:([^;]+);/);
                                  const mimeType = mimeMatch ? mimeMatch[1] : 'image/png';
                                  const extension = mimeType.split('/')[1] || 'png';
                                  
                                  const byteCharacters = atob(base64Data);
                                  const byteNumbers = new Array(byteCharacters.length);
                                  for (let i = 0; i < byteCharacters.length; i++) {
                                    byteNumbers[i] = byteCharacters.charCodeAt(i);
                                  }
                                  const byteArray = new Uint8Array(byteNumbers);
                                  const blob = new Blob([byteArray], { type: mimeType });
                                  
                                  const url = window.URL.createObjectURL(blob);
                                  const a = document.createElement('a');
                                  a.style.display = 'none';
                                  a.href = url;
                                  a.download = `${fileName}.${extension}`;
                                  document.body.appendChild(a);
                                  a.click();
                                  window.URL.revokeObjectURL(url);
                                  document.body.removeChild(a);
                                } catch (err) {
                                  console.error('Failed to download base64 image:', err);
                                  toast.error('Failed to download image');
                                }
                              } else if (imageUrl.includes('cloudinary.com')) {
                                const downloadUrl = imageUrl.replace('/upload/', `/upload/fl_attachment:${fileName}/`);
                                window.open(downloadUrl, '_blank');
                              } else {
                                const a = document.createElement('a');
                                a.href = imageUrl;
                                a.download = `${fileName}.png`;
                                a.target = '_blank';
                                document.body.appendChild(a);
                                a.click();
                                document.body.removeChild(a);
                              }
                            };

                            const handleViewFullSize = (e) => {
                              e.stopPropagation();
                              if (!imageUrl) return;
                              
                              if (imageUrl.startsWith('data:')) {
                                try {
                                  const base64Data = imageUrl.split(',')[1];
                                  const mimeMatch = imageUrl.match(/data:([^;]+);/);
                                  const mimeType = mimeMatch ? mimeMatch[1] : 'image/png';
                                  
                                  const byteCharacters = atob(base64Data);
                                  const byteNumbers = new Array(byteCharacters.length);
                                  for (let i = 0; i < byteCharacters.length; i++) {
                                    byteNumbers[i] = byteCharacters.charCodeAt(i);
                                  }
                                  const byteArray = new Uint8Array(byteNumbers);
                                  const blob = new Blob([byteArray], { type: mimeType });
                                  const url = window.URL.createObjectURL(blob);
                                  window.open(url, '_blank');
                                } catch (err) {
                                  console.error('Failed to open base64 image:', err);
                                  toast.error('Failed to open image');
                                }
                              } else if (imageUrl.includes('cloudinary.com')) {
                                const parts = imageUrl.split('/upload/');
                                if (parts.length === 2) {
                                  const highQualityUrl = parts[0] + '/upload/q_auto:best,f_auto/' + parts[1].split('/').slice(-2).join('/');
                                  window.open(highQualityUrl, '_blank');
                                } else {
                                  window.open(imageUrl, '_blank');
                                }
                              } else {
                                window.open(imageUrl, '_blank');
                              }
                            };

                            return imageUrl ? (
                              <div className="flex items-center gap-1">
                                <div className="flex -space-x-1">
                                  {cart.items.slice(0, 3).map((item, idx) => {
                                    const itemImage = item.image || item.imageUrl;
                                    return itemImage ? (
                                      <img
                                        key={idx}
                                        src={itemImage}
                                        alt="Cart item"
                                        className="w-8 h-8 rounded-full border-2 border-white object-cover cursor-pointer hover:scale-105 transition-transform"
                                        onClick={handleViewFullSize}
                                        title={`${item.frameColor || item.frameColorName || 'Frame'} - ${item.size || item.sizeName || 'Size'}`}
                                        onError={(e) => {
                                          e.target.onerror = null;
                                          e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjMyIiBoZWlnaHQ9IjMyIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xNCAxMEwxOCAxNE0xOCAxMEwxNCAxNCIgc3Ryb2tlPSIjOUI5Q0E0IiBzdHJva2Utd2lkdGg9IjEiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPgo8L3N2Zz4=';
                                        }}
                                      />
                                    ) : null;
                                  })}
                                  {cart.items.length > 3 && (
                                    <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-xs font-medium">
                                      +{cart.items.length - 3}
                                    </div>
                                  )}
                                </div>
                                <button
                                  onClick={handleDownloadImage}
                                  className="p-1 text-gray-400 hover:text-primary-600 transition-colors"
                                  title="Скачать первое изображение"
                                >
                                  <Download className="w-4 h-4" />
                                </button>
                              </div>
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                                <Image className="w-4 h-4 text-gray-400" />
                              </div>
                            );
                          })()}
                          
                          <button
                            onClick={() => fetchCartDetails(cart.id)}
                            className="text-primary-600 hover:text-primary-700"
                            title="Просмотр деталей"
                          >
                            <Eye className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Пагинация */}
            <div className="px-6 py-4 bg-gray-50 border-t flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Страница {currentPage} из {totalPages}
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border rounded-lg hover:bg-gray-100 disabled:opacity-50"
                >
                  Назад
                </button>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 border rounded-lg hover:bg-gray-100 disabled:opacity-50"
                >
                  Вперед
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Модальное окно с деталями корзины */}
      <AnimatePresence>
        {selectedCart && (
          <CartModal
            cart={selectedCart}
            onClose={() => setSelectedCart(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminCarts;