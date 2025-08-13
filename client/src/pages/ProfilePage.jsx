import React, { useState } from 'react';
import { useQuery } from 'react-query';
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
  Grid3x3
} from 'lucide-react';
import api from '../services/api';
import { useAuthStore } from '../stores/authStore';
import toast from 'react-hot-toast';

const ProfilePage = () => {
  const { user, logout } = useAuthStore();
  const [activeTab, setActiveTab] = useState('images');

  // Fetch user's images
  const { data: imagesData, refetch: refetchImages } = useQuery(
    ['myImages'],
    () => api.get('/images/my-images').then(res => res.data)
  );

  // Fetch user's generation history
  const { data: generationsData } = useQuery(
    ['myGenerations'],
    () => api.get('/generate/history').then(res => res.data)
  );

  const handleToggleVisibility = async (imageId, isPublic) => {
    try {
      await api.patch(`/images/${imageId}/visibility`, { isPublic });
      toast.success(`Image ${isPublic ? 'published' : 'made private'}`);
      refetchImages();
    } catch (error) {
      toast.error('Failed to update image visibility');
    }
  };

  const handleDeleteImage = async (imageId) => {
    if (!window.confirm('Are you sure you want to delete this image?')) return;
    
    try {
      await api.delete(`/images/${imageId}`);
      toast.success('Image deleted successfully');
      refetchImages();
    } catch (error) {
      toast.error('Failed to delete image');
    }
  };

  const tabs = [
    { id: 'images', label: 'My Images', icon: Image },
    { id: 'generations', label: 'Generation History', icon: Grid3x3 },
    { id: 'settings', label: 'Settings', icon: Settings }
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
                    <span>{imagesData?.images?.length || 0} Images</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CreditCard className="w-4 h-4 text-gray-500" />
                    <span className="font-medium text-primary-600">{user?.totalCredits || 0} Credits</span>
                  </div>
                  <div className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full font-medium">
                    {user?.subscription?.plan || 'FREE'} Plan
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
              {imagesData?.images?.length > 0 ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {imagesData.images.map((image, index) => (
                    <motion.div
                      key={image.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className="card overflow-hidden group"
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
                            title={image.isPublic ? 'Make Private' : 'Make Public'}
                          >
                            {image.isPublic ? (
                              <Eye className="w-4 h-4" />
                            ) : (
                              <EyeOff className="w-4 h-4" />
                            )}
                          </button>
                          <a
                            href={image.url}
                            download
                            className="p-2 bg-white/90 rounded-lg shadow hover:bg-white transition"
                            title="Download"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                          <button
                            onClick={() => handleDeleteImage(image.id)}
                            className="p-2 bg-white/90 rounded-lg shadow hover:bg-white transition text-red-500"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <div className="p-4">
                        <p className="text-sm text-gray-600 line-clamp-2">{image.prompt}</p>
                        <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
                          <span>{image.model}</span>
                          <span>{new Date(image.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="card p-20 text-center">
                  <Image className="w-24 h-24 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600 text-lg">No images yet</p>
                  <p className="text-gray-500 text-sm mt-2">Start generating to see your creations here</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'generations' && (
            <div className="space-y-4">
              {generationsData?.generations?.length > 0 ? (
                generationsData.generations.map((generation) => (
                  <div key={generation.id} className="card p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium mb-2">{generation.prompt}</p>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span>{generation.model}</span>
                          <span>{generation.images?.length || 0} images</span>
                          <span>{generation.creditsUsed} credits</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            generation.status === 'COMPLETED' 
                              ? 'bg-green-100 text-green-700'
                              : generation.status === 'FAILED'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {generation.status}
                          </span>
                        </div>
                      </div>
                      <span className="text-sm text-gray-500">
                        {new Date(generation.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    {generation.images?.length > 0 && (
                      <div className="flex space-x-2 mt-4">
                        {generation.images.map(img => (
                          <img
                            key={img.id}
                            src={img.thumbnailUrl || img.url}
                            alt=""
                            className="w-20 h-20 rounded-lg object-cover"
                          />
                        ))}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="card p-20 text-center">
                  <Grid3x3 className="w-24 h-24 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600 text-lg">No generation history</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="card p-8">
              <h2 className="text-2xl font-bold mb-6">Account Settings</h2>
              <div className="space-y-6">
                <div>
                  <label className="label">Email</label>
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="input bg-gray-50"
                  />
                </div>
                <div>
                  <label className="label">Username</label>
                  <input
                    type="text"
                    value={user?.username || ''}
                    disabled
                    className="input bg-gray-50"
                  />
                </div>
                <div>
                  <label className="label">Full Name</label>
                  <input
                    type="text"
                    defaultValue={user?.fullName || ''}
                    className="input"
                  />
                </div>
                <div className="flex space-x-4">
                  <button className="btn btn-primary">
                    Save Changes
                  </button>
                  <button
                    onClick={logout}
                    className="btn btn-outline text-red-600 border-red-600 hover:bg-red-50"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;