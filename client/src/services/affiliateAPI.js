import api from './api';

export const affiliateAPI = {
  // Создание или получение партнерского аккаунта
  createAffiliate: async () => {
    try {
      const response = await api.post('/affiliate/create');
      return response.data.affiliate;
    } catch (error) {
      console.error('Error creating affiliate:', error);
      throw error;
    }
  },

  // Получение данных дашборда
  getDashboard: async () => {
    try {
      const response = await api.get('/affiliate/dashboard');
      return response.data;
    } catch (error) {
      console.error('Error fetching dashboard:', error);
      throw error;
    }
  },

  // Управление ссылками
  getLinks: async () => {
    try {
      const response = await api.get('/affiliate/links');
      return response.data.links;
    } catch (error) {
      console.error('Error fetching links:', error);
      throw error;
    }
  },

  createLink: async (linkData) => {
    try {
      const response = await api.post('/affiliate/links', linkData);
      return response.data.link;
    } catch (error) {
      console.error('Error creating link:', error);
      throw error;
    }
  },

  updateLink: async (linkId, linkData) => {
    try {
      const response = await api.put(`/affiliate/links/${linkId}`, linkData);
      return response.data.link;
    } catch (error) {
      console.error('Error updating link:', error);
      throw error;
    }
  },

  deleteLink: async (linkId) => {
    try {
      const response = await api.delete(`/affiliate/links/${linkId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting link:', error);
      throw error;
    }
  },

  // Рефералы
  getReferrals: async (params = {}) => {
    try {
      const response = await api.get('/affiliate/referrals', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching referrals:', error);
      throw error;
    }
  },

  // Комиссии
  getCommissions: async (params = {}) => {
    try {
      const response = await api.get('/affiliate/commissions', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching commissions:', error);
      throw error;
    }
  },

  // Выплаты
  getPayouts: async (params = {}) => {
    try {
      const response = await api.get('/affiliate/payouts', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching payouts:', error);
      throw error;
    }
  },

  requestPayout: async (payoutData) => {
    try {
      const response = await api.post('/affiliate/payouts/request', payoutData);
      return response.data;
    } catch (error) {
      console.error('Error requesting payout:', error);
      throw error;
    }
  },

  // Аналитика
  getAnalytics: async (params = {}) => {
    try {
      const response = await api.get('/affiliate/analytics', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching analytics:', error);
      throw error;
    }
  },

  // Лидерборд
  getLeaderboard: async (params = {}) => {
    try {
      const response = await api.get('/affiliate/leaderboard', { params });
      return response.data.leaderboard;
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      throw error;
    }
  },

  // Отчеты по Sub ID
  getSubIdReports: async (params = {}) => {
    try {
      const response = await api.get('/affiliate/reports/subid', { params });
      return response.data.data;
    } catch (error) {
      console.error('Error fetching Sub ID reports:', error);
      throw error;
    }
  }
};

export default affiliateAPI;