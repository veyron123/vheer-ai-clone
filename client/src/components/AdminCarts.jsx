import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShoppingCart, Search, Eye, X, Clock, TrendingUp, 
  AlertCircle, DollarSign, Package, User, Calendar,
  RefreshCw, ShoppingBag, XCircle, CheckCircle,
  BarChart, Activity, Hash, MapPin
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
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'UAH',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount).replace('UAH', '₴');
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
              <div className="space-y-2">
                {cart.items && cart.items.map((item, index) => (
                  <div key={index} className="flex justify-between items-center bg-white rounded p-3">
                    <div className="flex-1">
                      <p className="font-medium">Frame Poster</p>
                      <div className="text-sm text-gray-500 mt-1">
                        <span>Цвет: {item.frameColorName || item.frameColor}</span>
                        <span className="mx-2">•</span>
                        <span>Размер: {item.sizeName || item.size}</span>
                        <span className="mx-2">•</span>
                        <span>Кол-во: {item.quantity}</span>
                      </div>
                    </div>
                    <p className="font-semibold">
                      {formatCurrency(item.price * item.quantity)}
                    </p>
                  </div>
                ))}
                <div className="border-t pt-3 mt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold">Итого:</span>
                    <span className="text-xl font-bold text-primary-600">
                      {formatCurrency(cart.totalAmount)}
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
                        <button
                          onClick={() => fetchCartDetails(cart.id)}
                          className="text-primary-600 hover:text-primary-700"
                          title="Просмотр деталей"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
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