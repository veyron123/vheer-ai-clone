import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { affiliateAPI } from '../services/affiliateAPI';

const AffiliateDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkForm, setLinkForm] = useState({
    name: '',
    url: '',
    subId: ''
  });
  const [referralLinks, setReferralLinks] = useState([
    { id: 1, name: 'Default', url: 'https://colibrrri.com/?ref=pinterest', subId: '', active: true },
    { id: 2, name: 'graphic-design', url: 'https://colibrrri.com/graphic-design?ref=pinterest&fp_sid=ads', subId: 'ads', active: true },
    { id: 3, name: 'thumbnail', url: 'https://colibrrri.com/?ref=pinterest&fp_sid=thumbnail', subId: 'thumbnail', active: true },
    { id: 4, name: 'ai-logo-maker', url: 'https://colibrrri.com/ai-logo-maker?ref=pinterest&fp_sid=logo', subId: 'logo', active: true },
    { id: 5, name: 'ai-font-generator', url: 'https://colibrrri.com/ai-font-generator?ref=pinterest&fp_sid=font', subId: 'font', active: true },
  ]);
  const [editingLink, setEditingLink] = useState(null);
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [customToken, setCustomToken] = useState('');
  const [activeReportTab, setActiveReportTab] = useState('sub-ids');
  const [reportTimeframe, setReportTimeframe] = useState('last30days');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedRows, setExpandedRows] = useState(new Set());
  
  // Mock data for Sub ID reports - в реальном приложении это будет загружаться с сервера
  const [subIdReports, setSubIdReports] = useState([
    { id: 1, subId: 'facebook_ads', earnings: 156.80, customers: 8, referrals: 42, clicks: 234 },
    { id: 2, subId: 'instagram_bio', earnings: 89.60, customers: 4, referrals: 28, clicks: 156 },
    { id: 3, subId: 'youtube_video', earnings: 243.20, customers: 12, referrals: 67, clicks: 389 },
    { id: 4, subId: 'email_campaign', earnings: 67.40, customers: 3, referrals: 19, clicks: 95 },
    { id: 5, subId: 'twitter_post', earnings: 45.00, customers: 2, referrals: 11, clicks: 67 },
    { id: 6, subId: 'blog_article', earnings: 178.40, customers: 9, referrals: 51, clicks: 412 },
    { id: 7, subId: 'tiktok_video', earnings: 312.60, customers: 15, referrals: 89, clicks: 567 },
    { id: 8, subId: 'google_ads', earnings: 423.80, customers: 21, referrals: 114, clicks: 892 },
  ]);
  const [affiliate, setAffiliate] = useState(null);
  const [stats, setStats] = useState({
    totalEarnings: 0,
    pendingPayouts: 0,
    totalClicks: 0,
    totalReferrals: 0,
    conversionRate: 0,
    activeCustomers: 0
  });

  useEffect(() => {
    initializeDashboard();
  }, []);

  useEffect(() => {
    if (activeReportTab === 'sub-ids') {
      loadSubIdReports();
    }
  }, [activeReportTab, reportTimeframe, searchQuery]);

  const initializeDashboard = async () => {
    try {
      setLoading(true);
      setError(null);

      // Try to create or get affiliate account
      const affiliateData = await affiliateAPI.createAffiliate();
      
      if (affiliateData?.affiliate) {
        setAffiliate(affiliateData.affiliate);
      }

      // Load dashboard stats
      const dashboardData = await affiliateAPI.getDashboard();
      
      if (dashboardData?.data) {
        const { affiliate: aff, stats: dashStats } = dashboardData.data;
        setAffiliate(aff);
        setStats(dashStats || stats);
      }
    } catch (err) {
      console.error('Failed to load affiliate dashboard:', err);
      setError(err.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const loadSubIdReports = async () => {
    try {
      const reports = await affiliateAPI.getSubIdReports({ 
        timeframe: reportTimeframe, 
        search: searchQuery 
      });
      
      if (reports && reports.length > 0) {
        // Map server data to match our UI format
        const formattedReports = reports.map((report, index) => ({
          id: index + 1,
          subId: report.subId,
          earnings: report.earnings,
          customers: report.customers,
          referrals: report.referrals,
          clicks: report.clicks
        }));
        setSubIdReports(formattedReports);
      }
    } catch (error) {
      console.error('Failed to load Sub ID reports:', error);
      // Keep mock data if API fails
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Требуется авторизация
          </h2>
          <p className="text-gray-600 mb-6">
            Войдите в систему для доступа к партнерскому кабинету
          </p>
          <button
            onClick={() => navigate('/login')}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Войти
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка партнерского кабинета...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
          <div className="text-center">
            <div className="text-red-500 text-5xl mb-4">⚠️</div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Ошибка загрузки
            </h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={initializeDashboard}
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
            >
              Попробовать снова
            </button>
          </div>
        </div>
      </div>
    );
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount || 0);
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('ru-RU').format(num || 0);
  };

  // Handlers for quick actions
  const handleCreateLink = () => {
    setLinkForm({
      name: '',
      url: `${window.location.origin}/`,
      subId: ''
    });
    setShowLinkModal(true);
  };

  const handleSubmitLink = () => {
    if (!linkForm.name.trim()) {
      setNotification({
        type: 'error',
        message: 'Ошибка',
        details: 'Название ссылки обязательно для заполнения'
      });
      setTimeout(() => setNotification(null), 3000);
      return;
    }

    // Build final URL with ref and subId
    let finalUrl = linkForm.url || `${window.location.origin}/`;
    
    // Ensure URL has proper protocol
    if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
      finalUrl = `https://${finalUrl}`;
    }
    
    // Add ref parameter
    const separator = finalUrl.includes('?') ? '&' : '?';
    finalUrl += `${separator}ref=${affiliate?.code || 'CODE'}`;
    
    // Add subId if provided
    if (linkForm.subId) {
      finalUrl += `&fp_sid=${linkForm.subId}`;
    }

    // Add new link to the list or update existing one
    if (editingLink) {
      const updatedLinks = referralLinks.map(link => 
        link.id === editingLink.id 
          ? { ...link, name: linkForm.name, url: finalUrl, subId: linkForm.subId }
          : link
      );
      setReferralLinks(updatedLinks);
      setEditingLink(null);
    } else {
      const newLink = {
        id: referralLinks.length + 1,
        name: linkForm.name,
        url: finalUrl,
        subId: linkForm.subId,
        active: true
      };
      setReferralLinks([...referralLinks, newLink]);
    }

    setReferralLinks([...referralLinks, newLink]);

    setNotification({
      type: 'success',
      message: editingLink ? `Ссылка "${linkForm.name}" обновлена!` : `Ссылка "${linkForm.name}" создана!`,
      details: linkForm.subId ? `Sub ID: ${linkForm.subId}` : 'Без Sub ID'
    });
    
    setShowLinkModal(false);
    setLinkForm({ name: '', url: '', subId: '' });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleCancelLink = () => {
    setShowLinkModal(false);
    setLinkForm({ name: '', url: '', subId: '' });
    setEditingLink(null);
  };

  const handleCustomizeToken = () => {
    setShowTokenModal(true);
  };

  const handleSaveToken = () => {
    if (!customToken.trim()) {
      setNotification({
        type: 'error',
        message: 'Ошибка',
        details: 'Введите пользовательский токен'
      });
      setTimeout(() => setNotification(null), 3000);
      return;
    }

    // Update all links with new custom token
    const updatedLinks = referralLinks.map(link => ({
      ...link,
      url: link.url.replace(/ref=[^&]+/, `ref=${customToken}`)
    }));
    
    setReferralLinks(updatedLinks);
    
    setNotification({
      type: 'success',
      message: 'Токен успешно обновлен!',
      details: `Новый токен: ${customToken}`
    });
    
    setShowTokenModal(false);
    setCustomToken('');
    setTimeout(() => setNotification(null), 5000);
  };

  const handleDeleteLink = (linkId) => {
    const linkToDelete = referralLinks.find(l => l.id === linkId);
    if (confirm(`Удалить ссылку "${linkToDelete.name}"?`)) {
      setReferralLinks(referralLinks.filter(l => l.id !== linkId));
      setNotification({
        type: 'success',
        message: 'Ссылка удалена',
        details: linkToDelete.name
      });
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const handleViewStats = () => {
    setNotification({
      type: 'info',
      message: 'Открытие детальной статистики...',
      details: 'Функция будет доступна в ближайшее время!'
    });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleRequestPayout = () => {
    if (stats.pendingPayouts < 50) {
      setNotification({
        type: 'warning',
        message: 'Недостаточно средств для выплаты',
        details: `Минимальная сумма: $50.00. Ваш баланс: ${formatCurrency(stats.pendingPayouts)}`
      });
    } else {
      const confirmed = confirm(`Запросить выплату ${formatCurrency(stats.pendingPayouts)}?`);
      if (confirmed) {
        setNotification({
          type: 'success',
          message: 'Запрос на выплату отправлен!',
          details: 'Выплата будет обработана в течение 3-5 рабочих дней.'
        });
      }
    }
    setTimeout(() => setNotification(null), 5000);
  };

  const handleViewMaterials = () => {
    setNotification({
      type: 'info',
      message: 'Загрузка рекламных материалов...',
      details: 'Баннеры • Текстовые шаблоны • Email шаблоны • Социальные посты',
      subtext: 'Функция будет доступна в ближайшее время!'
    });
    setTimeout(() => setNotification(null), 5000);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      {/* Token Customization Modal */}
      {showTokenModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
            <div className="border-b px-6 py-4">
              <h2 className="text-lg font-bold text-gray-900">Настроить партнерский токен</h2>
            </div>
            
            <div className="p-6">
              <p className="text-gray-600 mb-4">
                Введите пользовательский токен для ваших партнерских ссылок. 
                Он будет использован во всех ваших ссылках.
              </p>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Токен
                </label>
                <input
                  type="text"
                  value={customToken}
                  onChange={(e) => setCustomToken(e.target.value)}
                  placeholder={affiliate?.code || 'YOUR_TOKEN'}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Текущий токен: {affiliate?.code || 'pinterest'}
                </p>
              </div>
              
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setShowTokenModal(false);
                    setCustomToken('');
                  }}
                  className="px-6 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium"
                >
                  Отмена
                </button>
                <button
                  onClick={handleSaveToken}
                  className="px-6 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium"
                >
                  Сохранить
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Link Creation Modal */}
      {showLinkModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
            {/* Modal Header */}
            <div className="border-b px-6 py-4">
              <button 
                onClick={handleCancelLink}
                className="flex items-center text-gray-600 hover:text-gray-900 transition"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="text-sm font-medium">Назад</span>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                Создать новую ссылку
              </h2>

              {/* Name Field */}
              <div className="mb-5">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Название
                </label>
                <input
                  type="text"
                  value={linkForm.name}
                  onChange={(e) => setLinkForm({ ...linkForm, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
                  placeholder="Например: Основная ссылка"
                />
                <p className="text-xs text-red-500 mt-1">это обязательное поле</p>
              </div>

              {/* URL Field (Editable) */}
              <div className="mb-5">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  URL
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={linkForm.url}
                    onChange={(e) => setLinkForm({ ...linkForm, url: e.target.value })}
                    placeholder={`${window.location.origin}/`}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Введите URL страницы, на которую будет вести партнерская ссылка
                  </p>
                </div>
              </div>

              {/* Sub ID Field */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sub ID
                </label>
                <input
                  type="text"
                  value={linkForm.subId}
                  onChange={(e) => setLinkForm({ ...linkForm, subId: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
                  placeholder="Опционально"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Sub ID позволяет сегментировать или A/B тестировать трафик, отправленный на партнерскую ссылку.
                  Детали производительности можно увидеть в отчетах &gt; Sub ID.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 justify-end">
                <button
                  onClick={handleCancelLink}
                  className="px-6 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium"
                >
                  Отмена
                </button>
                <button
                  onClick={handleSubmitLink}
                  className="px-6 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition font-medium"
                >
                  {editingLink ? 'Сохранить' : 'Добавить'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notification Toast */}
      {notification && (
        <div className="fixed top-4 right-4 z-50 max-w-md animate-pulse">
          <div className={`rounded-lg shadow-lg p-4 ${
            notification.type === 'success' ? 'bg-green-500' :
            notification.type === 'warning' ? 'bg-yellow-500' :
            notification.type === 'error' ? 'bg-red-500' :
            'bg-blue-500'
          } text-white`}>
            <div className="flex items-start">
              <div className="flex-shrink-0">
                {notification.type === 'success' && '✅'}
                {notification.type === 'warning' && '⚠️'}
                {notification.type === 'error' && '❌'}
                {notification.type === 'info' && 'ℹ️'}
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium">
                  {notification.message}
                </p>
                {notification.details && (
                  <p className="mt-1 text-sm opacity-90">
                    {notification.details}
                  </p>
                )}
                {notification.subtext && (
                  <p className="mt-2 text-xs opacity-75">
                    {notification.subtext}
                  </p>
                )}
              </div>
              <button
                onClick={() => setNotification(null)}
                className="ml-4 flex-shrink-0 rounded-md hover:bg-white/20 p-1"
              >
                <span className="text-lg">×</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Партнерский кабинет
              </h1>
              <p className="text-gray-600 mt-1">
                Добро пожаловать, {user?.fullName || user?.email}!
              </p>
            </div>
            {affiliate && (
              <div className="bg-purple-100 px-4 py-2 rounded-lg">
                <p className="text-sm text-gray-600">Ваш партнерский код:</p>
                <p className="text-lg font-bold text-purple-600">
                  {affiliate.code}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Общий заработок</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(stats.totalEarnings)}
                </p>
              </div>
              <div className="text-green-500 text-3xl">💰</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Всего кликов</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatNumber(stats.totalClicks)}
                </p>
              </div>
              <div className="text-blue-500 text-3xl">👆</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Рефералы</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatNumber(stats.totalReferrals)}
                </p>
              </div>
              <div className="text-purple-500 text-3xl">👥</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Активные клиенты</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatNumber(stats.activeCustomers)}
                </p>
              </div>
              <div className="text-orange-500 text-3xl">🔥</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Конверсия</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.conversionRate?.toFixed(2)}%
                </p>
              </div>
              <div className="text-indigo-500 text-3xl">📈</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">К выплате</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(stats.pendingPayouts)}
                </p>
              </div>
              <div className="text-yellow-500 text-3xl">💳</div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            Быстрые действия
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <button 
              onClick={handleCreateLink}
              className="p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition cursor-pointer"
            >
              <div className="text-purple-600 text-2xl mb-2">🔗</div>
              <p className="text-sm font-medium">Создать ссылку</p>
            </button>
            <button 
              onClick={handleViewStats}
              className="p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition cursor-pointer"
            >
              <div className="text-blue-600 text-2xl mb-2">📊</div>
              <p className="text-sm font-medium">Статистика</p>
            </button>
            <button 
              onClick={handleRequestPayout}
              className="p-4 bg-green-50 hover:bg-green-100 rounded-lg transition cursor-pointer"
            >
              <div className="text-green-600 text-2xl mb-2">💸</div>
              <p className="text-sm font-medium">Запросить выплату</p>
            </button>
            <button 
              onClick={handleViewMaterials}
              className="p-4 bg-orange-50 hover:bg-orange-100 rounded-lg transition cursor-pointer"
            >
              <div className="text-orange-600 text-2xl mb-2">📚</div>
              <p className="text-sm font-medium">Материалы</p>
            </button>
          </div>
        </div>

        {/* Referral Links Table */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">Партнерские ссылки</h2>
            <div className="flex gap-3">
              <button 
                onClick={handleCustomizeToken}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span className="text-sm font-medium">Настроить токен</span>
              </button>
              <button 
                onClick={handleCreateLink}
                className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="text-sm font-medium">Новая ссылка</span>
              </button>
            </div>
          </div>

          {/* Links Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <tbody className="divide-y divide-gray-100">
                {referralLinks.map((link) => (
                  <tr key={link.id} className="group hover:bg-gray-50 transition">
                    <td className="py-4 pr-4">
                      <div className="flex items-center">
                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText(link.url);
                            setNotification({
                              type: 'success',
                              message: 'Ссылка скопирована!',
                              details: link.name
                            });
                            setTimeout(() => setNotification(null), 2000);
                          }}
                          className="mr-3 text-gray-400 hover:text-gray-600 transition"
                          title="Копировать ссылку"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                          </svg>
                        </button>
                        <div>
                          <p className="font-medium text-gray-900">{link.name}</p>
                          <p className="text-sm text-gray-500 break-all">{link.url}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition">
                        {/* Edit button */}
                        <button 
                          onClick={() => {
                            setEditingLink(link);
                            // Extract base URL without ref parameters
                            const baseUrl = link.url.split('?')[0];
                            setLinkForm({ 
                              name: link.name, 
                              url: baseUrl,
                              subId: link.subId 
                            });
                            setShowLinkModal(true);
                          }}
                          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition"
                          title="Редактировать"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        
                        {/* Copy button */}
                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText(link.url);
                            setNotification({
                              type: 'success',
                              message: 'Ссылка скопирована!',
                              details: link.name
                            });
                            setTimeout(() => setNotification(null), 2000);
                          }}
                          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition"
                          title="Копировать"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </button>

                        {/* Twitter share */}
                        <button 
                          onClick={() => {
                            window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(link.url)}`, '_blank');
                          }}
                          className="p-2 text-gray-400 hover:text-blue-400 hover:bg-gray-100 rounded transition"
                          title="Поделиться в Twitter"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                          </svg>
                        </button>

                        {/* Facebook share */}
                        <button 
                          onClick={() => {
                            window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link.url)}`, '_blank');
                          }}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-gray-100 rounded transition"
                          title="Поделиться в Facebook"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                          </svg>
                        </button>

                        {/* Delete button */}
                        <button 
                          onClick={() => handleDeleteLink(link.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition ml-2"
                          title="Удалить ссылку"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {referralLinks.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p className="mb-4">У вас пока нет партнерских ссылок</p>
              <button 
                onClick={handleCreateLink}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
              >
                Создать первую ссылку
              </button>
            </div>
          )}
        </div>

        {/* Reports Section */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">Отчеты</h2>
            <button className="p-2 text-gray-400 hover:text-gray-600 transition" title="Скачать отчет">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b mb-6">
            <button
              onClick={() => setActiveReportTab('overview')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
                activeReportTab === 'overview'
                  ? 'text-purple-600 border-purple-600'
                  : 'text-gray-500 border-transparent hover:text-gray-700'
              }`}
            >
              Обзор
            </button>
            <button
              onClick={() => setActiveReportTab('links')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
                activeReportTab === 'links'
                  ? 'text-purple-600 border-purple-600'
                  : 'text-gray-500 border-transparent hover:text-gray-700'
              }`}
            >
              Ссылки
            </button>
            <button
              onClick={() => setActiveReportTab('traffic')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
                activeReportTab === 'traffic'
                  ? 'text-purple-600 border-purple-600'
                  : 'text-gray-500 border-transparent hover:text-gray-700'
              }`}
            >
              Источники трафика
            </button>
            <button
              onClick={() => setActiveReportTab('sub-ids')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
                activeReportTab === 'sub-ids'
                  ? 'text-purple-600 border-purple-600'
                  : 'text-gray-500 border-transparent hover:text-gray-700'
              }`}
            >
              Sub-Ids
            </button>
          </div>

          {/* Sub ID Reports Tab */}
          {activeReportTab === 'sub-ids' && (
            <div>
              {/* Controls */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <div className="relative">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Начните поиск..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                    />
                    <svg className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>
                <select
                  value={reportTimeframe}
                  onChange={(e) => setReportTimeframe(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                >
                  <option value="today">Сегодня</option>
                  <option value="yesterday">Вчера</option>
                  <option value="last7days">Последние 7 дней</option>
                  <option value="last30days">Последние 30 дней</option>
                  <option value="thisMonth">Этот месяц</option>
                  <option value="lastMonth">Прошлый месяц</option>
                  <option value="custom">Выбрать период</option>
                </select>
              </div>

              {/* Sub ID Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <th className="pb-3 pr-4" width="40"></th>
                      <th className="pb-3 pr-4">SubId</th>
                      <th className="pb-3 pr-4 text-right">
                        <button className="flex items-center gap-1 ml-auto hover:text-gray-700">
                          Заработок
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                          </svg>
                        </button>
                      </th>
                      <th className="pb-3 pr-4 text-right">
                        <button className="flex items-center gap-1 ml-auto hover:text-gray-700">
                          Новые клиенты
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                          </svg>
                        </button>
                      </th>
                      <th className="pb-3 pr-4 text-right">
                        <button className="flex items-center gap-1 ml-auto hover:text-gray-700">
                          Новые рефералы
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                          </svg>
                        </button>
                      </th>
                      <th className="pb-3 text-right">
                        <button className="flex items-center gap-1 ml-auto hover:text-gray-700">
                          Клики
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                          </svg>
                        </button>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {subIdReports
                      .filter(report => 
                        !searchQuery || report.subId.toLowerCase().includes(searchQuery.toLowerCase())
                      )
                      .map((report) => (
                      <tr key={report.id} className="group hover:bg-gray-50 transition">
                        <td className="py-4 pr-4">
                          <button
                            onClick={() => {
                              const newExpanded = new Set(expandedRows);
                              if (expandedRows.has(report.id)) {
                                newExpanded.delete(report.id);
                              } else {
                                newExpanded.add(report.id);
                              }
                              setExpandedRows(newExpanded);
                            }}
                            className="p-1 hover:bg-gray-200 rounded transition"
                          >
                            <svg 
                              className={`w-4 h-4 text-gray-400 transition-transform ${
                                expandedRows.has(report.id) ? 'rotate-90' : ''
                              }`} 
                              fill="none" 
                              stroke="currentColor" 
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                        </td>
                        <td className="py-4 pr-4">
                          <p className="font-medium text-gray-900">{report.subId}</p>
                        </td>
                        <td className="py-4 pr-4 text-right">
                          <p className="text-gray-900">${report.earnings.toFixed(2)}</p>
                        </td>
                        <td className="py-4 pr-4 text-right">
                          <p className="text-gray-900">{report.customers}</p>
                        </td>
                        <td className="py-4 pr-4 text-right">
                          <p className="text-gray-900">{report.referrals}</p>
                        </td>
                        <td className="py-4 text-right">
                          <p className="text-gray-900">{report.clicks}</p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="border-t-2">
                    <tr className="font-medium">
                      <td className="py-4 pr-4"></td>
                      <td className="py-4 pr-4 text-gray-900">Итого</td>
                      <td className="py-4 pr-4 text-right text-gray-900">
                        ${subIdReports.reduce((sum, r) => sum + r.earnings, 0).toFixed(2)}
                      </td>
                      <td className="py-4 pr-4 text-right text-gray-900">
                        {subIdReports.reduce((sum, r) => sum + r.customers, 0)}
                      </td>
                      <td className="py-4 pr-4 text-right text-gray-900">
                        {subIdReports.reduce((sum, r) => sum + r.referrals, 0)}
                      </td>
                      <td className="py-4 text-right text-gray-900">
                        {subIdReports.reduce((sum, r) => sum + r.clicks, 0)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* Other tabs content */}
          {activeReportTab === 'overview' && (
            <div className="text-center py-12 text-gray-500">
              <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <p>Общая статистика будет доступна в ближайшее время</p>
            </div>
          )}

          {activeReportTab === 'links' && (
            <div className="text-center py-12 text-gray-500">
              <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              <p>Статистика по ссылкам будет доступна в ближайшее время</p>
            </div>
          )}

          {activeReportTab === 'traffic' && (
            <div className="text-center py-12 text-gray-500">
              <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p>Анализ источников трафика будет доступен в ближайшее время</p>
            </div>
          )}
        </div>

        {/* Original Referral Link Block */}
        {affiliate && (
          <div className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-lg shadow p-6 text-white">
            <h2 className="text-lg font-bold mb-4">
              Основная партнерская ссылка
            </h2>
            <div className="bg-white/20 backdrop-blur rounded-lg p-4">
              <p className="text-sm mb-2 text-white/90">
                Делитесь этой ссылкой для привлечения рефералов:
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={`${window.location.origin}?ref=${affiliate.code}`}
                  className="flex-1 bg-white/10 border border-white/30 rounded px-3 py-2 text-white"
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(
                      `${window.location.origin}?ref=${affiliate.code}`
                    );
                    setCopySuccess(true);
                    setTimeout(() => setCopySuccess(false), 2000);
                  }}
                  className="px-4 py-2 bg-white text-purple-600 rounded hover:bg-gray-100 transition relative"
                >
                  {copySuccess ? '✓ Скопировано' : 'Копировать'}
                </button>
              </div>
            </div>
            <div className="mt-4 text-sm text-white/80">
              💡 Совет: Вы получаете 20% от всех платежей привлеченных клиентов
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AffiliateDashboard;