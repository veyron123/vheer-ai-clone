import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { motion } from 'framer-motion';
import { 
  User, 
  Image, 
  CreditCard, 
  Settings, 
  LogOut,
  Download,
  Eye,
  EyeOff,
  Trash2,
  Grid3x3,
  Save,
  Loader,
  Search,
  Filter,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Clock,
  Zap,
  BarChart3,
  X
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import { useAuthStore } from '../stores/authStore';
import toast from 'react-hot-toast';
import DangerZone from '../components/profile/DangerZone';

const ProfilePage = () => {
  const { user, logout, updateUser } = useAuthStore();
  const { t } = useTranslation('profile');
  const [activeTab, setActiveTab] = useState('images');
  
  // Function to translate plan names
  const translatePlan = (plan) => {
    const planTranslations = {
      'FREE': t('plans.free', { defaultValue: 'Безкоштовний' }),
      'BASIC': t('plans.basic', { defaultValue: 'Базовий' }),
      'PRO': t('plans.pro', { defaultValue: 'Професійний' }),
      'PREMIUM': t('plans.premium', { defaultValue: 'Преміум' })
    };
    return planTranslations[plan] || plan;
  };

  // Function to format subscription expiry date
  const formatExpiryDate = (expiryDate) => {
    if (!expiryDate) return null;
    
    const now = new Date();
    const expiry = new Date(expiryDate);
    const diffInDays = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
    
    if (diffInDays < 0) {
      return { text: t('subscription.expired'), color: 'text-red-600', urgent: true };
    } else if (diffInDays === 0) {
      return { text: t('subscription.expires_today'), color: 'text-red-600', urgent: true };
    } else if (diffInDays === 1) {
      return { text: t('subscription.expires_tomorrow'), color: 'text-orange-600', urgent: true };
    } else if (diffInDays <= 7) {
      return { text: `${diffInDays} ${t('subscription.days_left')}`, color: 'text-orange-600', urgent: false };
    } else {
      return { 
        text: `${t('subscription.expires_on')} ${expiry.toLocaleDateString()}`, 
        color: 'text-gray-600', 
        urgent: false 
      };
    }
  };
  const [settingsForm, setSettingsForm] = useState({
    fullName: '',
    bio: '',
    website: '',
    location: ''
  });

  // Update form when user data loads
  React.useEffect(() => {
    if (user) {
      setSettingsForm({
        fullName: user.fullName || '',
        bio: user.bio || '',
        website: user.website || '',
        location: user.location || ''
      });
    }
  }, [user]);
  const queryClient = useQueryClient();

  // Fetch user's images
  const { data: imagesData, refetch: refetchImages, isLoading: imagesLoading } = useQuery(
    ['myImages'],
    () => api.get('/images/my-images').then(res => res.data),
    {
      enabled: activeTab === 'images'
    }
  );

  // Generation history filters
  const [generationFilters, setGenerationFilters] = useState({
    page: 1,
    limit: 10,
    status: '',
    model: '',
    search: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });

  // Fetch user's generation history
  const { data: generationsData, isLoading: generationsLoading, refetch: refetchGenerations } = useQuery(
    ['myGenerations', generationFilters],
    () => {
      const params = new URLSearchParams();
      Object.entries(generationFilters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
      return api.get(`/generate/history?${params.toString()}`).then(res => res.data);
    },
    {
      enabled: activeTab === 'generations',
      keepPreviousData: true
    }
  );

  // Update user settings mutation
  const updateSettingsMutation = useMutation(
    (data) => api.patch('/users/profile', data),
    {
      onSuccess: (response) => {
        toast.success(t('settings.messages.save_success'));
        updateUser(response.data.user);
        queryClient.invalidateQueries(['user']);
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || t('settings.messages.save_error'));
      }
    }
  );

  // Cancel subscription mutation
  const cancelSubscriptionMutation = useMutation(
    () => api.post('/payments/wayforpay/cancel'),
    {
      onSuccess: (response) => {
        toast.success(t('subscription.cancel_success'));
        // Update user data immediately with the response
        if (response.data.user) {
          updateUser(response.data.user);
        }
        queryClient.invalidateQueries(['user']);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || error.response?.data?.error || t('subscription.cancel_error'));
      }
    }
  );

  const handleToggleVisibility = async (imageId, isPublic) => {
    try {
      await api.patch(`/images/${imageId}/visibility`, { isPublic });
      const action = isPublic ? 'публічним' : 'приватним';
      toast.success(t('images.visibility_success', { action }));
      refetchImages();
    } catch (error) {
      toast.error(t('images.error'));
    }
  };

  const handleDeleteImage = async (imageId) => {
    if (!window.confirm(t('images.delete_confirm'))) return;
    
    try {
      await api.delete(`/images/${imageId}`);
      toast.success(t('images.delete_success'));
      refetchImages();
    } catch (error) {
      toast.error(t('images.error'));
    }
  };

  const handleCancelSubscription = async () => {
    if (!window.confirm(t('subscription.cancel_confirm'))) return;
    
    cancelSubscriptionMutation.mutate();
  };

  const downloadImage = async (imageUrl, filename = 'image.png') => {
    try {
      // Use backend proxy for downloading
      const response = await fetch('/api/images/download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageUrl: imageUrl
        })
      });

      if (!response.ok) {
        throw new Error('Download failed');
      }

      // Get the blob from response
      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
      // Fallback: use viewImage function which handles data URLs properly
      await viewImage(imageUrl);
    }
  };

  const viewImage = async (imageUrl) => {
    try {
      let viewUrl = imageUrl;
      
      // For data URLs, convert to blob URL to avoid browser restrictions
      if (imageUrl.startsWith('data:')) {
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        viewUrl = URL.createObjectURL(blob);
      }
      
      // Open in new tab
      const newWindow = window.open(viewUrl, '_blank', 'noopener,noreferrer');
      
      // Clean up blob URL after a short delay
      if (viewUrl !== imageUrl) {
        setTimeout(() => {
          URL.revokeObjectURL(viewUrl);
        }, 1000);
      }
      
      // If window.open failed (popup blocked), show alert
      if (!newWindow) {
        alert('Please allow popups for this site to view images in new tab');
      }
    } catch (error) {
      console.error('Error viewing image:', error);
      // Fallback: try direct open anyway
      window.open(imageUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handleSaveSettings = (e) => {
    e.preventDefault();
    updateSettingsMutation.mutate(settingsForm);
  };

  const handleSettingsChange = (field, value) => {
    setSettingsForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Generation history functions
  const handleRegenerateImage = async (generationId) => {
    try {
      await api.post(`/generate/${generationId}/regenerate`);
      toast.success(t('generations.details.regenerate') + '...');
      refetchGenerations();
    } catch (error) {
      toast.error('Failed to regenerate image');
    }
  };

  const handleDeleteGeneration = async (generationId) => {
    if (!window.confirm(t('generations.delete_confirm'))) return;
    
    try {
      await api.delete(`/generate/${generationId}`);
      toast.success(t('generations.details.delete') + 'd');
      refetchGenerations();
    } catch (error) {
      toast.error('Failed to delete generation');
    }
  };

  const handleFilterChange = (key, value) => {
    setGenerationFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1 // Reset to first page when filtering
    }));
  };

  const handlePageChange = (newPage) => {
    setGenerationFilters(prev => ({
      ...prev,
      page: newPage
    }));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'COMPLETED': return 'bg-green-100 text-green-700';
      case 'FAILED': return 'bg-red-100 text-red-700';
      case 'PROCESSING': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const formatModel = (model) => {
    return model.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const tabs = [
    { id: 'images', label: t('tabs.images'), icon: Image },
    { id: 'generations', label: t('tabs.generations'), icon: Grid3x3 },
    { id: 'subscription', label: t('tabs.subscription'), icon: CreditCard },
    { id: 'settings', label: t('tabs.settings'), icon: Settings }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container-custom">
        <div className="max-w-6xl mx-auto">
          {/* Profile Header */}
          <div className="card p-8 mb-8">
            <div className="flex items-center space-x-6">
              <div className="w-24 h-24 bg-primary-500 rounded-full flex items-center justify-center text-white text-3xl font-bold">
                {user?.username?.[0]?.toUpperCase() || 'U'}
              </div>
              <div className="flex-1">
                <h1 className="text-3xl font-bold mb-2">{user?.fullName || user?.username}</h1>
                <p className="text-gray-600 mb-4">@{user?.username}</p>
                <div className="flex items-center space-x-6 text-sm">
                  <div className="flex items-center space-x-2">
                    <Image className="w-4 h-4 text-gray-500" />
                    <span>{t('header.images_count', { count: imagesData?.images?.length || 0 })}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CreditCard className="w-4 h-4 text-gray-500" />
                    <span className="font-medium text-primary-600">{t('header.credits', { count: user?.totalCredits || 0 })}</span>
                  </div>
                  <div className="flex items-center space-x-3 flex-wrap">
                    <div className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full font-medium">
                      {t('header.plan', { plan: translatePlan(user?.subscription?.plan || 'FREE') })}
                    </div>
                    
                    {/* Expiry Date Display - Only for Cancelled Subscriptions */}
                    {user?.subscription?.plan && 
                     user?.subscription?.plan !== 'FREE' && 
                     user?.subscription?.status === 'CANCELLED' && 
                     user?.subscription?.currentPeriodEnd && (() => {
                       const now = new Date();
                       const endDate = new Date(user.subscription.currentPeriodEnd);
                       
                       // Show only if subscription hasn't expired yet
                       if (endDate > now) {
                         const expiryInfo = formatExpiryDate(user.subscription.currentPeriodEnd);
                         if (expiryInfo) {
                           return (
                             <div className={`px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${
                               expiryInfo.urgent 
                                 ? 'bg-red-100 text-red-700' 
                                 : 'bg-gray-100 text-gray-700'
                             }`}>
                               <Calendar className="w-3 h-3" />
                               <span>{expiryInfo.text}</span>
                             </div>
                           );
                         }
                       }
                       return null;
                     })()}
                    
                    {user?.subscription?.plan && 
                     user?.subscription?.plan !== 'FREE' && 
                     user?.subscription?.status === 'ACTIVE' && (
                      <button
                        onClick={handleCancelSubscription}
                        disabled={cancelSubscriptionMutation.isLoading}
                        className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium hover:bg-red-200 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
                        title={t('subscription.cancel_button')}
                      >
                        <X className="w-3 h-3" />
                        <span>{t('subscription.cancel_button')}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex space-x-1 mb-8 bg-white rounded-lg p-1 shadow-sm">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-lg transition ${
                    activeTab === tab.id
                      ? 'bg-primary-500 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Tab Content */}
          {activeTab === 'images' && (
            <div>
              {imagesLoading ? (
                <div className="flex justify-center items-center py-20">
                  <Loader className="w-8 h-8 animate-spin text-primary-500" />
                  <span className="ml-2 text-gray-600">{t('images.loading')}</span>
                </div>
              ) : imagesData?.message ? (
                <div className="card p-20 text-center">
                  <CreditCard className="w-24 h-24 text-amber-400 mx-auto mb-4" />
                  <p className="text-gray-600 text-lg font-medium mb-2">{t('images.premium_feature')}</p>
                  <p className="text-gray-500 text-sm mb-6">{imagesData.message}</p>
                  <div className="flex justify-center space-x-4">
                    <button 
                      onClick={() => setActiveTab('generations')}
                      className="btn btn-outline"
                    >
                      <Grid3x3 className="w-4 h-4 mr-2" />
                      {t('images.buttons.view_history')}
                    </button>
                    <button className="btn btn-primary">
                      <CreditCard className="w-4 h-4 mr-2" />
                      {t('images.buttons.upgrade_plan')}
                    </button>
                  </div>
                </div>
              ) : imagesData?.images?.length > 0 ? (
                <div>
                  {/* Image Stats for Paid Users */}
                  <div className="card p-4 mb-6 bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <Image className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium text-green-800">{t('images.premium_collection')}</p>
                          <p className="text-sm text-green-600">{t('images.images_saved', { count: imagesData.images.length })}</p>
                        </div>
                      </div>
                      <div className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                        {t('images.premium_access')}
                      </div>
                    </div>
                  </div>

                  {/* Images Grid */}
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {imagesData.images.map((image, index) => (
                      <motion.div
                        key={image.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        className="card overflow-hidden group hover:shadow-lg transition-shadow"
                      >
                        <div className="relative">
                          <img
                            src={image.thumbnailUrl || image.url}
                            alt={image.prompt}
                            className="w-full h-64 object-cover"
                          />
                          <div className="absolute top-2 right-2 flex space-x-2">
                            <button
                              onClick={() => handleToggleVisibility(image.id, !image.isPublic)}
                              className="p-2 bg-white/90 rounded-lg shadow hover:bg-white transition"
                              title={image.isPublic ? t('images.actions.make_private') : t('images.actions.make_public')}
                            >
                              {image.isPublic ? (
                                <Eye className="w-4 h-4 text-green-600" />
                              ) : (
                                <EyeOff className="w-4 h-4 text-gray-600" />
                              )}
                            </button>
                            <button
                              onClick={() => viewImage(image.url)}
                              className="p-2 bg-white/90 rounded-lg shadow hover:bg-white transition"
                              title={t('images.actions.view')}
                            >
                              <Eye className="w-4 h-4 text-gray-600" />
                            </button>
                            <button
                              onClick={() => downloadImage(image.url, `my-image-${image.id}.png`)}
                              className="p-2 bg-white/90 rounded-lg shadow hover:bg-white transition"
                              title={t('images.actions.download')}
                            >
                              <Download className="w-4 h-4 text-blue-600" />
                            </button>
                            <button
                              onClick={() => handleDeleteImage(image.id)}
                              className="p-2 bg-white/90 rounded-lg shadow hover:bg-white transition text-red-500 hover:text-red-600"
                              title={t('images.actions.delete')}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          {image.isPublic && (
                            <div className="absolute top-2 left-2">
                              <div className="px-2 py-1 bg-green-500 text-white text-xs rounded-full">
                                {t('images.public')}
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="p-4">
                          <p className="text-sm text-gray-600 line-clamp-2 mb-2">{image.prompt}</p>
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span className="font-medium">{image.model}</span>
                            <span>{new Date(image.createdAt).toLocaleDateString()}</span>
                          </div>
                          {image.generation && (
                            <div className="mt-2 text-xs text-gray-400">
                              Generation: {image.generation.id.slice(0, 8)}...
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="card p-20 text-center">
                  <Image className="w-24 h-24 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600 text-lg">{t('images.empty_title')}</p>
                  <p className="text-gray-500 text-sm mt-2 mb-6">
                    {t('images.empty_description')}
                  </p>
                  <button 
                    onClick={() => window.location.href = '/image-style-transfer'}
                    className="btn btn-primary"
                  >
                    {t('images.buttons.start_generating')}
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'generations' && (
            <div className="space-y-6">
              {/* Statistics Cards */}
              {generationsData?.stats && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="card p-4">
                    <div className="flex items-center">
                      <BarChart3 className="w-8 h-8 text-primary-500 mr-3" />
                      <div>
                        <p className="text-2xl font-bold">{generationsData.stats.totalGenerations}</p>
                        <p className="text-sm text-gray-600">{t('generations.stats.total_generations')}</p>
                      </div>
                    </div>
                  </div>
                  <div className="card p-4">
                    <div className="flex items-center">
                      <Zap className="w-8 h-8 text-yellow-500 mr-3" />
                      <div>
                        <p className="text-2xl font-bold">{generationsData.stats.totalCreditsUsed}</p>
                        <p className="text-sm text-gray-600">{t('generations.stats.credits_used')}</p>
                      </div>
                    </div>
                  </div>
                  <div className="card p-4">
                    <div className="flex items-center">
                      <Grid3x3 className="w-8 h-8 text-green-500 mr-3" />
                      <div>
                        <p className="text-2xl font-bold">{generationsData.stats.statusBreakdown?.COMPLETED || 0}</p>
                        <p className="text-sm text-gray-600">{t('generations.stats.completed')}</p>
                      </div>
                    </div>
                  </div>
                  <div className="card p-4">
                    <div className="flex items-center">
                      <Clock className="w-8 h-8 text-blue-500 mr-3" />
                      <div>
                        <p className="text-2xl font-bold">{generationsData.stats.statusBreakdown?.PROCESSING || 0}</p>
                        <p className="text-sm text-gray-600">{t('generations.stats.processing')}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Filters and Search */}
              <div className="card p-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="text"
                        placeholder={t('generations.filters.search_placeholder')}
                        value={generationFilters.search}
                        onChange={(e) => handleFilterChange('search', e.target.value)}
                        className="input pl-10"
                      />
                    </div>
                  </div>
                  <select
                    value={generationFilters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    className="input md:w-40"
                  >
                    <option value="">{t('generations.filters.all_status')}</option>
                    <option value="COMPLETED">{t('generations.status.COMPLETED')}</option>
                    <option value="PROCESSING">{t('generations.status.PROCESSING')}</option>
                    <option value="FAILED">{t('generations.status.FAILED')}</option>
                  </select>
                  <select
                    value={generationFilters.model}
                    onChange={(e) => handleFilterChange('model', e.target.value)}
                    className="input md:w-40"
                  >
                    <option value="">{t('generations.filters.all_models')}</option>
                    <option value="stable-diffusion-xl">SDXL</option>
                    <option value="kandinsky">Kandinsky</option>
                    <option value="anime">Anime</option>
                    <option value="realistic-vision">Realistic</option>
                  </select>
                  <select
                    value={generationFilters.sortBy}
                    onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                    className="input md:w-40"
                  >
                    <option value="createdAt">{t('generations.filters.sort_by_date')}</option>
                    <option value="creditsUsed">{t('generations.filters.sort_by_credits')}</option>
                    <option value="status">{t('generations.filters.sort_by_status')}</option>
                  </select>
                </div>
              </div>

              {/* Generation History List */}
              {generationsLoading ? (
                <div className="flex justify-center items-center py-20">
                  <Loader className="w-8 h-8 animate-spin text-primary-500" />
                  <span className="ml-2 text-gray-600">{t('generations.loading')}</span>
                </div>
              ) : generationsData?.generations?.length > 0 ? (
                <div className="space-y-4">
                  {generationsData.generations.map((generation) => (
                    <motion.div
                      key={generation.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="card p-6"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <p className="font-medium mb-2 line-clamp-2">{generation.prompt}</p>
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span className="flex items-center">
                              <Grid3x3 className="w-4 h-4 mr-1" />
                              {formatModel(generation.model)}
                            </span>
                            <span className="flex items-center">
                              <Image className="w-4 h-4 mr-1" />
                              {t('generations.details.images_count', { count: generation.images?.length || 0 })}
                            </span>
                            <span className="flex items-center">
                              <Zap className="w-4 h-4 mr-1" />
                              {t('generations.details.credits_used', { count: generation.creditsUsed })}
                            </span>
                            <span className="flex items-center">
                              <Calendar className="w-4 h-4 mr-1" />
                              {new Date(generation.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(generation.status)}`}>
                            {generation.status}
                          </span>
                          {generation.status === 'COMPLETED' && (
                            <button
                              onClick={() => handleRegenerateImage(generation.id)}
                              className="p-2 text-gray-400 hover:text-primary-500 transition"
                              title={t('generations.details.regenerate')}
                            >
                              <RefreshCw className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteGeneration(generation.id)}
                            className="p-2 text-gray-400 hover:text-red-500 transition"
                            title={t('generations.details.delete')}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      
                      {generation.images?.length > 0 && (
                        <div className="flex space-x-2 overflow-x-auto pb-2">
                          {generation.images.map(img => (
                            <div key={img.id} className="flex-shrink-0">
                              <img
                                src={img.thumbnailUrl || img.url}
                                alt=""
                                className="w-20 h-20 rounded-lg object-cover cursor-pointer hover:opacity-80 transition"
                                onClick={() => window.open(img.url, '_blank')}
                              />
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {generation.negativePrompt && (
                        <div className="mt-3 text-sm">
                          <span className="text-gray-500">{t('generations.details.negative_prompt')} </span>
                          <span className="text-gray-700">{generation.negativePrompt}</span>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="card p-20 text-center">
                  <Grid3x3 className="w-24 h-24 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600 text-lg">{t('generations.empty_title')}</p>
                  <p className="text-gray-500 text-sm mt-2">{t('generations.empty_description')}</p>
                </div>
              )}

              {/* Pagination */}
              {generationsData?.pagination && generationsData.pagination.pages > 1 && (
                <div className="flex justify-center items-center space-x-4 mt-6">
                  <button
                    onClick={() => handlePageChange(generationFilters.page - 1)}
                    disabled={generationFilters.page <= 1}
                    className="btn btn-outline disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    {t('generations.pagination.previous')}
                  </button>
                  <span className="text-gray-600">
                    {t('generations.pagination.page_of', { current: generationFilters.page, total: generationsData.pagination.pages })}
                  </span>
                  <button
                    onClick={() => handlePageChange(generationFilters.page + 1)}
                    disabled={generationFilters.page >= generationsData.pagination.pages}
                    className="btn btn-outline disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {t('generations.pagination.next')}
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'subscription' && (
            <div className="card p-8">
              <div className="mb-8">
                <h2 className="text-2xl font-bold mb-2">{t('subscription.title')}</h2>
                <p className="text-gray-600">{t('subscription.subtitle')}</p>
              </div>

              <div className="space-y-6">
                {/* Current Plan */}
                <div className="flex items-center justify-between py-3">
                  <div className="flex items-center space-x-3">
                    <User className="w-5 h-5 text-gray-600" />
                    <span className="font-medium text-gray-900">{t('subscription.current_plan')}</span>
                  </div>
                  <span className="text-gray-700 font-medium">
                    {translatePlan(user?.subscription?.plan || 'FREE')}
                  </span>
                </div>

                {/* Subscription Date */}
                <div className="flex items-center justify-between py-3">
                  <div className="flex items-center space-x-3">
                    <Calendar className="w-5 h-5 text-gray-600" />
                    <span className="font-medium text-gray-900">{t('subscription.subscription_date')}</span>
                  </div>
                  <span className="text-gray-700">
                    {user?.subscription?.createdAt 
                      ? new Date(user.subscription.createdAt).toLocaleDateString() 
                      : 'N/A'
                    }
                  </span>
                </div>

                {/* Subscription ID */}
                <div className="flex items-center justify-between py-3">
                  <div className="flex items-center space-x-3">
                    <CreditCard className="w-5 h-5 text-gray-600" />
                    <span className="font-medium text-gray-900">{t('subscription.subscription_id')}</span>
                  </div>
                  <span className="text-gray-700 font-mono text-sm">
                    {user?.subscription?.id 
                      ? user.subscription.id.slice(-8)
                      : 'N/A'
                    }
                  </span>
                </div>

                {/* Subscription Status */}
                <div className="flex items-center justify-between py-3">
                  <div className="flex items-center space-x-3">
                    <Calendar className="w-5 h-5 text-gray-600" />
                    <span className="font-medium text-gray-900">{t('subscription.subscription_status')}</span>
                  </div>
                  <span className="text-gray-700 font-medium lowercase">
                    {t(`subscription.status.${user?.subscription?.status || 'EXPIRED'}`).toLowerCase()}
                  </span>
                </div>

                {/* Next Billing Date / Expiry Date - Show for all paid subscriptions */}
                {user?.subscription?.plan && user?.subscription?.plan !== 'FREE' && (
                  <div className="flex items-center justify-between py-3">
                    <div className="flex items-center space-x-3">
                      <Clock className="w-5 h-5 text-gray-600" />
                      <span className="font-medium text-gray-900">
                        {user?.subscription?.status === 'CANCELLED' 
                          ? t('subscription.expires_on')  // "Expires on" for cancelled subscriptions
                          : t('subscription.next_billing_date')  // "Next Billing Date" for active subscriptions
                        }
                      </span>
                    </div>
                    <span className="text-gray-700">
                      {(() => {
                        // Show date only for ACTIVE subscriptions or CANCELLED subscriptions that haven't expired yet
                        if (user?.subscription?.currentPeriodEnd) {
                          const endDate = new Date(user.subscription.currentPeriodEnd);
                          const now = new Date();
                          
                          if (user?.subscription?.status === 'ACTIVE') {
                            // For active subscriptions, always show next billing date
                            return endDate.toLocaleDateString();
                          } else if (user?.subscription?.status === 'CANCELLED' && endDate > now) {
                            // For cancelled subscriptions that haven't expired yet, show expiry date
                            return endDate.toLocaleDateString();
                          }
                        }
                        return 'N/A';
                      })()}
                    </span>
                  </div>
                )}
              </div>

              {/* Action Button - Only Cancel Subscription */}
              <div className="mt-8 pt-6">
                {user?.subscription?.plan && 
                 user?.subscription?.plan !== 'FREE' && 
                 user?.subscription?.status === 'ACTIVE' && (
                  <button
                    onClick={handleCancelSubscription}
                    disabled={cancelSubscriptionMutation.isLoading}
                    className="bg-red-100 text-red-600 hover:bg-red-200 px-6 py-2 rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {cancelSubscriptionMutation.isLoading ? (
                      <>
                        <Loader className="w-4 h-4 mr-2 animate-spin inline" />
                        Cancelling...
                      </>
                    ) : (
                      t('subscription.cancel_button')
                    )}
                  </button>
                )}
              </div>

              {/* Disclaimer */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <p className="text-xs text-gray-500 leading-relaxed">
                  {t('subscription.disclaimer')}
                </p>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="card" style={{ padding: '1.5rem' }}>
              <h2 className="text-2xl font-bold mb-6">{t('settings.title')}</h2>
              <form onSubmit={handleSaveSettings} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="label">{t('settings.form.email')}</label>
                    <input
                      type="email"
                      value={user?.email || ''}
                      disabled
                      className="input bg-gray-50"
                    />
                    <p className="text-sm text-gray-500 mt-1">{t('settings.form.email_note')}</p>
                  </div>
                  <div>
                    <label className="label">{t('settings.form.username')}</label>
                    <input
                      type="text"
                      value={user?.username || ''}
                      disabled
                      className="input bg-gray-50"
                    />
                    <p className="text-sm text-gray-500 mt-1">{t('settings.form.username_note')}</p>
                  </div>
                </div>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="label">{t('settings.form.full_name')}</label>
                    <input
                      type="text"
                      value={settingsForm.fullName}
                      onChange={(e) => handleSettingsChange('fullName', e.target.value)}
                      className="input"
                      placeholder={t('settings.form.full_name_placeholder')}
                    />
                  </div>
                  <div>
                    <label className="label">{t('settings.form.location')}</label>
                    <input
                      type="text"
                      value={settingsForm.location}
                      onChange={(e) => handleSettingsChange('location', e.target.value)}
                      className="input"
                      placeholder={t('settings.form.location_placeholder')}
                    />
                  </div>
                </div>
                
                <div>
                  <label className="label">{t('settings.form.bio')}</label>
                  <textarea
                    value={settingsForm.bio}
                    onChange={(e) => handleSettingsChange('bio', e.target.value)}
                    className="input min-h-[100px] resize-none"
                    placeholder={t('settings.form.bio_placeholder')}
                    rows={4}
                  />
                </div>
                
                <div>
                  <label className="label">{t('settings.form.website')}</label>
                  <input
                    type="url"
                    value={settingsForm.website}
                    onChange={(e) => handleSettingsChange('website', e.target.value)}
                    className="input"
                    placeholder={t('settings.form.website_placeholder')}
                  />
                </div>
                
                <div className="flex space-x-4 pt-4">
                  <button 
                    type="submit"
                    disabled={updateSettingsMutation.isLoading}
                    className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {updateSettingsMutation.isLoading ? (
                      <>
                        <Loader className="w-4 h-4 mr-2 animate-spin" />
                        {t('settings.buttons.saving')}
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        {t('settings.buttons.save')}
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={logout}
                    className="btn btn-outline text-red-600 border-red-600 hover:bg-red-50"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    {t('settings.buttons.logout')}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Danger Zone - Account Deletion */}
        {activeTab === 'settings' && (
          <div style={{ marginTop: '100px' }}>
            <div className="max-w-6xl mx-auto">
              <DangerZone />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;